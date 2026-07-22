import type { IStorage } from "./storage";
import { fetchWithRetry } from "./network";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  constructor(
    public baseUrl: string,
    private storage: IStorage,
  ) {}

  async getToken(): Promise<string | null> {
    return await this.storage.get("bunker_access_token");
  }

  async setToken(token: string): Promise<void> {
    await this.storage.set("bunker_access_token", token);
  }

  async setRefreshToken(token: string): Promise<void> {
    await this.storage.set("bunker_refresh_token", token);
  }

  async clearTokens(): Promise<void> {
    await this.storage.remove("bunker_access_token");
    await this.storage.remove("bunker_refresh_token");
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = await this.storage.get("bunker_refresh_token");
    if (!refreshToken) return null;

    try {
      const res = await fetchWithRetry(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        await this.clearTokens();
        return null;
      }

      const data = await res.json();
      await this.setToken(data.accessToken);
      await this.setRefreshToken(data.refreshToken);
      return data.accessToken;
    } catch {
      await this.clearTokens();
      return null;
    }
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const makeRequest = async (token: string | null): Promise<Response> => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers as Record<string, string>,
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      return fetchWithRetry(`${this.baseUrl}${path}`, { ...options, headers });
    };

    let token = await this.getToken();
    let res = await makeRequest(token);

    if (res.status === 401 && token) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        res = await makeRequest(newToken);
      }
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`, body);
    }

    return res.json();
  }

  get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, options);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PUT", body: JSON.stringify(body) });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}
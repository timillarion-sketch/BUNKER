import type { IStorage } from "./storage";

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
    private baseUrl: string,
    private storage: IStorage,
  ) {}

  getToken(): string | null {
    return this.storage.get("bunker_access_token");
  }

  setToken(token: string): void {
    this.storage.set("bunker_access_token", token);
  }

  setRefreshToken(token: string): void {
    this.storage.set("bunker_refresh_token", token);
  }

  clearTokens(): void {
    this.storage.remove("bunker_access_token");
    this.storage.remove("bunker_refresh_token");
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.storage.get("bunker_refresh_token");
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        this.clearTokens();
        return null;
      }

      const data = await res.json();
      this.setToken(data.accessToken);
      this.setRefreshToken(data.refreshToken);
      return data.accessToken;
    } catch {
      this.clearTokens();
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

      return fetch(`${this.baseUrl}${path}`, { ...options, headers });
    };

    let token = this.getToken();
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

  get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PUT", body: JSON.stringify(body) });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

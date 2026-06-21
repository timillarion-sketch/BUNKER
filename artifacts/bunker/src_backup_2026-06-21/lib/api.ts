import { api as coreApi } from "@/core";
import { ApiError, ApiClient } from "@/core";

export const api = coreApi;
export { ApiError, ApiClient };
export const setToken = (token: string) => coreApi.setToken(token);
export const getToken = () => coreApi.getToken();
export const setRefreshToken = (token: string) => coreApi.setRefreshToken(token);
export const clearTokens = () => coreApi.clearTokens();

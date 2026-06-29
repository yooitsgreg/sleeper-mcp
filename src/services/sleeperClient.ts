import axios, { AxiosError } from "axios";
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "../constants.js";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

export async function sleeperGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const response = await client.get<T>(path, { params });
  return response.data;
}

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      switch (error.response.status) {
        case 400: return "Error: Invalid request. Please check your parameters.";
        case 404: return "Error: Resource not found. Please verify the ID or username is correct.";
        case 429: return "Error: Rate limit exceeded. Please wait before making more requests (limit: 1000/min).";
        case 500:
        case 503: return "Error: Sleeper server error. Please try again later.";
        default: return `Error: API request failed with status ${error.response.status}: ${error.response.statusText}`;
      }
    } else if (error.code === "ECONNABORTED") {
      return "Error: Request timed out. Please try again.";
    } else if (error.code === "ENOTFOUND") {
      return "Error: Cannot reach Sleeper API. Check your network connection.";
    }
  }
  return `Error: Unexpected error: ${error instanceof Error ? error.message : String(error)}`;
}

import "server-only";

export const TOKEN_COOKIE = "timbre_token";
export const ROLE_COOKIE = "timbre_role";

export const API_URL = process.env.LARAVEL_API_URL ?? "http://127.0.0.1:8000/api";

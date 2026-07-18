import { appConfig } from "../config/app.js";

export interface AuthSession {
  token: string;
  user: { id: string; email: string; role: string };
}

const API_URL = appConfig.apiUrl;

export function getToken(): string | null {
  return localStorage.getItem("trunorth_token");
}

export function setSession(session: AuthSession): void {
  localStorage.setItem("trunorth_token", session.token);
  localStorage.setItem("trunorth_user", JSON.stringify(session.user));
}

export function clearSession(): void {
  localStorage.removeItem("trunorth_token");
  localStorage.removeItem("trunorth_user");
}

export async function apiRegister(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? "Registration failed");
  }
  return res.json() as Promise<AuthSession>;
}

export async function apiLogin(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? "Login failed");
  }
  return res.json() as Promise<AuthSession>;
}

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return (await hashPin(pin)) === hash;
}

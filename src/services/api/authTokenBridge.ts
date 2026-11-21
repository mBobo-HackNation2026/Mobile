/** Lekki most tokenu dla httpClient — bez cyklicznego importu store. */
let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessTokenBridge(token: string | null): void {
  accessToken = token;
}

export function getAccessTokenBridge(): string | null {
  return accessToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export function notifyUnauthorized(): void {
  onUnauthorized?.();
}

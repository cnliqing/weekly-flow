export function isAdminRole(role: string): boolean {
  return role === "admin";
}

export function sanitizeAdminCallbackUrl(
  value: string | string[] | null | undefined,
): string {
  const callbackUrl = Array.isArray(value) ? value[0] : value;

  if (!callbackUrl) {
    return "/admin";
  }

  if (/^\/admin(?:\/|\?|#|$)/.test(callbackUrl)) {
    return callbackUrl;
  }

  return "/admin";
}

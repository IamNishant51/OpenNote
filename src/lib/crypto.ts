function deriveKey(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
  ];
  return parts.join("|||").slice(0, 64);
}

function xorEncrypt(text: string, key: string): string {
  const bytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return btoa(String.fromCharCode(...result));
}

function xorDecrypt(encoded: string, key: string): string {
  try {
    const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const keyBytes = new TextEncoder().encode(key);
    const result = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      result[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(result);
  } catch {
    return "";
  }
}

export function encryptKeys(data: Record<string, { apiKey?: string }>): string {
  const key = deriveKey();
  const json = JSON.stringify(data);
  return xorEncrypt(json, key);
}

export function decryptKeys(encoded: string): Record<string, { apiKey?: string }> | null {
  try {
    const key = deriveKey();
    const json = xorDecrypt(encoded, key);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

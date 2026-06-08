export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadBool(key: string, fallback = false): boolean {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) === 'true';
}

export function loadString(key: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) ?? fallback;
}

export function saveString(key: string, value: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

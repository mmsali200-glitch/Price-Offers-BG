// Some hosting UIs and shell exports leave matching surrounding quotes
// inside the env value (e.g. KEY="abc" → value is `"abc"` with the quote
// chars). Strip them so downstream Supabase calls don't send malformed keys.
function stripWrappingQuotes(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' || first === "'") && first === last) {
      return value.slice(1, -1);
    }
  }
  return value;
}

export function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;
  return stripWrappingQuotes(raw.trim());
}

export function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

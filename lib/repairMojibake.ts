const MOJIBAKE_MARKER_REGEX = /[ÃÂâäåæçèéêëìíîïðñòóôõöùúûü]/;
const CJK_REGEX = /[\u3400-\u9fff]/g;

const countMatches = (value: string, pattern: RegExp) => value.match(pattern)?.length ?? 0;

const decodeLatin1AsUtf8 = (value: string) => {
  const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
};

const scoreDecodedText = (value: string) =>
  countMatches(value, CJK_REGEX) * 4 - countMatches(value, MOJIBAKE_MARKER_REGEX) * 3;

export const repairMojibakeText = (value: string): string => {
  let current = value;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!MOJIBAKE_MARKER_REGEX.test(current)) {
      break;
    }

    let decoded = current;
    try {
      decoded = decodeLatin1AsUtf8(current);
    } catch {
      break;
    }

    if (decoded === current || scoreDecodedText(decoded) < scoreDecodedText(current)) {
      break;
    }

    current = decoded;
  }

  return current;
};

export const repairMojibakeDeep = <T>(value: T): T => {
  if (typeof value === 'string') {
    return repairMojibakeText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairMojibakeDeep(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [key, repairMojibakeDeep(entryValue)])
    ) as T;
  }

  return value;
};

// jsonc.ts — Mały parser JSONC (JSON z komentarzami `//` `/* */` i przecinkami końcowymi), który ŚLEDZI
// POZYCJE. Zwraca wartość + mapę ŚCIEŻKA→offset (np. "generators[0].cost") zgodną ze ścieżkami błędów
// z `validatePack`. Dzięki temu Studio pokazuje błędy z NUMEREM LINII (STUDIO §4.2), bez zewnętrznej
// biblioteki. Format ścieżek: pole obiektu = `a.b`, element tablicy = `a[0]`, korzeń = "".

export interface JsoncResult {
  value: unknown;
  /** Ścieżka logiczna → offset znakowy początku wartości w źródle. */
  locs: Map<string, number>;
  error?: { message: string; offset: number };
}

interface JsoncThrow {
  __jsonc: true;
  message: string;
  offset: number;
}

export function parseJsonc(src: string): JsoncResult {
  const locs = new Map<string, number>();
  const n = src.length;
  let i = 0;

  const fail = (message: string): never => {
    const e: JsoncThrow = { __jsonc: true, message, offset: i };
    throw e;
  };

  const skipWs = (): void => {
    while (i < n) {
      const c = src.charAt(i);
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
        i++;
      } else if (c === '/' && src.charAt(i + 1) === '/') {
        i += 2;
        while (i < n && src.charAt(i) !== '\n') i++;
      } else if (c === '/' && src.charAt(i + 1) === '*') {
        i += 2;
        while (i < n && !(src.charAt(i) === '*' && src.charAt(i + 1) === '/')) i++;
        i += 2;
      } else {
        break;
      }
    }
  };

  const isDigit = (c: string): boolean => c >= '0' && c <= '9';

  const parseString = (): string => {
    i++; // otwierający cudzysłów
    let s = '';
    while (i < n) {
      const c = src.charAt(i++);
      if (c === '"') return s;
      if (c === '\\') {
        const e = src.charAt(i++);
        if (e === 'n') s += '\n';
        else if (e === 't') s += '\t';
        else if (e === 'r') s += '\r';
        else if (e === 'b') s += '\b';
        else if (e === 'f') s += '\f';
        else if (e === 'u') {
          s += String.fromCharCode(parseInt(src.slice(i, i + 4), 16));
          i += 4;
        } else s += e; // " \ / oraz inne — dosłownie
      } else s += c;
    }
    return fail('Niezamknięty łańcuch znaków');
  };

  const parseNumber = (): number => {
    const start = i;
    if (src.charAt(i) === '-') i++;
    while (i < n && isDigit(src.charAt(i))) i++;
    if (src.charAt(i) === '.') {
      i++;
      while (i < n && isDigit(src.charAt(i))) i++;
    }
    if (src.charAt(i) === 'e' || src.charAt(i) === 'E') {
      i++;
      if (src.charAt(i) === '+' || src.charAt(i) === '-') i++;
      while (i < n && isDigit(src.charAt(i))) i++;
    }
    return Number(src.slice(start, i));
  };

  const parseValue = (path: string): unknown => {
    skipWs();
    locs.set(path, i);
    const c = src.charAt(i);
    if (c === '{') return parseObject(path);
    if (c === '[') return parseArray(path);
    if (c === '"') return parseString();
    if (c === '-' || isDigit(c)) return parseNumber();
    if (src.startsWith('true', i)) return (i += 4), true;
    if (src.startsWith('false', i)) return (i += 5), false;
    if (src.startsWith('null', i)) return (i += 4), null;
    return fail(`Oczekiwano wartości${c ? `, napotkano '${c}'` : ''}`);
  };

  const parseObject = (path: string): Record<string, unknown> => {
    i++; // {
    const obj: Record<string, unknown> = {};
    skipWs();
    if (src.charAt(i) === '}') return i++, obj;
    for (;;) {
      skipWs();
      if (src.charAt(i) === '}') {
        i++;
        break;
      } // przecinek końcowy
      if (src.charAt(i) !== '"') return fail('Oczekiwano klucza w cudzysłowie');
      const key = parseString();
      skipWs();
      if (src.charAt(i) !== ':') return fail("Oczekiwano ':' po kluczu");
      i++;
      obj[key] = parseValue(path ? `${path}.${key}` : key);
      skipWs();
      const sep = src.charAt(i);
      if (sep === ',') {
        i++;
        continue;
      }
      if (sep === '}') {
        i++;
        break;
      }
      return fail("Oczekiwano ',' albo '}'");
    }
    return obj;
  };

  const parseArray = (path: string): unknown[] => {
    i++; // [
    const arr: unknown[] = [];
    skipWs();
    if (src.charAt(i) === ']') return i++, arr;
    for (;;) {
      skipWs();
      if (src.charAt(i) === ']') {
        i++;
        break;
      } // przecinek końcowy
      arr.push(parseValue(`${path}[${arr.length}]`));
      skipWs();
      const sep = src.charAt(i);
      if (sep === ',') {
        i++;
        continue;
      }
      if (sep === ']') {
        i++;
        break;
      }
      return fail("Oczekiwano ',' albo ']'");
    }
    return arr;
  };

  try {
    const value = parseValue('');
    skipWs();
    if (i < n) fail('Nadmiarowe znaki po wartości');
    return { value, locs };
  } catch (e) {
    const t = e as JsoncThrow;
    if (t && t.__jsonc) return { value: undefined, locs, error: { message: t.message, offset: t.offset } };
    return { value: undefined, locs, error: { message: String(e), offset: i } };
  }
}

/** Numer linii (1-based) dla danego offsetu znakowego. */
export function offsetToLine(src: string, offset: number): number {
  let line = 1;
  const end = Math.min(offset, src.length);
  for (let k = 0; k < end; k++) if (src.charAt(k) === '\n') line++;
  return line;
}

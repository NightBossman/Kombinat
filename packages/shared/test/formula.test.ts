import { describe, it, expect } from 'vitest';
import {
  parseFormula,
  evalNumber,
  evalBool,
  collectRefs,
  FormulaError,
  type EvalContext,
  type RefValue,
} from '../src/index';

function ctxFrom(map: Record<string, RefValue>): EvalContext {
  return { resolve: (path) => map[path] };
}
const EMPTY: EvalContext = { resolve: () => undefined };

describe('parser: priorytety i lacznosc', () => {
  it('mnozenie przed dodawaniem', () => {
    expect(evalNumber('2 + 3 * 4', EMPTY).toNumber()).toBe(14);
  });
  it('potega jest prawostronna', () => {
    expect(evalNumber('2 ^ 3 ^ 2', EMPTY).toNumber()).toBe(512); // 2^(3^2)
  });
  it('unarne minus wiaze luzniej niz potega', () => {
    expect(evalNumber('-2 ^ 2', EMPTY).toNumber()).toBe(-4); // -(2^2)
  });
  it('nawiasy zmieniaja kolejnosc', () => {
    expect(evalNumber('(2 + 3) * 4', EMPTY).toNumber()).toBe(20);
  });
  it('modulo', () => {
    expect(evalNumber('17 % 5', EMPTY).toNumber()).toBe(2);
  });
});

describe('funkcje', () => {
  it('max/min z wieloma argumentami', () => {
    expect(evalNumber('max(1, 5, 3)', EMPTY).toNumber()).toBe(5);
    expect(evalNumber('min(2, 8, 4)', EMPTY).toNumber()).toBe(2);
  });
  it('floor/ceil/round/abs/sqrt/pow', () => {
    expect(evalNumber('floor(3.7)', EMPTY).toNumber()).toBe(3);
    expect(evalNumber('ceil(3.1)', EMPTY).toNumber()).toBe(4);
    expect(evalNumber('round(2.5)', EMPTY).toNumber()).toBe(3);
    expect(evalNumber('abs(0 - 9)', EMPTY).toNumber()).toBe(9);
    expect(evalNumber('sqrt(144)', EMPTY).toNumber()).toBe(12);
    expect(evalNumber('pow(2, 10)', EMPTY).toNumber()).toBe(1024);
  });
});

describe('logika i porownania', () => {
  it('and/or/not', () => {
    expect(evalBool('5 >= 3 and 2 < 1', EMPTY)).toBe(false);
    expect(evalBool('5 >= 3 or 2 < 1', EMPTY)).toBe(true);
    expect(evalBool('not (1 == 1)', EMPTY)).toBe(false);
    expect(evalBool('not 0', EMPTY)).toBe(true);
  });
  it('rownosc liczb', () => {
    expect(evalBool('2 + 2 == 4', EMPTY)).toBe(true);
    expect(evalBool('2 != 3', EMPTY)).toBe(true);
  });
});

describe('odwolania do stanu', () => {
  it('koszt rosnacy wykladniczo', () => {
    const c0 = evalNumber('120 * 1.16 ^ posiadane', ctxFrom({ posiadane: 0 }));
    const c1 = evalNumber('120 * 1.16 ^ posiadane', ctxFrom({ posiadane: 1 }));
    expect(c0.toNumber()).toBeCloseTo(120, 6);
    expect(c1.toNumber()).toBeCloseTo(139.2, 4);
  });
  it('zlozony warunek odblokowania', () => {
    const ctx = ctxFrom({ 'posiadane.odra1305': 10, 'zasob.dewizy': 600 });
    expect(evalBool('posiadane.odra1305 >= 10 and zasob.dewizy >= 500', ctx)).toBe(true);
    const ctx2 = ctxFrom({ 'posiadane.odra1305': 4, 'zasob.dewizy': 600 });
    expect(evalBool('posiadane.odra1305 >= 10 and zasob.dewizy >= 500', ctx2)).toBe(false);
  });
  it('nieustawione odwolanie traktowane jak 0', () => {
    expect(evalBool('flaga.nrd.stasi_zna == 0', EMPTY)).toBe(true);
  });
});

describe('wielkie liczby (break_infinity)', () => {
  it('nie psuja sie poza float64', () => {
    const v = evalNumber('1.15 ^ 1000', EMPTY);
    // 1.15^1000 ~ 1.7e60 — poza zwyklym zakresem nie ma problemu. log10() zwraca number.
    const lg = v.log10();
    expect(lg).toBeGreaterThan(60);
    expect(Number.isFinite(lg)).toBe(true);
  });
});

describe('bledy skladniowe', () => {
  it('niedokonczone wyrazenie', () => {
    expect(() => parseFormula('2 +')).toThrow(FormulaError);
  });
  it('pojedyncze = jest bledem', () => {
    expect(() => parseFormula('1 = 2')).toThrow(FormulaError);
  });
  it('nadmiarowy token', () => {
    expect(() => parseFormula('2 3')).toThrow(FormulaError);
  });
});

describe('collectRefs', () => {
  it('zbiera odwolania i funkcje', () => {
    const node = parseFormula('max(posiadane.odra1305, 5) + zasob.dewizy');
    const { refs, functions } = collectRefs(node);
    expect(refs.has('posiadane.odra1305')).toBe(true);
    expect(refs.has('zasob.dewizy')).toBe(true);
    expect(functions.has('max')).toBe(true);
  });
});

// --- Faza 5A: utwardzenie jezyka pod zewnetrzne DLC (bezpieczenstwo i deterministyczne wartosci) ---

describe('krotki spiek logiczny (and/or)', () => {
  // Prawy operand NIE moze byc liczony, gdy lewy juz rozstrzyga — DLC moze polegac na tym, by chronic
  // sie przed dzieleniem/odwolaniem, ktore ma sens tylko pod warunkiem (np. `x > 0 and 100 / x > 1`).
  function boomCtx(): EvalContext {
    return {
      resolve: (p) => {
        if (p === 'bomba') throw new Error('prawa strona nie powinna byc liczona');
        return 1;
      },
    };
  }
  it('false and X nie czyta X', () => {
    expect(evalBool('false and bomba', boomCtx())).toBe(false);
  });
  it('true or X nie czyta X', () => {
    expect(evalBool('true or bomba', boomCtx())).toBe(true);
  });
});

describe('bezpieczna arytmetyka brzegowa', () => {
  it('dzielenie przez zero = 0 (nie NaN/Infinity)', () => {
    expect(evalNumber('5 / 0', EMPTY).toNumber()).toBe(0);
  });
  it('modulo przez zero = 0', () => {
    expect(evalNumber('5 % 0', EMPTY).toNumber()).toBe(0);
  });
  it('log10 i pow lacza sie z wielkimi liczbami', () => {
    expect(evalNumber('log10(pow(10, 42))', EMPTY).toNumber()).toBeCloseTo(42, 6);
  });
});

describe('refy skalarne (pelne sciezki ze stanu)', () => {
  it('prestiz/czas/doktryna jako pojedyncze wartosci', () => {
    const ctx = ctxFrom({ 'prestiz.liczba': 3, 'czas.poraDnia': 22, 'doktryna.aktywna': 1 });
    expect(evalNumber('prestiz.liczba', ctx).toNumber()).toBe(3);
    expect(evalBool('czas.poraDnia >= 21 and doktryna.aktywna == 1', ctx)).toBe(true);
  });
});

describe('bledy niosa pozycje (dla Studia DLC)', () => {
  it('FormulaError ma pole pos wskazujace miejsce', () => {
    try {
      parseFormula('1 + * 2');
      expect.unreachable('powinno rzucic FormulaError');
    } catch (e) {
      expect(e).toBeInstanceOf(FormulaError);
      expect((e as FormulaError).pos).toBe(4); // '*' stoi na 4. znaku
    }
  });
});

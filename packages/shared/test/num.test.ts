import { describe, it, expect } from 'vitest';
import { formatNumber, pluralizePL, pluralizePLStable } from '../src/index';

const CYKL = { one: 'cykl', few: 'cykle', many: 'cykli', fractional: 'cykla' };

describe('formatNumber — polski zapis liczb', () => {
  it('uzywa przecinka jako separatora dziesietnego', () => {
    expect(formatNumber(5.96)).toBe('5,96');
    expect(formatNumber(17.25)).toBe('17,25');
    expect(formatNumber(0.5)).toBe('0,5');
  });

  it('rozdziela tysiace nielamliwa spacja (bez czesci dziesietnej)', () => {
    const NB = String.fromCharCode(0xa0);
    expect(formatNumber(1010)).toBe('1' + NB + '010');
    expect(formatNumber(12000)).toBe('12' + NB + '000');
  });

  it('duze liczby w notacji nazwanej z przecinkiem', () => {
    expect(formatNumber(1234567)).toBe('1,23 mln');
  });

  it('zero i liczby calkowite', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(150)).toBe('150');
  });

  it('STALA szerokosc w notacji nazwanej — miejsce dziesietne nie znika/wraca', () => {
    // Zrodlo dawnego migotania: 10,59 -> 10,6 -> 10,61 (raz 2, raz 1 cyfra po przecinku).
    // Teraz stale 1 miejsce w tym pasmie: kolejne odswiezenia maja te sama szerokosc.
    expect(formatNumber(10.59e9)).toBe('10,6 mld');
    expect(formatNumber(10.61e9)).toBe('10,6 mld');
    // 3 cyfry znaczace: <10 -> 2 miejsca (bez obcinania zer), 10-99 -> 1, >=100 -> 0.
    expect(formatNumber(1.5e9)).toBe('1,50 mld');
    expect(formatNumber(123.4e9)).toBe('123 mld');
  });
});

describe('pluralizePL — polska odmiana po liczbie', () => {
  it('mianownik l. poj. dla 1', () => {
    expect(pluralizePL(1, CYKL)).toBe('cykl');
  });
  it('mianownik l. mn. dla 2-4 (oprocz 12-14)', () => {
    expect(pluralizePL(2, CYKL)).toBe('cykle');
    expect(pluralizePL(4, CYKL)).toBe('cykle');
    expect(pluralizePL(22, CYKL)).toBe('cykle');
    expect(pluralizePL(24, CYKL)).toBe('cykle');
  });
  it('dopelniacz l. mn. dla 0, 5-21, koncowek 0/1/5-9 i 11-14', () => {
    expect(pluralizePL(0, CYKL)).toBe('cykli');
    expect(pluralizePL(5, CYKL)).toBe('cykli');
    expect(pluralizePL(11, CYKL)).toBe('cykli');
    expect(pluralizePL(12, CYKL)).toBe('cykli');
    expect(pluralizePL(14, CYKL)).toBe('cykli');
    expect(pluralizePL(21, CYKL)).toBe('cykli');
    expect(pluralizePL(25, CYKL)).toBe('cykli');
    expect(pluralizePL(100, CYKL)).toBe('cykli');
    expect(pluralizePL(101, CYKL)).toBe('cykli');
  });
  it('dopelniacz l. poj. dla liczb z czescia dziesietna', () => {
    expect(pluralizePL(22.81, CYKL)).toBe('cykla');
    expect(pluralizePL(0.5, CYKL)).toBe('cykla');
  });
  it('duze/nazwane liczby -> dopelniacz l. mn.', () => {
    expect(pluralizePL(1234567, CYKL)).toBe('cykli');
    expect(pluralizePL(Infinity, CYKL)).toBe('cykli');
  });
});

describe('pluralizePLStable — stabilna forma dla szybkich licznikow', () => {
  it('male wartosci 0-4 dokladnie', () => {
    expect(pluralizePLStable(1, CYKL)).toBe('cykl');
    expect(pluralizePLStable(2, CYKL)).toBe('cykle');
    expect(pluralizePLStable(0, CYKL)).toBe('cykli');
  });
  it('od 5 w gore zawsze "many" (bez migotania)', () => {
    expect(pluralizePLStable(5, CYKL)).toBe('cykli');
    expect(pluralizePLStable(22, CYKL)).toBe('cykli'); // mimo ze dokladnie byloby "cykle"
    expect(pluralizePLStable(123, CYKL)).toBe('cykli');
  });
});

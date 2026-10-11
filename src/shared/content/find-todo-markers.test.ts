import { describe, expect, it } from 'vitest';
import { findTodoMarkers } from './find-todo-markers';

describe('findTodoMarkers', () => {
  it('returns nothing for complete content', () => {
    expect(findTodoMarkers({ a: 'gata', b: { c: 3, d: true, e: null } })).toEqual([]);
  });

  it('returns the dotted path of every nested TODO string', () => {
    expect(findTodoMarkers({ prices: { monthly: 'TODO: preț' }, name: 'ok' })).toEqual(['prices.monthly']);
  });

  it('indexes array items', () => {
    expect(findTodoMarkers({ list: ['ok', 'TODO', 'ok'] })).toEqual(['list[1]']);
  });

  it('finds a marker anywhere inside the string', () => {
    expect(findTodoMarkers({ a: '3 ore, TODO zile' })).toEqual(['a']);
  });

  it('ignores numbers, booleans and null', () => {
    expect(findTodoMarkers([1, false, null, undefined])).toEqual([]);
  });
});

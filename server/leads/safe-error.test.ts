import { describe, expect, it } from 'vitest';
import { safeError } from './safe-error';

describe('safeError', () => {
  it('never includes the message', () => {
    const fields = safeError(new Error('Ana Pop +40722123456 rejected'));
    expect(JSON.stringify(fields)).not.toContain('Ana');
    expect(fields).toEqual({ errorName: 'Error' });
  });

  it('keeps primitive code, errno and responseCode', () => {
    const error = Object.assign(new TypeError('x'), { code: 'ECONNREFUSED', errno: -111, responseCode: 550, extra: 'no' });
    expect(safeError(error)).toEqual({ errorName: 'TypeError', code: 'ECONNREFUSED', errno: -111, responseCode: 550 });
  });

  it('drops non-primitive values', () => {
    expect(safeError(Object.assign(new Error('x'), { code: { a: 1 } }))).toEqual({ errorName: 'Error' });
  });

  it('describes non-object errors by type only', () => {
    expect(safeError('secret text')).toEqual({ errorName: 'string' });
    expect(safeError(null)).toEqual({ errorName: 'object' });
  });
});

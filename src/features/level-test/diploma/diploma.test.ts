// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import {
  createDiplomaCanvas,
  downloadDiploma,
  drawDiploma,
  printDiploma,
  type DiplomaContext,
} from './render-diploma';

function fakeContext() {
  const calls: string[] = [];
  const texts: { text: string; font: string; maxWidth?: number }[] = [];
  const moves: number[][] = [];
  const lines: number[][] = [];
  const ctx = {
    font: '',
    fillStyle: '' as unknown,
    strokeStyle: '' as unknown,
    lineWidth: 0,
    textAlign: 'start',
    createLinearGradient: () => ({ addColorStop: () => calls.push('stop') }),
    fillRect: () => calls.push('fillRect'),
    beginPath: () => calls.push('beginPath'),
    moveTo: (x: number, y: number) => {
      calls.push('moveTo');
      moves.push([x, y]);
    },
    lineTo: (x: number, y: number) => {
      calls.push('lineTo');
      lines.push([x, y]);
    },
    arcTo: () => calls.push('arcTo'),
    closePath: () => calls.push('closePath'),
    fill: () => calls.push('fill'),
    stroke: () => calls.push('stroke'),
    setLineDash: (dash: number[]) => calls.push(`dash:${dash.join(',')}`),
    measureText: (text: string) => ({ width: text.length * 20 }),
    fillText(text: string, _x?: number, _y?: number, maxWidth?: number) {
      texts.push({ text, font: this.font, maxWidth });
    },
  };
  return { ctx: ctx as unknown as DiplomaContext, calls, texts, moves, lines };
}

const data = { childName: '<b>Ana</b>', mode: 'level' as const, title: 'Movers', score: 7, total: 12, date: new Date('2026-10-11T09:00:00Z') };

describe('drawDiploma', () => {
  it('draws the frame, three stars and every text, with the name as plain text', () => {
    const { ctx, calls, texts, moves, lines } = fakeContext();
    drawDiploma(ctx, data);
    expect(calls).toContain('dash:22,16');
    expect(calls.indexOf('dash:')).toBeGreaterThan(calls.indexOf('dash:22,16'));
    expect(calls.filter((call) => call === 'stop')).toHaveLength(2);
    expect(moves).toContainEqual([190, 960]);
    expect(lines).toContainEqual([520, 960]);
    expect(calls.filter((call) => call === 'fill').length).toBeGreaterThanOrEqual(4);
    expect(texts.map((item) => item.text)).toContain('<b>Ana</b>');
    expect(texts.map((item) => item.text)).toContain('7 din 12 răspunsuri corecte');
  });

  it('caps only the child name at 1250px wide', () => {
    const { ctx, texts } = fakeContext();
    drawDiploma(ctx, data);
    expect(texts.find((item) => item.text === '<b>Ana</b>')?.maxWidth).toBe(1250);
    expect(texts.filter((item) => item.maxWidth !== undefined)).toHaveLength(1);
  });
});

describe('createDiplomaCanvas fonts', () => {
  it('requests every weight used before drawing', async () => {
    const load = vi.fn(() => Promise.resolve([]));
    const doc = { fonts: { load, ready: Promise.resolve() }, createElement: (tag: string) => document.createElement(tag) } as unknown as Document;
    await expect(createDiplomaCanvas(doc, data)).rejects.toThrow('Canvas 2D indisponibil');
    expect(load.mock.calls.map((call) => (call as unknown[])[0])).toEqual(['700 32px Nunito', '800 40px Nunito', '900 104px Nunito']);
    expect(load.mock.calls.map((call) => (call as unknown[])[1])).toEqual(Array(3).fill('ĂăÂâÎîȘșȚț'));
  });

  it('warns and continues when a font fails to load', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const doc = { fonts: { load: () => Promise.reject(new Error('x')), ready: Promise.resolve() }, createElement: (tag: string) => document.createElement(tag) } as unknown as Document;
    await expect(createDiplomaCanvas(doc, data)).rejects.toThrow('Canvas 2D indisponibil');
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});

describe('createDiplomaCanvas', () => {
  it('throws instead of swallowing the error when there is no 2D context', async () => {
    await expect(createDiplomaCanvas(document, data)).rejects.toThrow('Canvas 2D indisponibil');
  });
});

describe('downloadDiploma', () => {
  it('clicks a temporary link with a safe file name', () => {
    const canvas = document.createElement('canvas');
    canvas.toDataURL = () => 'data:image/png;base64,AAA';
    let connectedAtClick = false;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      connectedAtClick = this.isConnected;
    });
    downloadDiploma(document, canvas, 'Ana Pop');
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe('diploma-Ana-Pop.png');
    expect(link.href).toBe('data:image/png;base64,AAA');
    expect(connectedAtClick).toBe(true);
    expect(link.isConnected).toBe(false);
    click.mockRestore();
  });
});

describe('printDiploma', () => {
  it('returns false when the pop-up is blocked', () => {
    const canvas = document.createElement('canvas');
    expect(printDiploma(null, canvas, 'Ana')).toBe(false);
  });

  it('builds the print page with DOM APIs so the name cannot inject markup', () => {
    const canvas = document.createElement('canvas');
    canvas.toDataURL = () => 'data:image/png;base64,AAA';
    const popupDocument = document.implementation.createHTMLDocument('');
    const popup = { document: popupDocument, print: vi.fn(), focus: vi.fn() };
    expect(printDiploma(popup as unknown as Window, canvas, '  </title><script>alert(1)</script>  ')).toBe(true);
    expect(popupDocument.title).toBe('Diplomă </title><script>alert(1)</script>');
    expect(popupDocument.querySelector('script')).toBeNull();
    expect(popupDocument.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,AAA');
    expect(popupDocument.querySelector('style')?.textContent).toContain('size: A4 landscape');
    expect(popupDocument.querySelector('style')?.textContent).toContain('display: block');
    const img = popupDocument.querySelector('img')!;
    img.dispatchEvent(new Event('load'));
    img.dispatchEvent(new Event('load'));
    expect(popup.print).toHaveBeenCalledTimes(1);
    expect(popup.focus).toHaveBeenCalledTimes(1);
  });
});

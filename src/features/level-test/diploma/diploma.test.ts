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
  const texts: { text: string; font: string }[] = [];
  const ctx = {
    font: '',
    fillStyle: '' as unknown,
    strokeStyle: '' as unknown,
    lineWidth: 0,
    textAlign: 'start',
    createLinearGradient: () => ({ addColorStop: () => calls.push('stop') }),
    fillRect: () => calls.push('fillRect'),
    beginPath: () => calls.push('beginPath'),
    moveTo: () => calls.push('moveTo'),
    lineTo: () => calls.push('lineTo'),
    arcTo: () => calls.push('arcTo'),
    closePath: () => calls.push('closePath'),
    fill: () => calls.push('fill'),
    stroke: () => calls.push('stroke'),
    setLineDash: (dash: number[]) => calls.push(`dash:${dash.join(',')}`),
    measureText: (text: string) => ({ width: text.length * 20 }),
    fillText(text: string) {
      texts.push({ text, font: this.font });
    },
  };
  return { ctx: ctx as unknown as DiplomaContext, calls, texts };
}

const data = { childName: '<b>Ana</b>', mode: 'level' as const, title: 'Movers', score: 7, total: 12, date: new Date('2026-10-11T09:00:00Z') };

describe('drawDiploma', () => {
  it('draws the frame, three stars and every text, with the name as plain text', () => {
    const { ctx, calls, texts } = fakeContext();
    drawDiploma(ctx, data);
    expect(calls).toContain('dash:22,16');
    expect(calls.filter((call) => call === 'fill').length).toBeGreaterThanOrEqual(4);
    expect(texts.map((item) => item.text)).toContain('<b>Ana</b>');
    expect(texts.map((item) => item.text)).toContain('7 din 12 răspunsuri corecte');
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
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    downloadDiploma(document, canvas, 'Ana Pop');
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe('diploma-Ana-Pop.png');
    expect(link.href).toBe('data:image/png;base64,AAA');
    expect(link.isConnected).toBe(false);
    click.mockRestore();
  });
});

describe('printDiploma', () => {
  it('returns false when the pop-up is blocked', () => {
    const canvas = document.createElement('canvas');
    const win = { open: () => null } as unknown as Window;
    expect(printDiploma(win, canvas, 'Ana')).toBe(false);
  });

  it('builds the print page with DOM APIs so the name cannot inject markup', () => {
    const canvas = document.createElement('canvas');
    canvas.toDataURL = () => 'data:image/png;base64,AAA';
    const popupDocument = document.implementation.createHTMLDocument('');
    const popup = { document: popupDocument, print: vi.fn(), focus: vi.fn() };
    const win = { open: () => popup } as unknown as Window;
    expect(printDiploma(win, canvas, '  </title><script>alert(1)</script>  ')).toBe(true);
    expect(popupDocument.title).toBe('Diplomă </title><script>alert(1)</script>');
    expect(popupDocument.querySelector('script')).toBeNull();
    expect(popupDocument.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,AAA');
    expect(popupDocument.querySelector('style')?.textContent).toContain('size: A4 landscape');
  });
});

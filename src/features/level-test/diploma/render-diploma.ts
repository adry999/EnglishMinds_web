import {
  cleanChildName,
  DIPLOMA_SIZE,
  diplomaFileName,
  diplomaTexts,
  starPoints,
  type DiplomaData,
} from '../model/diploma-content';

export type DiplomaContext = Pick<
  CanvasRenderingContext2D,
  | 'font'
  | 'fillStyle'
  | 'strokeStyle'
  | 'lineWidth'
  | 'textAlign'
  | 'createLinearGradient'
  | 'fillRect'
  | 'beginPath'
  | 'moveTo'
  | 'lineTo'
  | 'arcTo'
  | 'closePath'
  | 'fill'
  | 'stroke'
  | 'setLineDash'
  | 'measureText'
  | 'fillText'
>;

function roundedRect(ctx: DiplomaContext, x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function star(ctx: DiplomaContext, cx: number, cy: number, radius: number): void {
  const [first, ...rest] = starPoints(cx, cy, radius);
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (const point of rest) ctx.lineTo(point.x, point.y);
  ctx.closePath();
  ctx.fillStyle = '#ffc41f';
  ctx.fill();
}

export function drawDiploma(ctx: DiplomaContext, data: DiplomaData): void {
  const { width, height } = DIPLOMA_SIZE;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#ec6423');
  gradient.addColorStop(1, '#f39a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  roundedRect(ctx, 70, 70, 1460, 990, 48);
  ctx.fillStyle = '#fff5e6';
  ctx.fill();

  ctx.setLineDash([22, 16]);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#ffc41f';
  roundedRect(ctx, 100, 100, 1400, 930, 36);
  ctx.stroke();
  ctx.setLineDash([]);

  star(ctx, 800, 230, 70);
  star(ctx, 260, 880, 40);
  star(ctx, 1340, 880, 40);

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#14224a';
  for (const [from, to] of [
    [190, 520],
    [1080, 1410],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(from, 960);
    ctx.lineTo(to, 960);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  const measure = (font: string, text: string) => {
    ctx.font = font;
    return ctx.measureText(text).width;
  };
  for (const item of diplomaTexts(data, measure)) {
    ctx.font = item.font;
    ctx.fillStyle = item.color;
    if (item.maxWidth === undefined) ctx.fillText(item.text, item.x, item.y);
    else ctx.fillText(item.text, item.x, item.y, item.maxWidth);
  }
}

const FONT_SAMPLE = 'ĂăÂâÎîȘșȚț';
const FONT_WEIGHTS = ['700 32px Nunito', '800 40px Nunito', '900 104px Nunito'];

export async function createDiplomaCanvas(doc: Document, data: DiplomaData): Promise<HTMLCanvasElement> {
  try {
    await Promise.all(FONT_WEIGHTS.map((font) => doc.fonts?.load(font, FONT_SAMPLE)));
    await doc.fonts?.ready;
  } catch (error) {
    console.warn('[diploma] fonts failed to load, using the fallback font', error);
  }
  const canvas = doc.createElement('canvas');
  canvas.width = DIPLOMA_SIZE.width;
  canvas.height = DIPLOMA_SIZE.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponibil');
  drawDiploma(ctx, data);
  return canvas;
}

export function downloadDiploma(doc: Document, canvas: HTMLCanvasElement, childName: string): void {
  const link = doc.createElement('a');
  link.download = diplomaFileName(childName);
  link.href = canvas.toDataURL('image/png');
  doc.body.append(link);
  link.click();
  link.remove();
}

export function printDiploma(popup: Window | null, canvas: HTMLCanvasElement, childName: string): boolean {
  const dataUrl = canvas.toDataURL('image/png');
  if (!popup) return false;
  const doc = popup.document;
  doc.title = `Diplomă ${cleanChildName(childName)}`;
  const style = doc.createElement('style');
  style.textContent =
    '@page { size: A4 landscape; margin: 0 } html, body { margin: 0; height: 100% } img { display: block; width: 100%; height: 100%; object-fit: contain }';
  const image = doc.createElement('img');
  image.alt = doc.title;
  image.addEventListener(
    'load',
    () => {
      popup.focus();
      popup.print();
    },
    { once: true },
  );
  image.addEventListener(
    'error',
    () => {
      console.error('[diploma] image failed to load for printing');
      popup.close();
    },
    { once: true },
  );
  image.src = dataUrl;
  doc.head.append(style);
  doc.body.replaceChildren(image);
  return true;
}

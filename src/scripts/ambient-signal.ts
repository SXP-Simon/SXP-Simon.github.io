import type { FrameKey } from "../data/frames";

type Area = { x: number; y: number; width: number; height: number };
type Patch = [x: number, y: number, radiusX: number, radiusY: number];

// Centres and radii in the original, uncropped CG. Each patch is a piece of
// sky, a window, a wall or another quiet surface selected around the figures.
const patches: Record<
  Exclude<FrameKey, "sunflower-roof" | "cyrano-piano">,
  Patch[]
> = {
  "at-sunset": [
    [0.48, 0.19, 0.075, 0.23],
    [0.94, 0.48, 0.09, 0.25],
  ],
  "blue-sky": [
    [0.19, 0.44, 0.2, 0.45],
    [0.91, 0.2, 0.14, 0.24],
  ],
  "edge-of-sight": [
    [0.25, 0.7, 0.2, 0.35],
    [0.82, 0.21, 0.21, 0.22],
  ],
  embrace: [
    [0.13, 0.36, 0.19, 0.23],
    [0.88, 0.075, 0.14, 0.065],
  ],
  "flower-bed": [
    [0.89, 0.1, 0.14, 0.1],
    [0.1, 0.88, 0.11, 0.1],
  ],
  "star-score": [
    [0.18, 0.13, 0.17, 0.12],
    [0.87, 0.52, 0.12, 0.15],
  ],
  "classroom-floor": [
    [0.19, 0.81, 0.17, 0.17],
    [0.87, 0.12, 0.11, 0.09],
  ],
  firelight: [
    [0.26, 0.88, 0.24, 0.1],
    [0.9, 0.76, 0.07, 0.12],
  ],
  "school-sky": [[0.13, 0.2, 0.1, 0.17]],
  "dusk-roof": [
    [0.16, 0.8, 0.14, 0.12],
    [0.68, 0.13, 0.11, 0.09],
  ],
  "train-stars": [
    [0.75, 0.14, 0.16, 0.1],
    [0.45, 0.8, 0.1, 0.06],
  ],
  "last-warmth": [
    [0.09, 0.85, 0.11, 0.15],
    [0.54, 0.38, 0.05, 0.05],
  ],
  "night-piano": [
    [0.22, 0.15, 0.25, 0.18],
    [0.3, 0.85, 0.27, 0.14],
  ],
  "on-paper": [
    [0.51, 0.13, 0.45, 0.1],
    [0.16, 0.83, 0.15, 0.17],
  ],
  "on-the-roof": [
    [0.23, 0.15, 0.23, 0.13],
    [0.1, 0.76, 0.12, 0.17],
  ],
  "paper-birds": [
    [0.15, 0.08, 0.14, 0.08],
    [0.19, 0.91, 0.11, 0.085],
  ],
  "reading-room": [
    [0.15, 0.43, 0.13, 0.3],
    [0.91, 0.49, 0.095, 0.37],
  ],
  sunflowers: [
    [0.53, 0.09, 0.36, 0.13],
    [0.18, 0.93, 0.16, 0.07],
  ],
  "two-windows": [
    [0.86, 0.23, 0.1, 0.18],
    [0.13, 0.73, 0.085, 0.19],
  ],
  "white-wings": [
    [0.28, 0.14, 0.28, 0.14],
    [0.48, 0.79, 0.12, 0.055],
  ],
};

let texture: HTMLCanvasElement | undefined;
function signalTexture() {
  if (texture) return texture;
  const tile = document.createElement("canvas");
  tile.width = 256;
  tile.height = 192;
  const ctx = tile.getContext("2d");
  if (!ctx) return;
  const pixels = ctx.createImageData(tile.width, tile.height);
  let seed = 1367;
  const tau = Math.PI * 2;
  for (let y = 0; y < tile.height; y++) {
    for (let x = 0; x < tile.width; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grain = seed / 4294967296 - 0.5;
      const phase = (tau * x) / tile.width;
      const carrier = Math.cos((tau * y) / 6 + 0.65 * Math.sin(phase));
      const envelope = 0.5 + 0.5 * Math.sin(phase + (tau * y) / 96);
      const value = 62 * grain + 18 * carrier * envelope;
      const i = (y * tile.width + x) * 4;
      const light = value > 0;
      pixels.data[i] = light ? 198 : 30;
      pixels.data[i + 1] = light ? 206 : 28;
      pixels.data[i + 2] = light ? 229 : 48;
      pixels.data[i + 3] = Math.abs(value);
    }
  }
  ctx.putImageData(pixels, 0, 0);
  texture = tile;
  return tile;
}

export function paintAmbientSignal(
  canvas: HTMLCanvasElement,
  frame: FrameKey,
  box: Area,
  illustration: Area,
  crop: Area,
  image: HTMLImageElement
) {
  const scale = Math.min(1, 1400 / box.width, 720 / box.height);
  canvas.width = Math.max(1, Math.round(box.width * scale));
  canvas.height = Math.max(1, Math.round(box.height * scale));
  const ctx = canvas.getContext("2d");
  const tile = signalTexture();
  if (!ctx || !tile) return;
  ctx.scale(canvas.width / box.width, canvas.height / box.height);
  if (illustration.x > 0) {
    const wash = ctx.createLinearGradient(0, 0, illustration.x, 0);
    wash.addColorStop(0, "#0009");
    wash.addColorStop(0.7, "#0007");
    wash.addColorStop(1, "transparent");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, illustration.x, box.height);
  }
  ctx.save();
  ctx.translate(illustration.x, illustration.y);
  ctx.beginPath();
  ctx.rect(0, 0, illustration.width, illustration.height);
  ctx.clip();
  ctx.scale(illustration.width / crop.width, illustration.height / crop.height);
  ctx.translate(-crop.x, -crop.y);
  ctx.scale(image.naturalWidth, image.naturalHeight);
  for (const [x, y, rx, ry] of patches[
    frame === "sunflower-roof"
      ? "on-the-roof"
      : frame === "cyrano-piano"
        ? "night-piano"
        : frame
  ]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    fade.addColorStop(0, "black");
    fade.addColorStop(0.45, "#000c");
    fade.addColorStop(1, "transparent");
    ctx.fillStyle = fade;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  ctx.restore();
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = ctx.createPattern(tile, "repeat")!;
  ctx.fillRect(0, 0, box.width, box.height);
}

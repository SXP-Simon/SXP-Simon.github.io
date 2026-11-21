import type { FrameKey } from "../data/frames";
import { paintAmbientSignal } from "./ambient-signal";

type Crop = { x: number; y: number; width: number; height: number };

// Source rectangle for CSS object-fit: cover, including the authored focal point.
function cover(
  source: Crop,
  width: number,
  height: number,
  x: number,
  y: number
): Crop {
  const scale = Math.min(source.width / width, source.height / height);
  const w = width * scale;
  const h = height * scale;
  return {
    x: source.x + (source.width - w) * x,
    y: source.y + (source.height - h) * y,
    width: w,
    height: h,
  };
}

function drawCrop(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  crop: Crop,
  dest: Crop
) {
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    dest.x,
    dest.y,
    dest.width,
    dest.height
  );
}

export function composeFrame(
  plate: HTMLElement,
  ambient?: HTMLCanvasElement
): HTMLCanvasElement | undefined {
  const box = plate.getBoundingClientRect();
  const picture = plate.querySelector("picture")!;
  const image = picture.querySelector("img")!;
  if (!image.complete || !image.naturalWidth || !box.width || !box.height)
    return;

  const result = document.createElement("canvas");
  const ratio = Math.min(
    devicePixelRatio,
    1.5,
    2240 / box.width,
    Math.sqrt(2200000 / (box.width * box.height))
  );
  result.width = Math.max(1, Math.round(box.width * ratio));
  result.height = Math.max(1, Math.round(box.height * ratio));
  const ctx = result.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(
    result.width / box.width,
    0,
    0,
    result.height / box.height,
    0,
    0
  );

  const native = {
    x: 0,
    y: 0,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
  const art = picture.getBoundingClientRect();
  const dest = {
    x: art.left - box.left,
    y: art.top - box.top,
    width: art.width,
    height: art.height,
  };
  const [x, y] = getComputedStyle(image)
    .objectPosition.split(" ")
    .map(value => parseFloat(value) / 100);
  const crop = cover(native, art.width, art.height, x, y);
  drawCrop(ctx, image, crop, dest);

  // Mask just the illustration, before laying the ambient colour behind it.
  const style = getComputedStyle(picture);
  const edge = ctx.createLinearGradient(dest.x, 0, dest.x + dest.width, 0);
  edge.addColorStop(0, "transparent");
  edge.addColorStop(
    parseFloat(style.getPropertyValue("--fade-in")) / 100,
    "black"
  );
  edge.addColorStop(
    parseFloat(style.getPropertyValue("--fade-out")) / 100,
    "black"
  );
  edge.addColorStop(
    1,
    Number(style.getPropertyValue("--end-alpha")) ? "black" : "transparent"
  );
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = edge;
  ctx.fillRect(dest.x, dest.y, dest.width, dest.height);

  const feather = Number(style.getPropertyValue("--fade-block"));
  if (feather) {
    const vertical = ctx.createLinearGradient(
      0,
      dest.y,
      0,
      dest.y + dest.height
    );
    vertical.addColorStop(0, "transparent");
    vertical.addColorStop(feather, "black");
    vertical.addColorStop(1 - feather * 1.3, "black");
    vertical.addColorStop(1, "transparent");
    ctx.fillStyle = vertical;
    ctx.fillRect(dest.x, dest.y, dest.width, dest.height);
  }

  // Work at a small scale for the soft background. The face and figure above
  // are always sampled from the decoded CG at the canvas's full resolution.
  const wash = document.createElement("canvas");
  wash.width = Math.max(12, Math.round(box.width / 12));
  wash.height = Math.max(12, Math.round(box.height / 12));
  const washCtx = wash.getContext("2d");
  if (!washCtx) return;
  const thumb = cover(
    native,
    480,
    300,
    parseFloat(style.getPropertyValue("--art-x")) / 100,
    parseFloat(style.getPropertyValue("--art-y")) / 100
  );
  const washSource = cover(thumb, wash.width, wash.height, 0.5, 0.5);
  washCtx.fillStyle = style.getPropertyValue("--art-tone");
  washCtx.fillRect(0, 0, wash.width, wash.height);
  washCtx.filter = "blur(2px) saturate(.8) brightness(.8)";
  drawCrop(washCtx, image, washSource, {
    x: -4,
    y: -4,
    width: wash.width + 8,
    height: wash.height + 8,
  });
  ctx.globalCompositeOperation = "destination-over";
  ctx.drawImage(wash, 0, 0, box.width, box.height);
  ctx.globalCompositeOperation = "source-over";

  const shade = ctx.createLinearGradient(0, 0, box.width, 0);
  shade.addColorStop(0, "#18162780");
  shade.addColorStop(0.36, "#211a3026");
  shade.addColorStop(0.72, "transparent");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, box.width, box.height);
  if (ambient) {
    paintAmbientSignal(
      ambient,
      plate.dataset.frame as FrameKey,
      box,
      dest,
      crop,
      image
    );
  }
  return result;
}

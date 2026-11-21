interface GrainField {
  width: number;
  height: number;
  rank: Uint8Array;
  warm: Uint8Array;
}

let cachedField: GrainField | undefined;

function noiseGrid(
  pitchX: number,
  pitchY: number,
  width: number,
  height: number,
  random: () => number
) {
  const stride = Math.ceil(width / pitchX) + 1;
  const values = Float32Array.from(
    { length: stride * (Math.ceil(height / pitchY) + 1) },
    random
  );
  return (x: number, y: number) => {
    const gx = x / pitchX,
      gy = y / pitchY;
    const ix = Math.floor(gx),
      iy = Math.floor(gy);
    const fx = gx - ix,
      fy = gy - iy;
    const tx = fx * fx * (3 - 2 * fx),
      ty = fy * fy * (3 - 2 * fy);
    const i = iy * stride + ix;
    const a = values[i] + (values[i + 1] - values[i]) * tx;
    const b =
      values[i + stride] + (values[i + stride + 1] - values[i + stride]) * tx;
    return a + (b - a) * ty;
  };
}

function grainField(width: number, height: number): GrainField {
  if (cachedField?.width === width && cachedField.height === height)
    return cachedField;
  let state = 0x8f0a35b9;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const span = Math.min(width, height);
  const bloom = noiseGrid(span * 0.65, span * 0.57, width, height, random);
  const cloud = noiseGrid(span * 0.19, span * 0.13, width, height, random);
  const fleck = noiseGrid(
    Math.max(2, span * 0.034),
    Math.max(2, span * 0.027),
    width,
    height,
    random
  );
  const rank = new Uint8Array(width * height);
  const warm = new Uint8Array(rank.length);
  const histogram = new Uint32Array(256);

  for (let y = 0; y < height; y++) {
    // A few narrow deposits elongate horizontally like ink dragged across paper.
    const drag = random() < 0.075 ? 0.03 + random() * 0.047 : 0;
    const center = random() * width,
      length = width * (0.06 + random() * 0.13);
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const grain = random();
      const streak = drag * Math.max(0, 1 - Math.abs(x - center) / length);
      const value =
        (0.342 * (x + 0.5)) / width +
        0.075 * (1 - (y + 0.5) / height) +
        0.249 * bloom(x, y) +
        0.138 * cloud(x, y) +
        0.083 * fleck(x, y) +
        0.113 * grain -
        streak;
      const bin = Math.min(255, Math.max(0, Math.round(value * 255)));
      rank[i] = bin;
      histogram[bin]++;
      warm[i] = grain > 0.43 ? 1 : 0;
    }
  }
  // Equalise coverage so the first and last quarter of the transition both move.
  const quantile = new Uint8Array(256);
  let count = 0;
  for (let i = 0; i < histogram.length; i++) {
    quantile[i] = Math.round(
      7 + (241 * (count + histogram[i] * 0.5)) / rank.length
    );
    count += histogram[i];
  }
  for (let i = 0; i < rank.length; i++) rank[i] = quantile[rank[i]];
  cachedField = { width, height, rank, warm };
  return cachedField;
}

/**
 * Render two equally sized, opaque compositions into an unclipped target of the
 * same size. The sources are borrowed and must stay unchanged until the last call.
 * Each invocation is independent of earlier progress, including backwards seeks.
 */
export function createGrainDissolve(
  from: HTMLCanvasElement,
  to: HTMLCanvasElement
): (ctx: CanvasRenderingContext2D, progress: number) => void {
  const width = from.width,
    height = from.height;
  if (!width || !height) return () => {};
  const scale = Math.min(
    0.68,
    544 / Math.max(width, height),
    256 / Math.min(width, height)
  );
  const mw = Math.max(1, Math.round(width * scale));
  const mh = Math.max(1, Math.round(height * scale));
  const field = grainField(mw, mh);
  const atlas = document.createElement("canvas");
  atlas.width = mw;
  atlas.height = mh * 2;
  const mask = atlas.getContext("2d");
  const plate = document.createElement("canvas");
  plate.width = width;
  plate.height = height;
  const layer = plate.getContext("2d");
  const pixels = mask?.createImageData(mw, mh * 2);
  const edgeOffset = mw * mh * 4;
  const coverage = new Uint8Array(256);
  const fringe = new Uint8Array(256);

  if (pixels) {
    // Upper half stores coverage. Lower half stores a brief copper/indigo edge
    // with the same seed as its grain; it never lights the entire composition.
    for (let i = 0; i < field.rank.length; i++) {
      const p = edgeOffset + 4 * i;
      const warm = field.warm[i];
      pixels.data[p] = warm ? 225 : 39;
      pixels.data[p + 1] = warm ? 178 : 34;
      pixels.data[p + 2] = warm ? 150 : 54;
    }
  }

  return (ctx: CanvasRenderingContext2D, progress: number) => {
    const p = Math.max(0, Math.min(1, progress || 0));
    ctx.save();
    ctx.resetTransform();
    ctx.filter = "none";
    ctx.shadowColor = "transparent";
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(p === 1 ? to : from, 0, 0);
    if (p > 0 && p < 1) {
      ctx.globalCompositeOperation = "source-over";
      if (mask && layer && pixels) {
        for (let i = 0; i < 256; i++) {
          const distance = p * 255 - i;
          const t = Math.max(0, Math.min(1, 0.5 + distance / 14));
          coverage[i] = Math.round(255 * t * t * (3 - 2 * t));
          const edge = Math.max(0, 1 - Math.abs(distance + 1) / 12);
          fringe[i] = Math.round(25 * edge * edge);
        }
        for (let i = 0, a = 3; i < field.rank.length; i++, a += 4) {
          const bin = field.rank[i];
          pixels.data[a] = coverage[bin];
          pixels.data[a + edgeOffset] = fringe[bin];
        }
        mask.putImageData(pixels, 0, 0);

        layer.globalCompositeOperation = "copy";
        layer.drawImage(atlas, 0, 0, mw, mh, 0, 0, width, height);
        layer.globalCompositeOperation = "source-in";
        layer.drawImage(to, 0, 0);
        ctx.drawImage(plate, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "low";
        ctx.drawImage(atlas, 0, mh, mw, mh, 0, 0, width, height);
      } else {
        ctx.globalAlpha = p;
        ctx.drawImage(to, 0, 0);
      }
    }
    ctx.restore();
  };
}

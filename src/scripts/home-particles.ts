type Scene = "home" | "content";
type Sample = {
  x: number;
  y: number;
  light: number;
  tint: number;
  mist: number;
  order: number;
};
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  light: number;
  fromLight: number;
  toLight: number;
  tint: number;
  fromTint: number;
  toTint: number;
  mist: number;
  fromMist: number;
  toMist: number;
  phase: number;
  depth: number;
  size: number;
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

// Morton ordering pairs nearby regions, keeping the morph coherent instead of
// throwing every particle across the whole viewport.
function spatialOrder(x: number, y: number) {
  const spread = (n: number) => {
    n = (n | (n << 8)) & 0x00ff00ff;
    n = (n | (n << 4)) & 0x0f0f0f0f;
    n = (n | (n << 2)) & 0x33333333;
    return (n | (n << 1)) & 0x55555555;
  };
  return (
    spread(Math.round((x + 0.5) * 1023)) |
    (spread(Math.round((y + 0.5) * 1023)) << 1)
  );
}

export function createHomeParticles(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return { setScene: (_scene: Scene) => {}, dispose: () => {} };
  const context = ctx;
  const listeners = new AbortController();
  const { signal } = listeners;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const particles: Particle[] = [];
  const tones = 40;
  const tintSteps = 5;
  const buckets: Particle[][] = Array.from(
    { length: tones * tintSteps },
    () => []
  );
  // A low-resolution layer gives the sampled white edges a soft bloom without
  // blurring facial detail in the full-resolution particle layer.
  const mistCanvas = document.createElement("canvas");
  const mistContext = mistCanvas.getContext("2d");
  const samples = new Map<Scene, Promise<Sample[]>>();
  const pointer = { x: -1000, y: -1000, active: false };
  let width = 1,
    height = 1,
    frame = 0,
    previousFrame = 0,
    time = 0;
  let progress = 1,
    disposed = false,
    revision = 0;
  let assembling = false;
  let reveal = 1;
  let requested: Scene | undefined;
  let activeScene: Scene = "home";
  let contentStyle = 0,
    fromContentStyle = 0;
  let livePlacement = { x: 0, y: 0, size: 1 };
  let fromPlacement = { ...livePlacement };
  let paused = motion.matches;
  let theme = document.documentElement.dataset.theme === "dark" ? 1 : 0;
  let targetTheme = theme;
  let seed = 177809507;
  let targetSamples: Sample[] | undefined;
  const count = innerWidth < 768 ? 15000 : 38000;
  const duration = 1.65;
  let palette: string[] = [];
  let paletteTheme = -1;

  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function rgb(light: number[], dark: number[], amount = theme) {
    return `rgb(${light.map((value, i) => Math.round(mix(value, dark[i], amount))).join(",")})`;
  }

  function frameFor(scene: Scene) {
    const mobile = width < 768;
    if (scene === "home")
      return {
        size: mobile
          ? Math.min(width * 1.06, 430)
          : Math.min(width * 0.53, height * 0.8, 710),
        x: mobile ? width * 0.56 : width / 2 + Math.min(width * 0.23, 280),
        y: mobile ? 247 : Math.min(430, height * 0.49 + 20),
      };
    return {
      size: mobile
        ? Math.min(height * 0.9, 660)
        : Math.min(height * 1.02, 1060),
      x: mobile ? width * 0.72 : width / 2 + Math.min(width * 0.44, 600),
      y: height * 0.54,
    };
  }

  async function sampleImage(scene: Scene): Promise<Sample[]> {
    const image = new Image();
    image.src = (
      scene === "home"
        ? canvas.dataset.portrait
        : canvas.dataset.contentPortrait
    )!;
    await image.decode();
    const sampleSize = scene === "content" ? 960 : 520;
    // This white-background artwork has a large empty top margin and thin
    // black scan borders. Crop those before measuring the particle placement.
    const sourceY = scene === "content" ? image.naturalHeight * 0.112 : 0;
    const sourceHeight =
      scene === "content" ? image.naturalHeight * 0.885 : image.naturalHeight;
    const scale = sampleSize / Math.max(image.naturalWidth, sourceHeight);
    const w = Math.round(image.naturalWidth * scale);
    const h = Math.round(sourceHeight * scale);
    const sampler = document.createElement("canvas");
    sampler.width = w;
    sampler.height = h;
    const read = sampler.getContext("2d", { willReadFrequently: true });
    if (!read) throw new Error("Image sampling unavailable");
    read.drawImage(
      image,
      0,
      sourceY,
      image.naturalWidth,
      sourceHeight,
      0,
      0,
      w,
      h
    );
    const { data } = read.getImageData(0, 0, w, h);
    // The new source has a white background. Use the same white rejection as
    // the homepage instead of the old blue-sky mask and hand-traced silhouette.
    const backgroundMask = new Uint8Array(w * h);
    for (let i = 0; i < backgroundMask.length; i++) {
      backgroundMask[i] = Number(
        Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) > 239
      );
    }
    const points: Sample[] = [];
    for (let y = 1; y < h - 1; y += 2) {
      for (let x = 1; x < w - 1; x += 2) {
        const index = (y * w + x) * 4;
        const r = data[index],
          g = data[index + 1],
          b = data[index + 2];
        const light = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
        if (backgroundMask[y * w + x]) continue;
        const edge = Math.min(x, y, w - x, h - y) / Math.min(w, h);
        if (scene === "home" && random() > Math.min(1, edge * 18 + 0.05))
          continue;
        let nearBackground = false;
        if (scene === "content") {
          for (const [dx, dy] of [
            [-6, 0],
            [6, 0],
            [0, -6],
            [0, 6],
          ]) {
            const sx = Math.max(0, Math.min(w - 1, x + dx));
            const sy = Math.max(0, Math.min(h - 1, y + dy));
            if (backgroundMask[sy * w + sx]) {
              nearBackground = true;
              break;
            }
          }
        }
        const nx = (x - w / 2 + (random() - 0.5) * 1.2) / sampleSize;
        const ny = (y - h / 2 + (random() - 0.5) * 1.2) / sampleSize;
        const tint =
          scene === "content" ? Math.max(-1, Math.min(1, (r - b) / 85)) : 0.38;
        const mist =
          light > 0.8 ? (nearBackground || edge < 0.055 ? 1 : 0.35) : 0;
        points.push({
          x: nx,
          y: ny,
          light,
          tint,
          mist,
          order: spatialOrder(nx, ny),
        });
      }
    }
    if (!points.length) throw new Error("No portrait samples");
    return points.sort((a, b) => a.order - b.order);
  }

  function load(scene: Scene) {
    let pending = samples.get(scene);
    if (!pending) {
      pending = sampleImage(scene);
      samples.set(scene, pending);
      // Retry a failed prefetch on an actual navigation, without unhandled rejections.
      void pending.catch(() => samples.delete(scene));
    }
    return pending;
  }

  function retarget(snap: boolean) {
    if (!targetSamples) return;
    // Resizing or navigating midway continues from the live cloud.
    assembling = false;
    if (snap) reveal = 1;
    fromContentStyle = contentStyle;
    fromPlacement = { ...livePlacement };
    if (snap) contentStyle = activeScene === "content" ? 1 : 0;
    const placement = frameFor(activeScene);
    for (let i = 0; i < count; i++) {
      const sample =
        targetSamples[
          Math.min(
            targetSamples.length - 1,
            Math.floor(((i + 0.5) * targetSamples.length) / count)
          )
        ];
      const x = placement.x + sample.x * placement.size;
      const y = placement.y + sample.y * placement.size;
      const p = particles[i] ?? {
        x,
        y,
        vx: 0,
        vy: 0,
        fromX: x,
        fromY: y,
        toX: x,
        toY: y,
        light: sample.light,
        fromLight: sample.light,
        toLight: sample.light,
        tint: sample.tint,
        fromTint: sample.tint,
        toTint: sample.tint,
        mist: sample.mist,
        fromMist: sample.mist,
        toMist: sample.mist,
        phase: random() * Math.PI * 2,
        depth: random(),
        size: 0.6 + random() * 0.85,
      };
      // Capture current positions, so a reversal continues from the live shape.
      p.fromX = p.x;
      p.fromY = p.y;
      p.fromLight = p.light;
      p.fromTint = p.tint;
      p.fromMist = p.mist;
      p.toX = x;
      p.toY = y;
      p.toLight = sample.light;
      p.toTint = sample.tint;
      p.toMist = sample.mist;
      if (snap) {
        p.x = x;
        p.y = y;
        p.light = sample.light;
        p.tint = sample.tint;
        p.mist = sample.mist;
        p.vx = p.vy = 0;
      }
      particles[i] = p;
    }
    progress = snap ? 1 : 0;
    pointer.active = false;
  }

  async function setScene(scene: Scene) {
    if (requested === scene || disposed) return;
    requested = scene;
    const ticket = ++revision;
    try {
      const points = await load(scene);
      if (disposed || ticket !== revision) return;
      const initial = !particles.length;
      targetSamples = points;
      activeScene = scene;
      retarget(initial || paused);
      if (initial && !paused) {
        const placement = frameFor(scene);
        fromPlacement = livePlacement = { ...placement };
        fromContentStyle = contentStyle = scene === "content" ? 1 : 0;
        for (const p of particles) {
          const angle = random() * Math.PI * 2;
          const radius = Math.sqrt(random());
          // Distribute positions independently of source pixels: the opening
          // reads as a cloud, not an enlarged or blurred copy of the portrait.
          p.x = p.fromX =
            placement.x + Math.cos(angle) * radius * placement.size * 0.62;
          p.y = p.fromY =
            placement.y + Math.sin(angle) * radius * placement.size * 0.62;
        }
        assembling = true;
        progress = 0;
        reveal = 0;
      }
      draw(0);
      resume();
      void load(scene === "home" ? "content" : "home").catch(() => {});
    } catch {
      if (ticket === revision) requested = undefined;
      // A failed image keeps the existing portrait rather than blanking the canvas.
    }
  }

  function updatePalette() {
    const key = Math.round(theme * 80) * 81 + Math.round(contentStyle * 80);
    if (key === paletteTheme) return;
    paletteTheme = key;
    palette = buckets.map((_, i) => {
      const l = (i % tones) / (tones - 1);
      const tint = (Math.floor(i / tones) / (tintSteps - 1) - 0.5) * 2;
      const brightness = Math.pow(l, 1.18);
      const ink = Math.pow(l, 1.1);
      const chroma = Math.sin(l * Math.PI) * tint;
      const lightColor = [
        30 + ink * 220 + chroma * 24,
        27 + ink * 216 - Math.abs(chroma) * 18,
        43 + ink * 207 - chroma * 23,
      ];
      const darkColor = [
        38 + brightness * 217 + chroma * 20,
        33 + brightness * 213 - Math.abs(chroma) * 21,
        48 + brightness * 201 - chroma * 20,
      ];
      // Both portraits share the light-mode ink / pearl range. Compressing
      // highlights into gray makes the content portrait look like flat noise.
      // Dark content keeps its quieter, almost monochrome dust.
      const darkDust = [
        35 + brightness * 157,
        30 + brightness * 142,
        40 + brightness * 141,
      ];
      return rgb(
        lightColor,
        darkColor.map((value, i) => mix(value, darkDust[i], contentStyle))
      );
    });
  }

  function draw(dt: number) {
    if (disposed) return;
    const step = Math.min(dt * 60, 2.5);
    progress = Math.min(1, progress + dt / (assembling ? 2.6 : duration));
    reveal = paused ? 1 : Math.min(1, reveal + dt / 0.8);
    const visibility = smooth(reveal);
    contentStyle = mix(
      fromContentStyle,
      activeScene === "content" ? 1 : 0,
      smooth(progress)
    );
    theme += (targetTheme - theme) * (1 - Math.exp(-dt * 10));
    if (Math.abs(theme - targetTheme) < 0.003 || paused) theme = targetTheme;
    updatePalette();
    const targetPlacement = frameFor(activeScene);
    livePlacement = {
      x: mix(fromPlacement.x, targetPlacement.x, smooth(progress)),
      y: mix(fromPlacement.y, targetPlacement.y, smooth(progress)),
      size: mix(fromPlacement.size, targetPlacement.size, smooth(progress)),
    };
    const placement = livePlacement;
    context.fillStyle = rgb([246, 243, 240], [11, 10, 15]);
    context.fillRect(0, 0, width, height);
    const glow = context.createRadialGradient(
      placement.x,
      placement.y,
      0,
      placement.x,
      placement.y,
      placement.size * 0.9
    );
    glow.addColorStop(0, rgb([179, 163, 186], [44, 29, 36]));
    glow.addColorStop(0.42, rgb([209, 197, 210], [29, 22, 31]));
    glow.addColorStop(1, rgb([246, 243, 240], [11, 10, 15]));
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
    const t = time * 0.34;
    const ease = smooth(progress);
    const wave = Math.sin(Math.PI * progress);
    const friction = Math.pow(0.79, step);
    const pointScale =
      Math.max(0.9, Math.min(placement.size / 620, 1.3)) *
      (count === 15000 ? 1.28 : 1.08);
    for (const bucket of buckets) bucket.length = 0;
    for (const p of particles) {
      // Slightly stagger the first assembly so the cloud doesn't collapse
      // mechanically in one uniform step. Route morph timing stays unchanged.
      const particleEase = assembling
        ? smooth(Math.max(0, Math.min(1, (progress - p.depth * 0.16) / 0.84)))
        : ease;
      const spread = wave * (16 + p.depth * 40);
      let tx =
        mix(p.fromX, p.toX, particleEase) +
        Math.cos(p.phase + progress * 3) * spread;
      let ty =
        mix(p.fromY, p.toY, particleEase) +
        Math.sin(p.phase + progress * 3) * spread * 0.7;
      if (!paused) {
        const drift = mix(0.9, 0.75, contentStyle);
        tx += Math.cos(p.phase + t * 0.6) * drift;
        ty += Math.sin(p.phase + t * 0.5) * drift;
        if (p.depth > 0.96) {
          tx += Math.sin(p.phase + t * 0.7) * 18 * (1 - contentStyle);
          ty += Math.cos(p.phase + t * 0.4) * 8 * (1 - contentStyle);
        }
      }
      p.light = mix(p.fromLight, p.toLight, ease);
      p.tint = mix(p.fromTint, p.toTint, ease);
      p.mist = mix(p.fromMist, p.toMist, ease);
      if (step) {
        p.vx += (tx - p.x) * 0.028 * step;
        p.vy += (ty - p.y) * 0.028 * step;
        if (pointer.active && progress === 1) {
          const dx = p.x - pointer.x,
            dy = p.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0.1 && distance < 85) {
            const push = (1 - distance / 85) * 1.4 * step;
            p.vx += (dx / distance) * push;
            p.vy += (dy / distance) * push;
          }
        }
        p.vx *= friction;
        p.vy *= friction;
        p.x += p.vx * step;
        p.y += p.vy * step;
      }
      const tone = Math.min(tones - 1, Math.floor(p.light * (tones - 1)));
      const tint = Math.round((p.tint + 1) * 0.5 * (tintSteps - 1));
      buckets[tint * tones + tone].push(p);
    }
    if (mistContext) {
      mistContext.clearRect(0, 0, mistCanvas.width, mistCanvas.height);
      // Light content borrows the homepage's soft tonal layer, but only from
      // interior samples. The cleaned silhouette and absent outer halo stay intact.
      for (let color = 0; color < buckets.length; color++) {
        mistContext.fillStyle = palette[color];
        mistContext.globalAlpha =
          0.4 * (1 - contentStyle) + 0.3 * contentStyle * (1 - theme);
        const bucket = buckets[color];
        for (let i = 0; i < bucket.length; i += 3) {
          const p = bucket[i];
          if (p.mist >= 0.5 && p.depth < contentStyle) continue;
          const radius = (2 + p.mist * 3 * (1 - contentStyle)) * pointScale;
          mistContext.fillRect(
            (p.x - radius) / 4,
            (p.y - radius) / 4,
            radius / 2,
            radius / 2
          );
        }
      }
      mistContext.globalAlpha = 0.32 * (1 - contentStyle);
      mistContext.fillStyle = "#fffdf8";
      for (let i = 0; i < particles.length; i += 4) {
        const p = particles[i];
        if (p.mist < 0.5) continue;
        const radius = (7 + p.depth * 10) * p.mist;
        mistContext.fillRect(
          (p.x - radius) / 4,
          (p.y - radius) / 4,
          radius / 2,
          radius / 2
        );
      }
      context.save();
      context.filter = "blur(9px)";
      context.globalAlpha =
        mix(0.5, 0.27, theme) * (1 - wave * 0.45) * visibility;
      context.drawImage(mistCanvas, 0, 0, width, height);
      context.restore();
    }
    context.globalAlpha = visibility;
    for (let color = 0; color < buckets.length; color++) {
      context.fillStyle = palette[color];
      for (const p of buckets[color]) {
        // Use the whole clean sample set so the arms and garment contours
        // remain connected; small dots retain the particle texture.
        const radius =
          p.size * pointScale * mix(1, mix(0.95, 0.86, theme), contentStyle);
        context.fillRect(p.x, p.y, radius, radius);
      }
    }
    context.lineWidth = 0.4;
    context.globalAlpha = (1 - contentStyle) * visibility;
    context.strokeStyle =
      theme > 0.5 ? "rgba(216,168,162,.12)" : "rgba(100,69,84,.12)";
    context.beginPath();
    for (let i = 0; i < particles.length; i += 149) {
      const p = particles[i];
      const length = 4 + p.depth * 14 + wave * 10;
      context.moveTo(p.x, p.y);
      context.quadraticCurveTo(
        p.x + length * 0.6,
        p.y - length * 0.3,
        p.x + length,
        p.y - length * 0.15
      );
    }
    context.stroke();
    context.globalAlpha = 1;
  }

  function resize() {
    width = innerWidth;
    height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    mistCanvas.width = Math.ceil(width / 4);
    mistCanvas.height = Math.ceil(height / 4);
    retarget(paused || !particles.length);
    draw(0);
    resume();
  }

  function tick(now: number) {
    frame = 0;
    if (disposed || paused || document.hidden) return;
    if (!previousFrame) previousFrame = now;
    if (now - previousFrame >= 1000 / 30) {
      const dt = Math.min((now - previousFrame) / 1000, 0.05);
      previousFrame = now;
      time += dt;
      draw(dt);
    }
    frame = requestAnimationFrame(tick);
  }

  function resume() {
    if (!frame && !disposed && !paused && !document.hidden) {
      previousFrame = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  const themeObserver = new MutationObserver(() => {
    targetTheme = document.documentElement.dataset.theme === "dark" ? 1 : 0;
    if (paused || document.hidden) {
      theme = targetTheme;
      draw(0);
    } else resume();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  window.addEventListener("resize", resize, { signal });
  window.addEventListener(
    "pointermove",
    event => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    },
    { passive: true, signal }
  );
  window.addEventListener(
    "pointerup",
    event => {
      if (event.pointerType === "touch") pointer.active = false;
    },
    { signal }
  );
  window.addEventListener(
    "pointercancel",
    () => {
      pointer.active = false;
    },
    { signal }
  );
  window.addEventListener(
    "blur",
    () => {
      pointer.active = false;
    },
    { signal }
  );
  document.addEventListener(
    "pointerleave",
    () => {
      pointer.active = false;
    },
    { signal }
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else resume();
    },
    { signal }
  );
  motion.addEventListener(
    "change",
    () => {
      paused = motion.matches;
      if (paused) {
        cancelAnimationFrame(frame);
        frame = 0;
        retarget(true);
        theme = targetTheme;
        draw(0);
      } else resume();
    },
    { signal }
  );
  resize();
  return {
    setScene,
    dispose() {
      disposed = true;
      revision++;
      listeners.abort();
      themeObserver.disconnect();
      cancelAnimationFrame(frame);
      particles.length = 0;
      samples.clear();
    },
  };
}

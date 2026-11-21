import { frames, type FrameKey } from "../data/frames";
import { composeFrame } from "./scene-canvas";
import { createGrainDissolve } from "./grain-dissolve";

export class DreamLandscape extends HTMLElement {
  private controller?: AbortController;
  private observer?: ResizeObserver;
  private visibilityObserver?: IntersectionObserver;
  private ambient?: HTMLCanvasElement;
  private active?: HTMLElement;
  private pending?: HTMLElement;
  private context: CanvasRenderingContext2D | null = null;
  private target?: HTMLCanvasElement;
  private desired?: FrameKey;
  private loading?: Promise<void>;
  private generation = 0;
  private tick = 0;
  private layoutTick = 0;
  private renderedLayout = "";
  private readonly reduced = matchMedia("(prefers-reduced-motion: reduce)");

  connectedCallback() {
    if (this.hasAttribute("data-small")) return;
    this.active = this.querySelector<HTMLElement>(".dream-plate") ?? undefined;
    const canvas = this.querySelector<HTMLCanvasElement>(".dream-canvas");
    if (!this.active || !canvas) return;
    this.ambient =
      this.querySelector<HTMLCanvasElement>(".dream-signal") ?? undefined;
    this.desired = this.active.dataset.frame as FrameKey;
    this.context = canvas.getContext("2d", { alpha: false });
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.renderedLayout = "";

    // A picture can change source after rotation even if the frame key is unchanged.
    this.addEventListener(
      "load",
      event => {
        if (this.active?.contains(event.target as Node)) this.scheduleLayout();
      },
      { capture: true, signal }
    );
    this.observer = new ResizeObserver(() => this.scheduleLayout());
    this.observer.observe(this);
    this.visibilityObserver = new IntersectionObserver(([entry]) => {
      this.toggleAttribute("data-in-view", entry.isIntersecting);
    });
    this.visibilityObserver.observe(this);
    window.addEventListener("resize", () => this.scheduleLayout(), { signal });
    this.reduced.addEventListener(
      "change",
      () => {
        if (this.reduced.matches) this.finish();
      },
      { signal }
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) this.finish();
      },
      { signal }
    );
    canvas.addEventListener(
      "contextlost",
      event => {
        event.preventDefault();
        this.stop();
        this.context = null;
        this.removeAttribute("data-painted");
      },
      { signal }
    );
    canvas.addEventListener(
      "contextrestored",
      () => {
        this.context = canvas.getContext("2d", { alpha: false });
        this.renderedLayout = "";
        this.scheduleLayout();
      },
      { signal }
    );

    const stage = this.parentElement;
    const fine = matchMedia(
      "(pointer: fine) and (prefers-reduced-motion: no-preference)"
    );
    const center = () => {
      this.style.removeProperty("--art-dx");
      this.style.removeProperty("--art-dy");
    };
    fine.addEventListener("change", center, { signal });
    stage?.addEventListener(
      "pointermove",
      event => {
        if (!fine.matches || event.pointerType === "touch") return;
        const area = stage.getBoundingClientRect();
        this.style.setProperty(
          "--art-dx",
          (1 - (2 * (event.clientX - area.left)) / area.width) * 1.35 + "px"
        );
        this.style.setProperty(
          "--art-dy",
          1 - (2 * (event.clientY - area.top)) / area.height + "px"
        );
      },
      { passive: true, signal }
    );
    stage?.addEventListener("pointerleave", center, { signal });
    this.scheduleLayout();
  }

  disconnectedCallback() {
    this.controller?.abort();
    this.observer?.disconnect();
    this.visibilityObserver?.disconnect();
    if (this.ambient) this.ambient.width = this.ambient.height = 0;
    this.generation++;
    this.pending?.remove();
    this.pending = undefined;
    this.stop();
    cancelAnimationFrame(this.layoutTick);
    this.layoutTick = 0;
    this.removeAttribute("data-painted");
    if (this.context)
      this.context.canvas.width = this.context.canvas.height = 0;
    this.context = null;
  }

  private scheduleLayout() {
    if (this.layoutTick) return;
    this.layoutTick = requestAnimationFrame(() => {
      this.layoutTick = 0;
      this.paint(false);
    });
  }

  private stop() {
    cancelAnimationFrame(this.tick);
    this.tick = 0;
    this.target = undefined;
    this.removeAttribute("data-dissolving");
  }

  private finish() {
    if (this.target) this.context?.drawImage(this.target, 0, 0);
    this.stop();
  }

  private paint(transition: boolean) {
    const ctx = this.context;
    const plate = this.active;
    if (!ctx || !plate) return;
    const img = plate.querySelector("img")!;
    const key = [
      plate.dataset.frame,
      this.parentElement?.hasAttribute("data-reading"),
      img.currentSrc,
      this.clientWidth,
      this.clientHeight,
      devicePixelRatio,
      matchMedia("(max-width: 700px)").matches,
    ].join("|");
    if (key === this.renderedLayout) return;
    const next = composeFrame(plate, this.ambient);
    if (!next) return;
    this.renderedLayout = key;
    const screen = ctx.canvas;
    const canDissolve =
      transition &&
      this.hasAttribute("data-painted") &&
      !this.reduced.matches &&
      !document.hidden &&
      screen.width === next.width &&
      screen.height === next.height;
    this.stop();
    if (screen.width !== next.width || screen.height !== next.height) {
      screen.width = next.width;
      screen.height = next.height;
    }
    this.toggleAttribute("data-painted", true);
    if (!canDissolve) {
      ctx.drawImage(next, 0, 0);
      return;
    }

    // Capture what is visible now, including a partially dissolved shot if
    // the reader advanced quickly. Only the active transition retains buffers.
    const from = document.createElement("canvas");
    from.width = screen.width;
    from.height = screen.height;
    const snapshot = from.getContext("2d", { alpha: false });
    if (!snapshot) {
      ctx.drawImage(next, 0, 0);
      return;
    }
    snapshot.drawImage(screen, 0, 0);
    const dissolve = createGrainDissolve(from, next);
    this.target = next;
    this.toggleAttribute("data-dissolving", true);
    const start = performance.now();
    const draw = (now: number) => {
      const progress = Math.max(0, (now - start) / 820);
      if (progress >= 1) {
        this.finish();
        return;
      }
      dissolve(ctx, progress);
      this.tick = requestAnimationFrame(draw);
    };
    this.tick = requestAnimationFrame(draw);
  }

  show(key: FrameKey) {
    this.scheduleLayout();
    if (key !== this.desired) this.loading = this.loadFrame(key);
    return this.loading;
  }

  private async loadFrame(key: FrameKey) {
    if (!this.active || key === this.desired) return;
    const revision = ++this.generation;
    this.desired = key;
    this.pending?.remove();
    this.pending = undefined;
    if (key === this.active.dataset.frame) return;
    const next = this.active.cloneNode(true) as HTMLElement;
    const art = frames[key];
    const source = next.querySelector("source")!;
    const img = next.querySelector("img")!;
    next.dataset.frame = key;
    next.toggleAttribute("data-portrait", art.portrait);
    next.style.setProperty("--art-tone", art.tone);
    next.style.setProperty("--art-ratio", String(art.ratio));
    next.style.setProperty("--art-x", art.x + "%");
    next.style.setProperty("--art-y", art.y + "%");
    next.style.setProperty(
      "--art-wash",
      "url(" + JSON.stringify(art.thumb) + ")"
    );
    next.style.opacity = "0";
    next.setAttribute("aria-hidden", "true");
    img.alt = art.alt;
    source.srcset = art.mobile;
    img.src = art.full;
    this.pending = next;
    this.active.after(next);
    try {
      await img.decode();
    } catch {
      if (revision !== this.generation) return;
      try {
        await img.decode();
      } catch {
        if (revision !== this.generation) return;
        next.remove();
        this.pending = undefined;
        this.desired = this.active?.dataset.frame as FrameKey;
        return;
      }
    }
    if (revision !== this.generation) return;
    this.active.remove();
    this.active = next;
    this.pending = undefined;
    next.style.removeProperty("opacity");
    next.removeAttribute("aria-hidden");
    this.dataset.frame = key;
    this.paint(true);
  }
}

if (!customElements.get("dream-landscape"))
  customElements.define("dream-landscape", DreamLandscape);

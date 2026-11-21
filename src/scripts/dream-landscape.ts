import { frames, type FrameKey } from "../data/frames";

class DreamLandscape extends HTMLElement {
  private controller?: AbortController;
  private active?: HTMLElement;
  private pending?: HTMLElement;
  private fade?: Animation;
  private desired?: FrameKey;
  private generation = 0;

  connectedCallback() {
    if (this.hasAttribute("data-small")) return;
    if (this.active?.parentElement !== this) {
      this.active =
        this.querySelector<HTMLElement>(".dream-plate") ?? undefined;
    }
    if (!this.active) return;
    this.desired = this.active.dataset.frame as FrameKey;
    this.controller = new AbortController();
    const signal = this.controller.signal;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia(
      "(pointer: fine) and (prefers-reduced-motion: no-preference)"
    );
    window.addEventListener(
      "dream:scene",
      event => {
        const key: unknown = (event as CustomEvent<{ frame: string }>).detail
          ?.frame;
        if (typeof key === "string" && Object.hasOwn(frames, key)) {
          void this.show(key as FrameKey, reduce);
        }
      },
      { signal }
    );
    reduce.addEventListener(
      "change",
      () => {
        if (reduce.matches) this.fade?.finish();
      },
      { signal }
    );
    const stage = this.parentElement;
    const center = () => {
      this.style.removeProperty("--art-dx");
      this.style.removeProperty("--art-dy");
    };
    fine.addEventListener("change", center, { signal });
    stage?.addEventListener(
      "pointermove",
      event => {
        if (!fine.matches || event.pointerType === "touch") return;
        const box = stage.getBoundingClientRect();
        this.style.setProperty(
          "--art-dx",
          (1 - (2 * (event.clientX - box.left)) / box.width) * 1.35 + "px"
        );
        this.style.setProperty(
          "--art-dy",
          1 - (2 * (event.clientY - box.top)) / box.height + "px"
        );
      },
      { passive: true, signal }
    );
    stage?.addEventListener("pointerleave", center, { signal });
  }

  disconnectedCallback() {
    this.controller?.abort();
    this.generation++;
    this.pending?.remove();
    this.pending = undefined;
    this.fade?.finish();
  }

  private async show(key: FrameKey, reduce: MediaQueryList) {
    if (!this.active || key === this.desired) return;
    const revision = ++this.generation;
    this.desired = key;
    this.pending?.remove();
    this.pending = undefined;
    if (key === this.active.dataset.frame) return;

    // Clone the server-rendered picture so its media query and art direction
    // stay identical when the reader changes scenes or rotates the device.
    const next = this.active.cloneNode(true) as HTMLElement;
    const art = frames[key];
    const source = next.querySelector("source")!;
    const img = next.querySelector("img")!;
    next.dataset.frame = key;
    next.toggleAttribute("data-portrait", art.portrait);
    next.style.setProperty("--art-tone", art.tone);
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
    this.append(next);

    try {
      await img.decode();
    } catch {
      // Responsive source changes can interrupt decode. Keep the previous
      // artwork if the new source genuinely failed to load.
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
    if (this.fade) await this.fade.finished;
    if (revision !== this.generation) return;

    const previous = this.active;
    this.pending = undefined;
    this.active = next;
    this.dataset.frame = key;
    previous.setAttribute("aria-hidden", "true");
    next.removeAttribute("aria-hidden");
    next.style.opacity = "1";
    if (!reduce.matches) {
      const fade = next.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 450,
        easing: "cubic-bezier(.28,.05,.29,1)",
      });
      this.fade = fade;
      await fade.finished;
      if (this.fade === fade) this.fade = undefined;
    }
    previous.remove();
  }
}

if (!customElements.get("dream-landscape")) {
  customElements.define("dream-landscape", DreamLandscape);
}

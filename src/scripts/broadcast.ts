import { gsap } from "gsap";
import { scenes } from "@/data/broadcast";
import type { FrameKey } from "@/data/frames";

import type { DreamLandscape } from "./dream-landscape";

// The broadcast has no audio files. Two quiet local tones share a slowly moving wind bed.
function makeAmbience(context: AudioContext) {
  const mix = context.createGain();
  mix.gain.setValueAtTime(0, context.currentTime);
  mix.gain.linearRampToValueAtTime(0.12, context.currentTime + 0.6);
  mix.connect(context.destination);
  const buffer = context.createBuffer(
    1,
    context.sampleRate * 3,
    context.sampleRate
  );
  const samples = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < samples.length; i++) {
    last = 0.98 * last + 0.02 * (Math.random() * 2 - 1);
    samples[i] = last;
  }
  const wind = context.createBufferSource();
  wind.buffer = buffer;
  wind.loop = true;
  wind.connect(mix);
  wind.start();

  const voices = [0.048, 0.024].map(level => {
    const tone = context.createOscillator();
    const amount = context.createGain();
    amount.gain.value = level;
    tone.connect(amount).connect(mix);
    tone.start();
    return tone;
  });
  return (scene: number) => {
    const notes = [
      [164.81, 246.94],
      [146.83, 220],
      [196, 293.66],
      [174.61, 261.63],
      [164.81, 329.63],
    ];
    voices.forEach((voice, i) =>
      voice.frequency.setTargetAtTime(
        notes[scene][i],
        context.currentTime,
        0.15
      )
    );
  };
}

class NightBroadcast extends HTMLElement {
  private verseTimer?: number;
  private revision = 0;
  private index = 0;
  private line = 0;
  private reading = false;
  private listener?: AbortController;
  private reveal?: gsap.core.Tween;
  private ambience?: AudioContext;
  private retune?: (index: number) => void;
  private get reduced() {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  private element<T extends HTMLElement = HTMLElement>(name: string) {
    return this.querySelector<T>(`[data-${name}]`)!;
  }

  connectedCallback() {
    this.listener = new AbortController();
    const { signal } = this.listener;
    this.addEventListener("click", this.clickControl, { signal });
    this.addEventListener(
      "keydown",
      event => {
        if (!this.reading) return;
        if (event.key === "Escape") this.leaveStory();
        if (
          !this.element("stage").contains(event.target as Node) ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        )
          return;
        if (event.key === "ArrowRight") {
          event.preventDefault();
          this.advance();
        } else if (event.key === "ArrowLeft" && this.line > 0) {
          event.preventDefault();
          this.line--;
          this.renderLine(true);
        }
      },
      { signal }
    );
    matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
      "change",
      () => {
        if (this.reduced) {
          this.resetMotion();
          if (
            this.reading &&
            this.element("stage").hasAttribute("data-sunflower")
          )
            this.renderLine(true);
        }
      },
      { signal }
    );
    if (!this.reduced) this.revealTitle();
  }

  disconnectedCallback() {
    this.revision++;
    this.listener?.abort();
    this.resetMotion();
    this.stopAudio();
  }

  private resetMotion() {
    this.reveal?.revert();
    window.clearTimeout(this.verseTimer);
  }

  private revealTitle() {
    this.reveal?.revert();
    this.reveal = gsap.fromTo(
      this.element("heading").children,
      {
        yPercent: 12,
        clipPath: "inset(0 0 94% 0)",
        opacity: 0.25,
      },
      {
        yPercent: 0,
        clipPath: "inset(-10% -10% -10% -10%)",
        opacity: 1,
        duration: 0.52,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "transform,opacity,clipPath",
      }
    );
  }

  private clickControl = (event: MouseEvent) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "button"
    );
    if (!button || !this.contains(button)) return;
    const control = button.dataset;
    if ("chapter" in control) this.tune(Number(control.chapter));
    else if ("tune" in control) {
      this.tune(Number(control.tune));
      const target = this.reading
        ? this.element("next-line")
        : this.element("heading");
      target.focus({ preventScroll: true });
      this.element("stage").scrollIntoView({
        behavior: this.reduced ? "instant" : "smooth",
        block: "start",
      });
    } else if ("read" in control) this.enterStory();
    else if ("close" in control) this.leaveStory();
    else if ("nextLine" in control) this.advance();
    else if ("back" in control && this.line > 0) {
      this.line--;
      this.renderLine(true);
    } else if ("audio" in control) void this.toggleAudio();
  };

  private tune(rawIndex: number) {
    this.resetMotion();
    this.index = (rawIndex + scenes.length) % scenes.length;
    this.line = 0;
    const scene = scenes[this.index];
    this.querySelectorAll<HTMLButtonElement>(
      "[data-tune], [data-chapter]"
    ).forEach(button =>
      button.setAttribute(
        "aria-pressed",
        String(
          Number(button.dataset.tune ?? button.dataset.chapter) === this.index
        )
      )
    );
    this.element("status").textContent =
      `第 ${this.index + 1} 幕，${scene.label}。`;
    this.retune?.(this.index);
    if (this.reading) {
      this.renderLine();
    } else {
      void this.presentFrame(scene.cover, () => {
        this.element("title-top").textContent = scene.title[0];
        this.element("title-bottom").textContent = scene.title[1];
        if (!this.reduced) this.revealTitle();
      });
    }
  }

  private enterStory() {
    this.resetMotion();
    this.reading = true;
    this.element("stage").toggleAttribute("data-reading", true);
    this.line = 0;
    this.element("copy").hidden = true;
    this.element("story").hidden = false;
    this.element("reading-controls").hidden = false;
    this.renderLine();
    this.element("next-line").focus({ preventScroll: true });
  }

  private leaveStory(index = this.index) {
    this.reading = false;
    this.element("stage").removeAttribute("data-sunflower");
    this.element("stage").removeAttribute("data-reading");
    this.element("story").hidden = true;
    this.element("reading-controls").hidden = true;
    this.element("copy").hidden = false;
    this.tune(index);
    this.element("read").focus({ preventScroll: true });
  }

  private async presentFrame(frame: FrameKey, revealText: () => void) {
    const revision = ++this.revision;
    await customElements.whenDefined("dream-landscape");
    if (revision !== this.revision) return;
    const landscape =
      this.element("stage").querySelector<DreamLandscape>("dream-landscape")!;
    await landscape.show(frame);
    if (revision === this.revision) revealText();
  }

  private renderLine(settled = false) {
    this.resetMotion();
    const scene = scenes[this.index];
    const passage = scene.lines[this.line];
    this.element<HTMLButtonElement>("back").disabled = this.line === 0;
    this.element("next-line").querySelector("span")!.textContent =
      this.line < scene.lines.length - 1
        ? "下一句"
        : this.index === scenes.length - 1
          ? "回到开场"
          : "换一个视角";
    const verse = passage.verse;
    const turn = verse?.turn;
    const hold = turn && !settled && !this.reduced;
    const story = this.element("story");
    this.element("stage").toggleAttribute("data-sunflower", !!verse);
    void this.presentFrame(turn && !hold ? turn.frame : passage.frame, () => {
      this.element("speaker").textContent = passage.speaker ?? "";
      this.element("speaker").hidden = !passage.speaker;
      const line = this.element("line");
      if (verse) {
        story.dataset.placement = verse.placement;
        const phrases = verse.phrases.map((text, i) => {
          const phrase = document.createElement("span");
          phrase.textContent = text;
          phrase.toggleAttribute("data-awaiting", !!hold && i >= turn.after);
          return phrase;
        });
        line.replaceChildren(...phrases);
        if (hold) {
          this.verseTimer = window.setTimeout(() => {
            void this.presentFrame(turn.frame, () => {
              for (const phrase of phrases)
                phrase.removeAttribute("data-awaiting");
            });
          }, turn.pause);
        }
        return;
      }
      delete story.dataset.placement;
      line.textContent = passage.text;
      if (!this.reduced) {
        this.reveal?.revert();
        this.reveal = gsap.fromTo(
          this.element("line"),
          { opacity: 0.4, y: 4 },
          {
            opacity: 1,
            y: 0,
            duration: 0.22,
            clearProps: "transform,opacity",
          }
        );
      }
    });
  }

  private advance() {
    if (this.line < scenes[this.index].lines.length - 1) {
      this.line++;
      this.renderLine();
    } else if (this.index === scenes.length - 1) {
      this.leaveStory(0);
    } else {
      this.tune(this.index + 1);
    }
  }

  private async toggleAudio() {
    if (this.ambience) {
      this.stopAudio();
      return;
    }
    try {
      const context = new AudioContext();
      this.ambience = context;
      this.retune = makeAmbience(context);
      this.retune(this.index);
      await context.resume();
      if (this.ambience === context) this.audioLabel(true);
    } catch {
      this.stopAudio();
      this.element("status").textContent = "当前浏览器无法播放环境音。";
    }
  }

  private audioLabel(on: boolean) {
    const button = this.element("audio");
    button.setAttribute("aria-pressed", String(on));
    button.title = on ? "关闭环境音" : "开启环境音";
    button.setAttribute("aria-label", button.title);
  }

  private stopAudio() {
    if (this.ambience && this.ambience.state !== "closed")
      void this.ambience.close();
    this.ambience = undefined;
    this.retune = undefined;
    this.audioLabel(false);
  }
}

if (!customElements.get("night-broadcast"))
  customElements.define("night-broadcast", NightBroadcast);

type PageSetup = (signal: AbortSignal) => void | (() => void);

/** Dispose at the actual swap: native snapshots are already captured, and
 * Astro's fallback has finished animating the live outgoing elements. */
export function onPageMount(setup: PageSetup) {
  let controller: AbortController | undefined;
  let cleanup: void | (() => void);
  function dispose() {
    controller?.abort();
    cleanup?.();
    cleanup = undefined;
  }
  function mount() {
    dispose();
    controller = new AbortController();
    cleanup = setup(controller.signal);
  }
  function beforeSwap(event: Event) {
    const transition = event as Event & { swap: () => void };
    const swap = transition.swap;
    transition.swap = () => {
      dispose();
      swap();
    };
  }
  document.addEventListener("astro:before-swap", beforeSwap);
  document.addEventListener("astro:after-swap", mount);
  mount();
  const unregister = () => {
    dispose();
    document.removeEventListener("astro:before-swap", beforeSwap);
    document.removeEventListener("astro:after-swap", mount);
  };
  import.meta.hot?.dispose(unregister);
  return unregister;
}

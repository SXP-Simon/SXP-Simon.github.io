const THEME_KEY = "theme";
const LIGHT = "light";
const DARK = "dark";

function getPreferredTheme(): string {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === LIGHT || stored === DARK) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DARK
    : LIGHT;
}

// Reuse the value already set by the inline FOUC-prevention script if available.
let themeValue: string =
  (window as unknown as { __theme?: { value: string } }).__theme?.value ??
  getPreferredTheme();

function persist(): void {
  localStorage.setItem(THEME_KEY, themeValue);
  reflect();
}

function reflect(): void {
  const root = document.firstElementChild;
  root?.setAttribute("data-theme", themeValue);
  root?.classList.toggle("dark", themeValue === DARK);
  document
    .querySelector("#theme-btn")
    ?.setAttribute(
      "aria-label",
      themeValue === DARK ? "切换为浅色模式" : "切换为深色模式"
    );

  // Fill <meta name="theme-color"> with the computed background colour so
  // Android's browser chrome matches the page background.
  const bg = window.getComputedStyle(document.body).backgroundColor;
  document
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", bg);
}

function setup(): void {
  themeValue = getPreferredTheme();
  reflect();
  const button = document.querySelector<HTMLButtonElement>("#theme-btn");
  if (button)
    button.onclick = () => {
      themeValue = themeValue === LIGHT ? DARK : LIGHT;
      persist();
    };
}

setup();

// Re-run after View Transitions navigation.
document.addEventListener("astro:after-swap", setup);

// Carry theme state & theme-color across View Transitions to prevent ANY flashing
document.addEventListener("astro:before-swap", event => {
  const currentTheme =
    localStorage.getItem(THEME_KEY) ||
    document.documentElement.getAttribute("data-theme") ||
    (document.documentElement.classList.contains("dark") ? DARK : LIGHT);

  const newDoc = (event as { newDocument: Document }).newDocument;
  newDoc.documentElement.setAttribute("data-theme", currentTheme);
  newDoc.documentElement.classList.toggle("dark", currentTheme === DARK);

  const color = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");
  if (color) {
    newDoc
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", color);
  }
});

// Sync with OS-level dark/light preference changes.
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", ({ matches }) => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === LIGHT || stored === DARK) return;
    themeValue = matches ? DARK : LIGHT;
    reflect();
  });

window.addEventListener("storage", event => {
  if (event.key === THEME_KEY || event.key === null) {
    themeValue = getPreferredTheme();
    reflect();
  }
});

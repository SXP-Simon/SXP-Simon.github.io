/**
 * CustomShiki transformer that adds file name labels to code blocks.
 *
 * This transformer looks for the `file="filename"` meta attribute in code blocks
 * and creates a styled label showing the filename. It supports two different
 * styling options and can optionally hide the green dot indicator.
 *
 * @param {Object} options - Configuration options for the transformer
 * @param {string} [options.style="v2"] - The styling variant to use
 *   - `"v1"`: Tab-style with rounded top corners, positioned at top-left
 *   - `"v2"`: Badge-style with border, positioned at top-left with offset
 * @param {boolean} [options.hideDot=false] - Whether to hide the green dot indicator
 */
export const transformerFileName = ({
  style = "v2",
  hideDot = false,
} = {}) => ({
  pre(node) {
    const raw = this.options.meta?.__raw?.split(" ");

    if (!raw) return;

    const metaMap = new Map();

    for (const item of raw) {
      const [key, value] = item.split("=");
      if (!key || !value) continue;
      metaMap.set(key, value.replace(/["'`]/g, ""));
    }

    const file = metaMap.get("file");

    if (!file) return;

    // Add relative positioning, top margin, and extra top padding (pt-11) so code lines never overlap badge
    this.addClassToHast(
      node,
      "relative mt-6 pt-11!"
    );

    // Add file name badge inside top header bar of code block
    node.children.push({
      type: "element",
      tagName: "span",
      properties: {
        class: [
          "absolute top-2.5 left-3 z-10 py-0.5 text-foreground/85 text-xs font-mono font-medium leading-5 select-none",
          hideDot
            ? "px-2"
            : "pl-4 pr-2.5 before:inline-block before:size-1.5 before:bg-emerald-500 before:rounded-full before:absolute before:top-[50%] before:-translate-y-1/2 before:left-1.5",
          "rounded-md border border-border/70 bg-background/80 dark:bg-muted/40 shadow-xs backdrop-blur-xs",
        ],
      },
      children: [
        {
          type: "text",
          value: file,
        },
      ],
    });
  },
});

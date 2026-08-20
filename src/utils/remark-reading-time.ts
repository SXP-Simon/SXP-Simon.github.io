// Helper to extract text from MDAST tree
function extractText(node: any): string {
  if (!node) return "";
  if (typeof node.value === "string") return node.value;
  if (Array.isArray(node.children)) {
    return node.children.map(extractText).join(" ");
  }
  return "";
}

export function remarkReadingTime() {
  return function (tree: any, { data }: any) {
    const text = extractText(tree);
    
    // Count CJK characters
    const cjkMatches = text.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g);
    const cjkCount = cjkMatches ? cjkMatches.length : 0;

    // Count Latin/alphanumeric words (excluding pure punctuation)
    const nonCjkText = text.replace(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g, " ");
    const wordMatches = nonCjkText.match(/[a-zA-Z0-9_\-\.\@]+/g);
    const wordCount = wordMatches ? wordMatches.length : 0;

    const totalWords = cjkCount + wordCount;

    // Standard reading speeds:
    // CJK characters: ~350 chars/min
    // English words: ~200 words/min
    const cjkMinutes = cjkCount / 350;
    const wordMinutes = wordCount / 200;
    const readingTimeMinutes = Math.max(1, Math.ceil(cjkMinutes + wordMinutes));

    if (!data.astro) {
      data.astro = {};
    }
    if (!data.astro.frontmatter) {
      data.astro.frontmatter = {};
    }

    data.astro.frontmatter.readingTime = `${readingTimeMinutes} 分钟`;
    data.astro.frontmatter.readingMinutes = readingTimeMinutes;
    data.astro.frontmatter.wordCount = totalWords;
    data.astro.frontmatter.wordCountStr =
      totalWords >= 1000
        ? `${(totalWords / 1000).toFixed(1)}k 字`
        : `${totalWords} 字`;
  };
}

import { marked } from 'marked';
import { createHighlighter, bundledLanguages, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Get or create a cached highlighter instance
 */
const getHighlighter = async (): Promise<Highlighter> => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: Object.keys(bundledLanguages)
    });
  }
  return highlighterPromise;
};

/**
 * Highlight code using Shiki
 * @param code - The code to highlight
 * @param lang - The language to use for highlighting
 * @param options - Options for highlighting
 */
export const highlightCode = async (
  code: string,
  lang: string = 'text',
  options: {
    theme?: 'github-light' | 'github-dark';
    showLineNumbers?: boolean;
  } = {}
): Promise<string> => {
  const highlighter = await getHighlighter();
  const { theme = 'github-light', showLineNumbers = false } = options;

  // Normalize language name
  const normalizedLang = lang
    .toLowerCase()
    .replace(/^sh$/, 'bash')
    .replace(/^ts$/, 'typescript')
    .replace(/^js$/, 'javascript');

  const html = highlighter.codeToHtml(code, {
    lang: normalizedLang,
    theme
  });

  // Determine theme class
  const themeClass = theme === 'github-dark' ? 'shiki-dark' : 'shiki-light';

  // Add line numbers if requested
  if (showLineNumbers) {
    const lines = code.split('\n');
    const lineNumbersHtml = lines
      .map((_, i) => `<span class="line-number">${i + 1}</span>`)
      .join('');

    // Wrap the code with line numbers and not-prose
    const withLineNumbers = html
      .replace(
        /<pre/,
        `<div class="code-block-wrapper ${themeClass}"><div class="line-numbers">` +
          lineNumbersHtml +
          '</div><pre'
      )
      .replace(/<\/pre>/, '</pre></div>');

    // Wrap in not-prose to prevent Tailwind Typography styles
    return `<div class="not-prose">${withLineNumbers}</div>`;
  }

  // Add copy button support via data attribute and wrap in not-prose
  const modifiedHtml = html.replace(
    /<pre/,
    `<pre data-code="${encodeURIComponent(code)}" data-language="${normalizedLang}"`
  );

  // Wrap in not-prose and code-block to prevent Tailwind Typography styles and add border
  return `<div class="not-prose"><div class="code-block ${themeClass}">${modifiedHtml}</div></div>`;
};

/**
 * Process markdown with syntax highlighting for code blocks
 * @param markdown - The markdown content to process
 * @param options - Options for processing
 */
export const processMarkdown = async (
  markdown: string,
  options: {
    theme?: 'github-light' | 'github-dark';
    showLineNumbers?: boolean;
    gfm?: boolean;
  } = {}
): Promise<string> => {
  const {
    theme = 'github-light',
    showLineNumbers = false,
    gfm = true
  } = options;

  // Configure marked options
  marked.setOptions({
    gfm,
    breaks: gfm
  });

  // Create a custom renderer for code blocks
  const renderer = new marked.Renderer();

  // Store async highlighted code blocks
  const codeBlocks: Promise<{ index: number; html: string }>[] = [];
  let blockIndex = 0;
  const placeholders: string[] = [];

  // Override code block rendering
  renderer.code = ({ text, lang }): string => {
    const currentIndex = blockIndex++;
    const placeholder = `<!--CODE_BLOCK_${currentIndex}-->`;
    placeholders.push(placeholder);

    // Process the code block asynchronously
    codeBlocks.push(
      highlightCode(text, lang || 'text', { theme, showLineNumbers }).then(
        (html) => ({
          index: currentIndex,
          html
        })
      )
    );

    return placeholder;
  };

  // Override inline code rendering (no syntax highlighting)
  renderer.codespan = ({ text }): string => {
    return `<code class="inline-code">${escapeHtml(text)}</code>`;
  };

  // Process the markdown with placeholders
  let html = await marked(markdown, { renderer });

  // Wait for all code blocks to be highlighted
  const highlightedBlocks = await Promise.all(codeBlocks);

  // Replace placeholders with highlighted code
  highlightedBlocks.forEach(({ index, html: codeHtml }) => {
    html = html.replace(`<!--CODE_BLOCK_${index}-->`, codeHtml);
  });

  return html;
};

/**
 * Escape HTML special characters
 */
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';

// Import only essential languages for a SvelteKit library docs
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml'; // HTML/SVG/XML
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import markdown from 'highlight.js/lib/languages/markdown';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('svelte', xml); // Svelte uses XML highlighting
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);

/**
 * Highlight code synchronously using highlight.js
 * @param code - The code to highlight
 * @param lang - The language to use for highlighting
 * @param options - Options for highlighting
 */
export const highlightCodeSync = (
  code: string,
  lang: string = 'text',
  options: {
    theme?: 'github-light' | 'github-dark';
    showLineNumbers?: boolean;
  } = {}
): string => {
  const { theme = 'github-light', showLineNumbers = false } = options;

  // Normalize language name
  const normalizedLang = lang
    .toLowerCase()
    .replace(/^jsx$/, 'javascript')
    .replace(/^tsx$/, 'typescript')
    .replace(/^text$/, 'plaintext')
    .replace(/^plain$/, 'plaintext');

  let highlightedCode: string;

  try {
    // Try to highlight with the specified language
    const result = hljs.highlight(code, { language: normalizedLang });
    highlightedCode = result.value;
  } catch {
    // Fallback to auto-detection or plain text
    try {
      const result = hljs.highlightAuto(code);
      highlightedCode = result.value;
    } catch {
      // If all else fails, escape the HTML
      highlightedCode = escapeHtml(code);
    }
  }

  // Wrap in pre and code tags with hljs class
  const themeClass = theme === 'github-dark' ? 'hljs-dark' : 'hljs-light';

  // Add line numbers if requested
  if (showLineNumbers) {
    const lines = code.split('\n');
    const lineNumbersHtml = lines
      .map((_, i) => `<span class="line-number">${i + 1}</span>`)
      .join('');

    // Wrap the code with line numbers
    const wrappedCode = `<div class="code-block-wrapper ${themeClass}">
      <div class="line-numbers">${lineNumbersHtml}</div>
      <pre class="hljs" data-code="${encodeURIComponent(code)}" data-language="${normalizedLang}"><code>${highlightedCode}</code></pre>
    </div>`;

    // Wrap in not-prose to prevent Tailwind Typography styles
    return `<div class="not-prose">${wrappedCode}</div>`;
  }

  // Add copy button support via data attribute and wrap in not-prose
  const wrappedCode = `<pre class="hljs ${themeClass}" data-code="${encodeURIComponent(code)}" data-language="${normalizedLang}"><code>${highlightedCode}</code></pre>`;

  // Wrap in not-prose and code-block to prevent Tailwind Typography styles and add border
  return `<div class="not-prose"><div class="code-block">${wrappedCode}</div></div>`;
};

/**
 * Process markdown synchronously with syntax highlighting for code blocks
 * @param markdown - The markdown content to process
 * @param options - Options for processing
 */
export const processMarkdownSync = (
  markdown: string,
  options: {
    theme?: 'github-light' | 'github-dark';
    showLineNumbers?: boolean;
    gfm?: boolean;
  } = {}
): string => {
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

  // Override code block rendering
  renderer.code = ({ text, lang }): string => {
    return highlightCodeSync(text, lang || 'text', { theme, showLineNumbers });
  };

  // Override inline code rendering (no syntax highlighting)
  renderer.codespan = ({ text }): string => {
    return `<code class="inline-code">${escapeHtml(text)}</code>`;
  };

  // Process the markdown synchronously
  const result = marked.parse(markdown, { renderer });

  // marked.parse returns string | Promise<string>, but with sync renderer it's always string
  return result as string;
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

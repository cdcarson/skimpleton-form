import { processMarkdown } from '$docs/utils.js';
import pageContent from './page.md?raw';

export const load = async () => {
  const content = await processMarkdown(pageContent, {
    theme: 'github-light',
    showLineNumbers: true
  });
  return {
    content
  };
};

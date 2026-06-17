import type MarkdownIt from "markdown-it";

declare global {
    const markdownit: () => MarkdownIt;
}

export {};
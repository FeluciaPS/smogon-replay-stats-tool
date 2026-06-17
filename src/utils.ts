export function toID(text: string): string {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className?: string
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    return element;
}
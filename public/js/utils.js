export function toID(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
export function el(tag, className) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    return element;
}

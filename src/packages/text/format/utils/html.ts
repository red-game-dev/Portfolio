const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };

// Text made safe to put in HTML, as content or as an attribute's value: nothing in it can open a tag or close a quote.
export const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (character) => ENTITIES[character]);

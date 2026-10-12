/**
 * IDs are typed against each page's DOM contract (src/<game>/types/elements.d.ts).
 * Literal IDs return their specific element type; dynamic IDs return HTMLElement.
 */
function getElement<K extends keyof PageElements>(id: K): PageElements[K];
function getElement<T extends HTMLElement = HTMLElement>(id: string): T;
function getElement(id: string): HTMLElement {
  return document.getElementById(id);
}

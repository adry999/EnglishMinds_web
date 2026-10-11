type Attributes = Record<string, string | number | boolean | undefined>;
type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Attributes = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === false) continue;
    if (name === 'class') element.className = String(value);
    else element.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children) if (child !== null && child !== undefined && child !== false) element.append(child);
  return element;
}

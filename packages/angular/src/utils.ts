export function getDPR(_element: Element): number {
  if (typeof window === 'undefined') {
    return 1;
  }
  return window.devicePixelRatio || 1;
}

export function roundByDPR(element: Element, value: number): number {
  const dpr = getDPR(element);
  return Math.round(value * dpr) / dpr;
}

export function unwrapElement<T>(element: T | null | undefined): T | null {
  return element || null;
}

/**
 * Utility functions for creating arrow paths that match the React FloatingArrow component.
 * @see https://floating-ui.com/docs/FloatingArrow
 */

export interface ArrowPathOptions {
  width?: number;
  height?: number;
  tipRadius?: number;
}

/**
 * Creates the default arrow path that matches React's FloatingArrow.
 */
export function createArrowPath(options: ArrowPathOptions = {}): string {
  const {width = 14, height = 7, tipRadius = 0} = options;

  const svgX = (width / 2) * (tipRadius / -8 + 1);
  const svgY = ((height / 2) * tipRadius) / 4;

  return (
    'M0,0' +
    ` H${width}` +
    ` L${width - svgX},${height - svgY}` +
    ` Q${width / 2},${height} ${svgX},${height - svgY}` +
    ' Z'
  );
}

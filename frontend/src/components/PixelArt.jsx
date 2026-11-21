import React from 'react';

// Renders a low-res sprite from rows of characters.
// Each character maps to a colour in `palette`; '.' (or any unmapped char) is transparent.
// Horizontal runs of the same colour are merged into one rect to keep the DOM small.
const PixelArt = ({ rows, palette = { '#': 'currentColor' }, size, className, title }) => {
  const width = Math.max(...rows.map((r) => r.length));
  const height = rows.length;
  const rects = [];

  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const fill = palette[row[x]];
      let run = 1;
      while (x + run < row.length && row[x + run] === row[x]) run++;
      if (fill) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={fill} />);
      }
      x += run;
    }
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size ? size * (width / height) : undefined}
      height={size}
      className={className}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {rects}
    </svg>
  );
};

export default PixelArt;

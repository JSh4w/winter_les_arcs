import React, { useEffect, useState } from 'react';
import PixelArt from './PixelArt';

const SAIL_EVERY_MS = 5 * 60 * 1000; // a voyage every 5 minutes
const FIRST_SAIL_MS = 8 * 1000;      // first voyage shortly after the page loads

// m mast, k flag, s skull, W sail, b hull, d dark hull, y porthole, w wave
const SHIP = [
  '..........mkkk........',
  '..........mksk........',
  '..........mkkk........',
  '..........m...........',
  '.......WWWmWWW........',
  '......WWWWmWWWW.......',
  '......WWWWmWWWW.......',
  '.......WWWmWWW........',
  '..........m...........',
  '.....WWWWWmWWWWW......',
  '....WWWWWWmWWWWWW.....',
  '....WWWWWWmWWWWWW.....',
  '.....WWWWWmWWWWW......',
  'bb........m.........mm',
  'bbbbbbbbbbbbbbbbbbbbm.',
  '.dddydddydddydddyddd..',
  '..bbbbbbbbbbbbbbbbb...',
  '...ddddddddddddddd....',
  'w..ww...ww...ww...ww.w',
  '.ww..www..www..www..w.',
];

const PALETTE = {
  m: '#3b2a1a',
  k: '#a8443a',
  s: '#e8e2cf',
  W: '#e8e2cf',
  b: '#7a4e2a',
  d: '#4f321b',
  y: '#e0b84f',
  w: '#5f9c86',
};

const PirateShip = () => {
  const [voyage, setVoyage] = useState(0); // 0 = in port; each new number restarts the animation

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    const sail = () => setVoyage((v) => v + 1);
    const first = setTimeout(sail, FIRST_SAIL_MS);
    const interval = setInterval(sail, SAIL_EVERY_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  if (!voyage) return null;

  return (
    <div
      key={voyage}
      className="pirate-ship"
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setVoyage(0);
      }}
    >
      <div className="pirate-ship-bob">
        <PixelArt rows={SHIP} palette={PALETTE} size={80} />
      </div>
    </div>
  );
};

export default PirateShip;

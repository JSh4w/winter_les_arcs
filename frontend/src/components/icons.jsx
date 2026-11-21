import React from 'react';
import PixelArt from './PixelArt';

// Custom pixel icons. All draw in currentColor so they follow the text colour.

const MESSAGE = [
  '.#######.',
  '#.......#',
  '#.#####.#',
  '#.......#',
  '#.###...#',
  '#.......#',
  '.#######.',
  '.##......',
  '.#.......',
];

const BOARD = [
  '#########',
  '#.......#',
  '#.##.##.#',
  '#.......#',
  '#.###.#.#',
  '#.......#',
  '#########',
  '...#.#...',
  '..#####..',
];

const REFRESH = [
  '...####..',
  '..#....#.',
  '.#.....##',
  '.#....###',
  '.#.......',
  '.#.....#.',
  '..#...#..',
  '...###...',
];

const SKULL = [
  '.#####.',
  '#######',
  '#..#..#',
  '#..#..#',
  '#######',
  '.##.##.',
  '.#.#.#.',
];

const ANCHOR = [
  '...#...',
  '..#.#..',
  '...#...',
  '#######',
  '...#...',
  '#..#..#',
  '##.#.##',
  '.#####.',
];

const icon = (rows) => {
  const Icon = ({ size = 18, className = 'pixel-icon', title }) => (
    <PixelArt rows={rows} size={size} className={className} title={title} />
  );
  return Icon;
};

export const MessageIcon = icon(MESSAGE);
export const BoardIcon = icon(BOARD);
export const RefreshIcon = icon(REFRESH);
export const SkullIcon = icon(SKULL);
export const AnchorIcon = icon(ANCHOR);

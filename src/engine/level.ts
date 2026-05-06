import { BubbleColor, GridMap } from './types';
import { cellKey, COLS_EVEN, COLS_ODD } from './grid';

// R=red, G=green, B=blue, Y=yellow
// Even rows: 9 chars, odd rows: 8 chars
const ROW_DEFS: string[] = [
  'RGBYRGBYR', // row 0 (even, 9)
  'YBGRYBGR',  // row 1 (odd,  8)
  'GRYBGRYBY', // row 2 (even, 9)
  'BRYGBRYG',  // row 3 (odd,  8)
  'RBGYRBGYR', // row 4 (even, 9)
  'YRGBYRGB',  // row 5 (odd,  8)
  'GBYRGYBRG', // row 6 (even, 9)
  'RYGBRYGB',  // row 7 (odd,  8)
];

function charToColor(ch: string): BubbleColor | null {
  switch (ch) {
    case 'R': return 'R';
    case 'G': return 'G';
    case 'B': return 'B';
    case 'Y': return 'Y';
    default:  return null;
  }
}

export function buildInitialGrid(): GridMap {
  const grid: GridMap = new Map();
  ROW_DEFS.forEach((rowStr, rowIdx) => {
    const maxCols = rowIdx % 2 === 0 ? COLS_EVEN : COLS_ODD;
    for (let col = 0; col < maxCols && col < rowStr.length; col++) {
      const color = charToColor(rowStr[col]);
      if (color) {
        grid.set(cellKey(rowIdx, col), color);
      }
    }
  });
  return grid;
}

export function randomColor(): BubbleColor {
  const pool: BubbleColor[] = ['R', 'G', 'B', 'Y'];
  return pool[Math.floor(Math.random() * pool.length)];
}

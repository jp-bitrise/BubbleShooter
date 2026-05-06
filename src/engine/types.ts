export type BubbleColor = 'R' | 'G' | 'B' | 'Y';

export const BUBBLE_COLORS: BubbleColor[] = ['R', 'G', 'B', 'Y'];

export const COLOR_HEX: Record<BubbleColor, string> = {
  R: '#E63946',
  G: '#2DC653',
  B: '#4895EF',
  Y: '#F4D03F',
};

export const COLOR_HIGHLIGHT: Record<BubbleColor, string> = {
  R: '#FF8A94',
  G: '#7EE89A',
  B: '#A8D4FF',
  Y: '#FFF59D',
};

export type GridMap = Map<string, BubbleColor>;

export type GamePhase =
  | 'idle'
  | 'aiming'
  | 'shooting'
  | 'processing'
  | 'won'
  | 'lost';

export interface Point {
  x: number;
  y: number;
}

export interface ShotPath {
  points: Point[];
  landingRow: number;
  landingCol: number;
  color: BubbleColor;
}

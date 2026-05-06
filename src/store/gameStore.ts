import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BubbleColor, GamePhase, GridMap, ShotPath } from '../engine/types';
import { buildInitialGrid, randomColor } from '../engine/level';
import { addRowAtTop, cellCenter, cellKey, generateRandomRow } from '../engine/grid';
import { applyShot } from '../engine/matcher';
import { computeShotPath } from '../engine/physics';

const HIGH_SCORE_KEY = '@bubble_high_score';
const ADVANCE_INTERVAL_MS = 20_000;

interface LayoutConfig {
  cellSize: number;
  canvasWidth: number;
  canvasHeight: number;
  launcherX: number;
  launcherY: number;
  dangerRow: number;
}

interface GameState {
  layout: LayoutConfig | null;
  grid: GridMap;
  currentBubble: BubbleColor;
  nextBubble: BubbleColor;
  score: number;
  highScore: number;
  phase: GamePhase;
  shotPath: ShotPath | null;
  nextAdvanceAt: number;
}

interface GameActions {
  initLayout(config: LayoutConfig): void;
  initGame(): void;
  startShoot(angle: number): void;
  placeBubble(): void;
  advanceBoard(): void;
  resetGame(): void;
  loadHighScore(): Promise<void>;
  saveHighScore(): Promise<void>;
}

function isDangerZone(grid: GridMap, dangerRow: number): boolean {
  for (const key of grid.keys()) {
    const row = parseInt(key.split(',')[0], 10);
    if (row >= dangerRow) return true;
  }
  return false;
}

export const useGameStore = create<GameState & GameActions>()((set, get) => ({
  layout: null,
  grid: new Map(),
  currentBubble: 'R',
  nextBubble: 'G',
  score: 0,
  highScore: 0,
  phase: 'idle',
  shotPath: null,
  nextAdvanceAt: 0,

  initLayout(config: LayoutConfig) {
    set({ layout: config });
  },

  initGame() {
    const { layout } = get();
    if (!layout) return;
    set({
      grid: buildInitialGrid(),
      currentBubble: randomColor(),
      nextBubble: randomColor(),
      score: 0,
      phase: 'aiming',
      shotPath: null,
      nextAdvanceAt: Date.now() + ADVANCE_INTERVAL_MS,
    });
  },

  startShoot(angle: number) {
    const { layout, grid, currentBubble, phase } = get();
    if (phase !== 'aiming' || !layout) return;

    const shot = computeShotPath(
      layout.launcherX,
      layout.launcherY,
      angle,
      currentBubble,
      grid,
      layout.cellSize,
      layout.canvasWidth,
    );

    set({ phase: 'shooting', shotPath: shot });
  },

  placeBubble() {
    const { shotPath, grid, currentBubble, nextBubble, score, highScore, layout } = get();
    if (!shotPath || !layout) return;

    // Place bubble in grid
    const { landingRow, landingCol, color } = shotPath;
    const withNew: GridMap = new Map(grid);
    withNew.set(cellKey(landingRow, landingCol), color);

    // Process cluster + cascade
    const { newGrid, poppedCount, fallenCount } = applyShot(withNew, landingRow, landingCol);

    const gained = poppedCount * 10 + fallenCount * 5;
    const newScore = score + gained;
    const newHigh = Math.max(highScore, newScore);

    const allCleared = newGrid.size === 0;
    const danger = isDangerZone(newGrid, layout.dangerRow);

    let nextPhase: GamePhase;
    if (allCleared) {
      nextPhase = 'won';
    } else if (danger) {
      nextPhase = 'lost';
    } else {
      nextPhase = 'aiming';
    }

    set({
      grid: newGrid,
      currentBubble: nextBubble,
      nextBubble: randomColor(),
      score: newScore,
      highScore: newHigh,
      phase: nextPhase,
      shotPath: null,
    });

    if (nextPhase === 'won' || nextPhase === 'lost') {
      get().saveHighScore();
    }
  },

  advanceBoard() {
    const { grid, layout, phase } = get();
    if (!layout || phase === 'won' || phase === 'lost') return;

    const newRow = generateRandomRow(0);
    const newGrid = addRowAtTop(grid, newRow);

    const danger = isDangerZone(newGrid, layout.dangerRow);
    const nextPhase: GamePhase = danger ? 'lost' : phase;

    set({
      grid: newGrid,
      phase: nextPhase,
      nextAdvanceAt: Date.now() + ADVANCE_INTERVAL_MS,
    });

    if (nextPhase === 'lost') {
      get().saveHighScore();
    }
  },

  resetGame() {
    get().initGame();
  },

  async loadHighScore() {
    try {
      const stored = await AsyncStorage.getItem(HIGH_SCORE_KEY);
      if (stored !== null) {
        set({ highScore: parseInt(stored, 10) });
      }
    } catch {
      // ignore
    }
  },

  async saveHighScore() {
    const { highScore } = get();
    try {
      await AsyncStorage.setItem(HIGH_SCORE_KEY, String(highScore));
    } catch {
      // ignore
    }
  },
}));

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BubbleCanvas } from '../components/BubbleCanvas';
import { HUD } from '../components/HUD';
import { useGameStore } from '../store/gameStore';

const COLS_EVEN = 9;
const HUD_HEIGHT = 64;
// How many rows above launcher before we show danger
const DANGER_ROW_OFFSET = 2;

interface Props {
  onMenu: () => void;
}

export const GameScreen: React.FC<Props> = ({ onMenu }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const layout = useGameStore(s => s.layout);
  const grid = useGameStore(s => s.grid);
  const currentBubble = useGameStore(s => s.currentBubble);
  const nextBubble = useGameStore(s => s.nextBubble);
  const score = useGameStore(s => s.score);
  const highScore = useGameStore(s => s.highScore);
  const phase = useGameStore(s => s.phase);
  const shotPath = useGameStore(s => s.shotPath);
  const nextAdvanceAt = useGameStore(s => s.nextAdvanceAt);

  const initLayout = useGameStore(s => s.initLayout);
  const initGame = useGameStore(s => s.initGame);
  const startShoot = useGameStore(s => s.startShoot);
  const placeBubble = useGameStore(s => s.placeBubble);
  const advanceBoard = useGameStore(s => s.advanceBoard);
  const resetGame = useGameStore(s => s.resetGame);
  const loadHighScore = useGameStore(s => s.loadHighScore);

  // Initialise layout + game on mount
  useEffect(() => {
    loadHighScore();

    const statusBarH = StatusBar.currentHeight ?? insets.top;
    const topInset = Math.max(statusBarH, insets.top);
    const canvasHeight = screenHeight - topInset - HUD_HEIGHT;
    const cellSize = screenWidth / COLS_EVEN;
    const launcherX = screenWidth / 2;
    const launcherY = canvasHeight - cellSize * 1.4;
    const rowHeight = cellSize * (Math.sqrt(3) / 2);
    const dangerRow = Math.floor((launcherY - cellSize * 0.5) / rowHeight) - DANGER_ROW_OFFSET;

    initLayout({
      cellSize,
      canvasWidth: screenWidth,
      canvasHeight,
      launcherX,
      launcherY,
      dangerRow,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start game once layout is ready
  useEffect(() => {
    if (layout && phase === 'idle') {
      initGame();
    }
  }, [layout, phase, initGame]);

  // Board advance timer
  const advanceRef = useRef(advanceBoard);
  advanceRef.current = advanceBoard;

  useEffect(() => {
    if (phase === 'won' || phase === 'lost' || phase === 'idle') return;

    const id = setInterval(() => {
      if (Date.now() >= useGameStore.getState().nextAdvanceAt) {
        advanceRef.current();
      }
    }, 500);

    return () => clearInterval(id);
  }, [phase]);

  const handleShoot = useCallback(
    (angle: number) => {
      startShoot(angle);
    },
    [startShoot],
  );

  const handleLanded = useCallback(() => {
    placeBubble();
  }, [placeBubble]);

  if (!layout) {
    return <View style={styles.loading} />;
  }

  const statusBarH = StatusBar.currentHeight ?? insets.top;
  const topInset = Math.max(statusBarH, insets.top);

  const isOver = phase === 'won' || phase === 'lost';

  return (
    <View style={[styles.root, { backgroundColor: '#0D1B2A' }]}>
      <View style={{ height: topInset }} />

      <HUD
        score={score}
        highScore={highScore}
        nextAdvanceAt={nextAdvanceAt}
      />

      <View style={{ flex: 1 }}>
        <BubbleCanvas
          grid={grid}
          currentBubble={currentBubble}
          nextBubble={nextBubble}
          phase={phase}
          shotPath={shotPath}
          cellSize={layout.cellSize}
          canvasWidth={layout.canvasWidth}
          canvasHeight={layout.canvasHeight}
          launcherX={layout.launcherX}
          launcherY={layout.launcherY}
          onShoot={handleShoot}
          onLanded={handleLanded}
        />
      </View>

      {/* Game Over / Win overlay */}
      {isOver && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>
            {phase === 'won' ? '🎉 YOU WIN!' : 'GAME OVER'}
          </Text>
          <Text style={styles.overlayScore}>Score: {score}</Text>
          {score >= highScore && score > 0 && (
            <Text style={styles.newBest}>NEW BEST!</Text>
          )}
          <TouchableOpacity
            style={styles.overlayBtn}
            onPress={resetGame}
            activeOpacity={0.8}>
            <Text style={styles.overlayBtnText}>PLAY AGAIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.overlayBtn, styles.menuBtn]}
            onPress={onMenu}
            activeOpacity={0.8}>
            <Text style={styles.overlayBtnText}>MENU</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pause / back button */}
      {!isOver && (
        <TouchableOpacity style={styles.backBtn} onPress={onMenu} activeOpacity={0.7}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13,27,42,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  overlayTitle: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
  },
  overlayScore: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 22,
    fontWeight: '600',
  },
  newBest: {
    color: '#F4D03F',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
  overlayBtn: {
    backgroundColor: '#4895EF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 52,
    marginTop: 4,
    elevation: 6,
  },
  menuBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  overlayBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
  backBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '700',
  },
});

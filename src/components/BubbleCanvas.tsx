import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import {
  BubbleColor,
  COLOR_HEX,
  COLOR_HIGHLIGHT,
  GamePhase,
  GridMap,
  ShotPath,
} from '../engine/types';
import { cellCenter } from '../engine/grid';
import {
  angleFromTouch,
  computeShotPath,
  getTotalPathLength,
  interpolateAlongPath,
} from '../engine/physics';

// Pixels per second for the flying bubble
const BUBBLE_SPEED_PPS = 900;

interface Props {
  grid: GridMap;
  currentBubble: BubbleColor;
  nextBubble: BubbleColor;
  phase: GamePhase;
  shotPath: ShotPath | null;
  cellSize: number;
  canvasWidth: number;
  canvasHeight: number;
  launcherX: number;
  launcherY: number;
  onShoot: (angle: number) => void;
  onLanded: () => void;
}

export const BubbleCanvas: React.FC<Props> = ({
  grid,
  currentBubble,
  nextBubble,
  phase,
  shotPath,
  cellSize,
  canvasWidth,
  canvasHeight,
  launcherX,
  launcherY,
  onShoot,
  onLanded,
}) => {
  const BUBBLE_R = cellSize * 0.46;
  const LAUNCHER_R = cellSize * 0.48;
  const NEXT_R = cellSize * 0.34;

  // Keep mutable refs for values used inside the stable PanResponder closure
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const onShootRef = useRef(onShoot);
  onShootRef.current = onShoot;

  // Aim line state (local, updated on touch move)
  const [aimAngle, setAimAngle] = useState<number | null>(null);
  const isAiming = useRef(false);

  // Flying bubble animation
  const flyPosRef = useRef({ x: launcherX, y: launcherY });
  const [flyTick, setFlyTick] = useState(0); // increments to trigger re-render
  const animFrameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Start/stop flying animation based on phase + shotPath
  useEffect(() => {
    if (phase !== 'shooting' || !shotPath) return;

    flyPosRef.current = shotPath.points[0];
    const totalLen = getTotalPathLength(shotPath.points);
    const duration = (totalLen / BUBBLE_SPEED_PPS) * 1000; // ms
    let elapsed = 0;
    lastTimeRef.current = Date.now();

    const tick = () => {
      const now = Date.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      elapsed += dt;
      const t = Math.min(elapsed / duration, 1);
      flyPosRef.current = interpolateAlongPath(shotPath.points, t);
      setFlyTick(n => n + 1);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        animFrameRef.current = null;
        onLanded();
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, shotPath]);

  // PanResponder: touch → aim → shoot
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        if (phaseRef.current !== 'aiming') return;
        isAiming.current = true;
        const { locationX, locationY } = evt.nativeEvent;
        setAimAngle(angleFromTouch(locationX, locationY, launcherX, launcherY));
      },
      onPanResponderMove: evt => {
        if (!isAiming.current) return;
        const { locationX, locationY } = evt.nativeEvent;
        setAimAngle(angleFromTouch(locationX, locationY, launcherX, launcherY));
      },
      onPanResponderRelease: evt => {
        if (!isAiming.current) return;
        isAiming.current = false;
        const { locationX, locationY } = evt.nativeEvent;
        const angle = angleFromTouch(locationX, locationY, launcherX, launcherY);
        setAimAngle(null);
        onShootRef.current(angle);
      },
      onPanResponderTerminate: () => {
        isAiming.current = false;
        setAimAngle(null);
      },
    }),
  ).current;

  // Build the SVG path string for the aim line
  const buildAimPath = useCallback(
    (angle: number): string => {
      const shot = computeShotPath(
        launcherX,
        launcherY,
        angle,
        currentBubble,
        grid,
        cellSize,
        canvasWidth,
      );
      const pts = shot.points;
      if (pts.length === 0) return '';
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` L ${pts[i].x} ${pts[i].y}`;
      }
      return d;
    },
    [launcherX, launcherY, currentBubble, grid, cellSize, canvasWidth],
  );

  const aimPathStr =
    phase === 'aiming' && aimAngle !== null
      ? buildAimPath(aimAngle)
      : null;

  const flyPos = flyPosRef.current;
  const flyColor =
    phase === 'shooting' && shotPath ? shotPath.color : null;

  return (
    <View style={[styles.container, { width: canvasWidth, height: canvasHeight }]}
      {...panResponder.panHandlers}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* --- Grid bubbles --- */}
        {Array.from(grid.entries()).map(([key, color]) => {
          const [row, col] = key.split(',').map(Number);
          const { x, y } = cellCenter(row, col, cellSize);
          return (
            <Group key={key}>
              <Circle cx={x} cy={y} r={BUBBLE_R} color={COLOR_HEX[color]} />
              <Circle
                cx={x - BUBBLE_R * 0.25}
                cy={y - BUBBLE_R * 0.28}
                r={BUBBLE_R * 0.28}
                color={COLOR_HIGHLIGHT[color]}
                opacity={0.6}
              />
            </Group>
          );
        })}

        {/* --- Aim line --- */}
        {aimPathStr !== null && aimPathStr !== '' && (
          <Path
            path={aimPathStr}
            color="rgba(255,255,255,0.55)"
            strokeWidth={2.5}
            style="stroke"
            strokeCap="round">
            <DashPathEffect intervals={[8, 10]} />
          </Path>
        )}

        {/* --- Flying bubble --- */}
        {flyColor !== null && (
          <Group>
            <Circle
              cx={flyPos.x}
              cy={flyPos.y}
              r={BUBBLE_R}
              color={COLOR_HEX[flyColor]}
            />
            <Circle
              cx={flyPos.x - BUBBLE_R * 0.25}
              cy={flyPos.y - BUBBLE_R * 0.28}
              r={BUBBLE_R * 0.28}
              color={COLOR_HIGHLIGHT[flyColor]}
              opacity={0.6}
            />
          </Group>
        )}

        {/* --- Launcher body --- */}
        <Circle
          cx={launcherX}
          cy={launcherY}
          r={LAUNCHER_R * 1.25}
          color="rgba(255,255,255,0.08)"
        />
        {/* Current bubble on launcher */}
        {phase !== 'shooting' && (
          <Group>
            <Circle
              cx={launcherX}
              cy={launcherY}
              r={LAUNCHER_R}
              color={COLOR_HEX[currentBubble]}
            />
            <Circle
              cx={launcherX - LAUNCHER_R * 0.25}
              cy={launcherY - LAUNCHER_R * 0.28}
              r={LAUNCHER_R * 0.28}
              color={COLOR_HIGHLIGHT[currentBubble]}
              opacity={0.6}
            />
          </Group>
        )}

        {/* Next bubble preview (bottom-left) */}
        <Circle
          cx={launcherX - cellSize * 1.6}
          cy={launcherY}
          r={NEXT_R}
          color={COLOR_HEX[nextBubble]}
          opacity={0.85}
        />
        <Circle
          cx={launcherX - cellSize * 1.6 - NEXT_R * 0.25}
          cy={launcherY - NEXT_R * 0.28}
          r={NEXT_R * 0.28}
          color={COLOR_HIGHLIGHT[nextBubble]}
          opacity={0.5}
        />

        {/* Danger line */}
        <Path
          path={`M 0 ${launcherY - LAUNCHER_R * 1.6} L ${canvasWidth} ${launcherY - LAUNCHER_R * 1.6}`}
          color="rgba(255, 80, 80, 0.35)"
          strokeWidth={1.5}
          style="stroke">
          <DashPathEffect intervals={[6, 8]} />
        </Path>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

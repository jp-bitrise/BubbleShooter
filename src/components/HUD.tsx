import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  score: number;
  highScore: number;
  nextAdvanceAt: number;
}

export const HUD: React.FC<Props> = ({ score, highScore, nextAdvanceAt }) => {
  const [secsLeft, setSecsLeft] = useState(20);

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.ceil((nextAdvanceAt - Date.now()) / 1000));
      setSecsLeft(remaining);
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [nextAdvanceAt]);

  const timerColor = secsLeft <= 5 ? '#FF4444' : secsLeft <= 10 ? '#FFAA00' : '#FFFFFF';

  return (
    <View style={styles.container}>
      <View style={styles.block}>
        <Text style={styles.label}>SCORE</Text>
        <Text style={styles.value}>{score}</Text>
      </View>

      <View style={styles.timerBlock}>
        <Text style={styles.label}>NEXT ROW</Text>
        <Text style={[styles.timerValue, { color: timerColor }]}>
          {secsLeft}s
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>BEST</Text>
        <Text style={styles.value}>{highScore}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  block: {
    alignItems: 'center',
    minWidth: 70,
  },
  timerBlock: {
    alignItems: 'center',
    minWidth: 80,
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  timerValue: {
    fontSize: 24,
    fontWeight: '800',
  },
});

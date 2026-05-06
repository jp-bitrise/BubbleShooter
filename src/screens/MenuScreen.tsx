import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useGameStore } from '../store/gameStore';

interface Props {
  onPlay: () => void;
}

export const MenuScreen: React.FC<Props> = ({ onPlay }) => {
  const highScore = useGameStore(s => s.highScore);
  const loadHighScore = useGameStore(s => s.loadHighScore);

  useEffect(() => {
    loadHighScore();
  }, [loadHighScore]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BUBBLE</Text>
        <Text style={styles.titleAccent}>SHOOTER</Text>
      </View>

      {highScore > 0 && (
        <View style={styles.highScoreBox}>
          <Text style={styles.highScoreLabel}>BEST SCORE</Text>
          <Text style={styles.highScoreValue}>{highScore}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.playButton} onPress={onPlay} activeOpacity={0.8}>
        <Text style={styles.playText}>PLAY</Text>
      </TouchableOpacity>

      <View style={styles.bubbleRow}>
        {(['R', 'G', 'B', 'Y'] as const).map(c => (
          <View
            key={c}
            style={[
              styles.deco,
              {
                backgroundColor:
                  c === 'R' ? '#E63946' :
                  c === 'G' ? '#2DC653' :
                  c === 'B' ? '#4895EF' :
                  '#F4D03F',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
  },
  titleAccent: {
    fontSize: 38,
    fontWeight: '900',
    color: '#4895EF',
    letterSpacing: 8,
    marginTop: -8,
  },
  highScoreBox: {
    alignItems: 'center',
    marginBottom: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  highScoreLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  highScoreValue: {
    color: '#F4D03F',
    fontSize: 34,
    fontWeight: '800',
  },
  playButton: {
    backgroundColor: '#4895EF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 72,
    marginBottom: 48,
    shadowColor: '#4895EF',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  playText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 5,
  },
  bubbleRow: {
    flexDirection: 'row',
    gap: 14,
  },
  deco: {
    width: 28,
    height: 28,
    borderRadius: 14,
    opacity: 0.75,
  },
});

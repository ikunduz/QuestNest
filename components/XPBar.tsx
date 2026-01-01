
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface XPBarProps {
  xp: number;
  level: number;
}

export const XPBar: React.FC<XPBarProps> = ({ xp, level }) => {
  const maxXP = level * 100;
  const percentage = Math.min((xp / maxXP) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.levelText}>SEVİYE {level}</Text>
        <Text style={styles.xpText}>{xp} / {maxXP} XP</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${percentage}%` }
          ]}
        />
        {percentage === 100 && (
          <View style={styles.pulse} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  levelText: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  track: {
    height: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: '#fbbf24',
  },
  pulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

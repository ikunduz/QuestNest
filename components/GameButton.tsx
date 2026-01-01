
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface GameButtonProps {
  children: React.ReactNode;
  onPress?: () => void; // Changed from onClick to onPress
  onClick?: () => void; // Support both for compatibility during transition
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: ViewStyle;
  disabled?: boolean;
}

export const GameButton: React.FC<GameButtonProps> = ({
  children,
  onPress,
  onClick,
  variant = 'primary',
  style,
  disabled = false
}) => {
  const handlePress = onPress || onClick;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.btn,
        styles[variant],
        disabled && styles.disabled,
        style
      ]}
    >
      <Text style={[
        styles.text,
        variant === 'primary' ? styles.textPrimary : styles.textSecondary
      ]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#f59e0b',
    borderBottomColor: '#b45309',
  },
  secondary: {
    backgroundColor: '#4f46e5',
    borderBottomColor: '#3730a3',
  },
  danger: {
    backgroundColor: '#e11d48',
    borderBottomColor: '#9f1239',
  },
  ghost: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderBottomColor: '#0f172a',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textPrimary: {
    color: '#0f172a',
  },
  textSecondary: {
    color: '#ffffff',
  },
});

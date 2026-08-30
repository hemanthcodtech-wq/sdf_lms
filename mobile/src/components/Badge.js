import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const Badge = ({
  text,
  variant = 'primary', // 'primary', 'secondary', 'success', 'warning', 'info', 'dark'
  style,
  textStyle,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: colors.primaryLight + '20', text: colors.primaryDark };
      case 'secondary':
        return { bg: colors.secondary + '20', text: colors.secondary };
      case 'success':
        return { bg: colors.successLight, text: colors.success };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'info':
        return { bg: colors.infoLight, text: colors.info };
      case 'dark':
        return { bg: colors.darkSurface, text: colors.textLight };
      default:
        return { bg: colors.surfaceAlt, text: colors.textSecondary };
    }
  };

  const scheme = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: scheme.bg }, style]}>
      <Text style={[styles.text, { color: scheme.text }, textStyle]}>
        {text}
      </Text>
    </View>
  );
};

export const ProgressBar = ({ progress = 0, height = 8, color = colors.primary, style }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  return (
    <View style={[styles.progressTrack, { height }, style]}>
      <View
        style={[
          styles.progressFill,
          { width: `${clampedProgress}%`, backgroundColor: color, height },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 99,
  },
});

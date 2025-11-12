import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';

export const SkeletonCard = memo(function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={[styles.line, { width: '40%', height: 14 }]} />
      <View style={[styles.line, { width: '100%', height: 12 }]} />
      <View style={[styles.line, { width: '92%', height: 12 }]} />
      <View style={[styles.image]} />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.palette.surface,
    borderWidth: 1,
    borderColor: theme.palette.border,
    gap: theme.spacing.sm,
  },
  line: {
    backgroundColor: '#E5E7EB',
    borderRadius: theme.radii.sm,
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: theme.radii.md,
    backgroundColor: '#E5E7EB',
  },
});

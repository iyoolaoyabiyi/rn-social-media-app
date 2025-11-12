import { memo, useMemo } from 'react';
import { Image } from 'expo-image';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

type Props = {
  uri: string | null;
  size?: number;
  name?: string | null;
};

const gradients = ['#6366F1', '#8B5CF6', '#F472B6', '#F97316', '#10B981'];

export const Avatar = memo(function Avatar({ uri, size = 40, name }: Props) {
  const initials = useMemo(() => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
    return letters.join('') || '?';
  }, [name]);

  const backgroundColor = useMemo(() => {
    if (!name) return gradients[0];
    const charCodeSum = name
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return gradients[charCodeSum % gradients.length];
  }, [name]);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        placeholder="LKO2?U%2Tw=w]~RBVZRi};RPxuwH"
        transition={300}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size / 2 }]}>{initials}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: theme.palette.surface,
    fontWeight: '600',
  },
});

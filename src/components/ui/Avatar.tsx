import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../../theme/colors';

export type AvatarSize = 'sm' | 'md' | 'lg' | number;

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: AvatarSize;
  level?: number;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  status?: 'online' | 'offline';
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

export const Avatar: React.FC<AvatarProps> = ({
  uri = DEFAULT_AVATAR,
  name,
  size = 'md',
  level,
  style,
  borderColor = Colors.primary,
  status,
}) => {
  const getDimension = (): number => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm':
        return 36;
      case 'lg':
        return 64;
      default:
        return 48;
    }
  };

  const dim = getDimension();

  return (
    <View style={[styles.container, { width: dim, height: dim }, style]}>
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            borderColor,
          },
        ]}
      />
      {typeof level === 'number' && (
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>L{level}</Text>
        </View>
      )}
      {status === 'online' && <View style={styles.statusIndicator} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    borderWidth: 2,
    backgroundColor: Colors.surfaceSecondary,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: Colors.primaryViolet,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#0B0D12',
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  statusIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: '#0B0D12',
  },
});

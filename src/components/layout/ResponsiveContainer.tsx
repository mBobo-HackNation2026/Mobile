import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { spacing } from '@/theme';

interface ResponsiveContainerProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function ResponsiveContainer({ children, style }: ResponsiveContainerProps) {
  const { contentMaxWidth, isCompact } = useAdaptiveLayout();

  return (
    <View
      style={[
        styles.wrap,
        {
          maxWidth: contentMaxWidth,
          paddingHorizontal: isCompact ? spacing.md : spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'center',
  },
});

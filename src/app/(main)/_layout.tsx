import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppShell } from '@/components/layout/AppShell';
import { colors } from '@/theme';

export default function MainLayout() {
  return (
    <AppShell>
      <View style={styles.stackHost}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  stackHost: {
    flex: 1,
    minHeight: 0,
  },
});

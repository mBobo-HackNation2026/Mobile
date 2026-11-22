import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function BenefitIdLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

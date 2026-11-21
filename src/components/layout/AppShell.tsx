import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomNav } from '@/components/layout/BottomNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { colors } from '@/theme';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { showSidebar, showBottomNav, sidebarCollapsed } = useAdaptiveLayout();

  return (
    <View style={styles.root}>
      {showSidebar ? <Sidebar collapsed={sidebarCollapsed} /> : null}
      <View style={styles.content}>
        <View style={styles.main}>{children}</View>
        {showBottomNav ? <BottomNav /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
});

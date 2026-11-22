import { useWindowDimensions } from 'react-native';

import { breakpoints, layout } from '@/theme';

export type LayoutMode = 'compact' | 'medium' | 'expanded';

export function useAdaptiveLayout() {
  const { width, height } = useWindowDimensions();

  const mode: LayoutMode =
    width >= breakpoints.expandedMin
      ? 'expanded'
      : width >= breakpoints.mediumMin
        ? 'medium'
        : 'compact';

  return {
    width,
    height,
    mode,
    isCompact: mode === 'compact',
    isMedium: mode === 'medium',
    isExpanded: mode === 'expanded',
    showBottomNav: mode === 'compact',
    showSidebar: mode !== 'compact',
    sidebarCollapsed: mode === 'medium',
    contentMaxWidth:
      mode === 'expanded'
        ? layout.contentMaxWidthWide
        : layout.contentMaxWidth,
    columns: mode === 'expanded' ? 2 : 1,
  };
}

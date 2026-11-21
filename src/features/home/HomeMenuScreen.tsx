import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import {
  HOME_CIRCLE_SIZE,
  HOME_MENU_ITEMS,
  type HomeMenuItem,
} from '@/features/home/homeMenuItems';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { computeScrollProgress } from '@/lib/scrollProgress';
import { colors, spacing, typography } from '@/theme';

/** Miejsce pod etykietę pod kołem (jedna linia). */
const LABEL_SPACE = 28;
const ITEM_PAD = 4;

/**
 * Główne menu — świadczenia na środku (większe), reszta jednakowa wokół.
 */
export function HomeMenuScreen() {
  const { isExpanded, showBottomNav } = useAdaptiveLayout();
  const [boardWidth, setBoardWidth] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const hero = HOME_MENU_ITEMS.find((i) => i.hero)!;
  const satellites = HOME_MENU_ITEMS.filter((i) => !i.hero);

  const onBoardLayout = (event: LayoutChangeEvent) => {
    setBoardWidth(event.nativeEvent.layout.width);
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setScrollProgress(
      computeScrollProgress({
        offsetY: contentOffset.y,
        contentHeight: contentSize.height,
        viewportHeight: layoutMeasurement.height,
      }),
    );
  };

  const layout = useMemo(() => {
    const sat = HOME_CIRCLE_SIZE.sat;
    const heroD = HOME_CIRCLE_SIZE.hero;
    const satWrap = sat + ITEM_PAD * 2;
    const heroWrap = heroD + ITEM_PAD * 2;

    const available = boardWidth > 0 ? boardWidth : isExpanded ? 480 : 340;
    const board = Math.min(available, isExpanded ? 480 : 360);

    const minRadius = heroD / 2 + sat / 2 + 28;
    const maxRadius = board / 2 - satWrap / 2 - 8;
    const orbitRadius = Math.max(minRadius, Math.min(maxRadius, board * 0.42));

    const boardHeight = board + LABEL_SPACE;
    const centerX = board / 2;
    const centerY = board / 2;

    return {
      board,
      boardHeight,
      centerX,
      centerY,
      orbitRadius,
      heroWrap,
      satWrap,
      heroD,
      sat,
    };
  }, [boardWidth, isExpanded]);

  return (
    <SafeAreaView
      style={styles.root}
      edges={showBottomNav ? ['left', 'right'] : ['bottom', 'left', 'right']}
    >
      <AppHeader
        // subtitle="Co chcesz dziś załatwić?"
        scrollProgress={scrollProgress}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          isExpanded && styles.contentWide,
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.boardOuter} onLayout={onBoardLayout}>
          <View
            style={[
              styles.board,
              { width: layout.board, height: layout.boardHeight },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.orbitRing,
                {
                  width: layout.orbitRadius * 2,
                  height: layout.orbitRadius * 2,
                  borderRadius: layout.orbitRadius,
                  left: layout.centerX - layout.orbitRadius,
                  top: layout.centerY - layout.orbitRadius,
                },
              ]}
            />

            <View
              style={[
                styles.absoluteItem,
                {
                  left: layout.centerX - layout.heroWrap / 2,
                  top: layout.centerY - (layout.heroD + LABEL_SPACE) / 2,
                  width: layout.heroWrap,
                  zIndex: 2,
                },
              ]}
            >
              <CircleButton item={hero} />
            </View>

            {satellites.map((item, index) => {
              const angle =
                -Math.PI / 2 + (index * 2 * Math.PI) / satellites.length;
              const left =
                layout.centerX +
                layout.orbitRadius * Math.cos(angle) -
                layout.satWrap / 2;
              const top =
                layout.centerY +
                layout.orbitRadius * Math.sin(angle) -
                (layout.sat + LABEL_SPACE) / 2;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.absoluteItem,
                    {
                      left,
                      top,
                      width: layout.satWrap,
                      zIndex: 1,
                    },
                  ]}
                >
                  <CircleButton item={item} />
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CircleButton({ item }: { item: HomeMenuItem }) {
  const diameter = HOME_CIRCLE_SIZE[item.size];
  const Icon = item.icon;
  const iconSize = item.hero ? 40 : 22;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.label}. ${item.hint}`}
      onPress={() => router.push(item.href as Href)}
      style={({ pressed }) => [
        styles.circleWrap,
        pressed && styles.circlePressed,
      ]}
    >
      <View
        style={[
          styles.circle,
          {
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            backgroundColor: item.fill,
          },
          item.hero && styles.circleHero,
        ]}
      >
        <Icon size={iconSize} color={item.ink} strokeWidth={item.hero ? 2.4 : 2} />
      </View>
      <Text
        style={[styles.circleLabel, item.hero && styles.circleLabelHero]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  contentWide: {
    maxWidth: 880,
  },
  boardOuter: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  board: {
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    opacity: 0.4,
  },
  absoluteItem: {
    position: 'absolute',
    alignItems: 'center',
  },
  circleWrap: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  circlePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  circleHero: {
    borderWidth: 0,
    shadowColor: colors.zusDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  circleLabel: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
  },
  circleLabelHero: {
    ...typography.bodyStrong,
    color: colors.zusDark,
    fontSize: 15,
  },
});

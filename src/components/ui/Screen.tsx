import { router, usePathname, type Href } from 'expo-router';
import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { colors, spacing } from '@/theme';

/** Start — bez „Wróć”. */
const HOME_PATHS = new Set(['/home', '/']);
/** Zakładki dolnego menu — „Wróć” tylko gdy jest historia. */
const TAB_PATHS = new Set(['/home', '/sprawy', '/calculator', '/profile']);

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  gutters?: boolean;
  /** Domyślnie dopasowane do dolnego menu / sidebara. */
  edges?: Edge[];
  keyboard?: boolean;
  /** Offset KAV — np. gdy Stack ma własny header. */
  keyboardOffset?: number;
  /**
   * Przycisk „Wróć”.
   * Domyślnie: poza Startem — zawsze na ekranach poza dolnym menu;
   * na zakładkach tylko gdy jest historia nawigacji.
   */
  back?: boolean;
  backLabel?: string;
  backFallbackHref?: Href;
  /** Tytuł w sticky headerze. Brak → marka eBobo. */
  title?: string;
  subtitle?: string;
  /** Ukryj sticky header (np. ankieta z własną nawigacją). */
  header?: boolean;
}

export function Screen({
  children,
  scroll = true,
  gutters = true,
  edges,
  keyboard = true,
  keyboardOffset = 0,
  back,
  backLabel,
  backFallbackHref = '/home',
  title,
  subtitle,
  header = true,
}: ScreenProps) {
  const pathname = usePathname();
  const { contentMaxWidth, isCompact, showBottomNav } = useAdaptiveLayout();

  const showBack =
    back === true ||
    (back !== false &&
      !HOME_PATHS.has(pathname) &&
      (!TAB_PATHS.has(pathname) || router.canGoBack()));

  /**
   * Gdy jest AppHeader — top inset bierze header (ten sam kolor pod notchem).
   * Bez headera — SafeAreaView pilnuje góry jak dotychczas.
   */
  const resolvedEdges: Edge[] =
    edges ??
    (header
      ? showBottomNav
        ? ['left', 'right']
        : ['bottom', 'left', 'right']
      : showBottomNav
        ? ['top', 'left', 'right']
        : ['top', 'bottom', 'left', 'right']);

  const bodyContent = (
    <View
      style={[
        styles.inner,
        gutters && { paddingHorizontal: isCompact ? spacing.md : spacing.lg },
        {
          maxWidth: contentMaxWidth,
          paddingBottom: showBottomNav ? spacing.lg : spacing.xl,
        },
      ]}
    >
      {children}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {bodyContent}
    </ScrollView>
  ) : (
    <View style={styles.flex}>{bodyContent}</View>
  );

  return (
    <SafeAreaView style={styles.root} edges={resolvedEdges}>
      {header ? (
        <AppHeader
          title={title}
          subtitle={subtitle}
          showBack={showBack}
          backLabel={backLabel}
          backFallbackHref={backFallbackHref}
        />
      ) : null}
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={
            keyboardOffset + (Platform.OS === 'ios' ? 8 : 0)
          }
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
});

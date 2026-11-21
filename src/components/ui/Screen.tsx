import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  gutters?: boolean;
  /** Domyślnie dopasowane do dolnego menu / sidebara. */
  edges?: Edge[];
  keyboard?: boolean;
  /** Offset KAV — np. gdy Stack ma własny header. */
  keyboardOffset?: number;
}

export function Screen({
  children,
  scroll = true,
  gutters = true,
  edges,
  keyboard = true,
  keyboardOffset = 0,
}: ScreenProps) {
  const { contentMaxWidth, isCompact, showBottomNav } = useAdaptiveLayout();

  const resolvedEdges: Edge[] =
    edges ??
    (showBottomNav
      ? ['top', 'left', 'right']
      : ['top', 'bottom', 'left', 'right']);

  const content = (
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
      {content}
    </ScrollView>
  ) : (
    <View style={styles.flex}>{content}</View>
  );

  return (
    <SafeAreaView style={styles.root} edges={resolvedEdges}>
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
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
});

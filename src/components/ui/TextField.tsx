import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, layout, radii, spacing, typography } from '@/theme';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={label}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  input: {
    minHeight: layout.touchMin,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...typography.small,
    color: colors.danger,
  },
  hint: {
    ...typography.small,
    color: colors.textMuted,
  },
});

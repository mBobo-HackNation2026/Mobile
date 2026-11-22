import { createElement } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ExternalLink, MapPin } from 'lucide-react-native';

import { colors, radii, spacing, typography } from '@/theme';

interface OsmMapPreviewProps {
  lat: number;
  lng: number;
  /** Stopnie — mniejsza wartość = bliższy zoom. */
  delta?: number;
  label?: string;
}

/** Prosty podgląd OSM: iframe na web, link zewnętrzny na native. */
export function OsmMapPreview({
  lat,
  lng,
  delta = 0.08,
  label = 'Mapa OpenStreetMap',
}: OsmMapPreviewProps) {
  const minLon = lng - delta;
  const minLat = lat - delta;
  const maxLon = lng + delta;
  const maxLat = lat + delta;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lng}`;
  const openUrl = `https://www.openstreetmap.org/#map=13/${lat}/${lng}`;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.caption}>{label}</Text>
        {createElement('iframe', {
          title: label,
          src: embedUrl,
          style: {
            width: '100%',
            height: 260,
            border: 0,
            borderRadius: 12,
          },
          loading: 'lazy',
        })}
        <Pressable onPress={() => Linking.openURL(openUrl)} style={styles.linkRow}>
          <ExternalLink size={14} color={colors.primary} />
          <Text style={styles.link}>Otwórz w OpenStreetMap →</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => Linking.openURL(openUrl)}
      style={styles.nativeCard}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <MapPin size={24} color={colors.primary} />
      <View style={styles.nativeCopy}>
        <Text style={styles.nativeTitle}>{label}</Text>
        <Text style={styles.nativeHint}>
          Otwórz mapę w przeglądarce (OSM). Wersja web pokazuje podgląd w aplikacji.
        </Text>
      </View>
      <ExternalLink size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  caption: { ...typography.caption, color: colors.textMuted },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  link: { ...typography.bodyStrong, color: colors.primary },
  nativeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceMuted,
  },
  nativeCopy: { flex: 1, minWidth: 0, gap: 2 },
  nativeTitle: { ...typography.bodyStrong, color: colors.text },
  nativeHint: { ...typography.small, color: colors.textMuted },
});

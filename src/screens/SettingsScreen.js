import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopAppBar from '../components/TopAppBar';
import { useApp } from '../context/AppContext';
import { colors, fonts, spacing, radius } from '../theme';

const BREAKPOINT = 768;

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'en', label: 'Inglês' },
  { code: 'es', label: 'Espanhol' },
  { code: 'fr', label: 'Francês' },
];

function Row({ icon, label, children }) {
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINT;
  const padding = isWide ? spacing.paddingDesktop : spacing.paddingMobile;
  const { settings, setSetting } = useApp();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TopAppBar
        onTranslate={() => Alert.alert('Tradução', 'Configurações de tradução abaixo.')}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: padding, paddingTop: 108, paddingBottom: 120, gap: spacing.gutter },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Ajustes</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transcrição automática (grátis)</Text>
          <View style={styles.row}>
            <MaterialCommunityIcons name="key-outline" size={22} color={colors.primary} />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Chave da API Groq</Text>
              <Text style={styles.rowHint}>
                O app já vem configurado com uma chave da API Groq para transcrição
                automática. Não é necessário configurar nada.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tradução</Text>
          <Row icon="translate" label="Idioma das legendas">
            <View style={styles.chipRow}>
              {LANGUAGES.map((lang) => {
                const active = settings.targetLang === lang.code;
                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => setSetting('targetLang', lang.code)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {lang.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Row>
          <Row icon="auto-fix" label="Traduzir legendas automaticamente">
            <Switch
              value={settings.autoTranslate}
              onValueChange={(v) => setSetting('autoTranslate', v)}
              trackColor={{ true: colors.secondaryContainer, false: colors.surfaceContainerHigh }}
              thumbColor={settings.autoTranslate ? colors.onSecondaryContainer : colors.onSurfaceVariant}
            />
          </Row>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Row icon="information-outline" label="Lumina Player">
            <Text style={styles.rowValue}>v1.1.0</Text>
          </Row>
          <Row icon="account-outline" label="Criador">
            <Text style={styles.rowValue}>João Pedro Justino Bemba</Text>
          </Row>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {},
  heading: {
    ...fonts.headlineMdMobile,
    color: colors.onSurface,
  },
  section: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    ...fonts.labelSm,
    color: colors.onSurfaceVariant,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(218, 226, 253, 0.08)',
  },
  rowBody: {
    flex: 1,
    gap: 8,
  },
  rowLabel: {
    ...fonts.bodyMd,
    fontFamily: 'Inter_600SemiBold',
    color: colors.onSurface,
  },
  rowHint: {
    ...fonts.bodyMd,
    fontSize: 13,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
  },
  rowValue: {
    ...fonts.bodyMd,
    color: colors.onSurfaceVariant,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant,
  },
  chipActive: {
    backgroundColor: colors.secondaryContainer,
    borderColor: colors.secondaryContainer,
  },
  chipText: {
    ...fonts.labelSm,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: colors.onSecondaryContainer,
  },
});

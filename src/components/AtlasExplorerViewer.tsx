import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AtlasExplorerPreset } from '../data/ebrainsExplorer';

type AtlasExplorerViewerProps = {
  preset: AtlasExplorerPreset;
};

const WEB_IFRAME_STYLE = {
  border: 0,
  borderRadius: '20px',
  width: '100%',
  height: '100%',
  backgroundColor: '#081015',
} as const;

export function AtlasExplorerViewer({ preset }: AtlasExplorerViewerProps) {
  const openViewer = () => {
    void Linking.openURL(preset.url);
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <View style={styles.webFrameShell}>
          {React.createElement('iframe', {
            title: `${preset.name} EBRAINS viewer`,
            src: preset.url,
            style: WEB_IFRAME_STYLE,
            allow: 'fullscreen',
            allowFullScreen: true,
            referrerPolicy: 'strict-origin-when-cross-origin',
          })}
        </View>
      ) : (
        <View style={styles.nativeFallback}>
          <Text style={styles.nativeFallbackTitle}>Phone-friendly first step</Text>
          <Text style={styles.nativeFallbackBody}>
            EBRAINS is embedded directly on the web build. On iPhone and Android, this version
            opens the same atlas in your phone browser until we add a dedicated in-app WebView.
          </Text>
        </View>
      )}

      <Pressable onPress={openViewer} style={styles.launchButton}>
        <Text style={styles.launchButtonText}>
          {Platform.OS === 'web' ? 'Open Full Viewer' : 'Open In Browser'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  webFrameShell: {
    minHeight: 560,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 219, 190, 0.12)',
    backgroundColor: '#081015',
  },
  nativeFallback: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 219, 190, 0.12)',
    backgroundColor: 'rgba(8, 16, 21, 0.85)',
    padding: 18,
    gap: 10,
  },
  nativeFallbackTitle: {
    color: '#f7f3ea',
    fontSize: 18,
    fontWeight: '700',
  },
  nativeFallbackBody: {
    color: '#c7d4d8',
    fontSize: 15,
    lineHeight: 22,
  },
  launchButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#e4863a',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  launchButtonText: {
    color: '#0f2029',
    fontSize: 14,
    fontWeight: '800',
  },
});

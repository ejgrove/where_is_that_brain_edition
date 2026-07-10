import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { getRecommendedAtlasExplorerPreset } from '../data/ebrainsExplorer';
import type { GameLayer } from '../types/game';

type EbrainsPlaySurfaceProps = {
  layer: GameLayer;
  turnKey: number;
  selectionResetKey: number;
  onSelectionLabelChange: (selection: {
    label: string | null;
    candidates: string[];
    sourceMethod: string | null;
  }) => void;
};

const VIEWER_ORIGIN = 'https://atlases.ebrains.eu';

const WEB_IFRAME_STYLE = {
  border: 0,
  display: 'block',
  width: '100%',
  backgroundColor: '#081015',
} as const;

type BridgeStatus =
  | 'waiting'
  | 'ready'
  | 'selectionRequested'
  | 'selectionReceived'
  | 'blocked'
  | 'unsupported';

export function EbrainsPlaySurface({
  layer,
  turnKey,
  selectionResetKey,
  onSelectionLabelChange,
}: EbrainsPlaySurfaceProps) {
  const preset = useMemo(() => getRecommendedAtlasExplorerPreset(layer.id), [layer.id]);
  const { height: windowHeight } = useWindowDimensions();
  const iframeRef = useRef<{ contentWindow?: Window | null } | null>(null);
  const viewerWindowRef = useRef<Window | null>(null);
  const onSelectionLabelChangeRef = useRef(onSelectionLabelChange);
  const selectedLabelRef = useRef<string | null>(null);
  const activeSelectionRequestIdRef = useRef<string | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>(
    Platform.OS === 'web' ? 'waiting' : 'unsupported'
  );
  const [lastDetectedLabel, setLastDetectedLabel] = useState<string | null>(null);
  const [lastSourceMethod, setLastSourceMethod] = useState<string | null>(null);
  const [lastCandidates, setLastCandidates] = useState<string[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [iframeVersion, setIframeVersion] = useState(0);
  const frameHeight = useMemo(() => {
    if (Platform.OS !== 'web') {
      return 720;
    }

    return Math.max(720, Math.min(windowHeight - 220, 980));
  }, [windowHeight]);
  const iframeStyle = useMemo(
    () => ({
      ...WEB_IFRAME_STYLE,
      height: `${frameHeight}px`,
    }),
    [frameHeight]
  );

  useEffect(() => {
    onSelectionLabelChangeRef.current = onSelectionLabelChange;
  }, [onSelectionLabelChange]);

  useEffect(() => {
    viewerWindowRef.current = null;
    activeSelectionRequestIdRef.current = null;
    selectedLabelRef.current = null;
    setLastDetectedLabel(null);
    setLastSourceMethod(null);
    setLastCandidates([]);
    setMessageCount(0);
    setBridgeStatus(Platform.OS === 'web' ? 'waiting' : 'unsupported');
    onSelectionLabelChangeRef.current({
      label: null,
      candidates: [],
      sourceMethod: null,
    });
  }, [selectionResetKey, turnKey]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.origin !== 'string' || !event.origin.includes('atlases.ebrains.eu')) {
        return;
      }

      const payload = coercePayload(event.data);
      const sourceMethod = extractSourceMethod(payload);
      setMessageCount((current) => current + 1);
      if (sourceMethod) {
        setLastSourceMethod(sourceMethod);
      }

      if (isInitHandshake(payload)) {
        const targetWindow =
          typeof event.source === 'object' && event.source && 'postMessage' in event.source
            ? (event.source as Window)
            : iframeRef.current?.contentWindow ?? null;

        if (!targetWindow) {
          setBridgeStatus('blocked');
          return;
        }

        viewerWindowRef.current = targetWindow;
        targetWindow.postMessage(
          {
            jsonrpc: '2.0',
            id: payload.id,
            result: {
              name: 'Where Is This Brain?',
              version: '0.1.0',
            },
          },
          VIEWER_ORIGIN
        );
        setBridgeStatus('ready');
        activeSelectionRequestIdRef.current = queueRegionSelectionRequest(targetWindow, turnKey, layer.id);
        setBridgeStatus('selectionRequested');
        return;
      }

      if (isJsonRpcResponse(payload) && payload.id === activeSelectionRequestIdRef.current) {
        const candidates = extractRegionCandidates(payload.result);
        const candidateLabel = candidates[0] ?? null;
        if (!candidateLabel) {
          activeSelectionRequestIdRef.current = null;
          setLastCandidates([]);
          setBridgeStatus('blocked');
          return;
        }

        activeSelectionRequestIdRef.current = null;
        selectedLabelRef.current = candidateLabel;
        setLastDetectedLabel(candidateLabel);
        setLastCandidates(candidates);
        setBridgeStatus('selectionReceived');
        onSelectionLabelChangeRef.current({
          label: candidateLabel,
          candidates,
          sourceMethod,
        });
        return;
      }

      if (isSelectionBroadcast(payload)) {
        const candidates = extractRegionCandidates(payload.params);
        const candidateLabel = candidates[0] ?? null;
        if (!candidateLabel || candidateLabel === selectedLabelRef.current) {
          return;
        }

        selectedLabelRef.current = candidateLabel;
        setLastDetectedLabel(candidateLabel);
        setLastCandidates(candidates);
        setBridgeStatus('selectionReceived');
        onSelectionLabelChangeRef.current({
          label: candidateLabel,
          candidates,
          sourceMethod,
        });
        return;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [layer.id, turnKey]);

  const openViewer = () => {
    void Linking.openURL(preset.url);
  };

  const reloadEmbed = () => {
    viewerWindowRef.current = null;
    activeSelectionRequestIdRef.current = null;
    selectedLabelRef.current = null;
    setLastDetectedLabel(null);
    setLastSourceMethod(null);
    setLastCandidates([]);
    setMessageCount(0);
    setBridgeStatus('waiting');
    onSelectionLabelChangeRef.current({
      label: null,
      candidates: [],
      sourceMethod: null,
    });
    setIframeVersion((current) => current + 1);
  };

  const retrySelectionRequest = () => {
    const targetWindow = viewerWindowRef.current ?? iframeRef.current?.contentWindow ?? null;
    if (!targetWindow) {
      setBridgeStatus('waiting');
      return;
    }
    activeSelectionRequestIdRef.current = queueRegionSelectionRequest(targetWindow, turnKey, layer.id);
    setBridgeStatus('selectionRequested');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>EBRAINS Play Surface</Text>
        <Text style={styles.body}>
          This uses siibra explorer's `postMessage` API. After the viewer handshake is
          acknowledged, we ask EBRAINS for a region selection and map the returned label back into
          the game when possible.
        </Text>
        <Text style={styles.statusLine}>{statusCopy(bridgeStatus)}</Text>
        {Platform.OS === 'web' ? (
          <Text style={styles.meta}>
            If you see the privacy dialog inside the frame, open setup in a new tab once, accept
            it there, then come back and reload the embedded viewer.
          </Text>
        ) : null}
        <Text style={styles.meta}>Messages seen: {messageCount}</Text>
        <Text style={styles.meta}>Last method: {lastSourceMethod ?? 'none yet'}</Text>
        <Text style={styles.meta}>Last detected label: {lastDetectedLabel ?? 'none yet'}</Text>
        {lastCandidates.length ? (
          <Text style={styles.meta}>Candidate labels: {lastCandidates.join(' • ')}</Text>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <Pressable onPress={openViewer} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>
            {Platform.OS === 'web' ? 'Open Setup In New Tab' : 'Open In Browser'}
          </Text>
        </Pressable>
        {Platform.OS === 'web' ? (
          <>
            <Pressable onPress={reloadEmbed} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Reload Embed</Text>
            </Pressable>
            <Pressable onPress={retrySelectionRequest} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Retry Region Request</Text>
            </Pressable>
          </>
        ) : null}
      </View>

      {Platform.OS === 'web' ? (
        <View style={[styles.webFrameShell, { height: frameHeight }]}>
          {React.createElement('iframe', {
            key: `${layer.id}-${turnKey}-${iframeVersion}`,
            ref: iframeRef,
            title: `${preset.name} game surface`,
            src: preset.url,
            style: iframeStyle,
            allow: 'fullscreen',
            allowFullScreen: true,
            referrerPolicy: 'strict-origin-when-cross-origin',
          })}
        </View>
      ) : (
        <View style={styles.nativeFallback}>
          <Text style={styles.nativeFallbackTitle}>Web-first for now</Text>
          <Text style={styles.nativeFallbackBody}>
            The viewer-backed play surface currently depends on the browser `postMessage` bridge, so
            it is only wired for the web build. On iPhone and Android, you can still open the atlas
            in the phone browser while we add a native `WebView` bridge later.
          </Text>
        </View>
      )}
    </View>
  );
}

function coercePayload(payload: unknown) {
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      return payload;
    }
  }

  return payload;
}

function isJsonRpcRequest(payload: unknown): payload is { id: string | number; method: string } {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as { id?: unknown; method?: unknown; result?: unknown; error?: unknown };
  return (
    candidate.id !== undefined &&
    typeof candidate.method === 'string' &&
    candidate.result === undefined &&
    candidate.error === undefined
  );
}

function isJsonRpcResponse(
  payload: unknown
): payload is { id: string | number; result?: unknown; error?: unknown } {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as { id?: unknown; method?: unknown };
  return candidate.id !== undefined && candidate.method === undefined;
}

function isInitHandshake(payload: unknown): payload is { id: string | number; method: 'sxplr.init' } {
  return isJsonRpcRequest(payload) && payload.method === 'sxplr.init';
}

function isSelectionBroadcast(
  payload: unknown
): payload is { method: 'sxplr.on.regionsSelected'; params?: unknown } {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as { method?: unknown };
  return candidate.method === 'sxplr.on.regionsSelected';
}

function queueRegionSelectionRequest(targetWindow: Window, turnKey: number, layerId: string) {
  const requestId = `where-is-this-brain-${layerId}-${turnKey}-${Date.now()}`;
  targetWindow.postMessage(
    {
      jsonrpc: '2.0',
      id: requestId,
      method: 'sxplr.getUserToSelectARoi',
      params: {},
    },
    VIEWER_ORIGIN
  );
  return requestId;
}

function extractSourceMethod(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as { method?: unknown };
  return typeof candidate.method === 'string' ? candidate.method : null;
}

function extractRegionCandidates(payload: unknown) {
  const ranked = collectRegionLabelCandidates(payload)
    .filter(({ value }) => isLikelyHumanLabel(value))
    .sort((left, right) => right.score - left.score);

  const unique: string[] = [];
  const seen = new Set<string>();

  for (const candidate of ranked) {
    const normalized = normalizeCandidate(candidate.value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    unique.push(candidate.value.trim());
  }

  return unique.slice(0, 6);
}

function collectRegionLabelCandidates(
  value: unknown,
  path: string[] = [],
  seen = new WeakSet<object>()
): { value: string; score: number }[] {
  if (typeof value === 'string') {
    return [{ value: value.trim(), score: scoreCandidate(path, value) }];
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  if (seen.has(value as object)) {
    return [];
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectRegionLabelCandidates(entry, [...path, String(index)], seen)
    );
  }

  const objectValue = value as Record<string, unknown>;
  const directCandidates: { value: string; score: number }[] = [];

  for (const [key, entry] of Object.entries(objectValue)) {
    if (
      typeof entry === 'string' &&
      ['name', 'label', 'fullName', 'shortName', 'displayName', 'title'].includes(key)
    ) {
      directCandidates.push({
        value: entry.trim(),
        score: scoreCandidate([...path, key], entry) + 8,
      });
    }
  }

  const nestedCandidates = Object.entries(objectValue).flatMap(([key, entry]) =>
    collectRegionLabelCandidates(entry, [...path, key], seen)
  );

  return [...directCandidates, ...nestedCandidates];
}

function scoreCandidate(path: string[], value: string) {
  const joinedPath = path.join('.').toLowerCase();
  let score = 0;

  if (joinedPath.includes('region')) {
    score += 6;
  }
  if (joinedPath.includes('label')) {
    score += 5;
  }
  if (joinedPath.includes('name')) {
    score += 4;
  }
  if (joinedPath.includes('fullname') || joinedPath.includes('displayname')) {
    score += 4;
  }
  if (joinedPath.includes('shortname')) {
    score += 3;
  }
  if (joinedPath.includes('title')) {
    score += 2;
  }
  if (joinedPath.includes('region')) {
    score += 2;
  }
  if (/^[A-Za-z][A-Za-z0-9'()\- ,]+$/.test(value.trim())) {
    score += 2;
  }
  if (value.split(' ').length <= 6) {
    score += 1;
  }

  return score;
}

function isLikelyHumanLabel(value: string) {
  const normalized = value.trim();
  const lower = normalized.toLowerCase();

  if (!normalized || normalized.length < 2 || normalized.length > 80) {
    return false;
  }
  if (!/[a-z]/i.test(normalized)) {
    return false;
  }
  if (
    lower.includes('http') ||
    lower.includes('jsonrpc') ||
    lower.includes('sxplr') ||
    lower.includes('request') ||
    lower.includes('response') ||
    lower.includes('handshake') ||
    lower.includes('broadcast') ||
    lower.includes('plugin') ||
    lower.includes('viewer') ||
    lower.includes('atlas') ||
    lower.includes('#/')
  ) {
    return false;
  }

  return true;
}

function normalizeCandidate(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function statusCopy(status: BridgeStatus) {
  switch (status) {
    case 'ready':
      return 'Viewer handshake complete. Waiting for the region-selection request to resolve.';
    case 'selectionRequested':
      return 'EBRAINS has been asked for a region selection. Pick a structure in the viewer.';
    case 'selectionReceived':
      return 'A region label was received from EBRAINS and is ready to confirm if it maps cleanly.';
    case 'blocked':
      return 'The embed is blocked or returned an unusable payload. Use setup in a new tab, then reload.';
    case 'unsupported':
      return 'This bridge is currently wired only for the web build.';
    case 'waiting':
    default:
      return 'Waiting for the EBRAINS viewer handshake.';
  }
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  headerCard: {
    borderRadius: 18,
    backgroundColor: '#16343f',
    padding: 14,
    gap: 8,
  },
  title: {
    color: '#f7f3ea',
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    color: '#c7d4d8',
    fontSize: 14,
    lineHeight: 21,
  },
  statusLine: {
    color: '#f0d7b0',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  meta: {
    color: '#c6d7db',
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  webFrameShell: {
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
  secondaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4b6f79',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#e5eef0',
    fontSize: 14,
    fontWeight: '800',
  },
});

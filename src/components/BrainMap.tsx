import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { brainViews } from '../data/layers';
import type {
  BrainViewId,
  GameLayer,
  GameSettings,
  PendingGuess,
  PinMarker,
  RegionRendering,
} from '../types/game';

type BrainMapProps = {
  layer: GameLayer;
  settings: GameSettings;
  previewGuess: PendingGuess | null;
  feedbackRegionId: string | null;
  feedbackPin: PinMarker | null;
  turnKey: number;
  interactionEnabled: boolean;
  onPreviewGuess: (guess: PendingGuess) => void;
};

const ZOOM_LEVELS = [1, 1.2, 1.45, 1.75];
const SVG_HEIGHT = 300;

export function BrainMap({
  layer,
  settings,
  previewGuess,
  feedbackRegionId,
  feedbackPin,
  turnKey,
  interactionEnabled,
  onPreviewGuess,
}: BrainMapProps) {
  const [activeViewId, setActiveViewId] = useState<BrainViewId>(layer.defaultViewId);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [svgWidthPx, setSvgWidthPx] = useState(0);

  useEffect(() => {
    setActiveViewId(layer.defaultViewId);
    setZoomIndex(0);
  }, [layer.defaultViewId, layer.id, turnKey]);

  const view = brainViews[activeViewId];
  const viewOverride = layer.viewOverrides?.[activeViewId];
  const zoomScale = ZOOM_LEVELS[zoomIndex];
  const { minX, minY, width, height, centerX, centerY } = useMemo(
    () => parseViewBox(view.viewBox),
    [view.viewBox]
  );
  const zoomTransform = `translate(${centerX * (1 - zoomScale)} ${centerY * (1 - zoomScale)}) scale(${zoomScale})`;
  const outlineTransform = viewOverride?.outlinePath
    ? undefined
    : buildMirrorTransform(width, view.mirrorX);

  const visibleRegions = useMemo(
    () =>
      layer.regions.flatMap((region) => {
        const rendering = region.renderings[activeViewId];
        if (!rendering) {
          return [];
        }

        return [{ region, rendering }];
      }),
    [activeViewId, layer.regions]
  );

  const caption = viewOverride?.caption
    ? viewOverride.caption
    : layer.atlasSource === 'prototype_schematic'
      ? `${view.caption} · atlas placeholder`
      : view.caption;
  const baseFill = settings.showBorders ? '#f5ecdc' : '#e3d9c8';
  const hiddenPrompt =
    feedbackRegionId !== null &&
    !visibleRegions.some((entry) => entry.region.id === feedbackRegionId);

  const displayedPin = feedbackPin ?? (previewGuess?.pin?.viewId === activeViewId ? previewGuess.pin : null);
  const displayedSelectedRegionId = previewGuess?.selectedRegionId ?? null;
  const incorrectFeedbackRegionId =
    feedbackRegionId &&
    displayedSelectedRegionId &&
    displayedSelectedRegionId !== feedbackRegionId
      ? displayedSelectedRegionId
      : null;

  const handleViewSelect = (viewId: BrainViewId) => {
    setActiveViewId(viewId);
  };

  const handleSvgLayout = (event: LayoutChangeEvent) => {
    setSvgWidthPx(event.nativeEvent.layout.width);
  };

  const handleRegionPress = (regionId: string) => {
    if (!interactionEnabled || !settings.highlightSelection) {
      return;
    }

    onPreviewGuess({
      selectedRegionId: regionId,
      pin: null,
    });
  };

  const handlePinDrop = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!interactionEnabled || settings.highlightSelection || svgWidthPx <= 0) {
      return;
    }

    const svgPoint = projectTapToViewBox({
      locationX: event.nativeEvent.locationX,
      locationY: event.nativeEvent.locationY,
      svgWidthPx,
      svgHeightPx: SVG_HEIGHT,
      minX,
      minY,
      viewWidth: width,
      viewHeight: height,
      zoomScale,
      centerX,
      centerY,
    });

    const closestRegion = findClosestRegion(visibleRegions, width, svgPoint.x, svgPoint.y);
    if (!closestRegion) {
      return;
    }

    onPreviewGuess({
      selectedRegionId: closestRegion.region.id,
      pin: {
        x: svgPoint.x,
        y: svgPoint.y,
        viewId: activeViewId,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.topCopy}>
          <Text style={styles.caption}>{caption}</Text>
          <Text style={styles.subcaption}>
            {layer.availableViewIds.length > 1
              ? 'Use the side rail to move between surface views and slice planes.'
              : 'This layer currently uses a single schematic view.'}
          </Text>
        </View>
        <View style={styles.zoomControls}>
          <Pressable
            onPress={() => setZoomIndex((current) => Math.max(0, current - 1))}
            style={[styles.zoomButton, zoomIndex === 0 && styles.zoomButtonDisabled]}
          >
            <Text style={styles.zoomButtonText}>-</Text>
          </Pressable>
          <Text style={styles.zoomLabel}>{Math.round(zoomScale * 100)}%</Text>
          <Pressable
            onPress={() =>
              setZoomIndex((current) => Math.min(ZOOM_LEVELS.length - 1, current + 1))
            }
            style={[
              styles.zoomButton,
              zoomIndex === ZOOM_LEVELS.length - 1 && styles.zoomButtonDisabled,
            ]}
          >
            <Text style={styles.zoomButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mapShell}>
        <View style={styles.viewRail}>
          {layer.availableViewIds.map((viewId) => {
            const selected = viewId === activeViewId;
            const meta = brainViews[viewId];

            return (
              <Pressable
                key={viewId}
                onPress={() => handleViewSelect(viewId)}
                style={[styles.viewPill, selected && styles.viewPillSelected]}
              >
                <Text style={[styles.viewPillShort, selected && styles.viewPillShortSelected]}>
                  {meta.shortLabel}
                </Text>
                <Text style={[styles.viewPillLabel, selected && styles.viewPillLabelSelected]}>
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.mapStage}>
          <View style={styles.svgFrame} onLayout={handleSvgLayout}>
            <Svg
              viewBox={view.viewBox}
              width="100%"
              height={SVG_HEIGHT}
              onPress={handlePinDrop}
            >
              <G transform={zoomTransform}>
                <Path
                  d={viewOverride?.outlinePath ?? view.outlinePath}
                  transform={outlineTransform}
                  fill="#e9dfcb"
                  stroke="#f5ead6"
                  strokeWidth={2.5}
                  opacity={0.98}
                />

                <G>
                {visibleRegions.map(({ region, rendering }) => {
                  const isSelected = region.id === displayedSelectedRegionId;
                  const isFeedback = region.id === feedbackRegionId;
                  const isIncorrectFeedback = region.id === incorrectFeedbackRegionId;
                  const isCorrectFeedback = isFeedback;
                  const isPreviewSelection =
                    !feedbackRegionId && settings.highlightSelection && isSelected;

                  const fillColor = isIncorrectFeedback
                    ? '#c74d4d'
                    : isCorrectFeedback
                      ? '#43a663'
                      : isPreviewSelection
                        ? region.color
                        : baseFill;
                  const fillOpacity =
                    isIncorrectFeedback || isCorrectFeedback || isPreviewSelection ? 0.92 : 0.2;
                  const stroke =
                    isIncorrectFeedback || isCorrectFeedback
                      ? '#f7f3ea'
                      : settings.showBorders
                        ? '#dbc7a7'
                        : 'transparent';
                  const strokeWidth =
                    isIncorrectFeedback || isCorrectFeedback ? 4 : settings.showBorders ? 1.6 : 0;

                    return (
                      <Path
                        key={region.id}
                        d={rendering.path}
                        transform={buildMirrorTransform(width, rendering.mirrorX)}
                        fill={fillColor}
                        fillOpacity={fillOpacity}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        onPress={() => handleRegionPress(region.id)}
                      />
                    );
                  })}
                </G>

                {displayedPin ? <Pin pin={displayedPin} /> : null}
              </G>
            </Svg>
          </View>
        </View>
      </View>

      {hiddenPrompt ? (
        <Text style={styles.warning}>
          The revealed answer is not available in this view yet. Switch views for the best anatomy
          context.
        </Text>
      ) : null}

      <Text style={styles.note}>
        The atlas is now moving toward an image-style multi-view layout with a side selector,
        while keeping the region data swappable for future atlas-derived assets.
      </Text>
    </View>
  );
}

function Pin({ pin }: { pin: PinMarker }) {
  return (
    <G>
      <Path
        d={`M ${pin.x} ${pin.y - 20} L ${pin.x} ${pin.y + 2}`}
        stroke="#10252e"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Circle cx={pin.x} cy={pin.y - 25} r={10} fill="#dd7f36" stroke="#fff5e8" strokeWidth={3} />
    </G>
  );
}

function findClosestRegion(
  visibleRegions: { region: GameLayer['regions'][number]; rendering: RegionRendering }[],
  viewWidth: number,
  x: number,
  y: number
) {
  let closest:
    | { region: GameLayer['regions'][number]; rendering: RegionRendering; distance: number }
    | null = null;

  for (const entry of visibleRegions) {
    const centroidX = entry.rendering.mirrorX ? viewWidth - entry.rendering.centroid.x : entry.rendering.centroid.x;
    const centroidY = entry.rendering.centroid.y;
    const distance = Math.hypot(x - centroidX, y - centroidY);

    if (!closest || distance < closest.distance) {
      closest = { ...entry, distance };
    }
  }

  return closest;
}

function projectTapToViewBox({
  locationX,
  locationY,
  svgWidthPx,
  svgHeightPx,
  minX,
  minY,
  viewWidth,
  viewHeight,
  zoomScale,
  centerX,
  centerY,
}: {
  locationX: number;
  locationY: number;
  svgWidthPx: number;
  svgHeightPx: number;
  minX: number;
  minY: number;
  viewWidth: number;
  viewHeight: number;
  zoomScale: number;
  centerX: number;
  centerY: number;
}) {
  const scale = Math.min(svgWidthPx / viewWidth, svgHeightPx / viewHeight);
  const contentWidthPx = viewWidth * scale;
  const contentHeightPx = viewHeight * scale;
  const offsetX = (svgWidthPx - contentWidthPx) / 2;
  const offsetY = (svgHeightPx - contentHeightPx) / 2;

  const baseX = minX + clamp((locationX - offsetX) / scale, 0, viewWidth);
  const baseY = minY + clamp((locationY - offsetY) / scale, 0, viewHeight);

  return {
    x: clamp((baseX - centerX * (1 - zoomScale)) / zoomScale, minX, minX + viewWidth),
    y: clamp((baseY - centerY * (1 - zoomScale)) / zoomScale, minY, minY + viewHeight),
  };
}

function parseViewBox(viewBox: string) {
  const [minX, minY, width, height] = viewBox.split(' ').map(Number);
  return {
    minX,
    minY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}

function buildMirrorTransform(viewWidth: number, mirrorX?: boolean) {
  if (!mirrorX) {
    return undefined;
  }

  return `translate(${viewWidth} 0) scale(-1 1)`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  topCopy: {
    flex: 1,
    gap: 4,
  },
  caption: {
    color: '#f0d7b0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subcaption: {
    color: '#bfd0d4',
    fontSize: 13,
    lineHeight: 18,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#20404b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonDisabled: {
    opacity: 0.45,
  },
  zoomButtonText: {
    color: '#f7f3ea',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  zoomLabel: {
    color: '#f7f3ea',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 44,
    textAlign: 'center',
  },
  mapShell: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  viewRail: {
    width: 80,
    gap: 8,
  },
  viewPill: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3c6772',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#12323c',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  viewPillSelected: {
    backgroundColor: '#2f8a82',
    borderColor: '#7cd0c2',
  },
  viewPillShort: {
    color: '#f0d7b0',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  viewPillShortSelected: {
    color: '#17333a',
  },
  viewPillLabel: {
    color: '#d8e4e7',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  viewPillLabelSelected: {
    color: '#f7f3ea',
  },
  mapStage: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 32, 41, 0.46)',
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  svgFrame: {
    width: '100%',
  },
  warning: {
    color: '#efb289',
    fontSize: 13,
    lineHeight: 20,
  },
  note: {
    color: '#b3c1c6',
    fontSize: 13,
    lineHeight: 20,
  },
});

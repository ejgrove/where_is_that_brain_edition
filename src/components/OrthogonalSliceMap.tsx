import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path as SvgPath, Rect } from 'react-native-svg';
import { harvardOxfordSliceAtlas } from '../data/harvardOxfordSlice';
import type {
  AtlasCoordinate,
  BrainViewId,
  GameLayer,
  GameSettings,
  PendingGuess,
} from '../types/game';

type OrthogonalSliceMapProps = {
  layer: GameLayer;
  settings: GameSettings;
  previewGuess: PendingGuess | null;
  feedbackRegionId: string | null;
  revealedAnswers: RevealedAnswerGroup[];
  turnKey: number;
  interactionEnabled: boolean;
  onPreviewGuess: (guess: PendingGuess) => void;
};

type RevealedAnswerGroup = {
  key: string;
  regionId: string | null;
  names: string[];
  coordinate?: AtlasCoordinate | null;
};

type SliceViewId = Extract<BrainViewId, 'midSagittal' | 'coronal' | 'axial'>;

type SliceGrid = {
  cols: number;
  rows: number;
  brainMask: Uint8Array;
  tissueValues: Uint8Array;
  groupValues: Uint8Array;
  detailValues: Uint8Array;
};

type RectRun = {
  x: number;
  y: number;
  width: number;
};

type ValueRectRun = RectRun & {
  value: number;
};

const SLICE_VIEW_ORDER: SliceViewId[] = ['midSagittal', 'coronal', 'axial'];

const SLICE_VIEW_META: Record<
  SliceViewId,
  {
    label: string;
    axisLabel: string;
    axisDescription: string;
    leftTag: string;
    rightTag: string;
    topTag: string;
    bottomTag: string;
  }
> = {
  midSagittal: {
    label: 'Sagittal',
    axisLabel: 'X',
    axisDescription: 'left to right',
    leftTag: 'P',
    rightTag: 'A',
    topTag: 'S',
    bottomTag: 'I',
  },
  coronal: {
    label: 'Coronal',
    axisLabel: 'Y',
    axisDescription: 'back to front',
    leftTag: 'L',
    rightTag: 'R',
    topTag: 'S',
    bottomTag: 'I',
  },
  axial: {
    label: 'Axial',
    axisLabel: 'Z',
    axisDescription: 'bottom to top',
    leftTag: 'L',
    rightTag: 'R',
    topTag: 'A',
    bottomTag: 'P',
  },
};

export function OrthogonalSliceMap({
  layer,
  settings,
  previewGuess,
  feedbackRegionId,
  revealedAnswers,
  turnKey,
  interactionEnabled,
  onPreviewGuess,
}: OrthogonalSliceMapProps) {
  const atlas = harvardOxfordSliceAtlas;
  const { width: windowWidth } = useWindowDimensions();
  const [currentCoordinate, setCurrentCoordinate] = useState<AtlasCoordinate>(
    atlas ? { ...atlas.defaultCoordinate } : { x: 0, y: 0, z: 0 }
  );
  const [panelMeasurements, setPanelMeasurements] = useState<
    Record<SliceViewId, { width: number; height: number }>
  >({
    midSagittal: { width: 0, height: 0 },
    coronal: { width: 0, height: 0 },
    axial: { width: 0, height: 0 },
  });

  useEffect(() => {
    if (!atlas) {
      return;
    }

    setCurrentCoordinate({ ...atlas.defaultCoordinate });
  }, [atlas, turnKey]);

  useEffect(() => {
    if (!atlas || !feedbackRegionId) {
      return;
    }

    const centroid = atlas.regionCentroids[feedbackRegionId];
    if (centroid) {
      setCurrentCoordinate({ ...centroid });
    }
  }, [atlas, feedbackRegionId]);

  const regionById = useMemo(
    () => Object.fromEntries(layer.regions.map((region) => [region.id, region])),
    [layer.regions]
  );

  if (!atlas) {
    return (
      <View style={styles.unavailableCard}>
        <Text style={styles.unavailableTitle}>Atlas unavailable</Text>
        <Text style={styles.unavailableBody}>
          The Harvard-Oxford slice dataset has not been generated yet for this build.
        </Text>
      </View>
    );
  }
  const displayCoordinate = currentCoordinate;
  const viewportAvailableWidth = Math.max(300, windowWidth - 36);
  const sideBySidePanelGap = 6;
  const sideBySidePanelWidth =
    windowWidth >= 920
      ? Math.max(230, Math.min(360, (viewportAvailableWidth - sideBySidePanelGap * 2) / 3))
      : Math.min(330, viewportAvailableWidth - 18);
  const sliceViewportHeight = windowWidth >= 920 ? 260 : 250;
  const previewRegionId =
    !feedbackRegionId ? previewGuess?.selectedRegionId ?? null : null;
  const correctFeedbackRegionId = feedbackRegionId;
  const previewValue = previewRegionId ? atlas.regionValueById[previewRegionId] ?? 0 : 0;
  const incorrectFeedbackValues = Array.from(
    new Set(
      revealedAnswers
        .filter((answer) => answer.regionId && answer.regionId !== feedbackRegionId)
        .map((answer) => atlas.regionValueById[answer.regionId ?? ''] ?? 0)
        .filter((value) => value > 0)
    )
  );
  const correctFeedbackValue = correctFeedbackRegionId
    ? atlas.regionValueById[correctFeedbackRegionId] ?? 0
    : 0;
  const selectedRegionLabel =
    previewGuess?.selectedRegionId ? regionById[previewGuess.selectedRegionId]?.label ?? null : null;

  const handleCoordinateChange = (nextCoordinate: AtlasCoordinate) => {
    if (![nextCoordinate.x, nextCoordinate.y, nextCoordinate.z].every(Number.isFinite)) {
      return;
    }

    const clampedCoordinate = clampCoordinate(nextCoordinate, atlas.dimensions);
    setCurrentCoordinate(clampedCoordinate);
    if (!feedbackRegionId) {
      onPreviewGuess({
        selectedRegionId: getRegionIdAtCoordinate(clampedCoordinate, atlas),
        pin: null,
        coordinate: clampedCoordinate,
      });
    }
  };

  const handlePanelLayout = (viewId: SliceViewId, event: LayoutChangeEvent) => {
    setPanelMeasurements((current) => ({
      ...current,
      [viewId]: {
        width: event.nativeEvent.layout.width,
        height: event.nativeEvent.layout.height,
      },
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.caption}>Atlas-backed orthogonal slices</Text>
          <Text style={styles.subcaption}>
            Click or drag inside any plane, or use the axis tracks, to move the crosshair. The
            answer only locks in after Confirm Answer.
          </Text>
        </View>
        <View style={styles.coordinateBadge}>
          <Text style={styles.coordinateBadgeText}>
            x {displayCoordinate.x} • y {displayCoordinate.y} • z {displayCoordinate.z}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.panelRow}
      >
        {SLICE_VIEW_ORDER.map((viewId) => {
          const slice = extractSlice(viewId, atlas, displayCoordinate);
          const tissueRuns = buildValueRuns(slice.cols, slice.rows, slice.tissueValues);
          const previewRuns = previewValue
            ? buildRuns(slice.cols, slice.rows, slice.groupValues, (value) => value === previewValue)
            : [];
          const incorrectFeedbackRuns = incorrectFeedbackValues.flatMap((feedbackValue) =>
            buildRuns(
              slice.cols,
              slice.rows,
              slice.groupValues,
              (value) => value === feedbackValue
            )
          );
          const correctFeedbackRuns = correctFeedbackValue
            ? buildRuns(slice.cols, slice.rows, slice.groupValues, (value) => value === correctFeedbackValue)
            : [];
          const outlineBoundaryPath = buildBoundaryPath(
            slice.cols,
            slice.rows,
            slice.brainMask,
            (value) => value > 0
          );
          const detailBoundaryPath = settings.showBorders
            ? buildBoundaryPath(slice.cols, slice.rows, slice.detailValues, (value) => value > 0, true)
            : '';
          const regionBoundaryPath = settings.showBorders
            ? buildBoundaryPath(slice.cols, slice.rows, slice.groupValues, (value) => value > 0, true)
            : '';
          const meta = SLICE_VIEW_META[viewId];
          const axisValue = displayCoordinate[axisKeyForView(viewId)];
          const axisMax = maxAxisValue(viewId, atlas.dimensions);
          const crosshair = coordinateToSlicePoint(viewId, displayCoordinate, atlas.dimensions);
          const aspectRatio = slice.cols / slice.rows;
          const viewportWidth = sliceViewportHeight * aspectRatio;
          const measurement = panelMeasurements[viewId];
          const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => interactionEnabled,
            onMoveShouldSetPanResponder: () => interactionEnabled,
            onStartShouldSetPanResponderCapture: () => interactionEnabled,
            onMoveShouldSetPanResponderCapture: () => interactionEnabled,
            onPanResponderGrant: (event) => {
              const nextCoordinate = coordinateFromRelativePosition(
                event.nativeEvent.locationX,
                event.nativeEvent.locationY,
                viewId,
                measurement.width,
                measurement.height,
                displayCoordinate,
                atlas.dimensions,
                slice.cols,
                slice.rows
              );
              if (nextCoordinate) {
                handleCoordinateChange(nextCoordinate);
              }
            },
            onPanResponderMove: (event) => {
              const nextCoordinate = coordinateFromRelativePosition(
                event.nativeEvent.locationX,
                event.nativeEvent.locationY,
                viewId,
                measurement.width,
                measurement.height,
                displayCoordinate,
                atlas.dimensions,
                slice.cols,
                slice.rows
              );
              if (nextCoordinate) {
                handleCoordinateChange(nextCoordinate);
              }
            },
            onPanResponderTerminationRequest: () => false,
          });

          return (
            <View key={viewId} style={[styles.panelCard, { width: sideBySidePanelWidth }]}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>{meta.label}</Text>
                  <Text style={styles.panelMeta}>
                    {meta.axisLabel}-slice {axisValue + 1}/{axisMax + 1}
                  </Text>
                </View>
                <Text style={styles.panelHint}>{meta.axisDescription}</Text>
              </View>

              <View style={[styles.sliceFrame, { height: sliceViewportHeight + 14 }]}>
                <View
                  style={[styles.sliceViewport, { width: viewportWidth, height: sliceViewportHeight }]}
                  onLayout={(event) => handlePanelLayout(viewId, event)}
                >
                  <Text style={[styles.edgeTag, styles.edgeTagTop]}>{meta.topTag}</Text>
                  <Text style={[styles.edgeTag, styles.edgeTagBottom]}>{meta.bottomTag}</Text>
                  <Text style={[styles.edgeTag, styles.edgeTagLeft]}>{meta.leftTag}</Text>
                  <Text style={[styles.edgeTag, styles.edgeTagRight]}>{meta.rightTag}</Text>
                  <Svg
                    viewBox={`0 0 ${slice.cols} ${slice.rows}`}
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid meet"
                    pointerEvents="none"
                  >
                    {tissueRuns.map((run, index) => (
                      <Rect
                        key={`tissue-${index}`}
                        x={run.x}
                        y={run.y}
                        width={run.width}
                        height={1}
                        fill={tissueFill(run.value)}
                      />
                    ))}

                    {previewRuns.map((run, index) => (
                      <Rect
                        key={`preview-highlight-${index}`}
                        x={run.x}
                        y={run.y}
                        width={run.width}
                        height={1}
                        fill={regionById[previewRegionId ?? '']?.color ?? '#f0d7b0'}
                        opacity={0.82}
                      />
                    ))}

                    {incorrectFeedbackRuns.map((run, index) => (
                      <Rect
                        key={`incorrect-feedback-${index}`}
                        x={run.x}
                        y={run.y}
                        width={run.width}
                        height={1}
                        fill="#c74d4d"
                        opacity={0.84}
                      />
                    ))}

                    {correctFeedbackRuns.map((run, index) => (
                      <Rect
                        key={`correct-feedback-${index}`}
                        x={run.x}
                        y={run.y}
                        width={run.width}
                        height={1}
                        fill="#43a663"
                        opacity={0.84}
                      />
                    ))}

                    {detailBoundaryPath ? (
                      <SvgPath
                        d={detailBoundaryPath}
                        fill="none"
                        stroke="#5b7079"
                        strokeWidth={0.2}
                        opacity={0.72}
                      />
                    ) : null}

                    {regionBoundaryPath ? (
                      <SvgPath
                        d={regionBoundaryPath}
                        fill="none"
                        stroke="#c9b18d"
                        strokeWidth={0.28}
                        opacity={0.88}
                      />
                    ) : null}

                    <SvgPath
                      d={outlineBoundaryPath}
                      fill="none"
                      stroke="#f7efdf"
                      strokeWidth={0.36}
                      opacity={0.94}
                    />

                    <Line
                      x1={0}
                      y1={crosshair.y + 0.5}
                      x2={slice.cols}
                      y2={crosshair.y + 0.5}
                      stroke="#0f2029"
                      strokeWidth={0.28}
                      opacity={0.82}
                    />
                    <Line
                      x1={crosshair.x + 0.5}
                      y1={0}
                      x2={crosshair.x + 0.5}
                      y2={slice.rows}
                      stroke="#0f2029"
                      strokeWidth={0.28}
                      opacity={0.82}
                    />
                    <Circle
                      cx={crosshair.x + 0.5}
                      cy={crosshair.y + 0.5}
                      r={1.3}
                      fill={feedbackRegionId ? '#2f8a82' : '#dd7f36'}
                      stroke="#fff5e8"
                      strokeWidth={0.32}
                    />
                  </Svg>
                  {feedbackRegionId
                    ? revealedAnswers.map((answer) => {
                        if (!answer.coordinate) {
                          return null;
                        }
                        const answerPoint = coordinateToSlicePoint(
                          viewId,
                          answer.coordinate,
                          atlas.dimensions
                        );
                        return (
                          <View
                            key={`${viewId}-${answer.key}`}
                            pointerEvents="none"
                            style={[
                              styles.answerMarker,
                              {
                                left: `${((answerPoint.x + 0.5) / slice.cols) * 100}%`,
                                top: `${((answerPoint.y + 0.5) / slice.rows) * 100}%`,
                              },
                            ]}
                          >
                            <Text style={styles.answerMarkerNames}>{answer.names.join(' + ')}</Text>
                            <View style={styles.answerMarkerDot} />
                          </View>
                        );
                      })
                    : null}
                  <View style={styles.sliceTouchLayer} {...panResponder.panHandlers} />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.axisTrackStack}>
        <AxisTrack
          label="Left ↔ Right"
          startTag="L"
          endTag="R"
          value={displayCoordinate.x}
          max={atlas.dimensions.x - 1}
          accent="#dd7f36"
          disabled={!interactionEnabled}
          onChange={(x) => handleCoordinateChange({ ...displayCoordinate, x })}
        />
        <AxisTrack
          label="Posterior ↔ Anterior"
          startTag="P"
          endTag="A"
          value={displayCoordinate.y}
          max={atlas.dimensions.y - 1}
          accent="#2f8a82"
          disabled={!interactionEnabled}
          onChange={(y) => handleCoordinateChange({ ...displayCoordinate, y })}
        />
        <AxisTrack
          label="Inferior ↔ Superior"
          startTag="I"
          endTag="S"
          value={displayCoordinate.z}
          max={atlas.dimensions.z - 1}
          accent="#6b8fd0"
          disabled={!interactionEnabled}
          onChange={(z) => handleCoordinateChange({ ...displayCoordinate, z })}
        />
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>
          {feedbackRegionId
            ? `Incorrect labeled choices stay red, and ${regionById[feedbackRegionId]?.label ?? 'the correct region'} stays green while you explore the slices.`
            : previewGuess?.coordinate
              ? settings.learningMode
                ? selectedRegionLabel
                  ? `Crosshair is currently inside ${selectedRegionLabel}.`
                  : 'Crosshair is currently outside the labeled teaching regions in this layer.'
                : 'Coordinate selected. Confirm it when you are ready.'
              : 'Move the crosshair until it lands in the structure you want, then confirm.'}
        </Text>
        <Text style={styles.statusBody}>
          Player names mark their submitted coordinates after everyone has answered.
        </Text>
      </View>
    </View>
  );
}

function AxisTrack({
  label,
  startTag,
  endTag,
  value,
  max,
  accent,
  disabled,
  onChange,
}: {
  label: string;
  startTag: string;
  endTag: string;
  value: number;
  max: number;
  accent: string;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const trackRef = useRef<any>(null);
  const trackMetricsRef = useRef({ pageX: Number.NaN, width: 0 });

  const syncTrackMetrics = () => {
    trackRef.current?.measureInWindow?.((pageX: number, _pageY: number, width: number) => {
      trackMetricsRef.current = { pageX, width };
    });
  };

  const handlePosition = (pageX?: number, fallbackLocationX?: number) => {
    if (disabled) {
      return;
    }

    const { pageX: trackPageX, width } = trackMetricsRef.current;
    if (width <= 0) {
      return;
    }

    const relativeX = Number.isFinite(pageX) && Number.isFinite(trackPageX)
      ? (pageX as number) - trackPageX
      : fallbackLocationX;
    if (!Number.isFinite(relativeX ?? Number.NaN)) {
      return;
    }

    onChange(Math.round(clamp((relativeX as number) / width, 0, 1) * max));
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: (event) => {
      syncTrackMetrics();
      handlePosition(event.nativeEvent.pageX, event.nativeEvent.locationX);
    },
    onPanResponderMove: (event) => {
      handlePosition(event.nativeEvent.pageX, event.nativeEvent.locationX);
    },
    onPanResponderTerminationRequest: () => false,
  });

  return (
    <View style={styles.axisTrackCard}>
      <View style={styles.axisTrackHeader}>
        <Text style={styles.axisTrackLabel}>{label}</Text>
        <Text style={styles.axisTrackValue}>
          {value + 1}/{max + 1}
        </Text>
      </View>
      <View style={styles.axisTrackFooter}>
        <Text style={styles.axisTrackTag}>{startTag}</Text>
        <View
          style={[styles.axisTrackRailHitArea, disabled && styles.axisTrackRailDisabled]}
          onLayout={(event) => {
            trackMetricsRef.current = {
              ...trackMetricsRef.current,
              width: event.nativeEvent.layout.width,
            };
            syncTrackMetrics();
          }}
          {...panResponder.panHandlers}
        >
          <View ref={trackRef} style={styles.axisTrackRail}>
            <View style={styles.axisTrackRailBase} />
            <View
              style={[
                styles.axisTrackRailFill,
                { backgroundColor: accent, width: `${(value / Math.max(max, 1)) * 100}%` },
              ]}
            />
            <View
              style={[
                styles.axisTrackThumb,
                {
                  borderColor: accent,
                  left: `${(value / Math.max(max, 1)) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
        <Text style={styles.axisTrackTag}>{endTag}</Text>
      </View>
    </View>
  );
}

function getRegionIdAtCoordinate(
  coordinate: AtlasCoordinate,
  atlas: NonNullable<typeof harvardOxfordSliceAtlas>
) {
  const value = atlas.labelVolume[getFlatIndex(coordinate, atlas.dimensions)] ?? 0;
  const regionId = Object.entries(atlas.regionValueById).find(([, regionValue]) => regionValue === value)?.[0];
  return regionId ?? null;
}

function extractSlice(
  viewId: SliceViewId,
  atlas: NonNullable<typeof harvardOxfordSliceAtlas>,
  coordinate: AtlasCoordinate
): SliceGrid {
  const { x, y, z } = atlas.dimensions;
  const cols = viewId === 'midSagittal' ? y : x;
  const rows = viewId === 'axial' ? y : z;
  const brainMask = new Uint8Array(cols * rows);
  const tissueValues = new Uint8Array(cols * rows);
  const groupValues = new Uint8Array(cols * rows);
  const detailValues = new Uint8Array(cols * rows);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const sliceIndex = row * cols + col;
      const volumeCoordinate = sliceCellToCoordinate(viewId, coordinate, col, row, atlas.dimensions);
      const flatIndex = getFlatIndex(volumeCoordinate, atlas.dimensions);

      brainMask[sliceIndex] = atlas.brainMask[flatIndex] ?? 0;
      tissueValues[sliceIndex] = atlas.tissueVolume[flatIndex] ?? 0;
      groupValues[sliceIndex] = atlas.labelVolume[flatIndex] ?? 0;
      detailValues[sliceIndex] = atlas.detailVolume[flatIndex] ?? 0;
    }
  }

  return { cols, rows, brainMask, tissueValues, groupValues, detailValues };
}

function sliceCellToCoordinate(
  viewId: SliceViewId,
  baseCoordinate: AtlasCoordinate,
  col: number,
  row: number,
  dimensions: { x: number; y: number; z: number }
) {
  switch (viewId) {
    case 'midSagittal':
      return {
        x: baseCoordinate.x,
        y: col,
        z: dimensions.z - 1 - row,
      };
    case 'coronal':
      return {
        x: col,
        y: baseCoordinate.y,
        z: dimensions.z - 1 - row,
      };
    case 'axial':
      return {
        x: col,
        y: dimensions.y - 1 - row,
        z: baseCoordinate.z,
      };
  }
}

function coordinateToSlicePoint(
  viewId: SliceViewId,
  coordinate: AtlasCoordinate,
  dimensions: { x: number; y: number; z: number }
) {
  switch (viewId) {
    case 'midSagittal':
      return {
        x: coordinate.y,
        y: dimensions.z - 1 - coordinate.z,
      };
    case 'coronal':
      return {
        x: coordinate.x,
        y: dimensions.z - 1 - coordinate.z,
      };
    case 'axial':
      return {
        x: coordinate.x,
        y: dimensions.y - 1 - coordinate.y,
      };
  }
}

function coordinateFromRelativePosition(
  locationX: number,
  locationY: number,
  viewId: SliceViewId,
  panelWidth: number,
  panelHeight: number,
  baseCoordinate: AtlasCoordinate,
  dimensions: { x: number; y: number; z: number },
  cols: number,
  rows: number
) {
  if (panelWidth <= 0 || panelHeight <= 0) {
    return null;
  }

  if (!Number.isFinite(locationX) || !Number.isFinite(locationY)) {
    return null;
  }

  const col = clamp(Math.floor((locationX / panelWidth) * cols), 0, cols - 1);
  const row = clamp(Math.floor((locationY / panelHeight) * rows), 0, rows - 1);
  return sliceCellToCoordinate(viewId, baseCoordinate, col, row, dimensions);
}

function buildRuns(
  cols: number,
  rows: number,
  values: Uint8Array,
  predicate: (value: number) => boolean
) {
  const runs: RectRun[] = [];

  for (let row = 0; row < rows; row += 1) {
    let start = -1;

    for (let col = 0; col < cols; col += 1) {
      const value = values[row * cols + col];
      if (predicate(value)) {
        if (start === -1) {
          start = col;
        }
        continue;
      }

      if (start !== -1) {
        runs.push({ x: start, y: row, width: col - start });
        start = -1;
      }
    }

    if (start !== -1) {
      runs.push({ x: start, y: row, width: cols - start });
    }
  }

  return runs;
}

function buildValueRuns(cols: number, rows: number, values: Uint8Array) {
  const runs: ValueRectRun[] = [];

  for (let row = 0; row < rows; row += 1) {
    let start = -1;
    let currentValue = 0;

    for (let col = 0; col < cols; col += 1) {
      const value = values[row * cols + col];
      if (value === currentValue) {
        continue;
      }

      if (currentValue > 0 && start !== -1) {
        runs.push({ x: start, y: row, width: col - start, value: currentValue });
      }

      currentValue = value;
      start = col;
    }

    if (currentValue > 0 && start !== -1) {
      runs.push({ x: start, y: row, width: cols - start, value: currentValue });
    }
  }

  return runs;
}

function buildBoundaryPath(
  cols: number,
  rows: number,
  values: Uint8Array,
  predicate: (value: number) => boolean,
  compareExactValues = false
) {
  let path = '';

  for (let edgeRow = 0; edgeRow <= rows; edgeRow += 1) {
    let start = -1;

    for (let col = 0; col < cols; col += 1) {
      const topValue = edgeRow > 0 ? values[(edgeRow - 1) * cols + col] : 0;
      const bottomValue = edgeRow < rows ? values[edgeRow * cols + col] : 0;
      const hasBoundary = compareExactValues
        ? topValue !== bottomValue && (predicate(topValue) || predicate(bottomValue))
        : predicate(topValue) !== predicate(bottomValue);

      if (hasBoundary) {
        if (start === -1) {
          start = col;
        }
        continue;
      }

      if (start !== -1) {
        path += `M${start} ${edgeRow}L${col} ${edgeRow}`;
        start = -1;
      }
    }

    if (start !== -1) {
      path += `M${start} ${edgeRow}L${cols} ${edgeRow}`;
    }
  }

  for (let edgeCol = 0; edgeCol <= cols; edgeCol += 1) {
    let start = -1;

    for (let row = 0; row < rows; row += 1) {
      const leftValue = edgeCol > 0 ? values[row * cols + edgeCol - 1] : 0;
      const rightValue = edgeCol < cols ? values[row * cols + edgeCol] : 0;
      const hasBoundary = compareExactValues
        ? leftValue !== rightValue && (predicate(leftValue) || predicate(rightValue))
        : predicate(leftValue) !== predicate(rightValue);

      if (hasBoundary) {
        if (start === -1) {
          start = row;
        }
        continue;
      }

      if (start !== -1) {
        path += `M${edgeCol} ${start}L${edgeCol} ${row}`;
        start = -1;
      }
    }

    if (start !== -1) {
      path += `M${edgeCol} ${start}L${edgeCol} ${rows}`;
    }
  }

  return path;
}

function axisKeyForView(viewId: SliceViewId): keyof AtlasCoordinate {
  switch (viewId) {
    case 'midSagittal':
      return 'x';
    case 'coronal':
      return 'y';
    case 'axial':
      return 'z';
  }
}

function maxAxisValue(
  viewId: SliceViewId,
  dimensions: { x: number; y: number; z: number }
) {
  switch (viewId) {
    case 'midSagittal':
      return dimensions.x - 1;
    case 'coronal':
      return dimensions.y - 1;
    case 'axial':
      return dimensions.z - 1;
  }
}

function getFlatIndex(
  coordinate: AtlasCoordinate,
  dimensions: { x: number; y: number; z: number }
) {
  return coordinate.z + dimensions.z * (coordinate.y + dimensions.y * coordinate.x);
}

function clampCoordinate(
  coordinate: AtlasCoordinate,
  dimensions: { x: number; y: number; z: number }
) {
  return {
    x: clamp(coordinate.x, 0, dimensions.x - 1),
    y: clamp(coordinate.y, 0, dimensions.y - 1),
    z: clamp(coordinate.z, 0, dimensions.z - 1),
  };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function tissueFill(value: number) {
  const shade = clamp(Math.round(value), 0, 255);
  const red = clamp(shade + 12, 0, 255);
  const green = clamp(shade + 6, 0, 255);
  const blue = clamp(shade - 2, 0, 255);
  return `rgb(${red}, ${green}, ${blue})`;
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  headingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headingCopy: {
    flex: 1,
    minWidth: 220,
    gap: 6,
  },
  caption: {
    color: '#f7f3ea',
    fontSize: 18,
    fontWeight: '700',
  },
  subcaption: {
    color: '#c7d4d8',
    fontSize: 14,
    lineHeight: 20,
  },
  coordinateBadge: {
    backgroundColor: 'rgba(240, 215, 176, 0.14)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coordinateBadgeText: {
    color: '#f0d7b0',
    fontSize: 13,
    fontWeight: '700',
  },
  panelRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 2,
  },
  panelCard: {
    backgroundColor: '#152c36',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(247, 243, 234, 0.08)',
    padding: 8,
    gap: 6,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  panelTitle: {
    color: '#f7f3ea',
    fontSize: 17,
    fontWeight: '700',
  },
  panelMeta: {
    color: '#9ec0ca',
    fontSize: 13,
    marginTop: 2,
  },
  panelHint: {
    color: '#7f98a1',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sliceFrame: {
    backgroundColor: '#0f2029',
    borderWidth: 1,
    borderColor: 'rgba(247, 243, 234, 0.07)',
    borderRadius: 16,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliceViewport: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    alignSelf: 'center',
    backgroundColor: '#081118',
  },
  answerMarker: {
    position: 'absolute',
    zIndex: 5,
    width: 120,
    marginLeft: -60,
    marginTop: -35,
    alignItems: 'center',
  },
  answerMarkerNames: {
    maxWidth: 120,
    color: '#13252d',
    backgroundColor: '#f2cf9f',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  answerMarkerDot: {
    width: 9,
    height: 9,
    marginTop: 2,
    borderRadius: 5,
    backgroundColor: '#dd7f36',
    borderColor: '#fff5e8',
    borderWidth: 1,
  },
  sliceTouchLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.001)',
    zIndex: 3,
  },
  edgeTag: {
    position: 'absolute',
    zIndex: 4,
    color: '#f7f3ea',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: 'rgba(15, 32, 41, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  edgeTagTop: {
    top: 8,
    alignSelf: 'center',
  },
  edgeTagBottom: {
    bottom: 8,
    alignSelf: 'center',
  },
  edgeTagLeft: {
    left: 8,
    top: '50%',
    marginTop: -10,
  },
  edgeTagRight: {
    right: 8,
    top: '50%',
    marginTop: -10,
  },
  axisTrackStack: {
    gap: 10,
  },
  axisTrackCard: {
    gap: 8,
  },
  axisTrackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  axisTrackLabel: {
    color: '#f7f3ea',
    fontSize: 14,
    fontWeight: '600',
  },
  axisTrackValue: {
    color: '#9ec0ca',
    fontSize: 13,
    fontWeight: '700',
  },
  axisTrackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  axisTrackTag: {
    color: '#9ec0ca',
    fontSize: 12,
    fontWeight: '700',
    width: 14,
    textAlign: 'center',
  },
  axisTrackRailHitArea: {
    flex: 1,
    height: 34,
    justifyContent: 'center',
  },
  axisTrackRail: {
    height: 24,
    justifyContent: 'center',
  },
  axisTrackRailDisabled: {
    opacity: 0.5,
  },
  axisTrackRailBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#173643',
  },
  axisTrackRailFill: {
    position: 'absolute',
    left: 0,
    height: 8,
    borderRadius: 999,
  },
  axisTrackThumb: {
    position: 'absolute',
    top: 2,
    marginLeft: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff5e8',
    borderWidth: 3,
  },
  statusCard: {
    backgroundColor: 'rgba(240, 215, 176, 0.08)',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  statusLabel: {
    color: '#f0d7b0',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  statusBody: {
    color: '#c7d4d8',
    fontSize: 13,
    lineHeight: 19,
  },
  unavailableCard: {
    backgroundColor: '#152c36',
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  unavailableTitle: {
    color: '#f7f3ea',
    fontSize: 18,
    fontWeight: '700',
  },
  unavailableBody: {
    color: '#c7d4d8',
    fontSize: 14,
    lineHeight: 20,
  },
});

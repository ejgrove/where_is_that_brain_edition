import { regionMetadataById } from './atlasPlan';
import type { AtlasCoordinate, BrainRegion, BrainViewId, GameLayer } from '../types/game';

type RawSliceAtlasLayer = {
  id: string;
  name: string;
  description: string;
  difficulty: GameLayer['difficulty'];
  defaultViewId: BrainViewId;
  availableViewIds: BrainViewId[];
  regions: Array<{
    id: string;
    label: string;
    color: string;
  }>;
};

type RawSliceAtlasDataset = {
  status: 'ready' | 'missing_source_data' | 'error';
  atlasSource: string;
  generatedAt: string;
  dimensions: [number, number, number];
  defaultCoordinate: [number, number, number];
  layer: RawSliceAtlasLayer;
  regionValueById: Record<string, number>;
  regionCentroids: Record<string, [number, number, number]>;
  brainMaskRle: Array<[number, number]>;
  tissueVolumeRle?: Array<[number, number]>;
  labelVolumeRle: Array<[number, number]>;
  detailVolumeRle: Array<[number, number]>;
  notes?: string[];
};

export type SliceAtlasRuntime = {
  atlasSource: string;
  generatedAt: string;
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  defaultCoordinate: AtlasCoordinate;
  regionValueById: Record<string, number>;
  regionCentroids: Record<string, AtlasCoordinate>;
  brainMask: Uint8Array;
  tissueVolume: Uint8Array;
  labelVolume: Uint8Array;
  detailVolume: Uint8Array;
  layer: GameLayer;
  notes: string[];
};

const rawDataset = require('../../data/processed/harvard_oxford_slice_atlas.json') as RawSliceAtlasDataset;
const decodedBrainMask =
  rawDataset.status === 'ready' ? decodeRle(rawDataset.brainMaskRle) : new Uint8Array();
const decodedTissueVolume =
  rawDataset.status === 'ready'
    ? rawDataset.tissueVolumeRle
      ? decodeRle(rawDataset.tissueVolumeRle)
      : Uint8Array.from(decodedBrainMask, (value) => (value > 0 ? 170 : 0))
    : new Uint8Array();

export const harvardOxfordSliceAtlas: SliceAtlasRuntime | null =
  rawDataset.status === 'ready'
    ? {
        atlasSource: rawDataset.atlasSource,
        generatedAt: rawDataset.generatedAt,
        dimensions: {
          x: rawDataset.dimensions[0],
          y: rawDataset.dimensions[1],
          z: rawDataset.dimensions[2],
        },
        defaultCoordinate: {
          x: rawDataset.defaultCoordinate[0],
          y: rawDataset.defaultCoordinate[1],
          z: rawDataset.defaultCoordinate[2],
        },
        regionValueById: rawDataset.regionValueById,
        regionCentroids: Object.fromEntries(
          Object.entries(rawDataset.regionCentroids).map(([regionId, [x, y, z]]) => [
            regionId,
            { x, y, z },
          ])
        ),
        brainMask: decodedBrainMask,
        tissueVolume: decodedTissueVolume,
        labelVolume: decodeRle(rawDataset.labelVolumeRle),
        detailVolume: decodeRle(rawDataset.detailVolumeRle),
        layer: {
          id: rawDataset.layer.id,
          name: rawDataset.layer.name,
          description: rawDataset.layer.description,
          atlasSource: rawDataset.atlasSource,
          difficulty: rawDataset.layer.difficulty,
          defaultViewId: rawDataset.layer.defaultViewId,
          availableViewIds: rawDataset.layer.availableViewIds,
          regions: rawDataset.layer.regions.map(withRegionMetadata),
        },
        notes: rawDataset.notes ?? [],
      }
    : null;

export function getHarvardOxfordSliceLayer(): GameLayer | null {
  return harvardOxfordSliceAtlas?.layer ?? null;
}

export function isHarvardOxfordSliceAtlasLayer(layer: GameLayer) {
  return harvardOxfordSliceAtlas?.layer.id === layer.id;
}

function withRegionMetadata(region: RawSliceAtlasLayer['regions'][number]): BrainRegion {
  return {
    ...region,
    renderings: {},
    ...regionMetadataById[region.id],
  };
}

function decodeRle(runs: Array<[number, number]>) {
  const totalLength = runs.reduce((sum, [count]) => sum + count, 0);
  const values = new Uint8Array(totalLength);
  let index = 0;

  for (const [count, value] of runs) {
    values.fill(value, index, index + count);
    index += count;
  }

  return values;
}

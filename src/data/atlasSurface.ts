import type { BrainRegion, BrainViewId, BrainViewOverride, GameLayer } from '../types/game';

type AtlasSurfaceLayerRecord = {
  id: string;
  name: string;
  description: string;
  difficulty: GameLayer['difficulty'];
  defaultViewId: BrainViewId;
  availableViewIds: BrainViewId[];
  regions: BrainRegion[];
};

type AtlasSurfaceDataset = {
  status: 'ready' | 'missing_source_data' | 'missing_dependency' | 'error';
  atlasSource: string;
  viewOverrides: Partial<Record<BrainViewId, BrainViewOverride>>;
  layers: AtlasSurfaceLayerRecord[];
  notes?: string[];
};

const atlasSurfaceDataset = require('../../data/processed/freesurfer_surface_atlas.json') as AtlasSurfaceDataset;

export function getAtlasBackedSurfaceLayers(): GameLayer[] {
  if (atlasSurfaceDataset.status !== 'ready') {
    return [];
  }

  return atlasSurfaceDataset.layers.map((layer) => ({
    ...layer,
    atlasSource: atlasSurfaceDataset.atlasSource,
    viewOverrides: atlasSurfaceDataset.viewOverrides,
  }));
}

export function getAtlasSurfaceNotes(): string[] {
  return atlasSurfaceDataset.notes ?? [];
}

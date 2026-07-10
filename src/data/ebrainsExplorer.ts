export type AtlasExplorerPresetId = 'viewerHome' | 'julichBrain';

export type AtlasExplorerPreset = {
  id: AtlasExplorerPresetId;
  name: string;
  description: string;
  url: string;
  defaultSearchTerms: string[];
  recommendedForLayerIds: string[];
};

const julichBrainUrl =
  'https://atlases.ebrains.eu/viewer/#/a:juelich:iav:atlas:v1.0.0:1/t:minds:core:referencespace:v1.0.0:dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2/p:minds:core:parcellationatlas:v1.0.0:94c1125b-b87e-45e4-901c-00daee7f2579-300';

export const atlasExplorerPresets: AtlasExplorerPreset[] = [
  {
    id: 'julichBrain',
    name: 'Julich Brain',
    description:
      'EBRAINS multilevel human atlas preset for structural and deep-region study in standard space.',
    url: julichBrainUrl,
    defaultSearchTerms: ['thalamus', 'hippocampus', 'insula'],
    recommendedForLayerIds: ['structural_slices', 'cortical_lobes', 'surface_landmarks', 'deep_structures'],
  },
  {
    id: 'viewerHome',
    name: 'Atlas Home',
    description:
      'The full EBRAINS viewer landing page so you can switch atlases, spaces, and explore slices freely.',
    url: 'https://atlases.ebrains.eu/viewer/',
    defaultSearchTerms: ['primary motor cortex', 'V1', "Broca's area"],
    recommendedForLayerIds: ['functional_areas'],
  },
];

export function getAtlasExplorerPreset(id: AtlasExplorerPresetId): AtlasExplorerPreset {
  return atlasExplorerPresets.find((preset) => preset.id === id) ?? atlasExplorerPresets[0];
}

export function getRecommendedAtlasExplorerPreset(layerId: string): AtlasExplorerPreset {
  return (
    atlasExplorerPresets.find((preset) => preset.recommendedForLayerIds.includes(layerId)) ??
    getAtlasExplorerPreset('julichBrain')
  );
}

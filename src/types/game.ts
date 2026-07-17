export type BrainViewId =
  | 'leftLateral'
  | 'rightLateral'
  | 'superior'
  | 'inferior'
  | 'midSagittal'
  | 'coronal'
  | 'axial';

export type RegionRendering = {
  path: string;
  centroid: {
    x: number;
    y: number;
  };
  mirrorX?: boolean;
};

export type BrainViewOverride = {
  outlinePath?: string;
  caption?: string;
};

export type BrainRegion = {
  id: string;
  label: string;
  color: string;
  renderings: Partial<Record<BrainViewId, RegionRendering>>;
  aliases?: string[];
  teachingSummary?: string;
  structuralNote?: string;
  keyFunctions?: string[];
  atlasCandidates?: string[];
};

export type GameLayer = {
  id: string;
  name: string;
  description: string;
  atlasSource: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  defaultViewId: BrainViewId;
  availableViewIds: BrainViewId[];
  viewOverrides?: Partial<Record<BrainViewId, BrainViewOverride>>;
  regions: BrainRegion[];
};

export type GameSettings = {
  highlightSelection: boolean;
  showBorders: boolean;
};

export type GameConfig = {
  layerId: string;
  roundsPerPlayer: number;
  players: string[];
  settings: GameSettings;
};

export type Turn = {
  promptRegionId: string;
  playerIndex: number;
};

export type PinMarker = {
  x: number;
  y: number;
  viewId: BrainViewId;
};

export type AtlasCoordinate = {
  x: number;
  y: number;
  z: number;
};

export type PendingGuess = {
  selectedRegionId: string | null;
  pin: PinMarker | null;
  coordinate?: AtlasCoordinate | null;
};

export type TurnFeedback = PendingGuess & {
  correct: boolean;
  promptRegionId: string;
};

export type PlayerAnswer = PendingGuess & {
  playerIndex: number;
  correct: boolean;
};

export type GameSession = {
  layerId: string;
  roundsPerPlayer: number;
  players: string[];
  deck: Turn[];
  scores: number[];
  turnIndex: number;
};

import type { BrainRegion, BrainViewId } from '../types/game';

export type AtlasRecommendation = {
  id: string;
  name: string;
  role: string;
  phase: 'Now' | 'Next' | 'Later';
  why: string;
  sourceUrl: string;
};

export type PlannedRegion = {
  id: string;
  label: string;
  focus: 'structural' | 'functional';
  phase: 'now' | 'later';
  summary: string;
  note?: string;
  keyFunctions?: string[];
  atlasCandidates: string[];
  suggestedViews: BrainViewId[];
  aliases?: string[];
};

export type ContentTrack = {
  id: string;
  name: string;
  description: string;
  defaultAtlas: string;
  regions: PlannedRegion[];
};

type RegionMetadata = Partial<
  Pick<BrainRegion, 'aliases' | 'teachingSummary' | 'structuralNote' | 'keyFunctions' | 'atlasCandidates'>
>;

export const atlasRecommendations: AtlasRecommendation[] = [
  {
    id: 'mni152_reference_space',
    name: 'MNI152 Reference Space',
    role: 'Canonical coordinate space for exported slices, pins, and future cross-atlas overlays.',
    phase: 'Now',
    why: 'Keeps the gameplay coordinate system stable even when the displayed atlas changes.',
    sourceUrl: 'https://nist.mni.mcgill.ca/mni152-atlas/',
  },
  {
    id: 'freesurfer_dkt',
    name: 'FreeSurfer DKT / Desikan-Killiany',
    role: 'Primary beginner structural cortex atlas for lobes and broad gyri-based regions.',
    phase: 'Now',
    why: 'Good teaching balance: recognizable anatomy without overwhelming detail.',
    sourceUrl: 'https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation',
  },
  {
    id: 'freesurfer_destrieux',
    name: 'FreeSurfer Destrieux',
    role: 'Higher-detail sulci and gyri layer for harder structural play.',
    phase: 'Next',
    why: 'Separates sulcal and gyral anatomy better than a broad beginner atlas.',
    sourceUrl: 'https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation',
  },
  {
    id: 'freesurfer_aseg',
    name: 'FreeSurfer Aseg',
    role: 'Broad deep structures, ventricles, basal ganglia, hippocampus, amygdala, and brainstem.',
    phase: 'Now',
    why: 'Covers many of the big cognition-relevant structures in one consistent segmentation family.',
    sourceUrl: 'https://surfer.nmr.mgh.harvard.edu/fswiki/SubcorticalSegmentation',
  },
  {
    id: 'freesurfer_subregions',
    name: 'FreeSurfer Subregion Modules',
    role: 'Refine thalamic nuclei, hypothalamus, hippocampus, amygdala, and brainstem when we want more depth.',
    phase: 'Next',
    why: 'Lets us promote specific nuclei such as LGN without redesigning the whole atlas stack.',
    sourceUrl: 'https://surfer.nmr.mgh.harvard.edu/fswiki/ThalamicNuclei',
  },
  {
    id: 'ebrains_julich',
    name: 'EBRAINS Julich-Brain',
    role: 'Selected small, functionally important nuclei and higher-fidelity cytoarchitectonic deep structures.',
    phase: 'Next',
    why: 'Useful when we care about specific nuclei more than broad classroom labels.',
    sourceUrl: 'https://atlases.ebrains.eu/viewer/',
  },
  {
    id: 'hcp_mmp_1_0',
    name: 'HCP MMP 1.0',
    role: 'Functional cortex layer and advanced cortical teaching overlays.',
    phase: 'Next',
    why: 'Best fit for modern functional cortex prompts such as visual, language, and sensorimotor systems.',
    sourceUrl: 'https://humanconnectome.org/study/hcp-young-adult/document/1200-subjects-data-release',
  },
  {
    id: 'harvard_oxford',
    name: 'Harvard-Oxford (FSL)',
    role: 'Fallback reference for broad subcortical labels and sanity checks during preprocessing.',
    phase: 'Later',
    why: 'Helpful as a comparison atlas, but not my first choice for the main game identity.',
    sourceUrl: 'https://fsl.fmrib.ox.ac.uk/fsl/docs/#/other/datasets',
  },
];

const structuralSurfaceTrack: ContentTrack = {
  id: 'structural_surface',
  name: 'Structural Surface',
  description: 'Gross cortical anatomy first: lobes, visible fissures, and the major medial and lateral landmarks.',
  defaultAtlas: 'freesurfer_dkt',
  regions: [
    {
      id: 'frontal_lobe',
      label: 'Frontal Lobe',
      focus: 'structural',
      phase: 'now',
      summary: 'Anterior cortex involved in executive control, action planning, speech production, and social behavior.',
      note: 'Best introduced as a grouped teaching region, then unpacked into precentral, premotor, orbitofrontal, and language-related cortex later.',
      atlasCandidates: ['freesurfer_dkt', 'freesurfer_destrieux'],
      suggestedViews: ['leftLateral', 'rightLateral', 'superior', 'midSagittal'],
    },
    {
      id: 'parietal_lobe',
      label: 'Parietal Lobe',
      focus: 'structural',
      phase: 'now',
      summary: 'Dorsal posterior cortex central to somatosensation, spatial attention, and sensorimotor integration.',
      atlasCandidates: ['freesurfer_dkt', 'freesurfer_destrieux'],
      suggestedViews: ['leftLateral', 'rightLateral', 'superior', 'midSagittal'],
    },
    {
      id: 'temporal_lobe',
      label: 'Temporal Lobe',
      focus: 'structural',
      phase: 'now',
      summary: 'Lateral and ventral cortex linked to auditory processing, memory, language, and object recognition.',
      atlasCandidates: ['freesurfer_dkt', 'freesurfer_destrieux'],
      suggestedViews: ['leftLateral', 'rightLateral', 'inferior', 'midSagittal'],
    },
    {
      id: 'occipital_lobe',
      label: 'Occipital Lobe',
      focus: 'structural',
      phase: 'now',
      summary: 'Posterior cortex dominated by visual processing regions and their surrounding association cortex.',
      atlasCandidates: ['freesurfer_dkt', 'freesurfer_destrieux'],
      suggestedViews: ['leftLateral', 'rightLateral', 'superior', 'midSagittal'],
    },
    {
      id: 'insula',
      label: 'Insular Cortex',
      focus: 'structural',
      phase: 'now',
      summary: 'Hidden cortex deep to the lateral sulcus involved in interoception, salience, affect, and taste.',
      note: 'Should be revealed in a slice or peeled-open teaching view rather than only on the outer surface.',
      atlasCandidates: ['freesurfer_dkt', 'freesurfer_destrieux'],
      suggestedViews: ['coronal', 'axial', 'leftLateral', 'rightLateral'],
    },
    {
      id: 'limbic_cortex',
      label: 'Limbic Cortex (Medial)',
      focus: 'structural',
      phase: 'now',
      summary: 'Medial cortical teaching group spanning cingulate and nearby medial wall anatomy relevant to emotion and memory.',
      note: 'Use as a pedagogic grouping rather than pretending it is a single native atlas parcel.',
      atlasCandidates: ['freesurfer_dkt', 'freesurfer_destrieux'],
      suggestedViews: ['midSagittal'],
    },
    {
      id: 'longitudinal_cerebral_fissure',
      label: 'Longitudinal Cerebral Fissure',
      focus: 'structural',
      phase: 'now',
      summary: 'Deep midline fissure separating the two cerebral hemispheres.',
      atlasCandidates: ['prototype_schematic', 'freesurfer_dkt'],
      suggestedViews: ['superior', 'inferior', 'midSagittal'],
      aliases: ['interhemispheric fissure'],
    },
    {
      id: 'lateral_sulcus',
      label: 'Lateral Sulcus',
      focus: 'structural',
      phase: 'now',
      summary: 'Major lateral fissure separating frontal and parietal cortex from temporal cortex.',
      note: 'Same landmark as the Sylvian fissure in many teaching diagrams.',
      atlasCandidates: ['freesurfer_destrieux'],
      suggestedViews: ['leftLateral', 'rightLateral'],
      aliases: ['Sylvian fissure', 'Sylvian sulcus'],
    },
    {
      id: 'central_sulcus',
      label: 'Central Sulcus',
      focus: 'structural',
      phase: 'now',
      summary: 'Primary landmark separating frontal motor cortex from parietal somatosensory cortex.',
      atlasCandidates: ['freesurfer_destrieux'],
      suggestedViews: ['leftLateral', 'rightLateral', 'superior'],
    },
    {
      id: 'precentral_sulcus',
      label: 'Precentral Sulcus',
      focus: 'structural',
      phase: 'later',
      summary: 'Sulcus anterior to the precentral gyrus, useful once the motor strip is already familiar.',
      atlasCandidates: ['freesurfer_destrieux'],
      suggestedViews: ['leftLateral', 'rightLateral', 'superior'],
    },
    {
      id: 'postcentral_sulcus',
      label: 'Postcentral Sulcus',
      focus: 'structural',
      phase: 'later',
      summary: 'Sulcus posterior to primary somatosensory cortex, best added after the central sulcus is mastered.',
      atlasCandidates: ['freesurfer_destrieux'],
      suggestedViews: ['leftLateral', 'rightLateral', 'superior'],
    },
    {
      id: 'parieto_occipital_sulcus',
      label: 'Parieto-Occipital Sulcus',
      focus: 'structural',
      phase: 'now',
      summary: 'Medial landmark separating parietal and occipital cortex.',
      atlasCandidates: ['freesurfer_destrieux'],
      suggestedViews: ['midSagittal'],
    },
    {
      id: 'calcarine_sulcus',
      label: 'Calcarine Sulcus',
      focus: 'structural',
      phase: 'now',
      summary: 'Medial occipital sulcus that anchors the primary visual cortex teaching layer.',
      atlasCandidates: ['freesurfer_destrieux', 'hcp_mmp_1_0'],
      suggestedViews: ['midSagittal'],
    },
    {
      id: 'cingulate_sulcus',
      label: 'Cingulate Sulcus',
      focus: 'structural',
      phase: 'later',
      summary: 'Medial sulcus running superior to the cingulate gyrus.',
      atlasCandidates: ['freesurfer_destrieux'],
      suggestedViews: ['midSagittal'],
    },
    {
      id: 'collateral_sulcus',
      label: 'Collateral Sulcus',
      focus: 'structural',
      phase: 'later',
      summary: 'Ventral temporal landmark near parahippocampal and fusiform cortex.',
      atlasCandidates: ['freesurfer_destrieux'],
      suggestedViews: ['inferior', 'midSagittal'],
    },
    {
      id: 'marginal_ramus',
      label: 'Marginal Ramus of the Cingulate Sulcus',
      focus: 'structural',
      phase: 'later',
      summary: 'Medial superior branch of the cingulate sulcus used to orient the paracentral region.',
      atlasCandidates: ['freesurfer_destrieux'],
      suggestedViews: ['midSagittal'],
    },
    {
      id: 'paracentral_lobule',
      label: 'Paracentral Lobule',
      focus: 'structural',
      phase: 'later',
      summary: 'Medial continuation of the motor and somatosensory strip, especially useful for lower-limb body maps.',
      note: 'Using the paracentral lobule here rather than a generic "paracentral sulcus" because it is the more standard teaching target.',
      atlasCandidates: ['freesurfer_dkt', 'freesurfer_destrieux', 'hcp_mmp_1_0'],
      suggestedViews: ['midSagittal', 'superior'],
    },
    {
      id: 'preoccipital_notch',
      label: 'Preoccipital Notch',
      focus: 'structural',
      phase: 'later',
      summary: 'Surface landmark sometimes used to estimate the temporal-occipital boundary on the lateral surface.',
      atlasCandidates: ['prototype_schematic'],
      suggestedViews: ['leftLateral', 'rightLateral'],
    },
  ],
};

const limbicDeepTrack: ContentTrack = {
  id: 'limbic_diencephalon_and_endocrine',
  name: 'Limbic, Diencephalon, And Endocrine',
  description: 'Functionally important medial temporal and diencephalic structures before ultra-fine nuclei.',
  defaultAtlas: 'freesurfer_aseg',
  regions: [
    {
      id: 'anterior_cingulate_gyrus',
      label: 'Anterior Cingulate Gyrus',
      focus: 'structural',
      phase: 'now',
      summary: 'Medial frontal limbic cortex tied to conflict monitoring, effort, pain, and motivation.',
      atlasCandidates: ['freesurfer_dkt', 'freesurfer_destrieux', 'hcp_mmp_1_0'],
      suggestedViews: ['midSagittal'],
    },
    {
      id: 'posterior_cingulate_gyrus',
      label: 'Posterior Cingulate Gyrus',
      focus: 'structural',
      phase: 'now',
      summary: 'Medial parietal limbic cortex relevant to memory, internal mentation, and the default mode network.',
      atlasCandidates: ['freesurfer_dkt', 'freesurfer_destrieux', 'hcp_mmp_1_0'],
      suggestedViews: ['midSagittal'],
    },
    {
      id: 'hippocampus',
      label: 'Hippocampus',
      focus: 'structural',
      phase: 'now',
      summary: 'Medial temporal structure central to episodic memory and spatial navigation.',
      atlasCandidates: ['freesurfer_aseg', 'freesurfer_subregions'],
      suggestedViews: ['midSagittal', 'coronal', 'axial'],
    },
    {
      id: 'amygdala',
      label: 'Amygdala',
      focus: 'structural',
      phase: 'now',
      summary: 'Anterior medial temporal nucleus complex involved in salience, threat, emotion, and learning.',
      atlasCandidates: ['freesurfer_aseg', 'freesurfer_subregions'],
      suggestedViews: ['coronal', 'axial', 'midSagittal'],
    },
    {
      id: 'fornix',
      label: 'Fornix',
      focus: 'structural',
      phase: 'now',
      summary: 'Major white-matter tract linking hippocampal circuitry with diencephalic memory structures.',
      atlasCandidates: ['prototype_schematic', 'freesurfer_subregions'],
      suggestedViews: ['midSagittal', 'coronal'],
    },
    {
      id: 'thalamus',
      label: 'Thalamus',
      focus: 'structural',
      phase: 'now',
      summary: 'Paired diencephalic relay structure linking cortex with sensory, motor, and limbic systems.',
      atlasCandidates: ['freesurfer_aseg', 'harvard_oxford', 'freesurfer_subregions'],
      suggestedViews: ['midSagittal', 'coronal', 'axial'],
    },
    {
      id: 'thalamic_nuclei',
      label: 'Thalamic Nuclei',
      focus: 'structural',
      phase: 'later',
      summary: 'Advanced diencephalic layer for selected cognitive and sensory relay nuclei.',
      note: 'Whole thalamus should come first; nuclei are a better second-pass layer than a first-pass layer.',
      atlasCandidates: ['freesurfer_subregions', 'ebrains_julich'],
      suggestedViews: ['coronal', 'axial', 'midSagittal'],
    },
    {
      id: 'lateral_geniculate_nucleus',
      label: 'Lateral Geniculate Nucleus',
      focus: 'structural',
      phase: 'now',
      summary: 'Visual thalamic relay between retina and primary visual cortex.',
      keyFunctions: ['visual relay', 'retinotopic transmission'],
      atlasCandidates: ['freesurfer_subregions', 'ebrains_julich'],
      suggestedViews: ['coronal', 'axial'],
      aliases: ['LGN'],
    },
    {
      id: 'hypothalamus',
      label: 'Hypothalamus',
      focus: 'structural',
      phase: 'now',
      summary: 'Small diencephalic hub linking endocrine control, autonomic regulation, drive states, and circadian function.',
      atlasCandidates: ['freesurfer_aseg', 'freesurfer_subregions'],
      suggestedViews: ['midSagittal', 'coronal', 'axial'],
    },
    {
      id: 'pituitary_gland',
      label: 'Pituitary Gland',
      focus: 'structural',
      phase: 'now',
      summary: 'Endocrine gland suspended below the hypothalamus that releases major hormonal signals.',
      keyFunctions: ['endocrine control'],
      atlasCandidates: ['prototype_schematic', 'freesurfer_aseg'],
      suggestedViews: ['midSagittal', 'coronal'],
    },
    {
      id: 'pineal_gland',
      label: 'Pineal Gland',
      focus: 'structural',
      phase: 'now',
      summary: 'Midline endocrine structure associated with melatonin secretion and circadian timing.',
      keyFunctions: ['circadian endocrine signaling'],
      atlasCandidates: ['prototype_schematic', 'freesurfer_aseg'],
      suggestedViews: ['midSagittal'],
    },
    {
      id: 'diencephalon',
      label: 'Diencephalon',
      focus: 'structural',
      phase: 'later',
      summary: 'Teaching-level grouping for thalamus, hypothalamus, and nearby deep forebrain structures.',
      note: 'Treat this as a grouped educational overlay rather than a single atlas-derived parcel.',
      atlasCandidates: ['prototype_schematic'],
      suggestedViews: ['midSagittal', 'coronal', 'axial'],
    },
    {
      id: 'corpus_callosum',
      label: 'Corpus Callosum',
      focus: 'structural',
      phase: 'now',
      summary: 'Largest commissural white-matter tract connecting the two cerebral hemispheres.',
      atlasCandidates: ['prototype_schematic', 'freesurfer_aseg'],
      suggestedViews: ['midSagittal', 'coronal'],
    },
    {
      id: 'lateral_ventricle',
      label: 'Lateral Ventricle',
      focus: 'structural',
      phase: 'now',
      summary: 'Paired CSF-filled ventricular chambers embedded within the cerebral hemispheres.',
      atlasCandidates: ['freesurfer_aseg', 'harvard_oxford'],
      suggestedViews: ['coronal', 'axial', 'midSagittal'],
    },
    {
      id: 'third_ventricle',
      label: 'Third Ventricle',
      focus: 'structural',
      phase: 'now',
      summary: 'Midline CSF space between the two thalami and above the hypothalamus.',
      atlasCandidates: ['freesurfer_aseg'],
      suggestedViews: ['midSagittal', 'coronal', 'axial'],
    },
  ],
};

const deepMotorTrack: ContentTrack = {
  id: 'basal_ganglia_and_midbrain',
  name: 'Basal Ganglia And Midbrain',
  description: 'The high-yield deep nuclei and nearby structures most relevant to cognition, movement, and reward.',
  defaultAtlas: 'freesurfer_aseg',
  regions: [
    {
      id: 'caudate',
      label: 'Caudate',
      focus: 'structural',
      phase: 'now',
      summary: 'Basal ganglia structure involved in action selection, learning, and cognitive control loops.',
      atlasCandidates: ['freesurfer_aseg', 'harvard_oxford'],
      suggestedViews: ['coronal', 'axial'],
    },
    {
      id: 'putamen',
      label: 'Putamen',
      focus: 'structural',
      phase: 'now',
      summary: 'Lateral basal ganglia nucleus central to motor and habit-related corticostriatal circuits.',
      atlasCandidates: ['freesurfer_aseg', 'harvard_oxford'],
      suggestedViews: ['coronal', 'axial'],
    },
    {
      id: 'globus_pallidus',
      label: 'Globus Pallidus',
      focus: 'structural',
      phase: 'now',
      summary: 'Major basal ganglia output nucleus shaping thalamocortical motor signaling.',
      atlasCandidates: ['freesurfer_aseg', 'harvard_oxford'],
      suggestedViews: ['coronal', 'axial'],
    },
    {
      id: 'nucleus_accumbens',
      label: 'Nucleus Accumbens',
      focus: 'structural',
      phase: 'now',
      summary: 'Ventral striatal region linked to reward, reinforcement, motivation, and affective salience.',
      atlasCandidates: ['freesurfer_aseg', 'harvard_oxford', 'ebrains_julich'],
      suggestedViews: ['coronal', 'axial'],
    },
    {
      id: 'claustrum',
      label: 'Claustrum',
      focus: 'structural',
      phase: 'later',
      summary: 'Thin deep gray sheet between insula and putamen, important but visually challenging.',
      atlasCandidates: ['ebrains_julich', 'prototype_schematic'],
      suggestedViews: ['coronal', 'axial'],
    },
    {
      id: 'external_capsule',
      label: 'External Capsule',
      focus: 'structural',
      phase: 'later',
      summary: 'White-matter sheet between putamen and claustrum, best added after the larger neighbors are familiar.',
      atlasCandidates: ['prototype_schematic'],
      suggestedViews: ['coronal', 'axial'],
    },
    {
      id: 'red_nucleus',
      label: 'Red Nucleus',
      focus: 'structural',
      phase: 'later',
      summary: 'Midbrain nucleus involved in motor coordination and a useful midbrain orientation landmark.',
      atlasCandidates: ['ebrains_julich', 'prototype_schematic'],
      suggestedViews: ['axial', 'coronal'],
    },
    {
      id: 'substantia_nigra',
      label: 'Substantia Nigra',
      focus: 'structural',
      phase: 'now',
      summary: 'Midbrain dopaminergic nucleus group central to reward learning and movement disorders.',
      atlasCandidates: ['ebrains_julich', 'prototype_schematic'],
      suggestedViews: ['axial', 'coronal'],
    },
    {
      id: 'cerebral_peduncle',
      label: 'Cerebral Peduncle',
      focus: 'structural',
      phase: 'later',
      summary: 'Large descending fiber bundle in the ventral midbrain.',
      atlasCandidates: ['prototype_schematic', 'freesurfer_subregions'],
      suggestedViews: ['midSagittal', 'axial'],
    },
    {
      id: 'superior_colliculus',
      label: 'Superior Colliculus',
      focus: 'structural',
      phase: 'later',
      summary: 'Dorsal midbrain structure involved in orienting eye and head movements.',
      atlasCandidates: ['ebrains_julich', 'prototype_schematic'],
      suggestedViews: ['midSagittal', 'axial'],
    },
    {
      id: 'inferior_colliculus',
      label: 'Inferior Colliculus',
      focus: 'structural',
      phase: 'later',
      summary: 'Auditory midbrain relay below the superior colliculus.',
      atlasCandidates: ['ebrains_julich', 'prototype_schematic'],
      suggestedViews: ['midSagittal', 'axial'],
    },
  ],
};

const hindbrainTrack: ContentTrack = {
  id: 'brainstem_and_cerebellum',
  name: 'Brainstem And Cerebellum',
  description: 'Big hindbrain structures first, then more specific substructures if the learning mode gets harder.',
  defaultAtlas: 'freesurfer_aseg',
  regions: [
    {
      id: 'brainstem',
      label: 'Brainstem',
      focus: 'structural',
      phase: 'now',
      summary: 'Major conduit between cerebrum and spinal cord, containing midbrain, pons, and medulla.',
      atlasCandidates: ['freesurfer_aseg', 'freesurfer_subregions'],
      suggestedViews: ['midSagittal', 'coronal'],
    },
    {
      id: 'midbrain',
      label: 'Midbrain',
      focus: 'structural',
      phase: 'now',
      summary: 'Upper brainstem segment housing tectal and dopaminergic structures important in movement and orienting.',
      atlasCandidates: ['freesurfer_subregions'],
      suggestedViews: ['midSagittal', 'axial', 'coronal'],
    },
    {
      id: 'pons',
      label: 'Pons',
      focus: 'structural',
      phase: 'now',
      summary: 'Bulging middle brainstem segment that relays information between cortex and cerebellum.',
      atlasCandidates: ['freesurfer_aseg', 'freesurfer_subregions'],
      suggestedViews: ['midSagittal', 'coronal', 'axial'],
    },
    {
      id: 'medulla',
      label: 'Medulla Oblongata',
      focus: 'structural',
      phase: 'now',
      summary: 'Lower brainstem segment essential for autonomic and cardiorespiratory functions.',
      atlasCandidates: ['freesurfer_aseg', 'freesurfer_subregions'],
      suggestedViews: ['midSagittal', 'coronal', 'axial'],
      aliases: ['medulla oblongata'],
    },
    {
      id: 'cerebellum',
      label: 'Cerebellum',
      focus: 'structural',
      phase: 'now',
      summary: 'Posterior hindbrain structure for coordination, timing, error correction, and increasingly recognized cognitive roles.',
      atlasCandidates: ['freesurfer_aseg', 'prototype_schematic'],
      suggestedViews: ['leftLateral', 'rightLateral', 'inferior', 'midSagittal'],
    },
  ],
};

const functionalTrack: ContentTrack = {
  id: 'functional_cortex',
  name: 'Functional Cortex',
  description: 'Start with big, high-yield cortical systems and leave somatotopic fine detail for a later layer.',
  defaultAtlas: 'hcp_mmp_1_0',
  regions: [
    {
      id: 'primary_motor_cortex',
      label: 'Primary Motor Cortex',
      focus: 'functional',
      phase: 'now',
      summary: 'Precentral cortex driving voluntary movement through corticospinal and corticobulbar output.',
      keyFunctions: ['voluntary movement'],
      atlasCandidates: ['hcp_mmp_1_0', 'freesurfer_dkt'],
      suggestedViews: ['leftLateral', 'rightLateral', 'superior', 'midSagittal'],
    },
    {
      id: 'premotor_cortex',
      label: 'Premotor Cortex',
      focus: 'functional',
      phase: 'later',
      summary: 'Frontal motor planning cortex important for action preparation and learned action sequences.',
      atlasCandidates: ['hcp_mmp_1_0'],
      suggestedViews: ['leftLateral', 'rightLateral', 'superior'],
    },
    {
      id: 'supplementary_motor_area',
      label: 'Supplementary Motor Area',
      focus: 'functional',
      phase: 'later',
      summary: 'Medial frontal motor planning region involved in internally generated action sequences.',
      atlasCandidates: ['hcp_mmp_1_0'],
      suggestedViews: ['midSagittal', 'superior'],
      aliases: ['SMA'],
    },
    {
      id: 'primary_somatosensory_cortex',
      label: 'Primary Somatosensory Cortex',
      focus: 'functional',
      phase: 'now',
      summary: 'Postcentral cortex receiving fine-grained body sensation from touch and proprioceptive pathways.',
      keyFunctions: ['touch', 'body sensation', 'proprioception'],
      atlasCandidates: ['hcp_mmp_1_0', 'freesurfer_dkt'],
      suggestedViews: ['leftLateral', 'rightLateral', 'superior', 'midSagittal'],
    },
    {
      id: 'primary_auditory_cortex',
      label: 'Primary Auditory Cortex',
      focus: 'functional',
      phase: 'now',
      summary: 'Early auditory cortex on or near Heschl gyrus for sound feature encoding.',
      keyFunctions: ['hearing'],
      atlasCandidates: ['hcp_mmp_1_0'],
      suggestedViews: ['leftLateral', 'rightLateral', 'superior'],
    },
    {
      id: 'brocas_area',
      label: "Broca's Area",
      focus: 'functional',
      phase: 'now',
      summary: 'Left inferior frontal language production network node, usually taught around pars opercularis and pars triangularis.',
      keyFunctions: ['speech production', 'language expression'],
      atlasCandidates: ['hcp_mmp_1_0', 'freesurfer_dkt'],
      suggestedViews: ['leftLateral', 'superior'],
    },
    {
      id: 'wernickes_area',
      label: "Wernicke's Area",
      focus: 'functional',
      phase: 'now',
      summary: 'Posterior temporal-parietal language comprehension teaching region rather than one universally fixed parcel.',
      keyFunctions: ['language comprehension'],
      atlasCandidates: ['hcp_mmp_1_0', 'freesurfer_dkt'],
      suggestedViews: ['leftLateral', 'superior'],
    },
    {
      id: 'v1',
      label: 'Primary Visual Cortex (V1)',
      focus: 'functional',
      phase: 'now',
      summary: 'Earliest cortical visual area centered on the calcarine bank in occipital cortex.',
      keyFunctions: ['early vision', 'retinotopic mapping'],
      atlasCandidates: ['hcp_mmp_1_0', 'ebrains_julich'],
      suggestedViews: ['midSagittal', 'leftLateral', 'rightLateral', 'superior'],
    },
    {
      id: 'v2',
      label: 'Secondary Visual Cortex (V2)',
      focus: 'functional',
      phase: 'now',
      summary: 'Early extrastriate visual cortex surrounding V1 and extending visual feature processing.',
      keyFunctions: ['visual feature processing'],
      atlasCandidates: ['hcp_mmp_1_0'],
      suggestedViews: ['midSagittal', 'leftLateral', 'rightLateral', 'superior'],
    },
    {
      id: 'visual_association_cortex',
      label: 'Visual Association Cortex',
      focus: 'functional',
      phase: 'later',
      summary: 'Helpful teaching umbrella for extrastriate visual areas before fine visual hierarchy questions.',
      atlasCandidates: ['hcp_mmp_1_0'],
      suggestedViews: ['leftLateral', 'rightLateral', 'midSagittal'],
    },
    {
      id: 'homunculus_lower_limb',
      label: 'Lower-Limb Sensorimotor Representation',
      focus: 'functional',
      phase: 'later',
      summary: 'Future difficulty layer for somatotopy on the medial motor and somatosensory strip.',
      note: 'This is the kind of hierarchical follow-on layer we should add after the main motor and sensory cortexes feel solid.',
      atlasCandidates: ['hcp_mmp_1_0'],
      suggestedViews: ['midSagittal', 'superior'],
    },
  ],
};

export const contentTracks: ContentTrack[] = [
  structuralSurfaceTrack,
  limbicDeepTrack,
  deepMotorTrack,
  hindbrainTrack,
  functionalTrack,
];

export const regionMetadataById: Record<string, RegionMetadata> = contentTracks.reduce<
  Record<string, RegionMetadata>
>((metadata, track) => {
  for (const region of track.regions) {
    metadata[region.id] = {
      aliases: region.aliases,
      teachingSummary: region.summary,
      structuralNote: region.focus === 'structural' ? region.note : undefined,
      keyFunctions: region.keyFunctions,
      atlasCandidates: region.atlasCandidates,
    };
  }

  return metadata;
}, {});

Object.assign(regionMetadataById, {
  frontal_pole: {
    teachingSummary:
      'Most anterior frontal cortex, often used as a landmark for prospective planning, abstract control, and frontopolar cognition.',
    atlasCandidates: ['harvard_oxford'],
  },
  superior_frontal_gyrus: {
    teachingSummary:
      'Dorsal frontal association cortex involved in executive control, self-generated action, and higher-order attention.',
    atlasCandidates: ['harvard_oxford'],
  },
  middle_frontal_gyrus: {
    teachingSummary:
      'A major dorsolateral prefrontal territory tied to working memory, flexible attention, and rule-guided behavior.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['working memory', 'cognitive control', 'attention shifting'],
  },
  inferior_frontal_gyrus: {
    teachingSummary:
      'Inferior frontal cortex that matters for response inhibition and, on the left, language production networks.',
    atlasCandidates: ['harvard_oxford'],
    aliases: ['IFG'],
    keyFunctions: ['response inhibition', 'speech production', 'selection'],
  },
  precentral_gyrus: {
    teachingSummary:
      'The precentral gyrus contains primary motor cortex and is the best structural landmark for voluntary movement output.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['voluntary movement', 'motor output'],
  },
  frontal_medial_cortex: {
    teachingSummary:
      'Medial frontal territory spanning supplementary and orbitomedial areas that help initiate actions and coordinate internal goals.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['action initiation', 'motor planning', 'goal maintenance'],
  },
  insula: {
    teachingSummary:
      'Hidden cortex within the lateral sulcus that is central to interoception, salience, affect, and visceral awareness.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['interoception', 'salience', 'affect'],
  },
  anterior_cingulate_gyrus: {
    teachingSummary:
      'Anterior cingulate supports conflict monitoring, motivation, autonomic regulation, and value-guided control.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['conflict monitoring', 'motivation', 'autonomic control'],
  },
  posterior_cingulate_gyrus: {
    teachingSummary:
      'Posterior cingulate is a medial hub linked to memory, spatial orientation, and the default mode network.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['memory orientation', 'default mode processing'],
  },
  postcentral_gyrus: {
    teachingSummary:
      'The postcentral gyrus contains primary somatosensory cortex and is the key structural strip for body sensation.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['touch', 'proprioception', 'somatosensation'],
  },
  superior_parietal_lobule: {
    teachingSummary:
      'Superior parietal cortex helps integrate sensation with movement and supports visuospatial attention.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['visuospatial attention', 'sensorimotor integration'],
  },
  supramarginal_gyrus: {
    teachingSummary:
      'Inferior parietal cortex near the lateral sulcus that contributes to phonology, body schema, and multisensory integration.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['phonological processing', 'body schema', 'multisensory integration'],
  },
  angular_gyrus: {
    teachingSummary:
      'Posterior inferior parietal cortex associated with semantic processing, reading, number knowledge, and cross-modal integration.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['semantics', 'reading', 'cross-modal integration'],
  },
  precuneus: {
    teachingSummary:
      'Medial parietal cortex often discussed in visuospatial imagery, episodic memory, and self-referential processing.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['visuospatial imagery', 'episodic memory', 'self processing'],
  },
  temporal_pole: {
    teachingSummary:
      'The anterior tip of the temporal lobe, important for semantic memory, social knowledge, and affective meaning.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['semantic memory', 'social cognition'],
  },
  superior_temporal_gyrus: {
    teachingSummary:
      'Superior temporal cortex contains core auditory association territory and is crucial for speech perception.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['auditory processing', 'speech perception'],
  },
  middle_temporal_gyrus: {
    teachingSummary:
      'Middle temporal cortex supports semantic access, motion-related interpretation, and broader association processing.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['semantic processing', 'association cortex'],
  },
  inferior_temporal_gyrus: {
    teachingSummary:
      'Inferior temporal cortex is part of the ventral visual stream for high-level object and category recognition.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['object recognition', 'ventral visual stream'],
  },
  heschls_gyrus: {
    teachingSummary:
      "Heschl's gyrus contains primary auditory cortex and is one of the clearest structural anchors for early sound processing.",
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['primary auditory cortex', 'early sound analysis'],
  },
  planum_temporale: {
    teachingSummary:
      'Posterior superior temporal plane that matters for auditory association and classic language lateralization discussions.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['auditory association', 'language lateralization'],
  },
  parahippocampal_gyrus: {
    teachingSummary:
      'Medial temporal cortex tied to scene context, navigation, and memory encoding alongside the hippocampal system.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['context encoding', 'navigation', 'memory'],
  },
  fusiform_gyrus: {
    teachingSummary:
      'Ventral temporal-occipital cortex associated with high-level visual recognition, including faces, words, and object categories.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['face recognition', 'visual word processing', 'object categories'],
  },
  lateral_occipital_cortex: {
    teachingSummary:
      'Lateral occipital visual cortex supports object form perception beyond the earliest visual field maps.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['visual object form', 'higher visual processing'],
  },
  cuneus: {
    teachingSummary:
      'Medial occipital cortex above the calcarine sulcus, commonly used as a structural landmark for early visual regions.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['early visual processing'],
  },
  intracalcarine_cortex: {
    teachingSummary:
      'Cortex lining the calcarine sulcus, often used as the structural proxy for primary visual cortex in teaching diagrams.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['primary visual cortex', 'retinotopic vision'],
  },
  lingual_gyrus: {
    teachingSummary:
      'Medial ventral occipital cortex implicated in visual feature processing, scenes, and some reading-related functions.',
    atlasCandidates: ['harvard_oxford'],
    keyFunctions: ['ventral visual processing', 'scene and feature analysis'],
  },
});

regionMetadataById.cerebellum_deep = {
  ...regionMetadataById.cerebellum,
};

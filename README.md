# Where Is This Brain?

A mobile-first neuroanatomy quiz game inspired by "Where is that?".

The current prototype is built as an Expo app so we can run one codebase on iPhone, Android, and the web while we iterate on gameplay. The current game surface is a free atlas-backed slice viewer built from Harvard-Oxford parcels plus an MNI anatomical backdrop.

## Current Prototype

- Single-player and local pass-and-play on one phone
- Touch-based anatomy prompts
- Short teaching summaries during prompts, with room for richer facts after reveal
- Atlas-backed sagittal, coronal, and axial slice gameplay
- MRI-style tissue backdrop with atlas parcel boundaries
- Conservative selectable regions with richer visible structural boundaries
- Highlighted region feedback after selection
- Optional borderless mode
- A growing structural region library for cortex and deep anatomy

## Recommended Workflow

For now, the smoothest path is:

1. Run the app as a web build during development.
2. Share the exported web build with a normal URL for phone testing.
3. Add native development builds later if we want a more app-like install on iPhone or Android.

Why this is the default path:

- The same Expo codebase works across web, iPhone, and Android.
- It avoids Expo Go version mismatch issues.
- It is easier to test atlas-style 2D views in a browser while the product is still changing quickly.

## Project Structure

- `App.tsx` - app entry point and screen flow
- `src/` - reusable game logic, map rendering, and layer definitions
- `src/data/atlasPlan.ts` - atlas strategy, planned content tracks, and reusable region teaching metadata
- `data/` - future atlas source files and preprocessing inputs
- `outputs/` - exported figures, derived meshes, and test renders
- `notebooks/` - analysis only

## Setup

### 1. Configure conda

```bash
conda config --add channels conda-forge
conda config --set channel_priority strict
```

### 2. Create the reproducible Python environment

```bash
conda env create -p ./.conda-env -f environment.yml
conda activate "./.conda-env"
```

The Python environment is for atlas preparation, region preprocessing, and future data conversion workflows.

Because the project folder contains spaces, quoting the environment path is the safest option on macOS shells.

### 3. Install app dependencies

```bash
npm install
```

### 4. Run locally

```bash
npm run web
```

Then open the exact URL Expo prints on your computer. With the current Expo web tooling, that is often `http://localhost:8081` rather than the older `19006` port.

If the Expo dev page does not load reliably, use the static preview flow instead:

```bash
npm run preview:web
```

That exports the site and serves `dist/` at `http://localhost:4173`, which is the most reliable local website path for this project right now.

If you want to open it on your phone while your Mac is serving it, use your Mac's local network IP instead of `localhost`, for example `http://192.168.x.x:4173`.

### Preferred local development

Use the browser version during day-to-day iteration:

```bash
npm run web
```

Important:

- `localhost` only works on the same machine that started the server.
- If you type `localhost` on your phone, the phone looks for a server on itself, not on your Mac.
- For phone testing, the better route is to deploy the exported web build and open a real URL.

### Optional Expo native debugging

If we later want to sanity-check native behavior during development:

```bash
npm run start
```

That should be treated as secondary to the web-first workflow.

### Build the free atlas-backed slice atlas

```bash
python src/atlas/build_harvard_oxford_slice_atlas.py
```

When run inside the project environment, that script writes the processed gameplay asset to `data/processed/harvard_oxford_slice_atlas.json`.

### Export a shareable web build

```bash
npm run export:web
```

This writes a static site to `dist/`. You can deploy that folder to any static host and then open the site on iPhone, Android, or desktop.

To preview that static build locally after exporting:

```bash
npm run serve:web
```

### Deploy to GitHub Pages

This repo now includes a Pages workflow at `.github/workflows/deploy-pages.yml`.

After you push the repo to GitHub:

1. Open the repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to `main` or `master`, or run the workflow manually from the `Actions` tab.

The workflow automatically computes the correct Expo `baseUrl` for either:

- a user site like `<user>.github.io`
- a project site like `<user>.github.io/<repository>`

It then exports the static web app and deploys `dist/` to GitHub Pages.

### Native testing later

Expo Go is not the recommended long-term path for this project. Once the web-first workflow feels stable, the next step for native testing should be Expo development builds rather than depending on Expo Go compatibility.

## Atlas Strategy

The game should use a mixed atlas stack inside one shared gameplay coordinate system, not force one atlas to do every job.

Current phase:

1. Canonical app space now: `mni152`
   Keeps slices and future exported assets in one reference space.
2. Structural slice gameplay now: `harvard_oxford`
   Good first pass for cortical parcels and major deep structures on sagittal, coronal, and axial slices.
3. Functional cortex later: `hcp_mmp_1_0`
   Best home for visual, motor, somatosensory, language, and other cortical systems.
4. Higher-detail structural layers later: `freesurfer_destrieux`, `freesurfer_aseg`, and selected `ebrains_julich`
   Better fit for sulci, gyri, and selected small but functionally important nuclei.

## Planned Content Scope

The next content pass should stay focused on big, cognition-relevant anatomy:

- Structural surface
  Frontal, parietal, temporal, occipital, insular, and medial limbic cortex; longitudinal fissure; lateral, central, parieto-occipital, and calcarine landmarks first.
- Limbic, diencephalon, and endocrine
  Hippocampus, amygdala, fornix, thalamus, hypothalamus, pituitary, pineal, ventricles, and corpus callosum.
- Basal ganglia and nearby deep anatomy
  Caudate, putamen, globus pallidus, nucleus accumbens, plus selected midbrain structures such as substantia nigra.
- Brainstem and cerebellum
  Brainstem as a whole, then midbrain, pons, medulla oblongata, and cerebellum.
- Functional cortex
  Primary motor, primary somatosensory, V1, V2, primary auditory cortex, Broca's area, and Wernicke's area first.

Some labels should be treated as teaching groupings rather than pretending they are single atlas-native parcels. Examples include `diencephalon`, `limbic cortex`, and classic classroom regions like `Broca's area` and `Wernicke's area`.

## Gameplay Backlog

Planned features for later implementation:

- Distance-based pin scoring
  In pin mode, score guesses by distance from the true region or overlap with the target region instead of using only a nearest-region match.
- Richer region fact prompts
  Expand the new summary system into fuller facts, anatomical relationships, and post-answer teaching callouts.
- Prompt mode toggle
  Let players choose between classic region-name prompts and function-based prompts such as language, motor, sensory, or visual roles.
- Structured region metadata
  Continue filling the shared region catalog so the same anatomy can support structure mode, function mode, and later clinical-correlation mode.
- Atlas fidelity upgrade
  Extend the now-working free surface atlas approach into deeper structures and more specific atlas-derived boundaries.
- Advanced structural layers
  Add harder layers for sulci, gyri, selected thalamic nuclei, and later somatotopic or retinotopic subregions once the core anatomy is solid.

## Reproducibility

- Reusable logic lives in `src/`
- Notebook work should remain exploratory only
- If Python dependencies change, refresh the minimal spec:

```bash
conda env export --from-history > environment.yml
```

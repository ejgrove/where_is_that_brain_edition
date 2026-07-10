from __future__ import annotations

import json
from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Callable

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PATH = ROOT / "data" / "processed" / "freesurfer_surface_atlas.json"
TARGET_WIDTH = 360.0
TARGET_HEIGHT = 240.0
PADDING = 14.0


@dataclass(frozen=True)
class RegionSpec:
    id: str
    label: str
    color: str
    summary: str
    members: tuple[str, ...]


@dataclass(frozen=True)
class LayerSpec:
    id: str
    name: str
    description: str
    difficulty: str
    default_view_id: str
    available_view_ids: tuple[str, ...]
    regions: tuple[RegionSpec, ...]


@dataclass(frozen=True)
class ViewSpec:
    id: str
    caption: str
    hemispheres: tuple[str, ...]
    project: Callable[[np.ndarray], np.ndarray]
    view_vector: np.ndarray


LOBE_LAYER = LayerSpec(
    id="cortical_lobes",
    name="Cortical Lobes",
    description="Atlas-backed cortical lobes on a free fsaverage surface, using lateral, superior, and inferior study views.",
    difficulty="Foundational",
    default_view_id="leftLateral",
    available_view_ids=("leftLateral", "rightLateral", "superior", "inferior"),
    regions=(
        RegionSpec(
            id="frontal_lobe",
            label="Frontal Lobe",
            color="#d8763d",
            summary="Anterior cortex central to executive control, planning, voluntary movement, and speech production.",
            members=(
                "G_and_S_frontomargin",
                "G_and_S_transv_frontopol",
                "G_front_inf-Opercular",
                "G_front_inf-Orbital",
                "G_front_inf-Triangul",
                "G_front_middle",
                "G_front_sup",
                "G_orbital",
                "G_precentral",
                "G_rectus",
                "G_and_S_subcentral",
                "S_front_inf",
                "S_front_middle",
                "S_front_sup",
                "S_orbital_lateral",
                "S_orbital_med-olfact",
                "S_orbital-H_Shaped",
                "S_precentral-inf-part",
                "S_precentral-sup-part",
                "S_suborbital",
            ),
        ),
        RegionSpec(
            id="parietal_lobe",
            label="Parietal Lobe",
            color="#5d9ec0",
            summary="Dorsal posterior cortex for somatosensation, spatial attention, and sensorimotor integration.",
            members=(
                "G_and_S_paracentral",
                "G_pariet_inf-Angular",
                "G_pariet_inf-Supramar",
                "G_parietal_sup",
                "G_postcentral",
                "G_precuneus",
                "S_intrapariet_and_P_trans",
                "S_postcentral",
                "S_subparietal",
            ),
        ),
        RegionSpec(
            id="temporal_lobe",
            label="Temporal Lobe",
            color="#4d9c72",
            summary="Lateral and ventral cortex linked to hearing, language, memory, and object recognition.",
            members=(
                "G_oc-temp_lat-fusifor",
                "G_oc-temp_med-Parahip",
                "G_temp_sup-G_T_transv",
                "G_temp_sup-Lateral",
                "G_temp_sup-Plan_polar",
                "G_temp_sup-Plan_tempo",
                "G_temporal_inf",
                "G_temporal_middle",
                "Pole_temporal",
                "S_collat_transv_ant",
                "S_collat_transv_post",
                "S_oc-temp_lat",
                "S_temporal_inf",
                "S_temporal_sup",
                "S_temporal_transverse",
            ),
        ),
        RegionSpec(
            id="occipital_lobe",
            label="Occipital Lobe",
            color="#b68a3d",
            summary="Posterior cortex specialized for visual processing from early visual cortex to extrastriate regions.",
            members=(
                "G_and_S_occipital_inf",
                "G_cuneus",
                "G_occipital_middle",
                "G_occipital_sup",
                "G_oc-temp_med-Lingual",
                "Pole_occipital",
                "S_calcarine",
                "S_oc_middle_and_Lunatus",
                "S_oc_sup_and_transversal",
                "S_occipital_ant",
                "S_oc-temp_med_and_Lingual",
                "S_parieto_occipital",
            ),
        ),
    ),
)

LANDMARK_LAYER = LayerSpec(
    id="surface_landmarks",
    name="Surface Landmarks",
    description="Selected atlas-backed gyri and sulci. Some prompts are easiest from superior or inferior views, so switching views is part of the challenge.",
    difficulty="Advanced",
    default_view_id="leftLateral",
    available_view_ids=("leftLateral", "rightLateral", "superior", "inferior"),
    regions=(
        RegionSpec(
            id="superior_frontal_gyrus",
            label="Superior Frontal Gyrus",
            color="#d97947",
            summary="Dorsal frontal gyrus contributing to higher-order control and motor planning.",
            members=("G_front_sup",),
        ),
        RegionSpec(
            id="middle_frontal_gyrus",
            label="Middle Frontal Gyrus",
            color="#df9059",
            summary="Lateral frontal cortex strongly associated with working memory and cognitive control.",
            members=("G_front_middle",),
        ),
        RegionSpec(
            id="inferior_frontal_gyrus",
            label="Inferior Frontal Gyrus",
            color="#e7a16d",
            summary="Inferior frontal cortex that includes classic language-related cortex in the dominant hemisphere.",
            members=("G_front_inf-Opercular", "G_front_inf-Orbital", "G_front_inf-Triangul"),
        ),
        RegionSpec(
            id="precentral_gyrus",
            label="Precentral Gyrus",
            color="#d45e55",
            summary="Primary motor strip just anterior to the central sulcus.",
            members=("G_precentral",),
        ),
        RegionSpec(
            id="postcentral_gyrus",
            label="Postcentral Gyrus",
            color="#4e9bb3",
            summary="Primary somatosensory strip just posterior to the central sulcus.",
            members=("G_postcentral",),
        ),
        RegionSpec(
            id="superior_parietal_lobule",
            label="Superior Parietal Lobule",
            color="#4f8db9",
            summary="Dorsal parietal cortex for visuospatial and sensorimotor integration.",
            members=("G_parietal_sup",),
        ),
        RegionSpec(
            id="supramarginal_gyrus",
            label="Supramarginal Gyrus",
            color="#68a7cb",
            summary="Inferior parietal gyrus involved in phonology, praxis, and multimodal integration.",
            members=("G_pariet_inf-Supramar",),
        ),
        RegionSpec(
            id="angular_gyrus",
            label="Angular Gyrus",
            color="#7bb8d6",
            summary="Posterior inferior parietal gyrus associated with language, semantic processing, and default-mode cognition.",
            members=("G_pariet_inf-Angular",),
        ),
        RegionSpec(
            id="superior_temporal_gyrus",
            label="Superior Temporal Gyrus",
            color="#4da06c",
            summary="Upper temporal cortex important for auditory and speech-related processing.",
            members=(
                "G_temp_sup-G_T_transv",
                "G_temp_sup-Lateral",
                "G_temp_sup-Plan_polar",
                "G_temp_sup-Plan_tempo",
            ),
        ),
        RegionSpec(
            id="middle_temporal_gyrus",
            label="Middle Temporal Gyrus",
            color="#67b380",
            summary="Temporal association cortex involved in semantic and visual processing.",
            members=("G_temporal_middle",),
        ),
        RegionSpec(
            id="inferior_temporal_gyrus",
            label="Inferior Temporal Gyrus",
            color="#83c496",
            summary="Ventral temporal cortex important for higher-level visual object recognition.",
            members=("G_temporal_inf",),
        ),
        RegionSpec(
            id="fusiform_gyrus",
            label="Fusiform Gyrus",
            color="#6e9a7b",
            summary="Ventral temporal region linked to high-level visual recognition such as faces and words.",
            members=("G_oc-temp_lat-fusifor",),
        ),
        RegionSpec(
            id="parahippocampal_gyrus",
            label="Parahippocampal Gyrus",
            color="#8bb28a",
            summary="Medial ventral temporal cortex associated with memory and scene processing.",
            members=("G_oc-temp_med-Parahip",),
        ),
        RegionSpec(
            id="lateral_occipital_cortex",
            label="Lateral Occipital Cortex",
            color="#b58c42",
            summary="Lateral occipital surface that supports higher-order visual analysis.",
            members=("G_and_S_occipital_inf", "G_occipital_middle", "G_occipital_sup", "Pole_occipital"),
        ),
        RegionSpec(
            id="cuneus",
            label="Cuneus",
            color="#c4a05b",
            summary="Dorsomedial occipital cortex adjacent to early visual cortex.",
            members=("G_cuneus",),
        ),
        RegionSpec(
            id="lingual_gyrus",
            label="Lingual Gyrus",
            color="#d1b171",
            summary="Medial ventral occipital cortex associated with visual processing and reading-related functions.",
            members=("G_oc-temp_med-Lingual",),
        ),
        RegionSpec(
            id="insula",
            label="Insular Cortex",
            color="#9f7fc1",
            summary="Deep cortex associated with interoception, salience, affect, and taste.",
            members=("G_Ins_lg_and_S_cent_ins", "G_insular_short"),
        ),
        RegionSpec(
            id="central_sulcus",
            label="Central Sulcus",
            color="#205d7b",
            summary="Major sulcus separating frontal motor cortex from parietal somatosensory cortex.",
            members=("S_central",),
        ),
        RegionSpec(
            id="precentral_sulcus",
            label="Precentral Sulcus",
            color="#42768f",
            summary="Sulcus just anterior to the precentral gyrus.",
            members=("S_precentral-inf-part", "S_precentral-sup-part"),
        ),
        RegionSpec(
            id="postcentral_sulcus",
            label="Postcentral Sulcus",
            color="#5f8ca2",
            summary="Sulcus just posterior to the postcentral gyrus.",
            members=("S_postcentral",),
        ),
        RegionSpec(
            id="lateral_sulcus",
            label="Lateral Sulcus",
            color="#755f7b",
            summary="Sylvian fissure separating temporal cortex from frontal and parietal cortex.",
            members=("Lat_Fis-ant-Horizont", "Lat_Fis-ant-Vertical", "Lat_Fis-post"),
        ),
        RegionSpec(
            id="superior_frontal_sulcus",
            label="Superior Frontal Sulcus",
            color="#b48e95",
            summary="Frontal sulcus bordering the superior frontal gyrus.",
            members=("S_front_sup",),
        ),
        RegionSpec(
            id="middle_frontal_sulcus",
            label="Middle Frontal Sulcus",
            color="#c39ea2",
            summary="Frontal sulcus on the lateral convexity between middle frontal territories.",
            members=("S_front_middle",),
        ),
        RegionSpec(
            id="inferior_frontal_sulcus",
            label="Inferior Frontal Sulcus",
            color="#d0b0b2",
            summary="Inferior frontal sulcus near the classic inferior frontal language-related cortex.",
            members=("S_front_inf",),
        ),
        RegionSpec(
            id="intraparietal_sulcus",
            label="Intraparietal Sulcus",
            color="#3b6f9f",
            summary="Dorsal parietal sulcus involved in visuospatial attention and eye-hand coordination.",
            members=("S_intrapariet_and_P_trans",),
        ),
        RegionSpec(
            id="superior_temporal_sulcus",
            label="Superior Temporal Sulcus",
            color="#3b7e62",
            summary="Temporal sulcus important in social perception, multisensory integration, and language processing.",
            members=("S_temporal_sup",),
        ),
        RegionSpec(
            id="inferior_temporal_sulcus",
            label="Inferior Temporal Sulcus",
            color="#5f9677",
            summary="Ventral temporal sulcus bordering visual association cortex.",
            members=("S_temporal_inf",),
        ),
    ),
)

VIEWS: tuple[ViewSpec, ...] = (
    ViewSpec(
        id="leftLateral",
        caption="Free Destrieux atlas · left lateral inflated surface",
        hemispheres=("left",),
        project=lambda coords: np.column_stack((-coords[:, 1], -coords[:, 2])),
        view_vector=np.array([-1.0, 0.0, 0.0]),
    ),
    ViewSpec(
        id="rightLateral",
        caption="Free Destrieux atlas · right lateral inflated surface",
        hemispheres=("right",),
        project=lambda coords: np.column_stack((-coords[:, 1], -coords[:, 2])),
        view_vector=np.array([1.0, 0.0, 0.0]),
    ),
    ViewSpec(
        id="superior",
        caption="Free Destrieux atlas · superior inflated surface",
        hemispheres=("left", "right"),
        project=lambda coords: np.column_stack((coords[:, 0], -coords[:, 1])),
        view_vector=np.array([0.0, 0.0, 1.0]),
    ),
    ViewSpec(
        id="inferior",
        caption="Free Destrieux atlas · inferior inflated surface",
        hemispheres=("left", "right"),
        project=lambda coords: np.column_stack((coords[:, 0], -coords[:, 1])),
        view_vector=np.array([0.0, 0.0, -1.0]),
    ),
)


def main() -> None:
    try:
        from nilearn import surface
        from nilearn.datasets import fetch_atlas_surf_destrieux, fetch_surf_fsaverage
    except ImportError:
        write_placeholder(
            status="missing_dependency",
            notes=[
                "Install the project conda environment before building the free surface atlas.",
                "Expected command: conda env create -p ./.conda-env -f environment.yml",
            ],
        )
        return

    atlas = fetch_atlas_surf_destrieux(verbose=0)
    fsaverage = fetch_surf_fsaverage(mesh="fsaverage5")
    label_names = [str(label) for label in atlas["labels"]]

    hemis = {
        "left": {
            "coords": surface.load_surf_mesh(fsaverage["infl_left"])[0],
            "faces": surface.load_surf_mesh(fsaverage["infl_left"])[1],
            "labels": np.asarray(atlas["map_left"], dtype=np.int32),
        },
        "right": {
            "coords": surface.load_surf_mesh(fsaverage["infl_right"])[0],
            "faces": surface.load_surf_mesh(fsaverage["infl_right"])[1],
            "labels": np.asarray(atlas["map_right"], dtype=np.int32),
        },
    }

    view_overrides: dict[str, dict[str, str]] = {}
    prepared_views: dict[str, dict[str, dict[str, np.ndarray]]] = {}

    for view in VIEWS:
        prepared = prepare_view(hemis=hemis, view=view)
        prepared_views[view.id] = prepared
        outline_path = build_outline_path(prepared)
        view_overrides[view.id] = {
            "outlinePath": outline_path,
            "caption": view.caption,
        }

    layers = [
        build_layer_record(
            layer_spec=LOBE_LAYER,
            label_names=label_names,
            prepared_views=prepared_views,
            atlas_candidates=["freesurfer_destrieux", "nilearn_destrieux_fsaverage5"],
        ),
        build_layer_record(
            layer_spec=LANDMARK_LAYER,
            label_names=label_names,
            prepared_views=prepared_views,
            atlas_candidates=["freesurfer_destrieux", "nilearn_destrieux_fsaverage5"],
        ),
    ]

    dataset = {
        "status": "ready",
        "atlasSource": "nilearn_destrieux_fsaverage5",
        "viewOverrides": view_overrides,
        "layers": layers,
        "notes": [
            "Generated from Nilearn's free fsaverage5 surface and Destrieux sulco-gyral atlas.",
            "This first surface pass focuses on outer cortical anatomy; medial and slice-based landmarks should still be taught in sagittal/coronal/axial layers.",
        ],
        "generatedAt": datetime.now(UTC).isoformat(),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(dataset, indent=2))


def prepare_view(hemis: dict[str, dict[str, np.ndarray]], view: ViewSpec) -> dict[str, dict[str, np.ndarray]]:
    prepared: dict[str, dict[str, np.ndarray]] = {}
    raw_points: list[np.ndarray] = []

    for hemi_name in view.hemispheres:
        hemi = hemis[hemi_name]
        coords = hemi["coords"]
        faces = hemi["faces"]
        projected = view.project(coords)
        visible_mask = select_visible_faces(coords=coords, faces=faces, view_vector=view.view_vector)
        visible_faces = faces[visible_mask]

        prepared[hemi_name] = {
            "projected": projected,
            "faces": faces,
            "visible_faces": visible_faces,
            "labels": hemi["labels"],
        }
        raw_points.append(projected[np.unique(visible_faces.reshape(-1))])

    transform = build_view_transform(np.vstack(raw_points))

    for hemi_name, hemi_data in prepared.items():
        hemi_data["projected_transformed"] = transform(hemi_data["projected"])

    return prepared


def build_layer_record(
    layer_spec: LayerSpec,
    label_names: list[str],
    prepared_views: dict[str, dict[str, dict[str, np.ndarray]]],
    atlas_candidates: list[str],
) -> dict[str, object]:
    regions = []

    for region in layer_spec.regions:
        rendering_map: dict[str, dict[str, object]] = {}
        member_indices = [label_names.index(name) for name in region.members if name in label_names]
        if not member_indices:
            continue

        for view in VIEWS:
            path, centroid = build_region_rendering(
                member_indices=member_indices,
                prepared=prepared_views[view.id],
            )
            if not path or centroid is None:
                continue

            rendering_map[view.id] = {
                "path": path,
                "centroid": {"x": round(float(centroid[0]), 1), "y": round(float(centroid[1]), 1)},
            }

        if not rendering_map:
            continue

        regions.append(
            {
                "id": region.id,
                "label": region.label,
                "color": region.color,
                "teachingSummary": region.summary,
                "atlasCandidates": atlas_candidates,
                "renderings": rendering_map,
            }
        )

    return {
        "id": layer_spec.id,
        "name": layer_spec.name,
        "description": layer_spec.description,
        "difficulty": layer_spec.difficulty,
        "defaultViewId": layer_spec.default_view_id,
        "availableViewIds": list(layer_spec.available_view_ids),
        "regions": regions,
    }


def select_visible_faces(coords: np.ndarray, faces: np.ndarray, view_vector: np.ndarray) -> np.ndarray:
    triangles = coords[faces]
    normals = np.cross(triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0])
    alignments = normals @ view_vector
    visible = alignments > 0

    if visible.mean() < 0.2 or visible.mean() > 0.8:
        visible = alignments < 0

    return visible


def build_view_transform(points: np.ndarray) -> Callable[[np.ndarray], np.ndarray]:
    min_xy = points.min(axis=0)
    max_xy = points.max(axis=0)
    span = np.maximum(max_xy - min_xy, 1e-6)
    usable_width = TARGET_WIDTH - (PADDING * 2)
    usable_height = TARGET_HEIGHT - (PADDING * 2)
    scale = min(usable_width / span[0], usable_height / span[1])
    scaled_size = span * scale
    offset = np.array(
        [
            PADDING + (usable_width - scaled_size[0]) / 2.0,
            PADDING + (usable_height - scaled_size[1]) / 2.0,
        ]
    )

    def transform(projected: np.ndarray) -> np.ndarray:
        return ((projected - min_xy) * scale) + offset

    return transform


def build_outline_path(prepared: dict[str, dict[str, np.ndarray]]) -> str:
    path_parts: list[str] = []

    for hemi in prepared.values():
        loops = trace_boundary_loops(hemi["visible_faces"])
        for loop in loops:
            points = hemi["projected_transformed"][loop]
            points = simplify_loop(points)
            if polygon_area(points) < 12:
                continue
            path_parts.append(points_to_path(points))

    return " ".join(path_parts)


def build_region_rendering(
    member_indices: list[int],
    prepared: dict[str, dict[str, np.ndarray]],
) -> tuple[str | None, np.ndarray | None]:
    path_parts: list[str] = []
    centroid_points: list[np.ndarray] = []

    for hemi in prepared.values():
        face_labels = hemi["labels"][hemi["visible_faces"]]
        in_region = np.isin(face_labels, member_indices)
        region_faces = hemi["visible_faces"][in_region.sum(axis=1) >= 2]
        if region_faces.size == 0:
            continue

        loops = trace_boundary_loops(region_faces)
        for loop in loops:
            points = hemi["projected_transformed"][loop]
            points = simplify_loop(points)
            if polygon_area(points) < 8:
                continue
            path_parts.append(points_to_path(points))

        centroid_points.append(hemi["projected_transformed"][np.unique(region_faces.reshape(-1))].mean(axis=0))

    if not path_parts or not centroid_points:
        return None, None

    centroid = np.vstack(centroid_points).mean(axis=0)
    return " ".join(path_parts), centroid


def trace_boundary_loops(faces: np.ndarray) -> list[np.ndarray]:
    if faces.size == 0:
        return []

    edges = np.concatenate((faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]), axis=0)
    edges = np.sort(edges, axis=1)
    unique_edges, counts = np.unique(edges, axis=0, return_counts=True)
    boundary_edges = unique_edges[counts == 1]

    adjacency: dict[int, list[int]] = defaultdict(list)
    remaining_edges: set[tuple[int, int]] = set()

    for edge in boundary_edges:
        left, right = int(edge[0]), int(edge[1])
        adjacency[left].append(right)
        adjacency[right].append(left)
        remaining_edges.add((min(left, right), max(left, right)))

    loops: list[np.ndarray] = []
    while remaining_edges:
        start_left, start_right = next(iter(remaining_edges))
        loop = [start_left, start_right]
        remaining_edges.remove((start_left, start_right))
        previous = start_left
        current = start_right

        while True:
            neighbors = adjacency[current]
            candidate = next(
                (
                    neighbor
                    for neighbor in neighbors
                    if neighbor != previous and (min(current, neighbor), max(current, neighbor)) in remaining_edges
                ),
                None,
            )

            if candidate is None:
                break

            loop.append(candidate)
            remaining_edges.remove((min(current, candidate), max(current, candidate)))
            previous, current = current, candidate

            if current == loop[0]:
                break

        if len(loop) >= 4 and loop[0] == loop[-1]:
            loop = loop[:-1]

        if len(loop) >= 3:
            loops.append(np.asarray(loop, dtype=np.int32))

    return loops


def simplify_loop(points: np.ndarray, epsilon: float = 1.15) -> np.ndarray:
    if len(points) < 4:
        return points

    simplified = ramer_douglas_peucker(points, epsilon)
    return simplified if len(simplified) >= 3 else points


def ramer_douglas_peucker(points: np.ndarray, epsilon: float) -> np.ndarray:
    if len(points) < 3:
        return points

    start = points[0]
    end = points[-1]
    line = end - start
    line_length = np.linalg.norm(line)

    if line_length == 0:
        distances = np.linalg.norm(points - start, axis=1)
    else:
        deltas = points - start
        distances = np.abs((line[0] * deltas[:, 1]) - (line[1] * deltas[:, 0])) / line_length

    index = int(np.argmax(distances))
    max_distance = float(distances[index])

    if max_distance <= epsilon:
        return np.vstack((start, end))

    left = ramer_douglas_peucker(points[: index + 1], epsilon)
    right = ramer_douglas_peucker(points[index:], epsilon)
    return np.vstack((left[:-1], right))


def polygon_area(points: np.ndarray) -> float:
    if len(points) < 3:
        return 0.0

    x = points[:, 0]
    y = points[:, 1]
    return abs(float(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1))) / 2.0)


def points_to_path(points: np.ndarray) -> str:
    formatted = [f"{round(float(point[0]), 1)} {round(float(point[1]), 1)}" for point in points]
    return f"M {formatted[0]} L " + " L ".join(formatted[1:]) + " Z"


def write_placeholder(status: str, notes: list[str]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    dataset = {
        "status": status,
        "atlasSource": "freesurfer_surface_atlas",
        "viewOverrides": {},
        "layers": [],
        "notes": notes,
    }
    OUTPUT_PATH.write_text(json.dumps(dataset, indent=2))


if __name__ == "__main__":
    main()

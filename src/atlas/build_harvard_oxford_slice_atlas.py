from __future__ import annotations

import json
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import nibabel as nib
import numpy as np
from nibabel.processing import resample_from_to
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PATH = ROOT / "data" / "processed" / "harvard_oxford_slice_atlas.json"
ATLAS_ROOT = ROOT / "data" / "raw" / "nilearn" / "fsl" / "data" / "atlases"
MNI_TEMPLATE_PATH = (
    ROOT
    / ".conda-env"
    / "lib"
    / "python3.12"
    / "site-packages"
    / "nilearn"
    / "datasets"
    / "data"
    / "mni_icbm152_t1_tal_nlin_sym_09a_converted.nii.gz"
)


@dataclass(frozen=True)
class RegionSpec:
    id: str
    label: str
    color: str
    source: str
    members: tuple[str, ...]


REGION_SPECS = (
    RegionSpec(
        id="frontal_pole",
        label="Frontal Pole",
        color="#d97946",
        source="cortical",
        members=("Frontal Pole",),
    ),
    RegionSpec(
        id="superior_frontal_gyrus",
        label="Superior Frontal Gyrus",
        color="#d78d4f",
        source="cortical",
        members=("Superior Frontal Gyrus",),
    ),
    RegionSpec(
        id="middle_frontal_gyrus",
        label="Middle Frontal Gyrus",
        color="#c9603d",
        source="cortical",
        members=("Middle Frontal Gyrus",),
    ),
    RegionSpec(
        id="inferior_frontal_gyrus",
        label="Inferior Frontal Gyrus",
        color="#bf4f47",
        source="cortical",
        members=(
            "Inferior Frontal Gyrus, pars triangularis",
            "Inferior Frontal Gyrus, pars opercularis",
        ),
    ),
    RegionSpec(
        id="precentral_gyrus",
        label="Precentral Gyrus",
        color="#dbb34f",
        source="cortical",
        members=("Precentral Gyrus",),
    ),
    RegionSpec(
        id="frontal_medial_cortex",
        label="Medial Frontal Cortex",
        color="#d59f6d",
        source="cortical",
        members=(
            "Frontal Medial Cortex",
            "Juxtapositional Lobule Cortex (formerly Supplementary Motor Cortex)",
            "Frontal Orbital Cortex",
        ),
    ),
    RegionSpec(
        id="insula",
        label="Insular Cortex",
        color="#7a86cc",
        source="cortical",
        members=("Insular Cortex",),
    ),
    RegionSpec(
        id="anterior_cingulate_gyrus",
        label="Anterior Cingulate Gyrus",
        color="#cf5970",
        source="cortical",
        members=(
            "Paracingulate Gyrus",
            "Cingulate Gyrus, anterior division",
            "Subcallosal Cortex",
        ),
    ),
    RegionSpec(
        id="posterior_cingulate_gyrus",
        label="Posterior Cingulate Gyrus",
        color="#9565b0",
        source="cortical",
        members=("Cingulate Gyrus, posterior division",),
    ),
    RegionSpec(
        id="postcentral_gyrus",
        label="Postcentral Gyrus",
        color="#67a6c4",
        source="cortical",
        members=("Postcentral Gyrus",),
    ),
    RegionSpec(
        id="superior_parietal_lobule",
        label="Superior Parietal Lobule",
        color="#4d90c0",
        source="cortical",
        members=("Superior Parietal Lobule",),
    ),
    RegionSpec(
        id="supramarginal_gyrus",
        label="Supramarginal Gyrus",
        color="#5ea6b0",
        source="cortical",
        members=(
            "Supramarginal Gyrus, anterior division",
            "Supramarginal Gyrus, posterior division",
        ),
    ),
    RegionSpec(
        id="angular_gyrus",
        label="Angular Gyrus",
        color="#68b4aa",
        source="cortical",
        members=("Angular Gyrus",),
    ),
    RegionSpec(
        id="precuneus",
        label="Precuneus",
        color="#4f9bb2",
        source="cortical",
        members=("Precuneous Cortex",),
    ),
    RegionSpec(
        id="temporal_pole",
        label="Temporal Pole",
        color="#4a9b71",
        source="cortical",
        members=("Temporal Pole",),
    ),
    RegionSpec(
        id="superior_temporal_gyrus",
        label="Superior Temporal Gyrus",
        color="#4ea868",
        source="cortical",
        members=(
            "Superior Temporal Gyrus, anterior division",
            "Superior Temporal Gyrus, posterior division",
        ),
    ),
    RegionSpec(
        id="middle_temporal_gyrus",
        label="Middle Temporal Gyrus",
        color="#43a17a",
        source="cortical",
        members=(
            "Middle Temporal Gyrus, anterior division",
            "Middle Temporal Gyrus, posterior division",
            "Middle Temporal Gyrus, temporooccipital part",
        ),
    ),
    RegionSpec(
        id="inferior_temporal_gyrus",
        label="Inferior Temporal Gyrus",
        color="#4f9b88",
        source="cortical",
        members=(
            "Inferior Temporal Gyrus, anterior division",
            "Inferior Temporal Gyrus, posterior division",
            "Inferior Temporal Gyrus, temporooccipital part",
        ),
    ),
    RegionSpec(
        id="heschls_gyrus",
        label="Heschl's Gyrus",
        color="#9dbe62",
        source="cortical",
        members=("Heschl's Gyrus (includes H1 and H2)",),
    ),
    RegionSpec(
        id="planum_temporale",
        label="Planum Temporale",
        color="#86b85b",
        source="cortical",
        members=("Planum Temporale",),
    ),
    RegionSpec(
        id="parahippocampal_gyrus",
        label="Parahippocampal Gyrus",
        color="#79a65d",
        source="cortical",
        members=(
            "Parahippocampal Gyrus, anterior division",
            "Parahippocampal Gyrus, posterior division",
        ),
    ),
    RegionSpec(
        id="fusiform_gyrus",
        label="Fusiform Gyrus",
        color="#c79f55",
        source="cortical",
        members=(
            "Temporal Fusiform Cortex, anterior division",
            "Temporal Fusiform Cortex, posterior division",
            "Temporal Occipital Fusiform Cortex",
            "Occipital Fusiform Gyrus",
        ),
    ),
    RegionSpec(
        id="lateral_occipital_cortex",
        label="Lateral Occipital Cortex",
        color="#b99048",
        source="cortical",
        members=(
            "Lateral Occipital Cortex, superior division",
            "Lateral Occipital Cortex, inferior division",
            "Supracalcarine Cortex",
            "Occipital Pole",
        ),
    ),
    RegionSpec(
        id="cuneus",
        label="Cuneus",
        color="#beae55",
        source="cortical",
        members=("Cuneal Cortex",),
    ),
    RegionSpec(
        id="intracalcarine_cortex",
        label="Intracalcarine Cortex",
        color="#8d94d7",
        source="cortical",
        members=("Intracalcarine Cortex",),
    ),
    RegionSpec(
        id="lingual_gyrus",
        label="Lingual Gyrus",
        color="#8578cb",
        source="cortical",
        members=("Lingual Gyrus",),
    ),
    RegionSpec(
        id="lateral_ventricle",
        label="Lateral Ventricle",
        color="#8aa9d8",
        source="subcortical",
        members=("Left Lateral Ventrical", "Right Lateral Ventricle"),
    ),
    RegionSpec(
        id="thalamus",
        label="Thalamus",
        color="#5ca28f",
        source="subcortical",
        members=("Left Thalamus", "Right Thalamus"),
    ),
    RegionSpec(
        id="caudate",
        label="Caudate",
        color="#d8a14a",
        source="subcortical",
        members=("Left Caudate", "Right Caudate"),
    ),
    RegionSpec(
        id="putamen",
        label="Putamen",
        color="#d47f4c",
        source="subcortical",
        members=("Left Putamen", "Right Putamen"),
    ),
    RegionSpec(
        id="globus_pallidus",
        label="Globus Pallidus",
        color="#c35e59",
        source="subcortical",
        members=("Left Pallidum", "Right Pallidum"),
    ),
    RegionSpec(
        id="nucleus_accumbens",
        label="Nucleus Accumbens",
        color="#d58c86",
        source="subcortical",
        members=("Left Accumbens", "Right Accumbens"),
    ),
    RegionSpec(
        id="amygdala",
        label="Amygdala",
        color="#ca5a61",
        source="subcortical",
        members=("Left Amygdala", "Right Amygdala"),
    ),
    RegionSpec(
        id="hippocampus",
        label="Hippocampus",
        color="#6488c3",
        source="subcortical",
        members=("Left Hippocampus", "Right Hippocampus"),
    ),
    RegionSpec(
        id="brainstem",
        label="Brainstem",
        color="#5a9183",
        source="subcortical",
        members=("Brain-Stem",),
    ),
)


def main() -> None:
    cortical_group_img = nib.load(
        ATLAS_ROOT / "HarvardOxford" / "HarvardOxford-cort-maxprob-thr25-1mm.nii.gz"
    )
    subcortical_group_img = nib.load(
        ATLAS_ROOT / "HarvardOxford" / "HarvardOxford-sub-maxprob-thr25-1mm.nii.gz"
    )
    cortical_detail_img = nib.load(
        ATLAS_ROOT / "HarvardOxford" / "HarvardOxford-cort-maxprob-thr0-1mm.nii.gz"
    )
    subcortical_detail_img = nib.load(
        ATLAS_ROOT / "HarvardOxford" / "HarvardOxford-sub-maxprob-thr0-1mm.nii.gz"
    )
    template_img = nib.load(MNI_TEMPLATE_PATH)

    cortical_labels = parse_label_values(ATLAS_ROOT / "HarvardOxford-Cortical.xml")
    subcortical_labels = parse_label_values(ATLAS_ROOT / "HarvardOxford-Subcortical.xml")

    cortical_group_data = np.asarray(cortical_group_img.get_fdata(), dtype=np.int16)
    subcortical_group_data = np.asarray(subcortical_group_img.get_fdata(), dtype=np.int16)
    cortical_detail_data = np.asarray(cortical_detail_img.get_fdata(), dtype=np.int16)
    subcortical_detail_data = np.asarray(subcortical_detail_img.get_fdata(), dtype=np.int16)
    if cortical_group_data.shape != subcortical_group_data.shape:
        raise RuntimeError(
            f"Grouped atlas shapes do not match: {cortical_group_data.shape} vs {subcortical_group_data.shape}"
        )
    if cortical_group_data.shape != cortical_detail_data.shape:
        raise RuntimeError(
            f"Cortical grouped/detail atlas shapes do not match: {cortical_group_data.shape} vs {cortical_detail_data.shape}"
        )
    if subcortical_group_data.shape != subcortical_detail_data.shape:
        raise RuntimeError(
            f"Subcortical grouped/detail atlas shapes do not match: {subcortical_group_data.shape} vs {subcortical_detail_data.shape}"
        )

    template_resampled = resample_from_to(template_img, cortical_group_img, order=1)
    template_data = np.asarray(template_resampled.get_fdata(), dtype=np.float32)
    brain_mask = template_data > 60
    brain_mask = ndimage.binary_closing(brain_mask, structure=np.ones((2, 2, 2), dtype=bool))
    tissue_volume = build_tissue_volume(template_data, brain_mask)

    grouped_volume = np.zeros(cortical_group_data.shape, dtype=np.uint8)
    detail_volume = np.zeros(cortical_group_data.shape, dtype=np.uint8)
    region_value_by_id: dict[str, int] = {}
    region_source_by_value: dict[int, str] = {}
    region_centroids: dict[str, list[int]] = {}
    regions_payload: list[dict[str, object]] = []

    source_map = {
        "cortical": (cortical_group_data, cortical_labels),
        "subcortical": (subcortical_group_data, subcortical_labels),
    }

    cortical_detail_mask = cortical_detail_data > 0
    detail_volume[cortical_detail_mask] = cortical_detail_data[cortical_detail_mask].astype(
        np.uint8
    )

    subcortical_detail_mask = subcortical_detail_data > 0
    detail_volume[subcortical_detail_mask] = (
        subcortical_detail_data[subcortical_detail_mask] + 100
    ).astype(np.uint8)

    for value, region in enumerate(REGION_SPECS, start=1):
        source_data, source_labels = source_map[region.source]
        source_values = [source_labels[name] for name in region.members]
        mask = np.isin(source_data, source_values)
        overlap = grouped_volume[mask] > 0
        if overlap.any():
            overlapping_values = sorted({int(item) for item in grouped_volume[mask][overlap]})
            overlapping_sources = {region_source_by_value[value] for value in overlapping_values}
            if overlapping_sources != {"cortical"} or region.source != "subcortical":
                raise RuntimeError(
                    f"Region {region.id} overlaps existing regions with grouped values {overlapping_values}"
                )
        grouped_volume[mask] = value
        region_value_by_id[region.id] = value
        region_source_by_value[value] = region.source
        region_centroids[region.id] = compute_centroid(mask)
        regions_payload.append(
            {
                "id": region.id,
                "label": region.label,
                "color": region.color,
            }
        )

    x_dim, y_dim, z_dim = grouped_volume.shape
    payload = {
        "status": "ready",
        "atlasSource": "harvard_oxford_slice_atlas",
        "generatedAt": datetime.now(UTC).isoformat(),
        "dimensions": [int(x_dim), int(y_dim), int(z_dim)],
        "defaultCoordinate": [int(x_dim // 2), int(y_dim // 2), int(z_dim // 2)],
        "layer": {
            "id": "structural_slices",
            "name": "Structural Slice Atlas",
            "description": "Atlas-backed sagittal, coronal, and axial slices for cortical parcels and deep cognition-relevant structures.",
            "difficulty": "Intermediate",
            "defaultViewId": "midSagittal",
            "availableViewIds": ["midSagittal", "coronal", "axial"],
            "regions": regions_payload,
        },
        "regionValueById": region_value_by_id,
        "regionCentroids": region_centroids,
        "brainMaskRle": run_length_encode(brain_mask.astype(np.uint8)),
        "tissueVolumeRle": run_length_encode(tissue_volume),
        "labelVolumeRle": run_length_encode(grouped_volume),
        "detailVolumeRle": run_length_encode(detail_volume),
        "notes": [
            "Built from Harvard-Oxford 1 mm atlases with conservative threshold-25 grouped masks for selection.",
            "Visible parcel boundaries come from the threshold-0 atlas so the MRI backdrop can stay detailed while scoring remains anatomically tighter.",
            "The slice backdrop uses quantized MNI tissue intensities so white matter, cortex, and dark fluid spaces read more clearly.",
        ],
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"Wrote {OUTPUT_PATH}")


def parse_label_values(path: Path) -> dict[str, int]:
    root = ET.parse(path).getroot()
    return {
        label.text.strip(): int(label.attrib["index"]) + 1
        for label in root.findall(".//label")
        if label.text
    }


def compute_centroid(mask: np.ndarray) -> list[int]:
    points = np.argwhere(mask)
    if points.size == 0:
        raise RuntimeError("Cannot compute centroid for an empty region")
    centroid = np.rint(points.mean(axis=0)).astype(int)
    return [int(value) for value in centroid.tolist()]


def build_tissue_volume(template_data: np.ndarray, brain_mask: np.ndarray) -> np.ndarray:
    tissue_volume = np.zeros(template_data.shape, dtype=np.uint8)
    tissue_samples = template_data[brain_mask]
    if tissue_samples.size == 0:
        return tissue_volume

    low, high = np.percentile(tissue_samples, [2, 98])
    if high <= low:
        high = low + 1

    normalized = np.clip((template_data - low) / (high - low), 0.0, 1.0)
    quantized = np.rint(normalized * 15).astype(np.uint8)
    tissue_volume[brain_mask] = (28 + quantized[brain_mask] * 14).astype(np.uint8)
    return tissue_volume


def run_length_encode(data: np.ndarray) -> list[list[int]]:
    flat = np.asarray(data, dtype=np.uint16).reshape(-1)
    if flat.size == 0:
        return []

    runs: list[list[int]] = []
    current_value = int(flat[0])
    count = 1

    for value in flat[1:]:
        int_value = int(value)
        if int_value == current_value:
            count += 1
            continue

        runs.append([count, current_value])
        current_value = int_value
        count = 1

    runs.append([count, current_value])
    return runs


if __name__ == "__main__":
    main()

import type { BrainRegion, BrainViewId, GameLayer } from '../types/game';
import { getHarvardOxfordSliceLayer } from './harvardOxfordSlice';
import { regionMetadataById } from './atlasPlan';

type BrainViewDefinition = {
  id: BrainViewId;
  label: string;
  shortLabel: string;
  caption: string;
  viewBox: string;
  outlinePath: string;
  mirrorX?: boolean;
};

function withRegionMetadata(regions: BrainRegion[]): BrainRegion[] {
  return regions.map((region) => ({
    ...region,
    ...regionMetadataById[region.id],
  }));
}

const surfaceRegions: BrainRegion[] = [
  {
    id: 'frontal_lobe',
    label: 'Frontal Lobe',
    color: '#e4863a',
    renderings: {
      leftLateral: {
        path: 'M58 135 C64 98 92 72 126 62 C146 56 164 60 176 74 C175 95 166 116 158 142 C134 156 108 164 80 167 C64 160 55 149 58 135 Z',
        centroid: { x: 118, y: 114 },
      },
      rightLateral: {
        path: 'M58 135 C64 98 92 72 126 62 C146 56 164 60 176 74 C175 95 166 116 158 142 C134 156 108 164 80 167 C64 160 55 149 58 135 Z',
        centroid: { x: 118, y: 114 },
        mirrorX: true,
      },
      superior: {
        path: 'M105 70 C131 58 159 56 180 56 C201 56 229 58 255 70 C257 87 248 101 231 113 C213 120 197 124 180 124 C163 124 147 120 129 113 C112 101 103 87 105 70 Z',
        centroid: { x: 180, y: 90 },
      },
      inferior: {
        path: 'M108 68 C133 57 157 54 180 54 C203 54 227 57 252 68 C254 86 244 100 226 109 C210 114 195 117 180 117 C165 117 150 114 134 109 C116 100 106 86 108 68 Z',
        centroid: { x: 180, y: 87 },
      },
    },
  },
  {
    id: 'parietal_lobe',
    label: 'Parietal Lobe',
    color: '#5da59a',
    renderings: {
      leftLateral: {
        path: 'M158 72 C190 55 225 57 257 72 C273 82 282 96 285 113 C264 118 245 126 225 138 C204 149 181 155 158 142 C166 117 173 96 158 72 Z',
        centroid: { x: 218, y: 102 },
      },
      rightLateral: {
        path: 'M158 72 C190 55 225 57 257 72 C273 82 282 96 285 113 C264 118 245 126 225 138 C204 149 181 155 158 142 C166 117 173 96 158 72 Z',
        centroid: { x: 218, y: 102 },
        mirrorX: true,
      },
      superior: {
        path: 'M120 114 C138 106 157 102 180 102 C203 102 222 106 240 114 C243 133 237 149 220 161 C208 166 194 169 180 169 C166 169 152 166 140 161 C123 149 117 133 120 114 Z',
        centroid: { x: 180, y: 136 },
      },
      inferior: {
        path: 'M160 108 C166 103 173 101 180 101 C187 101 194 103 200 108 C198 117 191 123 180 126 C169 123 162 117 160 108 Z',
        centroid: { x: 180, y: 114 },
      },
    },
  },
  {
    id: 'temporal_lobe',
    label: 'Temporal Lobe',
    color: '#d65b52',
    renderings: {
      leftLateral: {
        path: 'M94 170 C120 164 140 157 158 145 C177 158 198 164 220 169 C216 188 204 202 183 208 C151 214 126 206 106 190 C97 184 92 177 94 170 Z',
        centroid: { x: 156, y: 184 },
      },
      rightLateral: {
        path: 'M94 170 C120 164 140 157 158 145 C177 158 198 164 220 169 C216 188 204 202 183 208 C151 214 126 206 106 190 C97 184 92 177 94 170 Z',
        centroid: { x: 156, y: 184 },
        mirrorX: true,
      },
      superior: {
        path: 'M94 136 C104 129 116 128 129 133 C136 146 135 161 128 174 C116 177 104 173 94 162 C88 153 88 144 94 136 Z M231 133 C244 128 256 129 266 136 C272 144 272 153 266 162 C256 173 244 177 232 174 C225 161 224 146 231 133 Z',
        centroid: { x: 180, y: 151 },
      },
      inferior: {
        path: 'M82 110 C98 100 117 99 132 107 C142 128 141 149 133 169 C117 177 101 175 88 164 C78 151 75 129 82 110 Z M228 107 C243 99 262 100 278 110 C285 129 282 151 272 164 C259 175 243 177 227 169 C219 149 218 128 228 107 Z',
        centroid: { x: 180, y: 139 },
      },
    },
  },
  {
    id: 'occipital_lobe',
    label: 'Occipital Lobe',
    color: '#d3a340',
    renderings: {
      leftLateral: {
        path: 'M286 114 C301 119 313 127 319 140 C320 157 312 168 296 175 C280 178 264 173 252 164 C260 149 272 128 286 114 Z',
        centroid: { x: 289, y: 147 },
      },
      rightLateral: {
        path: 'M286 114 C301 119 313 127 319 140 C320 157 312 168 296 175 C280 178 264 173 252 164 C260 149 272 128 286 114 Z',
        centroid: { x: 289, y: 147 },
        mirrorX: true,
      },
      superior: {
        path: 'M136 162 C149 157 163 154 180 154 C197 154 211 157 224 162 C224 177 214 190 197 198 C191 200 186 201 180 201 C174 201 169 200 163 198 C146 190 136 177 136 162 Z',
        centroid: { x: 180, y: 180 },
      },
      inferior: {
        path: 'M150 155 C160 150 170 148 180 148 C190 148 200 150 210 155 C209 170 198 182 180 187 C162 182 151 170 150 155 Z',
        centroid: { x: 180, y: 168 },
      },
    },
  },
  {
    id: 'cerebellum',
    label: 'Cerebellum',
    color: '#7f97c9',
    renderings: {
      leftLateral: {
        path: 'M245 176 C270 173 291 179 304 191 C299 205 284 214 263 216 C245 214 231 206 226 194 C228 186 236 180 245 176 Z',
        centroid: { x: 264, y: 197 },
      },
      rightLateral: {
        path: 'M245 176 C270 173 291 179 304 191 C299 205 284 214 263 216 C245 214 231 206 226 194 C228 186 236 180 245 176 Z',
        centroid: { x: 264, y: 197 },
        mirrorX: true,
      },
      superior: {
        path: 'M155 189 C163 186 171 184 180 184 C189 184 197 186 205 189 C205 200 196 208 180 212 C164 208 155 200 155 189 Z',
        centroid: { x: 180, y: 198 },
      },
      inferior: {
        path: 'M118 173 C136 164 157 160 180 160 C203 160 224 164 242 173 C243 191 231 205 206 212 C197 214 188 215 180 215 C172 215 163 214 154 212 C129 205 117 191 118 173 Z',
        centroid: { x: 180, y: 188 },
      },
    },
  },
];

const functionalRegions: BrainRegion[] = [
  {
    id: 'brocas_area',
    label: "Broca's Area",
    color: '#e15f3a',
    renderings: {
      leftLateral: {
        path: 'M115 138 C125 124 138 118 153 120 C151 133 147 145 138 153 C127 153 120 148 115 138 Z',
        centroid: { x: 136, y: 138 },
      },
      superior: {
        path: 'M129 92 C137 85 148 82 156 85 C157 94 153 102 144 108 C136 107 130 101 129 92 Z',
        centroid: { x: 145, y: 95 },
      },
    },
  },
  {
    id: 'primary_motor_cortex',
    label: 'Primary Motor Cortex',
    color: '#61a57b',
    renderings: {
      leftLateral: {
        path: 'M162 81 C170 78 178 80 183 88 C180 104 175 120 168 136 C161 132 156 126 154 118 C157 105 159 92 162 81 Z',
        centroid: { x: 168, y: 108 },
      },
      superior: {
        path: 'M161 72 C168 68 176 67 182 67 C188 67 196 68 203 72 C203 86 196 97 182 106 C168 97 161 86 161 72 Z',
        centroid: { x: 182, y: 84 },
      },
      midSagittal: {
        path: 'M148 68 C157 61 168 58 179 58 C182 72 179 86 170 99 C158 93 150 83 148 68 Z',
        centroid: { x: 166, y: 79 },
      },
    },
  },
  {
    id: 'primary_somatosensory_cortex',
    label: 'Primary Somatosensory Cortex',
    color: '#41a0b5',
    renderings: {
      leftLateral: {
        path: 'M181 88 C189 83 199 84 208 92 C207 107 200 123 190 136 C181 132 173 125 168 136 C175 120 180 104 181 88 Z',
        centroid: { x: 190, y: 110 },
      },
      superior: {
        path: 'M161 108 C170 100 177 97 182 97 C187 97 194 100 203 108 C202 121 195 132 182 142 C169 132 162 121 161 108 Z',
        centroid: { x: 182, y: 118 },
      },
      midSagittal: {
        path: 'M181 58 C192 58 203 62 212 69 C210 83 202 93 190 99 C181 86 178 72 181 58 Z',
        centroid: { x: 194, y: 79 },
      },
    },
  },
  {
    id: 'wernickes_area',
    label: "Wernicke's Area",
    color: '#d5933e',
    renderings: {
      leftLateral: {
        path: 'M210 144 C224 136 239 135 250 141 C248 154 240 164 227 170 C218 167 212 158 210 144 Z',
        centroid: { x: 230, y: 151 },
      },
      superior: {
        path: 'M106 129 C117 124 127 124 135 131 C134 143 126 151 115 154 C108 149 104 139 106 129 Z',
        centroid: { x: 119, y: 139 },
      },
    },
  },
  {
    id: 'v1',
    label: 'Primary Visual Cortex (V1)',
    color: '#7c8ed9',
    renderings: {
      leftLateral: {
        path: 'M277 131 C289 128 301 132 307 140 C302 151 293 159 282 160 C276 151 274 140 277 131 Z',
        centroid: { x: 289, y: 145 },
      },
      superior: {
        path: 'M168 159 C173 154 178 151 182 151 C186 151 191 154 196 159 C194 169 189 177 182 181 C175 177 170 169 168 159 Z',
        centroid: { x: 182, y: 166 },
      },
      midSagittal: {
        path: 'M268 121 C280 116 292 118 301 127 C298 138 289 146 278 148 C271 140 267 130 268 121 Z',
        centroid: { x: 284, y: 132 },
      },
    },
  },
];

const deepRegions: BrainRegion[] = [
  {
    id: 'thalamus',
    label: 'Thalamus',
    color: '#5da59a',
    renderings: {
      midSagittal: {
        path: 'M168 106 C182 96 202 96 214 107 C215 122 205 132 190 135 C176 133 168 123 168 106 Z',
        centroid: { x: 191, y: 116 },
      },
      coronal: {
        path: 'M129 101 C137 91 149 87 160 90 C166 101 167 113 162 123 C150 127 139 124 130 116 C126 110 125 106 129 101 Z M200 90 C211 87 223 91 231 101 C235 106 234 110 230 116 C221 124 210 127 198 123 C193 113 194 101 200 90 Z',
        centroid: { x: 180, y: 108 },
      },
      axial: {
        path: 'M146 110 C154 100 165 97 176 99 C182 109 183 120 178 129 C166 132 155 130 147 121 C143 116 142 113 146 110 Z M184 99 C195 97 206 100 214 110 C218 113 217 116 213 121 C205 130 194 132 182 129 C177 120 178 109 184 99 Z',
        centroid: { x: 180, y: 114 },
      },
    },
  },
  {
    id: 'hypothalamus',
    label: 'Hypothalamus',
    color: '#e4863a',
    renderings: {
      midSagittal: {
        path: 'M186 136 C196 132 205 134 210 141 C207 149 200 154 191 154 C185 150 183 143 186 136 Z',
        centroid: { x: 196, y: 144 },
      },
      coronal: {
        path: 'M166 126 C172 122 180 121 188 123 C190 132 187 140 180 145 C172 142 167 136 166 126 Z',
        centroid: { x: 178, y: 133 },
      },
      axial: {
        path: 'M170 133 C176 129 184 129 190 133 C190 142 185 148 180 151 C175 148 170 142 170 133 Z',
        centroid: { x: 180, y: 141 },
      },
    },
  },
  {
    id: 'pituitary_gland',
    label: 'Pituitary Gland',
    color: '#d65b52',
    renderings: {
      midSagittal: {
        path: 'M194 157 C201 155 208 158 211 164 C208 171 201 174 194 173 C189 168 189 161 194 157 Z',
        centroid: { x: 200, y: 165 },
      },
      coronal: {
        path: 'M175 148 C180 145 185 145 189 148 C189 156 185 161 180 163 C175 161 171 156 171 151 C171 150 173 149 175 148 Z',
        centroid: { x: 180, y: 153 },
      },
      axial: {
        path: 'M175 154 C178 151 182 151 185 154 C185 160 182 164 180 166 C177 164 174 160 174 157 C174 156 174 155 175 154 Z',
        centroid: { x: 180, y: 158 },
      },
    },
  },
  {
    id: 'amygdala',
    label: 'Amygdala',
    color: '#d3a340',
    renderings: {
      midSagittal: {
        path: 'M153 150 C161 145 170 147 174 154 C171 162 164 167 156 166 C151 161 150 155 153 150 Z',
        centroid: { x: 162, y: 157 },
      },
      coronal: {
        path: 'M132 147 C139 142 146 143 151 149 C149 157 143 163 136 164 C131 159 129 152 132 147 Z M209 149 C214 143 221 142 228 147 C231 152 229 159 224 164 C217 163 211 157 209 149 Z',
        centroid: { x: 180, y: 154 },
      },
      axial: {
        path: 'M130 145 C136 139 143 139 149 144 C149 152 143 158 136 158 C131 154 128 149 130 145 Z M211 144 C217 139 224 139 230 145 C232 149 229 154 224 158 C217 158 211 152 211 144 Z',
        centroid: { x: 180, y: 150 },
      },
    },
  },
  {
    id: 'hippocampus',
    label: 'Hippocampus',
    color: '#7f97c9',
    renderings: {
      midSagittal: {
        path: 'M166 166 C181 158 199 159 210 169 C205 181 190 188 174 187 C166 182 163 174 166 166 Z',
        centroid: { x: 186, y: 175 },
      },
      coronal: {
        path: 'M121 166 C133 159 146 160 155 168 C152 179 142 186 129 187 C121 182 117 174 121 166 Z M205 168 C214 160 227 159 239 166 C243 174 239 182 231 187 C218 186 208 179 205 168 Z',
        centroid: { x: 180, y: 175 },
      },
      axial: {
        path: 'M121 165 C132 158 144 158 153 165 C151 176 141 183 129 183 C121 178 118 171 121 165 Z M207 165 C216 158 228 158 239 165 C242 171 239 178 231 183 C219 183 209 176 207 165 Z',
        centroid: { x: 180, y: 172 },
      },
    },
  },
  {
    id: 'pons',
    label: 'Pons',
    color: '#58a97c',
    renderings: {
      midSagittal: {
        path: 'M232 152 C246 146 259 149 266 160 C262 173 250 180 236 177 C229 170 228 160 232 152 Z',
        centroid: { x: 247, y: 163 },
      },
      coronal: {
        path: 'M168 171 C176 166 186 166 194 171 C195 182 190 192 180 198 C170 192 165 182 166 171 Z',
        centroid: { x: 180, y: 182 },
      },
      axial: {
        path: 'M162 178 C171 172 189 172 198 178 C198 188 192 198 180 203 C168 198 162 188 162 178 Z',
        centroid: { x: 180, y: 188 },
      },
    },
  },
  {
    id: 'medulla',
    label: 'Medulla',
    color: '#41a0b5',
    renderings: {
      midSagittal: {
        path: 'M245 179 C255 176 264 180 268 189 C264 199 256 205 247 204 C241 198 240 188 245 179 Z',
        centroid: { x: 254, y: 191 },
      },
      coronal: {
        path: 'M172 198 C176 194 184 194 188 198 C188 207 185 214 180 219 C175 214 172 207 172 198 Z',
        centroid: { x: 180, y: 206 },
      },
      axial: {
        path: 'M170 201 C174 197 186 197 190 201 C189 210 186 217 180 220 C174 217 171 210 170 201 Z',
        centroid: { x: 180, y: 209 },
      },
    },
  },
  {
    id: 'cerebellum_deep',
    label: 'Cerebellum',
    color: '#cf8d45',
    renderings: {
      midSagittal: {
        path: 'M263 126 C285 122 304 130 314 145 C310 167 293 182 270 184 C253 178 244 164 245 149 C248 138 254 130 263 126 Z',
        centroid: { x: 281, y: 154 },
      },
      coronal: {
        path: 'M85 152 C104 138 126 137 143 146 C148 165 139 182 119 191 C100 191 87 179 82 162 C82 158 83 155 85 152 Z M217 146 C234 137 256 138 275 152 C277 155 278 158 278 162 C273 179 260 191 241 191 C221 182 212 165 217 146 Z',
        centroid: { x: 180, y: 166 },
      },
      axial: {
        path: 'M84 168 C100 155 120 151 140 158 C147 177 142 193 124 204 C106 205 91 196 83 181 C81 176 81 172 84 168 Z M220 158 C240 151 260 155 276 168 C279 172 279 176 277 181 C269 196 254 205 236 204 C218 193 213 177 220 158 Z',
        centroid: { x: 180, y: 179 },
      },
    },
  },
];

export const brainViews: Record<BrainViewId, BrainViewDefinition> = {
  leftLateral: {
    id: 'leftLateral',
    label: 'Left Lateral',
    shortLabel: 'L',
    caption: 'Left lateral surface view',
    viewBox: '0 0 360 240',
    outlinePath:
      'M40 140 C40 92 77 58 136 45 C192 34 255 43 300 73 C324 90 336 112 331 135 C327 156 311 172 287 183 C279 198 264 209 241 215 C195 224 136 219 96 200 C73 201 53 190 44 170 C41 160 39 151 40 140 Z',
  },
  rightLateral: {
    id: 'rightLateral',
    label: 'Right Lateral',
    shortLabel: 'R',
    caption: 'Right lateral surface view',
    viewBox: '0 0 360 240',
    outlinePath:
      'M40 140 C40 92 77 58 136 45 C192 34 255 43 300 73 C324 90 336 112 331 135 C327 156 311 172 287 183 C279 198 264 209 241 215 C195 224 136 219 96 200 C73 201 53 190 44 170 C41 160 39 151 40 140 Z',
    mirrorX: true,
  },
  superior: {
    id: 'superior',
    label: 'Superior',
    shortLabel: 'Sup',
    caption: 'Superior surface view',
    viewBox: '0 0 360 240',
    outlinePath:
      'M88 126 C88 88 119 62 166 54 C172 53 176 53 180 53 C184 53 188 53 194 54 C241 62 272 88 272 126 C272 155 251 178 218 188 C206 192 193 194 180 194 C167 194 154 192 142 188 C109 178 88 155 88 126 Z',
  },
  inferior: {
    id: 'inferior',
    label: 'Inferior',
    shortLabel: 'Inf',
    caption: 'Inferior surface view',
    viewBox: '0 0 360 240',
    outlinePath:
      'M88 110 C92 78 118 57 160 50 C174 48 186 48 200 50 C242 57 268 78 272 110 C272 137 257 159 231 176 C218 184 203 189 186 193 C184 193 182 194 180 194 C178 194 176 193 174 193 C157 189 142 184 129 176 C103 159 88 137 88 110 Z',
  },
  midSagittal: {
    id: 'midSagittal',
    label: 'Mid-Sagittal',
    shortLabel: 'Sag',
    caption: 'Mid-sagittal internal view',
    viewBox: '0 0 360 240',
    outlinePath:
      'M55 130 C59 91 96 60 148 50 C209 39 270 58 308 98 C321 112 323 140 314 157 C299 183 266 202 221 208 C166 215 108 203 73 177 C59 167 52 149 55 130 Z',
  },
  coronal: {
    id: 'coronal',
    label: 'Coronal',
    shortLabel: 'Cor',
    caption: 'Coronal slice view',
    viewBox: '0 0 360 240',
    outlinePath:
      'M80 70 C100 54 130 46 180 46 C230 46 260 54 280 70 C293 85 298 104 296 129 C292 169 267 196 221 204 C205 207 193 208 180 208 C167 208 155 207 139 204 C93 196 68 169 64 129 C62 104 67 85 80 70 Z',
  },
  axial: {
    id: 'axial',
    label: 'Axial',
    shortLabel: 'Axl',
    caption: 'Axial slice view',
    viewBox: '0 0 360 240',
    outlinePath:
      'M95 72 C117 55 144 47 180 47 C216 47 243 55 265 72 C280 88 288 109 287 128 C284 159 264 183 229 194 C214 199 197 201 180 201 C163 201 146 199 131 194 C96 183 76 159 73 128 C72 109 80 88 95 72 Z',
  },
};

const harvardOxfordSliceLayer = getHarvardOxfordSliceLayer();

const fallbackSurfaceLayer: GameLayer = {
  id: 'cortical_regions',
  name: 'Cortical Regions',
  description: 'Image-style atlas views with lateral, superior, and inferior orientations.',
  atlasSource: 'prototype_schematic',
  difficulty: 'Foundational',
  defaultViewId: 'leftLateral',
  availableViewIds: ['leftLateral', 'rightLateral', 'superior', 'inferior'],
  regions: withRegionMetadata(surfaceRegions),
};

export const layers: GameLayer[] = harvardOxfordSliceLayer ? [harvardOxfordSliceLayer] : [fallbackSurfaceLayer];

export const defaultLayerId = layers[0].id;

export function getLayerById(id: string): GameLayer {
  return layers.find((layer) => layer.id === id) ?? layers[0];
}

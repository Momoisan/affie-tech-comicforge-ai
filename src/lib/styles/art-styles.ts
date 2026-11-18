import type { ArtStyleId, ExportTarget } from '@/types/comicforge';

export interface ArtStyleSpec {
  id: ArtStyleId;
  labelMs: string;
  labelEn: string;
  characterRendering: string;
  lineArt: string;
  shading: string;
  colorTreatment: string;
  backgroundDetail: string;
  composition: string;
  lighting: string;
  visualConsistency: string;
  negativeKeywords: string;
}

export const ART_STYLES: Record<ArtStyleId, ArtStyleSpec> = {
  'Japanese Manga — Black & White': {
    id: 'Japanese Manga — Black & White',
    labelMs: 'Manga Jepun — Hitam & Putih',
    labelEn: 'Japanese Manga — Black & White',
    characterRendering: 'Expressive anime-proportioned characters with crisp facial anatomy and clear silhouettes',
    lineArt: 'Clean G-pen ink linework with dynamic line-weight variation',
    shading: 'Traditional screentone dots, cross-hatching, and bold black ink shadows',
    colorTreatment: 'Pure monochrome black ink, crisp white highlights, and halftone gray screentones',
    backgroundDetail: 'Detailed architectural or environmental ink backgrounds with speed lines for motion',
    composition: 'Dynamic manga panel framing with dramatic foreshortening and expressive close-ups',
    lighting: 'High-contrast dramatic ink lighting with rim highlights',
    visualConsistency: 'Maintain uniform screentone density and consistent manga facial proportions across panels',
    negativeKeywords: 'color, watercolor, 3D render, photorealistic skin, blurry lines',
  },
  'Japanese Manga — Full Color': {
    id: 'Japanese Manga — Full Color',
    labelMs: 'Manga Jepun — Warna Penuh',
    labelEn: 'Japanese Manga — Full Color',
    characterRendering: 'Vibrant anime-styled characters with expressive eyes and clean anatomical proportions',
    lineArt: 'Sharp clean digital ink outlines with subtle colored line accents',
    shading: 'Cel-shaded shadows combined with soft airbrushed gradients',
    colorTreatment: 'Rich saturated anime color palette with harmonious skin and outfit tones',
    backgroundDetail: 'Illustrated anime-style backgrounds with atmospheric depth',
    composition: 'Dynamic action or emotional framing suited for modern colored manga',
    lighting: 'Cinematic anime lighting with glowing rim lights and soft ambient bounce',
    visualConsistency: 'Preserve exact hair, eye, and outfit color codes across all panels',
    negativeKeywords: 'monochrome, muddy colors, extra fingers, distorted eyes',
  },
  'Korean Webtoon': {
    id: 'Korean Webtoon',
    labelMs: 'Webtoon Korea',
    labelEn: 'Korean Webtoon',
    characterRendering: 'Sleek modern manhwa/webtoon character proportions with expressive eyes and stylish hair',
    lineArt: 'Smooth, refined digital linework with clean tapering',
    shading: 'Layered digital cel-shading with soft gradient transitions and ambient occlusion',
    colorTreatment: 'Polished luminous webtoon palette with clean skin tones and vivid accent highlights',
    backgroundDetail: 'Semi-detailed modern backgrounds with soft bokeh or atmospheric blur behind characters',
    composition: 'Vertical scroll-friendly framing with clear breathing room for speech bubbles',
    lighting: 'Soft cinematic rim lighting, subtle bloom, and mood-driven color grading',
    visualConsistency: 'Keep webtoon facial structure, hair silhouette, and outfit palette locked across panels',
    negativeKeywords: 'rough sketch, muddy shading, extra limbs, inconsistent face, watermark',
  },
  'Western Comic Book': {
    id: 'Western Comic Book',
    labelMs: 'Komik Barat Klasik/Moden',
    labelEn: 'Western Comic Book',
    characterRendering: 'Heroic, grounded anatomical proportions with strong jawlines and dynamic posture',
    lineArt: 'Bold comic book ink lines with heavy shadows and feathering',
    shading: 'Dramatic spotted blacks, comic hatching, and bold volume shading',
    colorTreatment: 'Punchy modern comic book coloring with rich contrast and subtle halftone texture',
    backgroundDetail: 'Detailed urban or sci-fi environments with strong perspective grids',
    composition: 'Impactful superhero-style angles, low-angle hero shots, and dynamic diagonals',
    lighting: 'High-contrast theatrical lighting with strong directional shadows',
    visualConsistency: 'Keep costume emblems, muscular build, and facial features consistent',
    negativeKeywords: 'chibi, flat amateur drawing, blurry ink, extra limbs',
  },
  'Cinematic Graphic Novel': {
    id: 'Cinematic Graphic Novel',
    labelMs: 'Novel Grafik Sinematik',
    labelEn: 'Cinematic Graphic Novel',
    characterRendering: 'Grounded, realistic-leaning illustrated characters with nuanced facial acting',
    lineArt: 'Controlled fine ink lines integrated with painterly edges',
    shading: 'Deep atmospheric chiaroscuro shadows and sculpted form lighting',
    colorTreatment: 'Film-inspired desaturated palette with selective warm/cool color contrast',
    backgroundDetail: 'Richly textured, moody environments with cinematic depth of field',
    composition: 'Widescreen filmic framing, rule-of-thirds, and dramatic silhouettes',
    lighting: 'Volumetric moody lighting, motivated practical lights, and soft fog',
    visualConsistency: 'Preserve realistic facial proportions and moody color grading throughout the scene',
    negativeKeywords: 'cartoonish exaggeration, neon oversaturation, flat lighting, extra fingers',
  },
  'Malaysian Cartoon': {
    id: 'Malaysian Cartoon',
    labelMs: 'Kartun Malaysia',
    labelEn: 'Malaysian Cartoon',
    characterRendering: 'Charming, expressive Malaysian comic-strip characters with warm relatable proportions',
    lineArt: 'Clean, lively hand-inked style outlines with friendly curves',
    shading: 'Crisp two-tone cel shading with clean shadow shapes',
    colorTreatment: 'Warm tropical Malaysian color palette with inviting daylight tones',
    backgroundDetail: 'Authentic Malaysian kampung, kopitiam, school, or city details with clear readability',
    composition: 'Clear storytelling framing with expressive body language and comedy/heartfelt timing',
    lighting: 'Bright natural tropical sunlight or warm indoor ambient lighting',
    visualConsistency: 'Maintain signature Malaysian attire, facial charm, and clean line thickness',
    negativeKeywords: 'hyper-realistic, grimdark horror, distorted anatomy, text artifacts',
  },
  '3D Stylized Cartoon': {
    id: '3D Stylized Cartoon',
    labelMs: 'Kartun 3D Bergaya',
    labelEn: '3D Stylized Cartoon',
    characterRendering: 'Appealing 3D animated-film style characters with expressive eyes and stylized proportions',
    lineArt: 'No 2D ink outlines; smooth sculpted 3D surfaces and crisp silhouette edges',
    shading: 'Soft subsurface skin scattering and physically plausible stylized materials',
    colorTreatment: 'Vibrant, harmonious animated-feature color palette',
    backgroundDetail: 'Stylized 3D environments with tactile props and soft depth of field',
    composition: 'Animated-film camera framing with clear focal hierarchy',
    lighting: 'Three-point studio cinema lighting with soft rim light and warm bounce',
    visualConsistency: 'Keep 3D character proportions, hair sculpt, and material colors identical',
    negativeKeywords: '2D flat sketch, uncanny valley realism, harsh noise, extra limbs',
  },
  Chibi: {
    id: 'Chibi',
    labelMs: 'Chibi Comel',
    labelEn: 'Chibi',
    characterRendering: 'Cute 2-to-3 head-tall chibi proportions with oversized expressive eyes and tiny hands',
    lineArt: 'Clean, rounded, slightly thick cute outlines',
    shading: 'Simple soft pastel cel shading with rosy cheek highlights',
    colorTreatment: 'Bright, cheerful pastel and candy-toned palette',
    backgroundDetail: 'Simplified charming backgrounds with cute decorative motifs when appropriate',
    composition: 'Playful centered framing emphasizing adorable reactions',
    lighting: 'Bright, even, cheerful studio lighting',
    visualConsistency: 'Maintain consistent 2.5-head chibi ratio and simplified outfit details',
    negativeKeywords: 'realistic anatomy, grim shadows, gritty texture, extra fingers',
  },
  'Semi-Realistic Illustration': {
    id: 'Semi-Realistic Illustration',
    labelMs: 'Ilustrasi Separa Realistik',
    labelEn: 'Semi-Realistic Illustration',
    characterRendering: 'Refined semi-realistic anatomy with detailed eyes, hair strands, and natural posture',
    lineArt: 'Minimal, delicate linework blended seamlessly into painted forms',
    shading: 'Smooth painterly rendering with accurate light falloff and soft edges',
    colorTreatment: 'Rich, balanced painterly colors with subtle skin undertones',
    backgroundDetail: 'Detailed painted environments supporting atmospheric storytelling',
    composition: 'Editorial illustration framing with strong focal point',
    lighting: 'Naturalistic directional lighting with gentle rim highlights',
    visualConsistency: 'Keep facial structure, nose/eye proportions, and outfit textures consistent',
    negativeKeywords: 'flat cartoon, harsh pixelation, deformed hands, watermark',
  },
  'Watercolor Comic': {
    id: 'Watercolor Comic',
    labelMs: 'Komik Cat Air',
    labelEn: 'Watercolor Comic',
    characterRendering: 'Graceful illustrated characters with organic hand-drawn charm',
    lineArt: 'Delicate sepia or charcoal ink outlines with slight organic texture',
    shading: 'Layered transparent watercolor washes with soft pigment blooms',
    colorTreatment: 'Soft, poetic watercolor palette on subtle cold-press paper texture',
    backgroundDetail: 'Impressionistic painted backgrounds with gentle sky and foliage washes',
    composition: 'Open, airy comic composition with breathing space',
    lighting: 'Soft diffused daylight filtering through watercolor washes',
    visualConsistency: 'Preserve consistent character ink lines and signature outfit color washes',
    negativeKeywords: '3D CGI, neon plastic, harsh digital gradients, extra limbs',
  },
  "Children's Storybook": {
    id: "Children's Storybook",
    labelMs: 'Buku Cerita Kanak-kanak',
    labelEn: "Children's Storybook",
    characterRendering: 'Warm, friendly, approachable characters with soft rounded shapes',
    lineArt: 'Gentle colored-pencil or soft ink outlines',
    shading: 'Soft gouache and pastel-textured shading',
    colorTreatment: 'Cheerful, comforting storybook colors safe and inviting for children',
    backgroundDetail: 'Whimsical, cozy environments filled with charming storytelling details',
    composition: 'Clear, uncluttered framing easy for young readers to follow',
    lighting: 'Warm golden-hour or gentle cozy indoor glow',
    visualConsistency: 'Keep friendly proportions and signature outfit colors steady across pages',
    negativeKeywords: 'scary, dark horror, gritty violence, distorted face, extra limbs',
  },
  'Pixel Art Comic': {
    id: 'Pixel Art Comic',
    labelMs: 'Komik Seni Piksel',
    labelEn: 'Pixel Art Comic',
    characterRendering: 'Crisp retro 16-bit / 32-bit pixel-art sprites and expressive portrait tiles',
    lineArt: 'Clean pixel-perfect dark outlines without anti-aliasing blur',
    shading: 'Classic pixel dithering and stepped palette shading',
    colorTreatment: 'Curated retro game color palette with high readability',
    backgroundDetail: 'Detailed tile-based pixel environments with parallax depth',
    composition: 'Clean retro game cutscene / comic panel framing',
    lighting: 'Stylized pixel lighting with crisp highlight pixels',
    visualConsistency: 'Maintain consistent pixel density and sprite proportions across panels',
    negativeKeywords: 'smooth vector blur, photorealism, 3D render, blurry upscaling',
  },
  'Custom Art Style': {
    id: 'Custom Art Style',
    labelMs: 'Gaya Seni Tersuai',
    labelEn: 'Custom Art Style',
    characterRendering: 'User-defined character rendering style with clear readable silhouettes',
    lineArt: 'Consistent user-specified linework',
    shading: 'Cohesive shading matching the custom style description',
    colorTreatment: 'Harmonious custom palette',
    backgroundDetail: 'Environment detail aligned with the custom aesthetic',
    composition: 'Clear comic panel storytelling composition',
    lighting: 'Mood-appropriate lighting supporting readability',
    visualConsistency: 'Strictly follow the custom art style instructions across every panel',
    negativeKeywords: 'inconsistent style, extra limbs, distorted face, text watermark',
  },
};

export function getArtStylePromptBlock(styleId: string, customArtStyle?: string): string {
  const spec = ART_STYLES[styleId as ArtStyleId] ?? ART_STYLES['Korean Webtoon'];
  if (styleId === 'Custom Art Style' && customArtStyle?.trim()) {
    return `Custom Art Style: ${customArtStyle.trim()}. Maintain consistent linework, shading, palette, and character proportions across panels.`;
  }
  return [
    `Art Style: ${spec.id}.`,
    `Character Rendering: ${spec.characterRendering}.`,
    `Line Art: ${spec.lineArt}.`,
    `Shading: ${spec.shading}.`,
    `Color Treatment: ${spec.colorTreatment}.`,
    `Background: ${spec.backgroundDetail}.`,
    `Lighting & Composition: ${spec.lighting}; ${spec.composition}.`,
    `Consistency: ${spec.visualConsistency}.`,
  ].join(' ');
}

export function getTargetPresetNote(target: ExportTarget): string {
  if (target === 'chatgpt') {
    return 'Formatted for ChatGPT Images: Clear natural-language scene, locked character identity block, explicit aspect ratio & framing, no speech-bubble text clutter unless requested.';
  }
  return 'Formatted for Google Gemini Image Generation: Structured visual descriptors, clear subject-action-environment hierarchy, and explicit negative constraints. Note: Outputs vary across external image models.';
}

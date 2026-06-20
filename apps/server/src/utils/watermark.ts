import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import opentype from 'opentype.js';
import { WatermarkPosition } from '@mangasketch/shared';
import { KATAKANA_PATHS } from './fonts/katakanaPaths';

// Load and parse Impact font at startup
let impactFont: opentype.Font | null = null;
try {
  const possiblePaths = [
    path.join(__dirname, 'fonts', 'impact.ttf'),
    path.join(__dirname, 'impact.ttf'),
    path.join(process.cwd(), 'src', 'utils', 'fonts', 'impact.ttf'),
    path.join(process.cwd(), 'apps', 'server', 'src', 'utils', 'fonts', 'impact.ttf'),
    path.join(process.cwd(), 'dist', 'utils', 'fonts', 'impact.ttf'),
    '/Users/rizkyanasbukhori/PlayWorks/mangasketch/scratch/impact.ttf',
  ];
  let fontPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      fontPath = p;
      break;
    }
  }
  if (fontPath) {
    const buffer = fs.readFileSync(fontPath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    impactFont = opentype.parse(arrayBuffer);
    console.log(`Successfully loaded Impact font from: ${fontPath}`);
  } else {
    console.error('Impact font file not found in any of the resolved paths.');
  }
} catch (err) {
  console.error('Failed to load Impact font in watermark helper:', err);
}

/**
 * Dynamically generates the SVG string for the Hanko Stamp watermark overlay using vector paths.
 * @param userName Optional user name/initials (1-4 characters)
 * @param position Placement corner
 * @returns SVG XML string
 */
export function generateWatermarkSvg(userName: string | undefined, position: WatermarkPosition): string {
  const width = 768;
  const height = 1024;
  
  // Set center coordinates based on the corner position (80px margin from edges)
  let cx = 688;
  let cy = 944; // Default to BOTTOM_RIGHT

  switch (position) {
    case 'TOP_LEFT':
      cx = 80;
      cy = 80;
      break;
    case 'TOP_RIGHT':
      cx = 688;
      cy = 80;
      break;
    case 'BOTTOM_LEFT':
      cx = 80;
      cy = 944;
      break;
    case 'BOTTOM_RIGHT':
    default:
      cx = 688;
      cy = 944;
      break;
  }

  const cleanName = userName ? userName.trim().toUpperCase().substring(0, 4) : '';
  const hasText = cleanName.length > 0;
  
  const circleFill = '#FFFFFF'; // Solid white circle background to overlay/mask AI signature underneath
  const strokeColor = '#D9383A'; // Traditional red ink stamp color

  let katakanaSvg = '';
  let bannerSvg = '';

  // Function to render static Katakana path centered at (x, y) with a given fontSize
  function renderKatakana(char: string, x: number, y: number, fontSize: number): string {
    const scale = fontSize / 1000;
    const charInfo = KATAKANA_PATHS[char];
    if (!charInfo) return '';
    const shiftX = x - charInfo.centerX * scale;
    const shiftY = y;
    return `<path d="${charInfo.d}" transform="translate(${shiftX.toFixed(2)}, ${shiftY.toFixed(2)}) scale(${scale.toFixed(4)})" fill="${strokeColor}" />`;
  }

  if (hasText) {
    // --- Case 1: With Username Banner ---
    // Left column: ス ケ ッ チ (fontSize = 13px)
    // Right column: マ ン ガ (fontSize = 16px)
    katakanaSvg = `
      <!-- Right Column: マ ン ガ -->
      ${renderKatakana('マ', cx + 10, cy - 16, 16)}
      ${renderKatakana('ン', cx + 10, cy - 16 + 14, 16)}
      ${renderKatakana('ガ', cx + 10, cy - 16 + 28, 16)}
      
      <!-- Left Column: ス ケ ッ チ -->
      ${renderKatakana('ス', cx - 10, cy - 19, 13)}
      ${renderKatakana('ケ', cx - 10, cy - 19 + 12, 13)}
      ${renderKatakana('ッ', cx - 10, cy - 19 + 22, 13)}
      ${renderKatakana('チ', cx - 10, cy - 19 + 34, 13)}
    `;

    // Dynamic initials rendering using opentype.js
    const fontScale = cleanName.length <= 2 ? 12 : 10;
    let initialsPathData = '';
    
    if (impactFont) {
      // Center the text horizontally at cx
      const textWidth = impactFont.getAdvanceWidth(cleanName, fontScale);
      const startX = cx - textWidth / 2;
      const yBaseline = cy + 36;
      
      const initialsPath = impactFont.getPath(cleanName, startX, yBaseline, fontScale);
      initialsPathData = initialsPath.toPathData(2);
    }

    const chordOffset = 22;
    const halfChord = Math.sqrt(42 * 42 - chordOffset * chordOffset);
    const x1 = cx - halfChord;
    const x2 = cx + halfChord;
    const yChord = cy + chordOffset;

    bannerSvg = `
      <!-- Bottom Red Segment Banner -->
      <path d="M ${x1} ${yChord} A 42 42 0 0 0 ${x2} ${yChord} Z" fill="${strokeColor}" />
      
      <!-- User initials/short name (drawn as path) -->
      ${initialsPathData ? `<path d="${initialsPathData}" fill="#FFFFFF" />` : ''}
    `;
  } else {
    // --- Case 2: Without Username Banner (Katakana centered in full circle) ---
    // Right column: マ ン ガ (fontSize = 17px)
    // Left column: ス ケ ッ チ (fontSize = 15px)
    katakanaSvg = `
      <!-- Right Column: マ ン ガ -->
      ${renderKatakana('マ', cx + 10, cy - 10, 17)}
      ${renderKatakana('ン', cx + 10, cy - 10 + 16, 17)}
      ${renderKatakana('ガ', cx + 10, cy - 10 + 32, 17)}
      
      <!-- Left Column: ス ケ ッ チ -->
      ${renderKatakana('ス', cx - 10, cy - 14, 15)}
      ${renderKatakana('ケ', cx - 10, cy - 14 + 14, 15)}
      ${renderKatakana('ッ', cx - 10, cy - 14 + 28, 15)}
      ${renderKatakana('チ', cx - 10, cy - 14 + 42, 15)}
    `;
    bannerSvg = '';
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- 1. White Solid background to cover/mask AI signature underneath -->
      <circle cx="${cx}" cy="${cy}" r="42" fill="${circleFill}" />
      
      <!-- 2. Red Outer Circle Border -->
      <circle cx="${cx}" cy="${cy}" r="42" fill="none" stroke="${strokeColor}" stroke-width="4.5" />
      
      <!-- 3. Vertical Katakana (Rendered as paths) -->
      ${katakanaSvg}
      
      <!-- 4. Optional Bottom Banner & Username (Rendered as paths) -->
      ${bannerSvg}
    </svg>
  `;
}

/**
 * Composites the Hanko Stamp watermark onto the image buffer using Sharp.
 * @param imageBuffer Original image buffer from AI
 * @param userName The name to print
 * @param position Corner position
 * @returns Watermarked image buffer
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  userName: string | undefined,
  position: WatermarkPosition
): Promise<Buffer> {
  const svgOverlay = generateWatermarkSvg(userName, position);
  
  // 1. Force grayscale to guarantee pure B&W (kills any color leakage from AI model)
  // 2. Convert back to sRGB color space so the red Hanko stamp renders correctly
  // 3. Composite the Hanko stamp overlay
  const grayscaleBuffer = await sharp(imageBuffer)
    .grayscale()
    .toColourspace('srgb')
    .toBuffer();

  return sharp(grayscaleBuffer)
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0
      }
    ])
    .webp({ quality: 85 })
    .toBuffer();
}

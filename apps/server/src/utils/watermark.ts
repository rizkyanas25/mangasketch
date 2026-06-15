import sharp from 'sharp';
import { WatermarkPosition } from '@mangasketch/shared';

/**
 * Dynamically generates the SVG string for the Hanko Stamp watermark overlay.
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

  if (hasText) {
    // --- Case 1: With Username Banner ---
    // Katakana font sizes bumped from 14/12 to 16/13 for better readability
    const userFontSize = cleanName.length <= 2 ? '12px' : '10px';
    
    // Banner chord geometry: offset 22px below center gives a taller segment
    const chordOffset = 22;
    const halfChord = Math.sqrt(42 * 42 - chordOffset * chordOffset); // ≈ 35.8
    const x1 = cx - halfChord;
    const x2 = cx + halfChord;
    const yChord = cy + chordOffset;

    katakanaSvg = `
      <!-- Right Column: マ ン ガ (16px, vertically centered above banner) -->
      <text x="${cx + 10}" y="${cy - 16}" fill="${strokeColor}" font-family="'Noto Sans JP', 'Helvetica Neue', 'Arial Black', sans-serif" font-weight="900" font-size="16px" text-anchor="middle" letter-spacing="-0.5px">
        マ
        <tspan x="${cx + 10}" dy="14">ン</tspan>
        <tspan x="${cx + 10}" dy="14">ガ</tspan>
      </text>
      
      <!-- Left Column: ス ケ ッ チ (13px, vertically centered above banner) -->
      <text x="${cx - 10}" y="${cy - 19}" fill="${strokeColor}" font-family="'Noto Sans JP', 'Helvetica Neue', 'Arial Black', sans-serif" font-weight="900" font-size="13px" text-anchor="middle" letter-spacing="-0.5px">
        ス
        <tspan x="${cx - 10}" dy="12">ケ</tspan>
        <tspan x="${cx - 10}" dy="10">ッ</tspan>
        <tspan x="${cx - 10}" dy="12">チ</tspan>
      </text>
    `;

    bannerSvg = `
      <!-- Bottom Red Segment Banner (taller segment for better text fit) -->
      <path d="M ${x1} ${yChord} A 42 42 0 0 0 ${x2} ${yChord} Z" fill="${strokeColor}" />
      
      <!-- User initials/short name (centered in segment) -->
      <text x="${cx}" y="${cy + 36}" fill="#FFFFFF" font-family="'Impact', 'Arial Black', sans-serif" font-size="${userFontSize}" font-weight="bold" letter-spacing="0.5" text-anchor="middle">
        ${cleanName}
      </text>
    `;
  } else {
    // --- Case 2: Without Username Banner (Katakana truly centered in full circle) ---
    katakanaSvg = `
      <!-- Right Column: マ ン ガ (17px, vertically centered in circle) -->
      <text x="${cx + 10}" y="${cy - 10}" fill="${strokeColor}" font-family="'Noto Sans JP', 'Helvetica Neue', 'Arial Black', sans-serif" font-weight="900" font-size="17px" text-anchor="middle" letter-spacing="-0.5px">
        マ
        <tspan x="${cx + 10}" dy="16">ン</tspan>
        <tspan x="${cx + 10}" dy="16">ガ</tspan>
      </text>
      
      <!-- Left Column: ス ケ ッ チ (15px, vertically centered in circle) -->
      <text x="${cx - 10}" y="${cy - 14}" fill="${strokeColor}" font-family="'Noto Sans JP', 'Helvetica Neue', 'Arial Black', sans-serif" font-weight="900" font-size="15px" text-anchor="middle" letter-spacing="-0.5px">
        ス
        <tspan x="${cx - 10}" dy="14">ケ</tspan>
        <tspan x="${cx - 10}" dy="11">ッ</tspan>
        <tspan x="${cx - 10}" dy="14">チ</tspan>
      </text>
    `;
    
    bannerSvg = ''; // No bottom banner
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- 1. White Solid background to cover/mask AI signature underneath -->
      <circle cx="${cx}" cy="${cy}" r="42" fill="${circleFill}" />
      
      <!-- 2. Red Outer Circle Border -->
      <circle cx="${cx}" cy="${cy}" r="42" fill="none" stroke="${strokeColor}" stroke-width="4.5" />
      
      <!-- 3. Vertical Katakana (マンガスケッチ) in center -->
      ${katakanaSvg}
      
      <!-- 4. Optional Bottom Banner & Username -->
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
    .toBuffer();
}

/**
 * Card Export Utility
 * Generates high-definition, beautifully styled shareable cards
 * Supports 4 aesthetic themes and 2 aspect ratios (Story 9:16 and Square 1:1)
 * Uses high-res Canvas with dynamic line wrapping, font loading guards, and zero-overlap layout.
 */
import html2canvas from 'html2canvas';

export const THEME_CONFIGS = {
  olive: {
    id: 'olive',
    name: 'الزيتوني الملكي',
    bgStart: '#FDFBF7',
    bgEnd: '#F4EFE6',
    outerBorder: 'rgba(212, 175, 55, 0.45)',
    innerBorder: '#E2D7C5',
    diamond: '#D4AF37',
    appTitle: '#2C4A3E',
    slogan: '#D4AF37',
    badgeBg: 'rgba(44, 74, 62, 0.08)',
    badgeText: '#2C4A3E',
    title: '#1F342B',
    reflection: '#2D3748',
    proofBoxBg: 'rgba(44, 74, 62, 0.04)',
    proofBorder: 'rgba(212, 175, 55, 0.55)',
    proofText: '#2C4A3E',
    proofSource: '#D4AF37',
    footer: '#718096'
  },
  sand: {
    id: 'sand',
    name: 'الرملي النوراني',
    bgStart: '#FAF6EC',
    bgEnd: '#EFE5D0',
    outerBorder: 'rgba(197, 139, 36, 0.45)',
    innerBorder: '#DFD3B9',
    diamond: '#C58B24',
    appTitle: '#503A28',
    slogan: '#B87B1C',
    badgeBg: 'rgba(184, 123, 28, 0.12)',
    badgeText: '#64461F',
    title: '#3B2816',
    reflection: '#3D3025',
    proofBoxBg: 'rgba(184, 123, 28, 0.06)',
    proofBorder: 'rgba(197, 139, 36, 0.5)',
    proofText: '#4D3823',
    proofSource: '#B87B1C',
    footer: '#8C7760'
  },
  midnight: {
    id: 'midnight',
    name: 'سكينة الليل',
    bgStart: '#0E1A17',
    bgEnd: '#162822',
    outerBorder: 'rgba(212, 175, 55, 0.5)',
    innerBorder: 'rgba(44, 74, 62, 0.8)',
    diamond: '#E5C358',
    appTitle: '#E2DAC8',
    slogan: '#E5C358',
    badgeBg: 'rgba(212, 175, 55, 0.18)',
    badgeText: '#E5C358',
    title: '#FFFFFF',
    reflection: '#D1DCD6',
    proofBoxBg: 'rgba(255, 255, 255, 0.04)',
    proofBorder: 'rgba(212, 175, 55, 0.45)',
    proofText: '#E9DFCE',
    proofSource: '#E5C358',
    footer: 'rgba(255, 255, 255, 0.45)'
  },
  emerald: {
    id: 'emerald',
    name: 'الزمردي النقي',
    bgStart: '#17372D',
    bgEnd: '#0C201A',
    outerBorder: 'rgba(223, 183, 88, 0.55)',
    innerBorder: 'rgba(32, 80, 64, 0.65)',
    diamond: '#DFB758',
    appTitle: '#F0FDF4',
    slogan: '#DFB758',
    badgeBg: 'rgba(223, 183, 88, 0.2)',
    badgeText: '#DFB758',
    title: '#FFFFFF',
    reflection: '#E6F4ED',
    proofBoxBg: 'rgba(0, 0, 0, 0.22)',
    proofBorder: 'rgba(223, 183, 88, 0.45)',
    proofText: '#F7FBF9',
    proofSource: '#DFB758',
    footer: 'rgba(240, 253, 244, 0.5)'
  }
};

/**
 * Splits text into wrapped lines with exact measurement
 */
function splitTextIntoLines(ctx, text, maxWidth) {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = ctx.measureText(testLine).width;
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export async function exportBlessingAsImage(blessing, options = {}) {
  // Wait for Google Fonts to be fully ready before measuring or drawing
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // proceed if fonts error
    }
  }

  // Support both options object or legacy boolean isNightMode
  let themeKey = 'olive';
  let ratio = 'story';

  if (typeof options === 'boolean') {
    themeKey = options ? 'midnight' : 'olive';
  } else if (typeof options === 'object') {
    themeKey = options.theme || (options.isNightMode ? 'midnight' : 'olive');
    ratio = options.ratio || 'story';
  }

  const theme = THEME_CONFIGS[themeKey] || THEME_CONFIGS.olive;
  const isSquare = ratio === 'square';

  try {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = isSquare ? 1080 : 1920;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, theme.bgStart);
    bgGrad.addColorStop(1, theme.bgEnd);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Borders
    const borderMargin = isSquare ? 32 : 44;
    ctx.strokeStyle = theme.outerBorder;
    ctx.lineWidth = 3;
    ctx.strokeRect(borderMargin, borderMargin, width - borderMargin * 2, height - borderMargin * 2);

    ctx.strokeStyle = theme.innerBorder;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(borderMargin + 10, borderMargin + 10, width - (borderMargin + 10) * 2, height - (borderMargin + 10) * 2);

    // Corner decorative diamond accents
    const drawDiamond = (x, y, s) => {
      ctx.fillStyle = theme.diamond;
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s, y);
      ctx.closePath();
      ctx.fill();
    };

    drawDiamond(borderMargin + 10, borderMargin + 10, 8);
    drawDiamond(width - borderMargin - 10, borderMargin + 10, 8);
    drawDiamond(borderMargin + 10, height - borderMargin - 10, 8);
    drawDiamond(width - borderMargin - 10, height - borderMargin - 10, 8);

    // Base typography setup
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.direction = 'rtl';

    // 1. Header: App Title & Slogan
    const headerTitleY = isSquare ? 105 : 190;
    const headerSloganY = isSquare ? 144 : 242;

    ctx.font = `bold ${isSquare ? '42px' : '56px'} "Reem Kufi", "Amiri", "Cairo", sans-serif`;
    ctx.fillStyle = theme.appTitle;
    ctx.fillText('نِعْمَة', width / 2, headerTitleY);

    ctx.font = `${isSquare ? '20px' : '25px'} "Cairo", "Tajawal", sans-serif`;
    ctx.fillStyle = theme.slogan;
    ctx.fillText('« تَذَكَّرْ لِتَشْكُرْ »', width / 2, headerSloganY);

    // 2. Category Badge
    ctx.font = `600 ${isSquare ? '19px' : '23px'} "Cairo", "Tajawal", sans-serif`;
    const badgeText = blessing.categoryName || 'نعم الله';
    const badgeWidth = ctx.measureText(badgeText).width + (isSquare ? 48 : 60);
    const badgeX = (width - badgeWidth) / 2;
    const badgeY = isSquare ? 175 : 295;
    const badgeH = isSquare ? 34 : 42;

    ctx.fillStyle = theme.badgeBg;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeH, badgeH / 2);
    ctx.fill();

    ctx.fillStyle = theme.badgeText;
    ctx.fillText(badgeText, width / 2, badgeY + (isSquare ? 24 : 30));

    // Dynamic Sizing calculation to guarantee non-overlapping layout
    const textMaxWidth = isSquare ? 880 : 860;

    // Check content lengths
    const titleText = blessing.title || '';
    const refText = blessing.reflection || '';
    const proofText = blessing.proof || '';
    const isLongContent = isSquare && (refText.length > 150 || (proofText.length > 70 && refText.length > 100));

    // Font configurations
    const titleFontSize = isSquare ? (isLongContent ? 34 : 38) : 52;
    const titleLineHeight = isSquare ? (isLongContent ? 54 : 60) : 80;

    const refFontSize = isSquare ? (isLongContent ? 23 : 26) : 33;
    const refLineHeight = isSquare ? (isLongContent ? 42 : 46) : 62;

    const proofFontSize = isSquare ? (isLongContent ? 20 : 23) : 29;
    const proofLineHeight = isSquare ? (isLongContent ? 36 : 40) : 52;
    const proofSourceFontSize = isSquare ? 17 : 22;

    // Measure Title Lines
    ctx.font = `bold ${titleFontSize}px "Amiri", "Reem Kufi", serif`;
    const titleLines = splitTextIntoLines(ctx, titleText, textMaxWidth);

    // Measure Reflection Lines
    ctx.font = `400 ${refFontSize}px "Amiri", "Cairo", serif`;
    const refLines = splitTextIntoLines(ctx, refText, textMaxWidth);

    // Measure Proof Lines (if present)
    let proofLines = [];
    if (proofText) {
      ctx.font = `bold italic ${proofFontSize}px "Amiri", serif`;
      proofLines = splitTextIntoLines(ctx, proofText, textMaxWidth - (isSquare ? 100 : 120));
    }

    // Starting Y coordinates
    let currentY = isSquare ? (isLongContent ? 260 : 275) : 480;

    // Render Title Lines
    ctx.font = `bold ${titleFontSize}px "Amiri", "Reem Kufi", serif`;
    ctx.fillStyle = theme.title;
    for (let i = 0; i < titleLines.length; i++) {
      ctx.fillText(titleLines[i], width / 2, currentY);
      currentY += titleLineHeight;
    }

    // Gap between Title and Reflection
    currentY += isSquare ? (isLongContent ? 24 : 32) : 50;

    // Render Reflection Lines
    ctx.font = `400 ${refFontSize}px "Amiri", "Cairo", serif`;
    ctx.fillStyle = theme.reflection;
    for (let i = 0; i < refLines.length; i++) {
      ctx.fillText(refLines[i], width / 2, currentY);
      currentY += refLineHeight;
    }

    // Render Proof Box if present
    if (proofLines.length > 0) {
      currentY += isSquare ? (isLongContent ? 20 : 30) : 50;

      const hasSource = Boolean(blessing.proofSource);
      const boxPaddingTop = isSquare ? 24 : 34;
      const boxPaddingBottom = isSquare ? 22 : 30;
      const sourceSpace = hasSource ? (isSquare ? 32 : 44) : 0;
      const boxHeight = boxPaddingTop + (proofLines.length * proofLineHeight) + sourceSpace + boxPaddingBottom;
      const boxWidth = textMaxWidth + (isSquare ? 40 : 60);
      const boxX = (width - boxWidth) / 2;
      const boxY = currentY;

      // Box Background & Border
      ctx.fillStyle = theme.proofBoxBg;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16);
      ctx.fill();

      ctx.strokeStyle = theme.proofBorder;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Render Proof lines inside the box
      let proofCurrentY = boxY + boxPaddingTop + (proofLineHeight * 0.7);
      ctx.font = `bold italic ${proofFontSize}px "Amiri", serif`;
      ctx.fillStyle = theme.proofText;

      for (let i = 0; i < proofLines.length; i++) {
        ctx.fillText(proofLines[i], width / 2, proofCurrentY);
        proofCurrentY += proofLineHeight;
      }

      // Render Proof Source
      if (hasSource) {
        proofCurrentY += isSquare ? 4 : 8;
        ctx.font = `${proofSourceFontSize}px "Cairo", sans-serif`;
        ctx.fillStyle = theme.proofSource;
        ctx.fillText(`— ${blessing.proofSource}`, width / 2, proofCurrentY);
      }
    }

    // Footer at the bottom
    const footerY = height - (isSquare ? 42 : 75);
    ctx.font = `${isSquare ? '18px' : '22px'} "Cairo", sans-serif`;
    ctx.fillStyle = theme.footer;
    ctx.fillText('منصة نِعْمَة — شارك لتؤجر وذكّر لتشكر', width / 2, footerY);

    // Export image
    const dataUrl = canvas.toDataURL('image/png');
    const safeTitle = (blessing.title || 'نعمة').replace(/[\\/:*?"<>|\s]+/g, '_').substring(0, 30);
    const filename = `نعمة-${safeTitle}-${themeKey}-${ratio}.png`;
    downloadURI(dataUrl, filename);
    return true;
  } catch (err) {
    console.error('Canvas export failed, falling back to DOM...', err);
    const element = document.getElementById('blessing-card-exportable');
    if (element) {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme.bgStart
      });
      const dataUrl = canvas.toDataURL('image/png');
      downloadURI(dataUrl, `نعمة-${blessing.title.replace(/\s+/g, '_')}.png`);
      return true;
    }
  }
}

function downloadURI(uri, name) {
  const link = document.createElement('a');
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

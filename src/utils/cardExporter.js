/**
 * Card Export Utility
 * Generates high-definition, beautifully styled shareable cards
 * Supports 4 aesthetic themes and 2 aspect ratios (Story 9:16 and Square 1:1)
 * Fallback to DOM-based html2canvas if canvas fails
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

export async function exportBlessingAsImage(blessing, options = {}) {
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

    // Typography Setup
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';

    // Header: App Title & Slogan
    const titleY = isSquare ? 110 : 210;
    const sloganY = isSquare ? 152 : 265;

    ctx.font = `bold ${isSquare ? '46px' : '58px'} "Reem Kufi", "Amiri", "Cairo", sans-serif`;
    ctx.fillStyle = theme.appTitle;
    ctx.fillText('نِعْمَة', width / 2, titleY);

    ctx.font = `${isSquare ? '22px' : '26px'} "Cairo", "Tajawal", sans-serif`;
    ctx.fillStyle = theme.slogan;
    ctx.fillText('« تَذَكَّرْ لِتَشْكُرْ »', width / 2, sloganY);

    // Category Badge
    ctx.font = `600 ${isSquare ? '20px' : '24px'} "Cairo", "Tajawal", sans-serif`;
    const badgeText = blessing.categoryName || 'نعم الله';
    const badgeWidth = ctx.measureText(badgeText).width + (isSquare ? 50 : 64);
    const badgeX = (width - badgeWidth) / 2;
    const badgeY = isSquare ? 195 : 330;
    const badgeH = isSquare ? 36 : 44;

    ctx.fillStyle = theme.badgeBg;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeH, badgeH / 2);
    ctx.fill();

    ctx.fillStyle = theme.badgeText;
    ctx.fillText(badgeText, width / 2, badgeY + (isSquare ? 25 : 30));

    // Title of the Blessing
    const blessingTitleY = isSquare ? 300 : 540;
    const titleFontSize = isSquare ? 42 : 54;
    ctx.font = `bold ${titleFontSize}px "Amiri", "Reem Kufi", serif`;
    ctx.fillStyle = theme.title;
    const afterTitleY = wrapText(ctx, blessing.title, width / 2, blessingTitleY, width - 180, isSquare ? 56 : 74);

    // Reflection Text (التدبّر)
    const reflectionY = afterTitleY + (isSquare ? 35 : 55);
    const refFontSize = isSquare ? 27 : 34;
    ctx.font = `400 ${refFontSize}px "Amiri", "Cairo", serif`;
    ctx.fillStyle = theme.reflection;
    const reflectionEndY = wrapText(ctx, blessing.reflection, width / 2, reflectionY, width - (isSquare ? 180 : 220), isSquare ? 46 : 60);

    // Quranic Ayah or Hadith Frame
    if (blessing.proof) {
      const minBoxY = isSquare ? 670 : 1200;
      const boxY = Math.max(reflectionEndY + (isSquare ? 35 : 70), minBoxY);
      const boxWidth = width - (isSquare ? 160 : 200);
      const boxX = (width - boxWidth) / 2;
      const boxHeight = isSquare ? 210 : 280;

      ctx.fillStyle = theme.proofBoxBg;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 18);
      ctx.fill();

      ctx.strokeStyle = theme.proofBorder;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Proof text
      const proofFontSize = isSquare ? 25 : 32;
      ctx.font = `italic ${proofFontSize}px "Amiri", serif`;
      ctx.fillStyle = theme.proofText;
      wrapText(ctx, blessing.proof, width / 2, boxY + (isSquare ? 60 : 80), boxWidth - 60, isSquare ? 42 : 54);

      // Proof source
      if (blessing.proofSource) {
        ctx.font = `${isSquare ? '19px' : '23px'} "Cairo", sans-serif`;
        ctx.fillStyle = theme.proofSource;
        ctx.fillText(`— ${blessing.proofSource}`, width / 2, boxY + boxHeight - (isSquare ? 26 : 38));
      }
    }

    // Footer
    ctx.font = `${isSquare ? '19px' : '22px'} "Cairo", sans-serif`;
    ctx.fillStyle = theme.footer;
    ctx.fillText('منصة نِعْمَة — شارك لتؤجر وذكّر لتشكر', width / 2, height - (isSquare ? 50 : 80));

    // Download image
    const dataUrl = canvas.toDataURL('image/png');
    const filename = `نعمة-${blessing.title.replace(/\s+/g, '_')}-${themeKey}-${ratio}.png`;
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

// Helper to wrap text cleanly in Canvas
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
  return curY;
}

function downloadURI(uri, name) {
  const link = document.createElement('a');
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

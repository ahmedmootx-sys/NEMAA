/**
 * Card Export Utility
 * Generates high-definition, beautifully styled shareable cards
 * Supports both high-res HTML5 Canvas generation (1080x1350) and DOM-based html2canvas
 */
import html2canvas from 'html2canvas';

export async function exportBlessingAsImage(blessing, isNightMode = false) {
  // Try high-resolution Canvas renderer first for flawless Arabic rendering and crisp typography
  try {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background colors
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (isNightMode) {
      bgGrad.addColorStop(0, '#152520');
      bgGrad.addColorStop(1, '#0C1714');
    } else {
      bgGrad.addColorStop(0, '#FDFBF7');
      bgGrad.addColorStop(1, '#F7F3EA');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle decorative textured border
    const borderMargin = 40;
    ctx.strokeStyle = isNightMode ? '#D4AF3788' : '#D4AF3755';
    ctx.lineWidth = 3;
    ctx.strokeRect(borderMargin, borderMargin, width - borderMargin * 2, height - borderMargin * 2);

    ctx.strokeStyle = isNightMode ? '#2C4A3E' : '#E8DFD0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(borderMargin + 10, borderMargin + 10, width - (borderMargin + 10) * 2, height - (borderMargin + 10) * 2);

    // Corner decorative accents (Gold diamonds)
    const drawDiamond = (x, y, s) => {
      ctx.fillStyle = '#D4AF37';
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

    // Header: App Title & Slogan
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';

    ctx.font = 'bold 54px "Reem Kufi", "Amiri", "Cairo", sans-serif';
    ctx.fillStyle = isNightMode ? '#E2DAC8' : '#2C4A3E';
    ctx.fillText('نِعْمَة', width / 2, 140);

    ctx.font = '24px "Cairo", "Tajawal", sans-serif';
    ctx.fillStyle = '#D4AF37';
    ctx.fillText('« تَذَكَّرْ لِتَشْكُرْ »', width / 2, 190);

    // Category Badge
    ctx.font = '600 24px "Cairo", "Tajawal", sans-serif';
    const badgeText = blessing.categoryName || 'نعم الله';
    const badgeWidth = ctx.measureText(badgeText).width + 60;
    const badgeX = (width - badgeWidth) / 2;
    const badgeY = 240;

    ctx.fillStyle = isNightMode ? 'rgba(212, 175, 55, 0.15)' : 'rgba(44, 74, 62, 0.08)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, 42, 21);
    ctx.fill();

    ctx.fillStyle = isNightMode ? '#D4AF37' : '#2C4A3E';
    ctx.fillText(badgeText, width / 2, badgeY + 28);

    // Title of the Blessing
    ctx.font = 'bold 52px "Amiri", "Reem Kufi", serif';
    ctx.fillStyle = isNightMode ? '#FFFFFF' : '#1F342B';
    wrapText(ctx, blessing.title, width / 2, 380, width - 200, 70);

    // Reflection Text (التدبّر)
    ctx.font = '400 32px "Amiri", "Cairo", serif';
    ctx.fillStyle = isNightMode ? '#D1DCD6' : '#2D3748';
    const reflectionEndY = wrapText(ctx, blessing.reflection, width / 2, 510, width - 240, 56);

    // Quranic Ayah or Hadith Frame
    if (blessing.proof) {
      const boxY = Math.max(reflectionEndY + 60, 780);
      const boxWidth = width - 200;
      const boxX = 100;

      // Draw ornate callout
      ctx.fillStyle = isNightMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(44, 74, 62, 0.04)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, 240, 16);
      ctx.fill();

      ctx.strokeStyle = isNightMode ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Proof text
      ctx.font = 'italic 30px "Amiri", serif';
      ctx.fillStyle = isNightMode ? '#E9DFCE' : '#2C4A3E';
      wrapText(ctx, blessing.proof, width / 2, boxY + 70, boxWidth - 60, 48);

      // Proof source
      if (blessing.proofSource) {
        ctx.font = '22px "Cairo", sans-serif';
        ctx.fillStyle = '#D4AF37';
        ctx.fillText(`— ${blessing.proofSource}`, width / 2, boxY + 200);
      }
    }

    // Footer
    ctx.font = '20px "Cairo", sans-serif';
    ctx.fillStyle = isNightMode ? 'rgba(255, 255, 255, 0.4)' : '#718096';
    ctx.fillText('منصة نِعْمَة — شارك لتؤجر وذكّر لتشكر', width / 2, height - 70);

    // Download image
    const dataUrl = canvas.toDataURL('image/png');
    downloadURI(dataUrl, `نعمة-${blessing.title.replace(/\s+/g, '_')}.png`);
    return true;
  } catch (err) {
    console.error('Canvas export failed, trying DOM fallback...', err);
    // Fallback to html2canvas on card element
    const element = document.getElementById('blessing-card-exportable');
    if (element) {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: isNightMode ? '#152520' : '#FDFBF7'
      });
      const dataUrl = canvas.toDataURL('image/png');
      downloadURI(dataUrl, `نعمة-${blessing.title.replace(/\s+/g, '_')}.png`);
      return true;
    }
  }
}

// Helper to wrap text cleanly in Canvas
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
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

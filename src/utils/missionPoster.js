/**
 * Platform Mission Poster Generator (بوستر رسالة وهدف منصة نِعْمَة)
 * Generates an ultra high-resolution 1080x1920 (9:16) Status/Story poster for WhatsApp & Instagram
 */


function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
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

export async function generateMissionPoster({ lang = 'ar' } = {}) {
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  const appUrl = 'https://ahmedmootx-sys.github.io/NEMAA/';
  const isRtl = lang === 'ar';

  // 1. Royal Emerald Islamic Night Gradient with Soft Subtle Vignette
  const bg = ctx.createLinearGradient(0, 0, 0, 1920);
  bg.addColorStop(0, '#04100C');
  bg.addColorStop(0.22, '#09241B');
  bg.addColorStop(0.55, '#0E3326');
  bg.addColorStop(0.85, '#081D16');
  bg.addColorStop(1, '#030B08');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1920);

  // Soft Central Spiritual Glow behind Emblem
  const glow = ctx.createRadialGradient(540, 140, 20, 540, 140, 320);
  glow.addColorStop(0, 'rgba(212, 175, 55, 0.18)');
  glow.addColorStop(0.5, 'rgba(212, 175, 55, 0.05)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 480);

  // 2. Gold Decorative Borders
  ctx.save();
  ctx.shadowColor = 'rgba(212, 175, 55, 0.35)';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(40, 40, 1000, 1840, 24);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(48, 48, 984, 1824, 20);
  ctx.stroke();

  // Corner ornaments
  const drawCornerAccent = (x, y, flipX, flipY) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.lineTo(28, 28);
    ctx.lineTo(28, 0);
    ctx.stroke();
    ctx.restore();
  };
  drawCornerAccent(58, 58, false, false);
  drawCornerAccent(1022, 58, true, false);
  drawCornerAccent(58, 1862, false, true);
  drawCornerAccent(1022, 1862, true, true);

  // 3. Brand Logo at Top
  let logoY = 150;
  try {
    const logoImg = await loadImage(`${import.meta.env.BASE_URL}brand/emblem-arabic.png`).catch(() =>
      loadImage(`${import.meta.env.BASE_URL}brand/logo-wordmark.png`)
    );
    const logoSize = 100;
    const logoX = (1080 - logoSize) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
    ctx.shadowBlur = 18;
    ctx.drawImage(logoImg, logoX, 85, logoSize, logoSize);
    ctx.restore();
    logoY = 205;
  } catch {
    logoY = 150;
  }

  // 4. Header Titles
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Bismillah
  ctx.font = '22px "Amiri", serif';
  ctx.fillStyle = '#D4AF37';
  ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 540, logoY + 20);

  // Main Header Title
  ctx.font = 'bold 44px "Cairo", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(isRtl ? 'رسالة وهدف منصة «نِعْمَة»' : 'The Mission of «NEMAA»', 540, logoY + 70);

  // Golden Slogan
  ctx.font = 'bold 24px "Amiri", serif';
  ctx.fillStyle = '#E5C358';
  ctx.fillText(isRtl ? '« تَذَكَّرْ لِتَشْكُرْ »' : '« Remember to Give Thanks »', 540, logoY + 115);

  // Decorative Golden Line
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(340, logoY + 140);
  ctx.lineTo(740, logoY + 140);
  ctx.stroke();

  // Diamond in center of divider
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(540, logoY + 140, 5, 0, Math.PI * 2);
  ctx.fill();

  // 5. Message Content Body
  let currentY = logoY + 185;
  const contentWidth = 900;
  const contentX = 540;

  if (isRtl) {
    // Greeting
    ctx.font = 'bold 28px "Cairo", sans-serif';
    ctx.fillStyle = '#F5D77F';
    ctx.fillText('السلام عليكم ورحمة الله وبركاته،', contentX, currentY);
    currentY += 50;

    // Paragraph 1
    ctx.font = '24px "Cairo", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    const p1 = 'نحن نعيش في كنف نِعَمٍ سابغة لا تُحصى، لكن طول الاعتياد يورث الغفلة، فننسى أن نستشعر ما بين أيدينا، أو نغفل عن التفكر في ألطاف الله حتى نألفها ولا نراها..';
    const p1Lines = wrapText(ctx, p1, contentWidth);
    p1Lines.forEach(line => {
      ctx.fillText(line, contentX, currentY);
      currentY += 40;
    });
    currentY += 20;

    // Golden Highlighted Core Mission Box
    const p2 = 'ومن هنا، بفضل الله وتوفيقه، جاءت فكرة تطبيق «نِعْمَة»؛ ليكون منارةً للتذكرة، ومساحةً لتأمل القلوب ويقظتها. أودعنا بين يديك نفائس من النعم المختارة والمحررة لتكون منطلقاً لإيقاظ الوعي وتجديد الشكر في حياتك..';
    ctx.font = 'bold 25px "Cairo", sans-serif';
    const p2Lines = wrapText(ctx, p2, contentWidth - 60);
    const boxHeight = (p2Lines.length * 40) + 40;

    ctx.save();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80, currentY - 15, 920, boxHeight, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#FFE699';
    let boxTextY = currentY + 15;
    p2Lines.forEach(line => {
      ctx.fillText(line, contentX, boxTextY);
      boxTextY += 40;
    });
    currentY += boxHeight + 25;

    // Paragraph 3
    ctx.font = '24px "Cairo", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    const p3 = 'وكل نعمة إضافية تجدها هنا مستقبلاً، ما هي إلا رسالة خير وشهادة حق كتبها المشاركون من تجاربهم وتأملاتهم، ليكون التطبيق مشكاةً حية نتذكر فيها جميعاً فضل الله.';
    const p3Lines = wrapText(ctx, p3, contentWidth);
    p3Lines.forEach(line => {
      ctx.fillText(line, contentX, currentY);
      currentY += 38;
    });
    currentY += 20;

    // Paragraph 4
    ctx.font = 'bold 25px "Cairo", sans-serif';
    ctx.fillStyle = '#9FE3C6';
    const p4 = 'فاستشعر ما لديك، وشاركنا نعمةً لمستَ فضلها لتكون تذكرةً ونوراً لإخوانك.';
    const p4Lines = wrapText(ctx, p4, contentWidth);
    p4Lines.forEach(line => {
      ctx.fillText(line, contentX, currentY);
      currentY += 40;
    });
    currentY += 25;

    // Golden Motto Badge
    ctx.save();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(260, currentY - 10, 560, 64, 32);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 30px "Amiri", serif';
    ctx.fillStyle = '#F5D77F';
    ctx.fillText('✨  تَذَكَّرْ لِتَشْكُرْ  ✨', 540, currentY + 22);
    ctx.restore();
  } else {
    // English Version
    ctx.font = 'bold 28px "Cairo", sans-serif';
    ctx.fillStyle = '#F5D77F';
    ctx.fillText('Peace and blessings be upon you,', contentX, currentY);
    currentY += 50;

    ctx.font = '23px "Cairo", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    const p1 = 'We live surrounded by endless, boundless blessings, yet constant familiarity breeds heedlessness. We often forget to truly feel what lies within our hands, taking Divine graces for granted until we no longer perceive them..';
    const p1Lines = wrapText(ctx, p1, contentWidth);
    p1Lines.forEach(line => {
      ctx.fillText(line, contentX, currentY);
      currentY += 38;
    });
    currentY += 20;

    const p2 = 'From this realization arose «NEMAA» Platform; a sanctuary for mindfulness and gratitude. In this first release, we offer 100 carefully curated blessings as a gateway to awaken your heart and renew daily thankfulness.';
    ctx.font = 'bold 24px "Cairo", sans-serif';
    const p2Lines = wrapText(ctx, p2, contentWidth - 60);
    const boxHeight = (p2Lines.length * 38) + 36;

    ctx.save();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80, currentY - 15, 920, boxHeight, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#FFE699';
    let boxTextY = currentY + 15;
    p2Lines.forEach(line => {
      ctx.fillText(line, contentX, boxTextY);
      boxTextY += 38;
    });
    currentY += boxHeight + 25;

    ctx.font = 'bold 24px "Cairo", sans-serif';
    ctx.fillStyle = '#9FE3C6';
    const p4 = 'Feel what you have been bestowed, and share a blessing whose grace you have witnessed to inspire others.';
    const p4Lines = wrapText(ctx, p4, contentWidth);
    p4Lines.forEach(line => {
      ctx.fillText(line, contentX, currentY);
      currentY += 38;
    });
    currentY += 25;

    ctx.save();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(260, currentY - 10, 560, 60, 30);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 28px "Cairo", sans-serif';
    ctx.fillStyle = '#F5D77F';
    ctx.fillText('✨  Remember to Give Thanks  ✨', 540, currentY + 20);
    ctx.restore();
  }

  // 6. Footer Card with QR Code
  const qrBoxY = 1560;
  const qrBoxH = 240;
  const qrBoxW = 920;
  const qrBoxX = (1080 - qrBoxW) / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(9, 26, 19, 0.94)';
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 20);
  ctx.fill();

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Generate QR Code
  try {
    const { default: QRCode } = await import('qrcode');
    const qrDataUrl = await QRCode.toDataURL(appUrl, {
      width: 170,
      margin: 1,
      color: {
        dark: '#0B261D',
        light: '#FFFFFF'
      }
    });
    const qrImage = await loadImage(qrDataUrl);

    // Draw White Border for QR
    const qrX = 140;
    const qrY = qrBoxY + 35;
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qrX - 8, qrY - 8, 186, 186, 12);
    ctx.fill();
    ctx.drawImage(qrImage, qrX, qrY, 170, 170);
    ctx.restore();

    // Call to action text next to QR
    const infoX = qrX + 220;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 24px "Cairo", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(isRtl ? 'امسح الباركود لزيارة منصة نِعْمَة' : 'Scan to explore NEMAA Platform', infoX + 480, qrBoxY + 70);

    ctx.font = '20px "Cairo", sans-serif';
    ctx.fillStyle = '#D4AF37';
    ctx.fillText(isRtl ? '100 نعمة مختارة ومحررة بشواهد مباشرة' : '100 curated blessings with direct evidence', infoX + 480, qrBoxY + 115);

    ctx.font = 'bold 18px "Cairo", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('ahmedmootx-sys.github.io/NEMAA', infoX + 480, qrBoxY + 160);
  } catch (err) {
    console.warn('QR Code generation failed:', err);
  }

  // Convert canvas to blob & dataUrl
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const dataUrl = canvas.toDataURL('image/png');
  const filename = isRtl ? 'بوستر-رسالة-منصة-نعمة.png' : 'nemaa-mission-poster.png';

  return { blob, dataUrl, filename };
}

export async function downloadMissionPoster({ lang = 'ar' } = {}) {
  const { dataUrl, filename } = await generateMissionPoster({ lang });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return true;
}

export async function shareMissionPoster({ lang = 'ar' } = {}) {
  const { blob, filename } = await generateMissionPoster({ lang });
  const title = lang === 'ar' ? 'رسالة وهدف منصة نِعْمَة' : 'NEMAA Platform Mission';
  const text = lang === 'ar'
    ? '«السلام عليكم.. نحن نعيش في كنف نِعَمٍ سابغة لا تُحصى، لكن طول الاعتياد يورث الغفلة.. تَذَكَّرْ لِتَشْكُرْ» — منصة نِعْمَة'
    : '«NEMAA Platform — Remember to give thanks»';

  if (navigator.share && blob && navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'image/png' })] })) {
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      await navigator.share({
        files: [file],
        title,
        text
      });
      return true;
    } catch {
      // User cancelled or unsupported
    }
  }

  // Fallback: download directly and copy text
  await downloadMissionPoster({ lang });
  try {
    await navigator.clipboard.writeText(`${text}\nhttps://ahmedmootx-sys.github.io/NEMAA/`);
  } catch { }
  return false;
}


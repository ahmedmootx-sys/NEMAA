/**
 * Share App Poster Generator (شارك تُؤجر)
 * Renders a high-resolution 1080x1920 (9:16) Status/Story poster for WhatsApp & Instagram
 */

import QRCode from 'qrcode';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export async function generateShareAppPoster() {
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  const appUrl = 'https://ahmedmootx-sys.github.io/NEMAA/';
  const displayDomain = 'ahmedmootx-sys.github.io/NEMAA';

  // 1. Background Royal Islamic Night Gradient
  const bg = ctx.createLinearGradient(0, 0, 0, 1920);
  bg.addColorStop(0, '#071510');
  bg.addColorStop(0.25, '#0E271E');
  bg.addColorStop(0.65, '#133529');
  bg.addColorStop(1, '#05100B');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Decorative Double Gold Frame
  ctx.save();
  ctx.shadowColor = 'rgba(212, 175, 55, 0.3)';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(42, 42, 996, 1836, 24);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(58, 58, 964, 1804, 18);
  ctx.stroke();

  // Corner Arabesque Diamonds
  const drawCornerRosette = (x, y) => {
    ctx.save();
    ctx.fillStyle = '#D4AF37';
    // Diamond
    ctx.beginPath();
    ctx.moveTo(x, y - 13);
    ctx.lineTo(x + 13, y);
    ctx.lineTo(x, y + 13);
    ctx.lineTo(x - 13, y);
    ctx.closePath();
    ctx.fill();
    // Inner dot
    ctx.fillStyle = '#071510';
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawCornerRosette(58, 58);
  drawCornerRosette(1022, 58);
  drawCornerRosette(58, 1862);
  drawCornerRosette(1022, 1862);

  // 3. Top Invocation (Bismillah)
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.font = '500 28px "Amiri", serif';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.85)';
  ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 540, 100);

  // Subtle separator line
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(380, 115);
  ctx.lineTo(700, 115);
  ctx.stroke();

  // 4. Royal Arch Medallion for the Logo (Fixes the dark-on-dark contrast issue)
  const archW = 460;
  const archH = 470;
  const archX = (1080 - archW) / 2;
  const archY = 135;

  ctx.save();
  // Outer Golden Glow
  ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
  ctx.shadowBlur = 32;

  // Medallion Background: Luminous Warm Ivory Radial Gradient
  const ivoryGrad = ctx.createRadialGradient(540, archY + archH / 2, 40, 540, archY + archH / 2, 300);
  ivoryGrad.addColorStop(0, '#FFFFFF');
  ivoryGrad.addColorStop(0.6, '#FBF7ED');
  ivoryGrad.addColorStop(1, '#F1E7D0');

  ctx.fillStyle = ivoryGrad;
  ctx.beginPath();
  ctx.roundRect(archX, archY, archW, archH, 36);
  ctx.fill();
  ctx.restore();

  // Medallion Gold Borders
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(archX, archY, archW, archH, 36);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(archX + 8, archY + 8, archW - 16, archH - 16, 28);
  ctx.stroke();

  // Draw Logo / Emblem inside the Ivory Medallion
  try {
    let emblemImg;
    try {
      emblemImg = await loadImage(`${import.meta.env.BASE_URL}brand/emblem-arabic.png`);
    } catch {
      emblemImg = await loadImage(`${import.meta.env.BASE_URL}brand/emblem-bilingual.png`);
    }
    const emblemW = 320;
    const emblemH = 452;
    ctx.drawImage(emblemImg, (1080 - emblemW) / 2, archY + 9, emblemW, emblemH);
  } catch (e) {
    console.warn('Emblem failed to render on canvas:', e);
  }

  // 5. Hadith Callout Box
  const hadithBoxY = 640;
  const hadithBoxW = 860;
  const hadithBoxH = 135;
  const hadithBoxX = (1080 - hadithBoxW) / 2;

  ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(hadithBoxX, hadithBoxY, hadithBoxW, hadithBoxH, 22);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 38px "Amiri", "Cairo", serif';
  ctx.fillStyle = '#F8E29C';
  ctx.fillText('«الدَّالُّ عَلَى الْخَيْرِ كَفَاعِلِهِ»', 540, hadithBoxY + 58);

  ctx.font = '500 22px "Cairo", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText('— رَوَاهُ مُسْلِمٌ فِي صَحِيحِهِ', 540, hadithBoxY + 104);

  // 6. Platform Title & Invitation
  ctx.font = 'bold 50px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('مَنَصَّةُ نِعْمَة', 540, 830);

  ctx.font = '600 26px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = '#D4AF37';
  ctx.fillText('« تَذَكَّرْ لِتَشْكُرْ »', 540, 882);

  // Spiritual Narrative
  ctx.font = 'bold 30px "Cairo", sans-serif';
  ctx.fillStyle = '#F1F5F9';
  ctx.fillText('تطبيق إسلامي تدبّري يُعينك على استشعار نِعَمِ الله الغامرة', 540, 945);

  ctx.font = '500 27px "Cairo", sans-serif';
  ctx.fillStyle = '#CBD5E1';
  ctx.fillText('وترطيب لسانك بذكر الله وحمده وشكره كل يوم', 540, 995);

  // 7. Three Feature Badges (Solid, Emoji-Free, Large & Readable)
  const drawBadge = (text, y) => {
    const badgeW = 800;
    const badgeH = 64;
    const badgeX = (1080 - badgeW) / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(badgeX, y, badgeW, badgeH, 32);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 24px "Cairo", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, 540, y + 41);
  };

  drawBadge('100 نعمة مختارة ومحررة بشواهد مباشرة وتأملات عميقة', 1055);
  drawBadge('أدعية شكر مأثورة، الوضع التدبري الهادئ، ومفكرة الامتنان', 1133);
  drawBadge('تطبيق ويب وهاتف خفيف، مجاني لوجه الله وبدون أي إعلانات', 1211);

  // 8. Premium Showcase Card for Link & QR Code (Guaranteed Zero Overlap)
  const cardY = 1300;
  const cardW = 880;
  const cardH = 380;
  const cardX = (1080 - cardW) / 2;

  // Background for Link/QR Card
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = 'rgba(9, 26, 19, 0.92)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.restore();

  // Gilded Border
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cardX + 6, cardY + 6, cardW - 12, cardH - 12, 22);
  ctx.stroke();

  // Load / Generate QR Code
  try {
    let qrDataUrl;
    try {
      qrDataUrl = await QRCode.toDataURL(appUrl, {
        width: 440,
        margin: 1,
        color: {
          dark: '#071510',
          light: '#FFFFFF'
        }
      });
    } catch {
      qrDataUrl = `${import.meta.env.BASE_URL}brand/qr-code.png`;
    }

    const qrImg = await loadImage(qrDataUrl);

    // Right Side: Framed White QR Card
    const qrBoxSize = 200;
    const qrBoxX = cardX + cardW - 240;
    const qrBoxY = cardY + 45;

    // White QR Backdrop
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
    ctx.fill();

    // Gold frame around QR
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
    ctx.stroke();

    // Draw QR image
    ctx.drawImage(qrImg, qrBoxX + 10, qrBoxY + 10, qrBoxSize - 20, qrBoxSize - 20);

    // QR Label underneath
    ctx.font = 'bold 18px "Cairo", sans-serif';
    ctx.fillStyle = '#E5C358';
    ctx.textAlign = 'center';
    ctx.fillText('امسح الرمز بكاميرا الجوال', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 36);

    // Left Side: Link & Action Text (width bounded to cardW - 270)
    const leftW = cardW - 265;
    const leftCenterX = cardX + leftW / 2;

    // Header Title
    ctx.font = 'bold 26px "Cairo", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('رابط المنصة والتطبيق المباشر', leftCenterX, cardY + 68);

    // Modern Link Pill Box
    const pillW = 470;
    const pillH = 62;
    const pillX = leftCenterX - pillW / 2;
    const pillY = cardY + 100;

    ctx.fillStyle = 'rgba(212, 175, 55, 0.16)';
    ctx.strokeStyle = '#E5C358';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 31);
    ctx.fill();
    ctx.stroke();

    // Clean Domain inside Pill (Modern Cairo Typography)
    ctx.font = 'bold 23px "Cairo", sans-serif';
    ctx.fillStyle = '#F9E498';
    ctx.direction = 'ltr';
    ctx.fillText(displayDomain, leftCenterX, pillY + 40);
    ctx.direction = 'rtl';

    // Spiritual CTA
    ctx.font = '500 20px "Cairo", sans-serif';
    ctx.fillStyle = '#F1F5F9';
    ctx.fillText('شاركه في حالتك لتكون صدقة جارية لك ولأحبابك', leftCenterX, cardY + 225);

    // Offline / PWA Badge
    ctx.font = '400 18px "Cairo", sans-serif';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.fillText('تطبيق فوري خفيف يعمل بدون إنترنت (PWA)', leftCenterX, cardY + 270);

  } catch (err) {
    console.warn('QR Code drawing fallback:', err);
    // Fallback simple link box
    ctx.font = 'bold 26px "Cairo", sans-serif';
    ctx.fillStyle = '#F9E498';
    ctx.fillText(displayDomain, 540, cardY + 120);
  }

  // 9. Footer
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.font = '500 22px "Cairo", sans-serif';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.65)';
  ctx.fillText('منصة نِعْمَة • تَذَكَّرْ لِتَشْكُرْ • صَدَقَةٌ جَارِيَةٌ لِوَجْهِ اللَّهِ', 540, 1845);

  return canvas.toDataURL('image/png', 0.95);
}

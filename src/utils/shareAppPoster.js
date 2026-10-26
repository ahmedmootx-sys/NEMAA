/**
 * Share App Poster Generator (شارك تُؤجر)
 * Renders a high-resolution 1080x1920 (9:16) Status/Story poster for WhatsApp & Instagram
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

export async function generateShareAppPoster() {
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  // Background Royal Gradient
  const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
  bg.addColorStop(0, '#0F241C');
  bg.addColorStop(0.5, '#1B3B2F');
  bg.addColorStop(1, '#091611');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1920);

  // Decorative Border
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, 1000, 1840);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(55, 55, 970, 1810);

  // Corner Diamond Accents
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
  drawDiamond(55, 55, 12);
  drawDiamond(1025, 55, 12);
  drawDiamond(55, 1865, 12);
  drawDiamond(1025, 1865, 12);

  // Bilingual Emblem
  try {
    const emblemImg = await loadImage(`${import.meta.env.BASE_URL}brand/emblem-bilingual.png`);
    const emblemW = 440;
    const emblemH = 440;
    ctx.drawImage(emblemImg, (1080 - emblemW) / 2, 140, emblemW, emblemH);
  } catch (e) {
    console.warn('Emblem failed to render on canvas:', e);
  }

  // Direction and Align
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  // Hadith Callout Box
  const hadithBoxY = 640;
  ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(140, hadithBoxY, 800, 130, 24);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 38px "Amiri", "Cairo", serif';
  ctx.fillStyle = '#E5C358';
  ctx.fillText('«الدَّالُّ عَلَى الْخَيْرِ كَفَاعِلِهِ»', 540, hadithBoxY + 60);

  ctx.font = '500 22px "Cairo", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('— صحيح مسلم', 540, hadithBoxY + 102);

  // Main Invitation
  ctx.font = 'bold 64px "Reem Kufi", "Amiri", serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('مَنَصَّةُ نِعْمَة', 540, 870);

  ctx.font = '600 32px "Amiri", "Cairo", serif';
  ctx.fillStyle = '#D4AF37';
  ctx.fillText('« تَذَكَّرْ لِتَشْكُرْ »', 540, 930);

  // Descriptive text
  ctx.font = '400 30px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.fillText('تطبيق إسلامي تدبّري يُعينك على استشعار نِعَمِ الله الغامرة', 540, 1020);
  ctx.fillText('وترطيب لسانك بالحمد والشكر كل يوم', 540, 1070);

  // 3 Feature Badges
  const drawBadge = (text, y) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(200, y, 680, 72, 36);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 26px "Cairo", sans-serif';
    ctx.fillStyle = '#F7FAFC';
    ctx.fillText(text, 540, y + 46);
  };

  drawBadge('✨ أكثر من 200 نعمة وشاهد موثق من القرآن والحديث', 1150);
  drawBadge('🌿 أدعية شكر مأثورة والوضع التدبري الهادئ', 1245);
  drawBadge('📱 مجاني لوجه الله تعالى وبدون أي إعلانات', 1340);

  // Link & QR Box at bottom
  const linkBoxY = 1480;
  ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(140, linkBoxY, 800, 260, 32);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 30px "Cairo", sans-serif';
  ctx.fillStyle = '#E5C358';
  ctx.fillText('رابط المنصة والتطبيق المباشر:', 540, linkBoxY + 65);

  ctx.font = 'bold 36px "Courier New", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.direction = 'ltr';
  ctx.fillText('https://ahmedmootx-sys.github.io/NEMAA/', 540, linkBoxY + 130);
  ctx.direction = 'rtl';

  ctx.font = '500 24px "Cairo", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('شاركه الآن في حالتك لتكون صدقة جارية لك ولأحبابك 🤲', 540, linkBoxY + 200);

  // Footer
  ctx.font = '400 22px "Cairo", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('منصة نِعْمَة • تَذَكَّرْ لِتَشْكُرْ', 540, 1820);

  return canvas.toDataURL('image/png', 0.95);
}

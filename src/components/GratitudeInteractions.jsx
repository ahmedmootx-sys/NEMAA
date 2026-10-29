import React, { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  HeartHandshake,
  Send
} from 'lucide-react';
import { GRATITUDE_PHRASES } from '../data/blessings';
import { audioEngine } from '../utils/audioEngine';
import { TRANSLATIONS } from '../i18n/translations';

export default function GratitudeInteractions({
  onNextBlessing,
  onPrevBlessing,
  onRandomBlessing,
  onIncrementGratitude,
  currentBlessing,
  onDownloadImage,
  onShare,
  onOpenShareApp,
  onOpenPublishModal,
  lang = 'ar'
}) {
  const [comfortPhrase, setComfortPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSparkling, setIsSparkling] = useState(false);
  const [noorParticles, setNoorParticles] = useState([]);
  const [showAura, setShowAura] = useState(false);
  const [isThanked, setIsThanked] = useState(false);

  const handleAlhamdulillahClick = () => {
    // 1. Play deep, warm spiritual chime
    audioEngine.playGratitudeChime();

    // 2. Increment daily counter
    onIncrementGratitude();

    // 3. Pick random comforting phrase
    const randomPhrase = GRATITUDE_PHRASES[Math.floor(Math.random() * GRATITUDE_PHRASES.length)];
    setComfortPhrase(randomPhrase);

    // 4. Trigger serene Noor Aura & floating light particles (بديل الكونفيتي الروحي)
    setIsSparkling(true);
    setIsThanked(true);
    setTimeout(() => setIsThanked(false), 2800);
    setShowAura(true);
    setTimeout(() => setIsSparkling(false), 800);
    setTimeout(() => setShowAura(false), 1200);

    // Generate 4 gentle, delicate floating light sparks
    const batchId = Date.now();
    const sparks = Array.from({ length: 4 }, (_, i) => ({
      id: `${batchId}_${i}`,
      dx: `${(Math.random() - 0.5) * 70}px`,
      size: `${3 + Math.random() * 3.5}px`,
      delay: `${i * 0.06}s`
    }));

    setNoorParticles(prev => [...prev.slice(-6), ...sparks]);
    setTimeout(() => {
      setNoorParticles(prev => prev.filter(p => !p.id.startsWith(String(batchId))));
    }, 1500);
  };

  const handleCopy = () => {
    if (!currentBlessing) return;
    const textToCopy = `«${currentBlessing.title}»\n\n${currentBlessing.reflection}\n\n${currentBlessing.proof ? currentBlessing.proof + (currentBlessing.proofSource ? ` (${currentBlessing.proofSource})` : '') + '\n\n' : ''}من منصة نِعْمَة — تَذَكَّرْ لِتَشْكُرْ`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;

  return (
    <div className="gratitude-action-section">
      {/* Prominent "الحمد لله" Button with Serene Noor Aura & Particles */}
      <div className="gratitude-btn-wrapper">
        {showAura && <div className="noor-aura-ring" aria-hidden="true" />}
        {noorParticles.map(p => (
          <div 
            key={p.id}
            className="noor-sparkle-particle"
            style={{
              '--dx': p.dx,
              width: p.size,
              height: p.size,
              animationDelay: p.delay
            }}
            aria-hidden="true"
          />
        ))}

        <button
          id="btn-alhamdulillah-main"
          className={`btn-alhamdulillah ${isSparkling ? 'pulse-glow' : ''}`}
          onClick={handleAlhamdulillahClick}
          title="اضغط للحمد والامتنان واستشعار السكينة"
          aria-label={t.alhamdulillahBtn}
        >
          <Sparkles size={20} color="#1A2B25" />
          <span>{t.alhamdulillahBtn}</span>
          <Sparkles size={20} color="#1A2B25" />
        </button>
      </div>

      {/* Floating Comforting Gratitude Phrase */}
      {comfortPhrase && (
        <div className="comfort-phrase-toast" role="status">
          <HeartHandshake size={18} color="var(--color-gold)" style={{ flexShrink: 0 }} />
          <span>{comfortPhrase}</span>
        </div>
      )}

      {/* Navigation Bar: Prev, Random "نعمة جديدة", Next */}
      <div className="navigation-bar">
        {/* Next Button (in RTL: right arrow goes forward) */}
        <button
          className="btn-nav-arrow"
          onClick={onNextBlessing}
          title={t.nextBlessingBtn}
          aria-label={t.nextBlessingBtn}
        >
          <ChevronRight size={20} />
        </button>

        {/* Core "نعمة جديدة" Button */}
        <button
          id="btn-new-blessing"
          className="btn-new-blessing"
          onClick={onRandomBlessing}
          title={`${t.newBlessingBtn} (Space)`}
        >
          <RefreshCw size={17} />
          <span>{t.newBlessingBtn}</span>
        </button>

        {/* Previous Button (in RTL: left arrow goes back) */}
        <button
          className="btn-nav-arrow"
          onClick={onPrevBlessing}
          title={t.prevBlessingBtn}
          aria-label={t.prevBlessingBtn}
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Quick Toolbar (Download, Copy, Share) */}
      <div className="card-quick-toolbar">
        <button 
          className="toolbar-btn"
          onClick={() => onDownloadImage(currentBlessing)}
          title={t.downloadBtn}
        >
          <Download size={14} />
          <span>{t.downloadBtn}</span>
        </button>

        <button 
          className="toolbar-btn"
          onClick={handleCopy}
          title={t.copyBtn}
        >
          {copied ? <Check size={14} color="#38A169" /> : <Copy size={14} />}
          <span>{copied ? t.copiedText : t.copyBtn}</span>
        </button>

        <button 
          className="toolbar-btn"
          onClick={() => onShare(currentBlessing)}
          title={t.shareBtn}
        >
          <Share2 size={14} />
          <span>{t.shareBtn}</span>
        </button>
      </div>

      {/* Community Publish Button (انشر نِعمة على نِعْمَة) */}
      <button
        type="button"
        id="btn-publish-blessing-trigger"
        className="btn-publish-blessing-trigger"
        onClick={onOpenPublishModal}
        title={lang === 'ar' ? 'انشر نِعمة استشعرتها مع جميع زوار المنصة لتُؤجر على تذكيرهم' : 'Publish a blessing to all visitors worldwide'}
      >
        <Send size={16} style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
        <span>{lang === 'ar' ? 'انشر نِعمة على نِعْمَة' : 'Publish a Blessing on NEMAA'}</span>
        <Sparkles size={15} color="var(--color-gold)" />
      </button>

      {/* Dedicated Spiritual Share Button (شَارِكْ تُؤْجَرْ — صَدَقَةٌ جَارِيَةٌ) */}
      <button
        type="button"
        id="btn-share-to-reward-main"
        className="btn-share-to-reward"
        onClick={onOpenShareApp}
        title="شَارِكْ تُؤْجَرْ — تصميم بوستر للنشر في الحالة ورابط التحميل"
      >
        <HeartHandshake size={18} color="var(--color-gold)" />
        <span>{t.shareToRewardBtn}</span>
        <span className="btn-share-reward-subtitle">«الدَّالُّ عَلَى الْخَيْرِ كَفَاعِلِهِ»</span>
      </button>
    </div>
  );
}

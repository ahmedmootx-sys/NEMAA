import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  HeartHandshake
} from 'lucide-react';
import { GRATITUDE_PHRASES } from '../data/blessings';
import { audioEngine } from '../utils/audioEngine';

export default function GratitudeInteractions({
  onNextBlessing,
  onPrevBlessing,
  onRandomBlessing,
  onIncrementGratitude,
  currentBlessing,
  onDownloadImage,
  onShare,
  dailyCount
}) {
  const [comfortPhrase, setComfortPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSparkling, setIsSparkling] = useState(false);

  const handleAlhamdulillahClick = (e) => {
    // 1. Play soft spiritual chime
    audioEngine.playGratitudeChime();

    // 2. Increment daily counter
    onIncrementGratitude();

    // 3. Pick random comforting phrase
    const randomPhrase = GRATITUDE_PHRASES[Math.floor(Math.random() * GRATITUDE_PHRASES.length)];
    setComfortPhrase(randomPhrase);

    // 4. Trigger confetti particles with gold & emerald tones
    setIsSparkling(true);
    setTimeout(() => setIsSparkling(false), 800);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 32,
      spread: 55,
      origin: { x, y },
      colors: ['#D4AF37', '#2C4A3E', '#F5D77F', '#528974', '#FFF9E6'],
      ticks: 180,
      gravity: 0.85,
      scalar: 0.85,
      shapes: ['circle', 'square']
    });
  };

  const handleCopy = () => {
    if (!currentBlessing) return;
    const textToCopy = `«${currentBlessing.title}»\n\n${currentBlessing.reflection}\n\n${currentBlessing.proof ? currentBlessing.proof + (currentBlessing.proofSource ? ` (${currentBlessing.proofSource})` : '') + '\n\n' : ''}من منصة نِعْمَة ✨ تَذَكَّرْ لِتَشْكُرْ`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="gratitude-action-section">
      {/* Prominent "الحمد لله" Button */}
      <button
        id="btn-alhamdulillah-main"
        className={`btn-alhamdulillah ${isSparkling ? 'pulse-glow' : ''}`}
        onClick={handleAlhamdulillahClick}
        title="اضغط للحمد والامتنان"
        aria-label="الحمد لله"
      >
        <Sparkles size={20} color="#1A2B25" />
        <span>الْحَمْدُ لِلَّهِ</span>
        <Sparkles size={20} color="#1A2B25" />
      </button>

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
          title="النعمة التالية"
          aria-label="النعمة التالية"
        >
          <ChevronRight size={20} />
        </button>

        {/* Core "نعمة جديدة" Button */}
        <button
          id="btn-new-blessing"
          className="btn-new-blessing"
          onClick={onRandomBlessing}
          title="عرض نعمة عشوائية (مسافة)"
        >
          <RefreshCw size={17} />
          <span>نِعْمَةٌ جَدِيدَةٌ</span>
        </button>

        {/* Previous Button (in RTL: left arrow goes back) */}
        <button
          className="btn-nav-arrow"
          onClick={onPrevBlessing}
          title="النعمة السابقة"
          aria-label="النعمة السابقة"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Quick Toolbar (Download, Copy, Share) */}
      <div className="card-quick-toolbar">
        <button 
          className="toolbar-btn"
          onClick={() => onDownloadImage(currentBlessing)}
          title="تحميل كبطاقة مصممة"
        >
          <Download size={14} />
          <span>تحميل البطاقة</span>
        </button>

        <button 
          className="toolbar-btn"
          onClick={handleCopy}
          title="نسخ نص التدبر"
        >
          {copied ? <Check size={14} color="#38A169" /> : <Copy size={14} />}
          <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
        </button>

        <button 
          className="toolbar-btn"
          onClick={() => onShare(currentBlessing)}
          title="مشاركة على وسائل التواصل"
        >
          <Share2 size={14} />
          <span>مشاركة النعمة</span>
        </button>
      </div>
    </div>
  );
}

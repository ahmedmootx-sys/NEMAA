import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Sparkles, 
  Check, 
  Trash2, 
  Calendar, 
  Flame, 
  HeartHandshake,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../utils/audioEngine';

export default function GratitudeJournalDrawer({ isOpen, onClose }) {
  // Journal entries: array of { id, dateStr, dateKey, items: [string, string, string], createdAt }
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_gratitude_journal');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [item1, setItem1] = useState('');
  const [item2, setItem2] = useState('');
  const [item3, setItem3] = useState('');
  const [isSavedToday, setIsSavedToday] = useState(false);
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'history'

  const todayKey = new Date().toISOString().split('T')[0];
  const todayArabicDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Check if today already has an entry
  useEffect(() => {
    const todayEntry = entries.find(e => e.dateKey === todayKey);
    if (todayEntry) {
      setItem1(todayEntry.items[0] || '');
      setItem2(todayEntry.items[1] || '');
      setItem3(todayEntry.items[2] || '');
      setIsSavedToday(true);
    } else {
      setIsSavedToday(false);
    }
  }, [entries, todayKey]);

  // Calculate Streak
  const streak = calculateStreak(entries);

  function calculateStreak(allEntries) {
    if (!allEntries || allEntries.length === 0) return 0;
    const dates = new Set(allEntries.map(e => e.dateKey));
    let count = 0;
    let checkDate = new Date();

    // Check if recorded today or yesterday
    const todayStr = checkDate.toISOString().split('T')[0];
    if (!dates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split('T')[0];
      if (!dates.has(yesterdayStr)) return 0;
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dates.has(dateStr)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }

  const handleSave = (e) => {
    e.preventDefault();
    if (!item1.trim() && !item2.trim() && !item3.trim()) return;

    const newItems = [item1.trim(), item2.trim(), item3.trim()].filter(Boolean);

    let updatedEntries;
    const existingIndex = entries.findIndex(e => e.dateKey === todayKey);
    if (existingIndex >= 0) {
      updatedEntries = [...entries];
      updatedEntries[existingIndex] = {
        ...updatedEntries[existingIndex],
        items: newItems,
        updatedAt: Date.now()
      };
    } else {
      const newEntry = {
        id: Date.now(),
        dateKey: todayKey,
        dateStr: todayArabicDate,
        items: newItems,
        createdAt: Date.now()
      };
      updatedEntries = [newEntry, ...entries];
    }

    setEntries(updatedEntries);
    localStorage.setItem('nemaa_gratitude_journal', JSON.stringify(updatedEntries));
    setIsSavedToday(true);

    // Audio Chime & Confetti
    try {
      audioEngine.playGratitudeChime();
    } catch {}

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const handleDeleteEntry = (id) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem('nemaa_gratitude_journal', JSON.stringify(updated));
    if (entries.find(e => e.id === id)?.dateKey === todayKey) {
      setIsSavedToday(false);
      setItem1('');
      setItem2('');
      setItem3('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div 
        className="drawer-content journal-drawer" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="دفتر الامتنان وسجل النعم"
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <div className="drawer-icon-wrap" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--color-gold)' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="drawer-title">دَفْتَرُ الحَمْدِ وَالامْتِنَان</h3>
              <p className="drawer-subtitle">دوِّن ثلاث نِعَم امتننت بها في يومك</p>
            </div>
          </div>

          <button 
            className="btn-icon" 
            onClick={onClose}
            aria-label="إغلاق الدفتر"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Summary Bar: Streak & Navigation */}
        <div className="journal-tabs-bar">
          <button 
            className={`journal-tab-btn ${activeTab === 'write' ? 'active' : ''}`}
            onClick={() => setActiveTab('write')}
          >
            <span>تدوين اليوم</span>
            {isSavedToday && <Check size={14} color="#38A169" />}
          </button>
          <button 
            className={`journal-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span>سجل الأيام ({entries.length})</span>
          </button>

          {streak > 0 && (
            <div className="journal-streak-pill" title={`مستمر في التدوين لـ ${streak} أيام متتالية`}>
              <Flame size={14} color="#E53E3E" />
              <span>{streak} أيام</span>
            </div>
          )}
        </div>

        {/* Tab 1: Write Today's Gratitude */}
        {activeTab === 'write' && (
          <form className="journal-body" onSubmit={handleSave}>
            <div className="journal-date-banner">
              <Calendar size={15} color="var(--color-primary)" />
              <span>{todayArabicDate}</span>
              {isSavedToday && (
                <span className="saved-badge">✓ تم الحفظ اليوم</span>
              )}
            </div>

            <p className="journal-prompt-text">
              «اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ»
            </p>

            <div className="journal-inputs-group">
              <div className="journal-input-item">
                <span className="journal-num-badge">١</span>
                <input
                  type="text"
                  className="journal-input"
                  placeholder="الحمد لله على نعمة استشعرتها في صحتي أو بدني..."
                  value={item1}
                  onChange={(e) => setItem1(e.target.value)}
                  maxLength={120}
                />
              </div>

              <div className="journal-input-item">
                <span className="journal-num-badge">٢</span>
                <input
                  type="text"
                  className="journal-input"
                  placeholder="الحمد لله على لطف خفي أو موقف تيسر لي اليوم..."
                  value={item2}
                  onChange={(e) => setItem2(e.target.value)}
                  maxLength={120}
                />
              </div>

              <div className="journal-input-item">
                <span className="journal-num-badge">٣</span>
                <input
                  type="text"
                  className="journal-input"
                  placeholder="الحمد لله على أهلي، مأواي، أو رزق كفاني..."
                  value={item3}
                  onChange={(e) => setItem3(e.target.value)}
                  maxLength={120}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary journal-save-btn"
              disabled={!item1.trim() && !item2.trim() && !item3.trim()}
            >
              <HeartHandshake size={18} />
              <span>{isSavedToday ? "تحديث نعم اليوم في الدفتر" : "حفظ نعم اليوم في دفتري"}</span>
            </button>
          </form>
        )}

        {/* Tab 2: Journal History */}
        {activeTab === 'history' && (
          <div className="journal-history-list">
            {entries.length === 0 ? (
              <div className="journal-empty-history">
                <BookOpen size={40} color="var(--text-faint)" />
                <h4>دفترك ينتظر أول تدبر</h4>
                <p>ابدأ بتدوين نعم اليوم لتحتفظ بها في سجلك وتتذكر فضل الله عليك كلما فتحت التطبيق.</p>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setActiveTab('write')}
                  style={{ marginTop: '12px' }}
                >
                  دوّن الآن ✨
                </button>
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="journal-history-card">
                  <div className="journal-card-top">
                    <span className="journal-card-date">
                      <Calendar size={13} />
                      {entry.dateStr}
                    </span>
                    <button 
                      className="btn-icon btn-sm" 
                      onClick={() => handleDeleteEntry(entry.id)}
                      title="حذف هذا اليوم"
                      aria-label="حذف"
                    >
                      <Trash2 size={14} color="#E53E3E" />
                    </button>
                  </div>
                  <ul className="journal-card-items">
                    {entry.items.map((item, idx) => (
                      <li key={idx}>
                        <span className="bullet-dot">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

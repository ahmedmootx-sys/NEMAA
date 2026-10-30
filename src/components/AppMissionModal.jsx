import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Heart, Check, Download, Share2, Loader2 } from 'lucide-react';
import { downloadMissionPoster, shareMissionPoster } from '../utils/missionPoster';

export default function AppMissionModal({ isOpen, onClose, lang = 'ar' }) {
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterFeedback, setPosterFeedback] = useState('');

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsGeneratingPoster(true);
    setPosterFeedback('');
    try {
      await downloadMissionPoster({ lang });
      setPosterFeedback(lang === 'ar' ? 'تم تنزيل بوستر رسالة المنصة بنجاح ✨' : 'Poster downloaded successfully ✨');
      setTimeout(() => setPosterFeedback(''), 4000);
    } catch (err) {
      console.warn('Error downloading mission poster:', err);
      setPosterFeedback(lang === 'ar' ? 'حدث خطأ أثناء تنزيل البوستر' : 'Failed to download poster');
      setTimeout(() => setPosterFeedback(''), 3000);
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const handleShare = async () => {
    setIsGeneratingPoster(true);
    setPosterFeedback('');
    try {
      const shared = await shareMissionPoster({ lang });
      if (shared) {
        setPosterFeedback(lang === 'ar' ? 'تمت المشاركة بنجاح ✨' : 'Shared successfully ✨');
      } else {
        setPosterFeedback(lang === 'ar' ? 'تم تنزيل البوستر ونسخ الرابط لمشاركته كحالة ✨' : 'Poster downloaded & link copied ✨');
      }
      setTimeout(() => setPosterFeedback(''), 4000);
    } catch (err) {
      console.warn('Error sharing mission poster:', err);
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true"
      style={{
        zIndex: 10005,
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div 
        className="modal-content app-mission-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '92%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-card)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-gold)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden'
        }}
      >
        {/* Header with Spiritual Emblem */}
        <div style={{
          position: 'relative',
          padding: '24px 24px 18px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(44,74,62,0.06) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}>
          <button 
            type="button" 
            onClick={onClose} 
            aria-label="إغلاق"
            style={{ 
              position: 'absolute', 
              top: '16px', 
              left: lang === 'ar' ? '16px' : 'auto', 
              right: lang === 'ar' ? 'auto' : '16px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--surface-card)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              transition: 'all 0.2s ease',
              padding: 0
            }}
          >
            <X size={18} />
          </button>

          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'var(--surface-card)',
            border: '1.5px solid var(--color-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: '0 4px 16px rgba(212,175,55,0.25)'
          }}>
            <Sparkles size={24} color="var(--color-gold)" />
          </div>

          <h3 style={{
            margin: '0 0 4px',
            fontSize: '20px',
            fontWeight: '800',
            color: 'var(--text-heading)',
            fontFamily: 'var(--font-arabic-heading)'
          }}>
            {lang === 'ar' ? 'رِسَالَةُ وَهَدَفُ مَنَصَّةِ «نِعْمَة»' : 'The Mission & Vision of NEMAA'}
          </h3>

          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--color-gold)',
            display: 'inline-block'
          }}>
            « تَذَكَّرْ لِتَشْكُرْ »
          </span>
        </div>

        {/* Message Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          fontSize: '15.5px',
          lineHeight: '2.0',
          color: 'var(--text-main)',
          fontFamily: 'var(--font-arabic-body)',
          textAlign: 'justify',
          textJustify: 'inter-word'
        }}>
          {lang === 'ar' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontWeight: '700', color: 'var(--color-primary)', fontSize: '17px', textAlign: 'center' }}>
                السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ،
              </p>

              <p style={{ margin: 0 }}>
                نَحْنُ نَعِيشُ فِي كَنَفِ نِعَمٍ سَابِغَةٍ لَا تُحْصَى، لَكِنَّ طُولَ الِاعْتِيَادِ يُورِثُ الْغَفْلَةَ، فَنَنْسَى أَنْ نَسْتَشْعِرَ مَا بَيْنَ أَيْدِينَا، أَوْ نَغْفُلُ عَنِ التَّفَكُّرِ فِي أَلْطَافِ اللَّهِ حَتَّى نَأْلَفَهَا وَلَا نَرَاهَا..
              </p>

              <div style={{
                background: 'var(--surface-sunken, rgba(44, 74, 62, 0.04))',
                borderRight: '3.5px solid var(--color-gold)',
                padding: '14px 18px',
                borderRadius: '12px',
                margin: '4px 0'
              }}>
                <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-heading)' }}>
                  وَمِنْ هُنَا، بِفَضْلِ اللَّهِ وَتَوْفِيقِهِ، جَاءَتْ فِكْرَةُ تَطْبِيقِ «نِعْمَة»؛ لِيَكُونَ مَنَارَةً لِلتَّذْكِرَةِ، وَمَسَاحَةً لِتَأَمُّلِ الْقُلُوبِ وَيَقَظَتِهَا. أَوْدَعْنَا بَيْنَ يَدَيْكَ فِي الإِصْدَارِ الأَوَّلِ 100 نِعْمَةٍ مُخْتَارَةٍ وَمُحَرَّرَةٍ لِتَكُونَ مُنْطَلَقاً لِإِيقَاظِ الْوَعْيِ وَتَجْدِيدِ الشُّكْرِ فِي حَيَاتِك..
                </p>
              </div>

              <p style={{ margin: 0 }}>
                وَكُلُّ نِعْمَةٍ إِضَافِيَّةٍ تَجِدُهَا هُنَا مُسْتَقْبَلاً، مَا هِيَ إِلَّا رِسَالَةُ خَيْرٍ وَشَهَادَةُ حَقٍّ كَتَبَهَا الْمُشَارِكُونَ مِنْ تَجَارِبِهِمْ وَتَأَمُّلَاتِهِمْ، لِيَكُونَ التَّطْبِيقُ مِشْكَاةً حَيَّةً نَتَذَكَّرُ فِيهَا جَمِيعاً فَضْلَ اللَّهِ.
              </p>

              <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-primary)' }}>
                فَاسْتَشْعِرْ مَا لَدَيْك، وَشَارِكْنَا نِعْمَةً لَمَسْتَ فَضْلَهَا لِتَكُونَ تذكرةً وَنُوراً لإخوانك.
              </p>

              <div style={{
                textAlign: 'center',
                margin: '8px 0 0',
                padding: '10px',
                background: 'rgba(212, 175, 55, 0.1)',
                borderRadius: '14px',
                border: '1px dashed var(--color-gold)'
              }}>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-gold)', letterSpacing: '0.04em' }}>
                  تَذَكَّرْ لِتَشْكُرْ.. ✨
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', direction: 'ltr', textAlign: 'left' }}>
              <p style={{ margin: 0, fontWeight: '700', color: 'var(--color-primary)', fontSize: '17px' }}>
                Peace and blessings be upon you,
              </p>
              <p style={{ margin: 0 }}>
                We live surrounded by endless, boundless blessings, yet constant familiarity breeds heedlessness. We often forget to truly feel what lies within our hands, taking God's subtle graces for granted until we no longer perceive them.
              </p>
              <div style={{
                background: 'var(--surface-sunken, rgba(44, 74, 62, 0.04))',
                borderLeft: '3.5px solid var(--color-gold)',
                padding: '14px 18px',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-heading)' }}>
                  From this realization, by God's grace and guidance, arose «NEMAA» Platform; a sanctuary for mindfulness and gratitude. In this first release, we offer 100 carefully curated blessings as a gateway to awaken your heart and renew daily thankfulness.
                </p>
              </div>
              <p style={{ margin: 0 }}>
                Every additional blessing you discover here in the future is a message of goodness and genuine reflection contributed by fellow seekers, making this platform a living beacon where we collectively celebrate divine benevolence.
              </p>
              <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-primary)' }}>
                Feel what you have been bestowed, and share a blessing whose light you have witnessed to inspire and illuminate others.
              </p>
              <div style={{
                textAlign: 'center',
                margin: '8px 0 0',
                padding: '10px',
                background: 'rgba(212, 175, 55, 0.1)',
                borderRadius: '14px',
                border: '1px dashed var(--color-gold)'
              }}>
                <span style={{ fontSize: '17px', fontWeight: '800', color: 'var(--color-gold)' }}>
                  Remember to Give Thanks.. ✨
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Poster Actions Section */}
        <div style={{
          padding: '12px 22px',
          background: 'var(--surface-sunken)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
              {lang === 'ar' ? 'مشاركة رسالة المنصة كبوستر فاخر:' : 'Share platform mission poster:'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: '700' }}>
              9:16 Story / Status
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              disabled={isGeneratingPoster}
              onClick={handleDownload}
              style={{
                padding: '9px 12px',
                borderRadius: '12px',
                background: 'var(--surface-card)',
                border: '1px solid var(--border-gold, #D4AF37)',
                color: 'var(--color-primary)',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: isGeneratingPoster ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              {isGeneratingPoster ? <Loader2 size={15} className="spin-animate" /> : <Download size={15} color="var(--color-gold)" />}
              <span>{lang === 'ar' ? 'تنزيل البوستر' : 'Download Poster'}</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingPoster}
              onClick={handleShare}
              style={{
                padding: '9px 12px',
                borderRadius: '12px',
                background: 'rgba(212, 175, 55, 0.14)',
                border: '1px solid var(--color-gold)',
                color: 'var(--color-primary)',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: isGeneratingPoster ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              {isGeneratingPoster ? <Loader2 size={15} className="spin-animate" /> : <Share2 size={15} color="var(--color-gold)" />}
              <span>{lang === 'ar' ? 'مشاركة كحالة' : 'Share Status'}</span>
            </button>
          </div>

          {posterFeedback && (
            <div style={{
              fontSize: '11.5px',
              color: 'var(--color-primary)',
              textAlign: 'center',
              fontWeight: '700',
              marginTop: '2px'
            }}>
              {posterFeedback}
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--surface-card)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              maxWidth: '320px',
              padding: '12px 20px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #1A382B 0%, #2C4A3E 60%, #15261F 100%)',
              color: '#FFFFFF',
              border: '1.5px solid var(--color-gold)',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(212,175,55,0.3)'
            }}
          >
            <Check size={17} />
            <span>{lang === 'ar' ? 'ابدأ رحلة الشكر والتدبّر' : 'Begin the Journey of Gratitude'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}


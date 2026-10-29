import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Moon, 
  Sun, 
  Type, 
  Globe, 
  Sparkles, 
  Scroll, 
  Compass, 
  MessageSquare, 
  Share2, 
  Download, 
  Edit3, 
  Trash2, 
  Heart, 
  ChevronLeft, 
  ChevronRight,
  PlusCircle,
  Check
} from 'lucide-react';

export default function SettingsScreen({
  isOpen,
  onClose,
  theme = 'day',
  onToggleTheme,
  currentLang = 'ar',
  onToggleLanguage,
  fontMode = 'modern',
  onToggleFontMode,
  myPublishedBlessings = [],
  onEditBlessing,
  onDeleteBlessing,
  onOpenPublish,
  onOpenGuide,
  onOpenMission,
  onOpenFeedback,
  onOpenShareApp,
  deferredPrompt,
  onInstallPwa,
  getBlessingPraises
}) {
  if (!isOpen) return null;

  const isRtl = currentLang === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const NextChevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div 
      className="settings-screen-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg-main)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.22s ease-out'
      }}
    >
      {/* Sticky Header Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--header-bg, var(--surface-card))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
      }}>
        {/* Back Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={isRtl ? 'رجوع' : 'Back'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--surface-sunken)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            transition: 'all 0.2s ease',
            padding: 0
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <BackArrow size={20} />
        </button>

        {/* Center Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0,
            fontSize: '17.5px',
            fontWeight: '800',
            fontFamily: 'var(--font-arabic-heading)',
            color: 'var(--text-heading)'
          }}>
            {isRtl ? 'إعدادات المنصة' : 'Settings & Preferences'}
          </h1>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            {isRtl ? 'تخصيص المظهر، نعمك المنشورة، والتواصل' : 'Preferences & My Blessings'}
          </span>
        </div>

        {/* Right balance spacer */}
        <div style={{ width: '40px' }} />
      </header>

      {/* Main Settings Body */}
      <main style={{
        maxWidth: '680px',
        width: '100%',
        margin: '0 auto',
        padding: '20px 16px 60px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxSizing: 'border-box'
      }}>

        {/* Section 1: Appearance & Typography */}
        <section>
          <div style={{
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '1px',
            color: 'var(--color-gold)',
            textTransform: 'uppercase',
            marginBottom: '10px',
            padding: '0 4px'
          }}>
            {isRtl ? 'المظهر والخطوط' : 'Appearance & Fonts'}
          </div>

          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            {/* Dark Mode Switch */}
            <div style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(212,175,55,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)'
                }}>
                  {theme === 'night' ? <Moon size={19} /> : <Sun size={19} />}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'الوضع الليلي (Night Mode)' : 'Dark Theme'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {theme === 'night' 
                      ? (isRtl ? 'مُفعّل — ألوان هادئة ومريحة للعين' : 'Active — easy on eyes')
                      : (isRtl ? 'غير مفعّل — وضع النهار الدافئ' : 'Day mode')}
                  </div>
                </div>
              </div>

              {/* iOS-Style Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={theme === 'night'}
                onClick={onToggleTheme}
                aria-label={isRtl ? 'تبديل المظهر' : 'Toggle Theme'}
                style={{
                  width: '52px',
                  height: '30px',
                  borderRadius: '30px',
                  background: theme === 'night' ? 'var(--color-gold)' : 'var(--surface-sunken)',
                  border: '1.5px solid var(--border-subtle)',
                  padding: '2px',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  flexShrink: 0
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  transform: theme === 'night' 
                    ? (isRtl ? 'translateX(-22px)' : 'translateX(22px)') 
                    : 'translateX(0)',
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </button>
            </div>

            {/* Font Style Selector */}
            <div style={{
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(44,74,62,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)'
                }}>
                  <Type size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'نمط الخط في النعم' : 'Blessing Typography'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {fontMode === 'modern' 
                      ? (isRtl ? 'خط حديث واضح ومريح للعين بدون تداخل (Cairo & Tajawal)' : 'Modern Cairo & Tajawal')
                      : (isRtl ? 'خط كلاسيكي أصيل بنكهة تراثية (Reem Kufi)' : 'Classic Calligraphy')}
                  </div>
                </div>
              </div>

              {/* Segmented Selector for Fonts */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: 'var(--surface-sunken)',
                padding: '4px',
                borderRadius: '14px'
              }}>
                <button
                  type="button"
                  onClick={() => { if (fontMode !== 'modern') onToggleFontMode(); }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: fontMode === 'modern' ? 'var(--surface-card)' : 'transparent',
                    color: fontMode === 'modern' ? 'var(--color-primary)' : 'var(--text-muted)',
                    fontWeight: fontMode === 'modern' ? '800' : '500',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: fontMode === 'modern' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  {fontMode === 'modern' && <Check size={14} color="var(--color-gold)" />}
                  <span>{isRtl ? 'حديث واضح (موصى به)' : 'Modern (Clear)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { if (fontMode !== 'classic') onToggleFontMode(); }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: fontMode === 'classic' ? 'var(--surface-card)' : 'transparent',
                    color: fontMode === 'classic' ? 'var(--color-primary)' : 'var(--text-muted)',
                    fontWeight: fontMode === 'classic' ? '800' : '500',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: fontMode === 'classic' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  {fontMode === 'classic' && <Check size={14} color="var(--color-gold)" />}
                  <span>{isRtl ? 'كلاسيكي تقليدي' : 'Classic Traditional'}</span>
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(56, 161, 105, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38A169'
                }}>
                  <Globe size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'لغة المنصة' : 'Language'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {currentLang === 'ar' ? 'العربية (Arabic)' : 'English (الإنجليزية)'}
                  </div>
                </div>
              </div>

              {/* Segmented Language Pills */}
              <div style={{
                display: 'inline-flex',
                background: 'var(--surface-sunken)',
                padding: '3px',
                borderRadius: '12px',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => { if (currentLang !== 'ar') onToggleLanguage(); }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '9px',
                    border: 'none',
                    background: currentLang === 'ar' ? 'var(--surface-card)' : 'transparent',
                    color: currentLang === 'ar' ? 'var(--color-primary)' : 'var(--text-muted)',
                    fontWeight: currentLang === 'ar' ? '800' : '500',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: currentLang === 'ar' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => { if (currentLang !== 'en') onToggleLanguage(); }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '9px',
                    border: 'none',
                    background: currentLang === 'en' ? 'var(--surface-card)' : 'transparent',
                    color: currentLang === 'en' ? 'var(--color-primary)' : 'var(--text-muted)',
                    fontWeight: currentLang === 'en' ? '800' : '500',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: currentLang === 'en' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: My Published Blessings (نِعَمي المنشورة) */}
        <section>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            padding: '0 4px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '1px',
              color: 'var(--color-gold)',
              textTransform: 'uppercase'
            }}>
              {isRtl ? 'نِعَمي المنشورة' : 'My Published Blessings'}
            </div>
            {myPublishedBlessings.length > 0 && (
              <span style={{
                fontSize: '11.5px',
                fontWeight: '700',
                background: 'rgba(212,175,55,0.15)',
                color: 'var(--color-gold)',
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
                {myPublishedBlessings.length} {isRtl ? 'نعمة' : 'items'}
              </span>
            )}
          </div>

          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            overflow: 'hidden',
            padding: '16px'
          }}>
            {myPublishedBlessings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '28px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(212,175,55,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)'
                }}>
                  <Sparkles size={26} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800', color: 'var(--text-heading)' }}>
                    {isRtl ? 'لم تنشر أي نعمة بعد' : 'No published blessings yet'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: '1.6' }}>
                    {isRtl 
                      ? 'شارك إخوانك نعمة لمست فضلها في حياتك لتكون تذكرة ونوراً يستشعر به الآخرون ويحمدون الله عليها.'
                      : 'Share a blessing you experienced to inspire others and encourage gratitude.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setTimeout(() => onOpenPublish && onOpenPublish(), 200);
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary)',
                    color: '#FFFFFF',
                    border: '1px solid var(--color-gold)',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(44,74,62,0.3)'
                  }}
                >
                  <PlusCircle size={16} />
                  <span>{isRtl ? 'انشر أول نعمة الآن' : 'Publish a Blessing Now'}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myPublishedBlessings.map((blessing) => {
                  const praises = getBlessingPraises ? getBlessingPraises(blessing) : (blessing.praisesCount || 0);
                  return (
                    <div
                      key={blessing.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: 'var(--surface-sunken)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                        <div>
                          <h4 style={{
                            margin: '0 0 4px',
                            fontSize: '15.5px',
                            fontWeight: '800',
                            fontFamily: 'var(--font-arabic-heading)',
                            color: 'var(--text-heading)'
                          }}>
                            {blessing.title}
                          </h4>
                          <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: 'var(--text-main)',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {blessing.reflection}
                          </p>
                        </div>
                      </div>

                      {/* Praises & Action Buttons */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(0,0,0,0.05)',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {/* Live Praises Badge */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: 'var(--color-primary)',
                          background: 'rgba(212,175,55,0.14)',
                          padding: '4px 10px',
                          borderRadius: '10px'
                        }}>
                          <Heart size={13} fill="#E53E3E" color="#E53E3E" />
                          <span>
                            {isRtl ? `حَمَدَ الله بسببها ${praises} شخصاً` : `${praises} people gave thanks`}
                          </span>
                        </div>

                        {/* Edit & Delete Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => onEditBlessing && onEditBlessing(blessing)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'var(--surface-card)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--color-primary)',
                              fontSize: '12.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Edit3 size={14} />
                            <span>{isRtl ? 'تعديل النعمة' : 'Edit'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteBlessing && onDeleteBlessing(blessing)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              background: 'rgba(229,62,62,0.08)',
                              border: '1px solid rgba(229,62,62,0.2)',
                              color: '#C53030',
                              fontSize: '12.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Trash2 size={13} />
                            <span>{isRtl ? 'حذف' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add another button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setTimeout(() => onOpenPublish && onOpenPublish(), 200);
                  }}
                  style={{
                    padding: '11px',
                    borderRadius: '12px',
                    border: '1.5px dashed var(--border-gold)',
                    background: 'transparent',
                    color: 'var(--color-primary)',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <PlusCircle size={16} />
                  <span>{isRtl ? 'نشر نعمة إضافية جديدة' : 'Publish Another Blessing'}</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Spiritual Mission & Interactive Tour */}
        <section>
          <div style={{
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '1px',
            color: 'var(--color-gold)',
            textTransform: 'uppercase',
            marginBottom: '10px',
            padding: '0 4px'
          }}>
            {isRtl ? 'عن المنصة والرسالة' : 'About & Mission'}
          </div>

          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            {/* App Mission Row */}
            <div
              onClick={onOpenMission}
              role="button"
              tabIndex={0}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(212,175,55,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)'
                }}>
                  <Scroll size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'رسالة وهدف منصة نِعْمَة' : 'Platform Mission & Purpose'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {isRtl ? '«نَحْنُ نَعِيشُ فِي كَنَفِ نِعَمٍ سَابِغَةٍ...» — اقرأ الرسالة كاملة' : 'Read our full spiritual mission statement'}
                  </div>
                </div>
              </div>
              <NextChevron size={18} color="var(--text-muted)" />
            </div>

            {/* Guide Tour Row */}
            <div
              onClick={onOpenGuide}
              role="button"
              tabIndex={0}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(44,74,62,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)'
                }}>
                  <Compass size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'دليل المنصة واستكشاف الميزات' : 'App Guide & Interactive Tour'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {isRtl ? 'جولة توضيحية لجميع الأزرار والوظائف' : 'Interactive tour of all features'}
                  </div>
                </div>
              </div>
              <NextChevron size={18} color="var(--text-muted)" />
            </div>
          </div>
        </section>

        {/* Section 4: Feedback & Support */}
        <section>
          <div style={{
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '1px',
            color: 'var(--color-gold)',
            textTransform: 'uppercase',
            marginBottom: '10px',
            padding: '0 4px'
          }}>
            {isRtl ? 'التواصل والمقترحات' : 'Support & Feedback'}
          </div>

          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            {/* Feedback & Suggestions Row */}
            <div
              onClick={() => {
                onClose();
                setTimeout(() => onOpenFeedback && onOpenFeedback(), 200);
              }}
              role="button"
              tabIndex={0}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderBottom: (deferredPrompt || onOpenShareApp) ? '1px solid var(--border-subtle)' : 'none',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(212,175,55,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)'
                }}>
                  <MessageSquare size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'الشكاوى والمقترحات التطويرية' : 'Feedback & Suggestions'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {isRtl ? 'صوتك يساعدنا على تطوير المنصة وإصلاح أي ملاحظة' : 'Report an issue or suggest a feature'}
                  </div>
                </div>
              </div>
              <NextChevron size={18} color="var(--text-muted)" />
            </div>

            {/* Install PWA Button (if prompt available) */}
            {deferredPrompt && (
              <div
                onClick={() => {
                  if (onInstallPwa) onInstallPwa();
                }}
                role="button"
                tabIndex={0}
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: 'rgba(56,161,105,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38A169'
                  }}>
                    <Download size={19} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                      {isRtl ? 'تثبيت تطبيق نِعْمَة على هاتفك' : 'Install NEMAA on Home Screen'}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      {isRtl ? 'تشغيل سريع ومباشر بدون إنترنت كتطبيق أصلي' : 'Fast standalone experience with offline access'}
                    </div>
                  </div>
                </div>
                <NextChevron size={18} color="var(--text-muted)" />
              </div>
            )}

            {/* Share App Row */}
            <div
              onClick={() => {
                onClose();
                setTimeout(() => onOpenShareApp && onOpenShareApp(), 200);
              }}
              role="button"
              tabIndex={0}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(44,74,62,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)'
                }}>
                  <Share2 size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'مشاركة المنصة مع من تحب' : 'Share NEMAA App'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {isRtl ? '«الدال على الخير كفاعله» — انشر نِعمة لتؤجر' : 'Spread the blessings with family and friends'}
                  </div>
                </div>
              </div>
              <NextChevron size={18} color="var(--text-muted)" />
            </div>
          </div>
        </section>

        {/* Section 5: App Version & About */}
        <section style={{ textAlign: 'center', paddingTop: '10px' }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '700',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span>منصة نِعْمَة</span>
            <span>•</span>
            <span>الإصدار 1.2.0</span>
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--color-gold)',
            marginTop: '4px',
            fontWeight: '600'
          }}>
            {isRtl ? '«تَذَكَّرْ لِتَشْكُرْ»' : 'Remember to Give Thanks'}
          </div>
        </section>
      </main>
    </div>
  );
}


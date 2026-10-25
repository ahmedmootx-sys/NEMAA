import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Sliders } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export default function AmbientSoundWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState('rain');
  const [volume, setVolume] = useState(0.35);
  const [showControls, setShowControls] = useState(false);

  const togglePlayback = () => {
    if (isPlaying) {
      audioEngine.stopAll();
      setIsPlaying(false);
    } else {
      audioEngine.setVolume(volume);
      audioEngine.playTrack(selectedTrack);
      setIsPlaying(true);
    }
  };

  const handleTrackChange = (e) => {
    const track = e.target.value;
    setSelectedTrack(track);
    if (isPlaying) {
      audioEngine.playTrack(track);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val);
  };

  return (
    <div className="audio-widget" aria-label="أصوات السكينة والطبيعة">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayback}
        style={{
          background: isPlaying ? 'var(--color-gold)' : 'transparent',
          color: isPlaying ? '#1A2B25' : 'var(--text-main)',
          border: 'none',
          borderRadius: '9999px',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        title={isPlaying ? "إيقاف الصوت الهادئ" : "تشغيل صوت السكينة"}
        aria-label={isPlaying ? "إيقاف الصوت" : "تشغيل الصوت"}
      >
        {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>

      {/* Track Selector Dropdown */}
      <select
        className="audio-track-select"
        value={selectedTrack}
        onChange={handleTrackChange}
        title="اختر صوت السكينة الخلفي"
      >
        <option value="rain">🌧️ مطر هادئ</option>
        <option value="breeze">🍃 نسيم عليل</option>
        <option value="birds">🐦 فجر وطيور</option>
        <option value="drone">🕊️ سكون وتأمل</option>
      </select>

      {/* Volume slider expand toggle */}
      <button
        onClick={() => setShowControls(!showControls)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-faint)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center'
        }}
        title="مستوى الصوت"
        aria-label="مستوى الصوت"
      >
        <Sliders size={14} />
      </button>

      {showControls && (
        <input
          type="range"
          min="0.05"
          max="0.9"
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          style={{
            width: '65px',
            accentColor: 'var(--color-gold)',
            cursor: 'pointer'
          }}
          title={`مستوى الصوت: ${Math.round(volume * 100)}%`}
        />
      )}
    </div>
  );
}

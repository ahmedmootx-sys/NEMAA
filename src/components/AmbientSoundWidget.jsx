import React, { useState } from 'react';
import { Volume2, VolumeX, Sliders } from 'lucide-react';
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
    <div className={`audio-widget ${isPlaying ? 'audio-active' : ''}`} aria-label="أصوات السكينة والطبيعة">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayback}
        className="audio-play-btn"
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
        <option value="rain">🌧️ مطر</option>
        <option value="breeze">🍃 نسيم</option>
        <option value="birds">🐦 طيور</option>
        <option value="drone">🕊️ سكون</option>
      </select>

      {/* Volume slider expand toggle */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="audio-sliders-btn"
        title="مستوى الصوت"
        aria-label="مستوى الصوت"
      >
        <Sliders size={13} />
      </button>

      {showControls && (
        <input
          type="range"
          min="0.05"
          max="0.9"
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          className="audio-range-slider"
          title={`مستوى الصوت: ${Math.round(volume * 100)}%`}
        />
      )}
    </div>
  );
}

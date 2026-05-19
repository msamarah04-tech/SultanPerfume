import React, { useState, useEffect } from 'react';

const SpriteSequence = ({ folder, frameCount = 12, fps = 24, loop = false, className = '', onComplete }) => {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    // Preload images
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      img.src = `/generated/animations/${folder}/frame-${i.toString().padStart(2, '0')}.png`;
    }
  }, [folder, frameCount]);

  useEffect(() => {
    if (!isPlaying) return;

    let frame = 1;
    const interval = 1000 / fps;
    const timer = setInterval(() => {
      frame++;
      if (frame > frameCount) {
        if (loop) {
          frame = 1;
        } else {
          clearInterval(timer);
          setIsPlaying(false);
          if (onComplete) onComplete();
          return;
        }
      }
      setCurrentFrame(frame);
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, frameCount, fps, loop, onComplete]);

  return (
    <img 
      src={`/generated/animations/${folder}/frame-${currentFrame.toString().padStart(2, '0')}.png`}
      className={`pointer-events-none ${className}`}
      style={{ imageRendering: 'smooth', filter: 'blur(0.5px)' }}
      alt=""
    />
  );
};

export default SpriteSequence;

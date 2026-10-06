import React, { useState, useEffect } from 'react';
import Tilt from 'react-parallax-tilt';

export function AnimeCard3DWrapper({ children, className }) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    // Check if it's a touch device (no mouse hover)
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const disable3D = isReducedMotion || isTouchDevice;

  if (disable3D) {
    // On mobile or reduced motion, we disable the 3D tilt entirely 
    // but still apply a subtle hover translation and scale via standard CSS, 
    // unless reduced motion is on, then no translation.
    return (
      <div className={`relative w-full h-full ${!isReducedMotion ? 'transition-normal hover:-translate-y-1 hover:shadow-depth-2' : ''} ${className || ''}`}>
        {children}
      </div>
    );
  }

  return (
    <Tilt
      tiltMaxAngleX={4}
      tiltMaxAngleY={5}
      scale={1.02}
      transitionSpeed={400}
      glareEnable={true}
      glareMaxOpacity={0.15}
      glareColor="#8b5cf6"
      glarePosition="all"
      tiltReverse={true}
      className={`relative w-full h-full transition-cinematic group hover:-translate-y-1 hover:shadow-depth-3 rounded-lg z-10 hover:z-20 ${className || ''}`}
    >
      {/* 
        To achieve parallax (layer movement), the inner children 
        just need some Z translation. We apply transform-style preserve-3d to Tilt.
      */}
      <div 
        style={{ transformStyle: 'preserve-3d' }} 
        className="w-full h-full"
      >
        {children}
      </div>
    </Tilt>
  );
}

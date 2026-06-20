'use client';

import React, { useState, useEffect, useRef } from 'react';

interface FadeInImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  duration?: number; // duration in ms, default 300
}

export function FadeInImage({ className, onLoad, duration = 300, ...props }: FadeInImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // If the image is already cached/loaded, set isLoaded to true immediately
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, []);

  const durationClass = duration === 500 ? 'duration-500' : 'duration-300';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      onLoad={(e) => {
        setIsLoaded(true);
        if (onLoad) onLoad(e);
      }}
      className={`${className || ''} transition-opacity ${durationClass} ease-in-out ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      {...props}
    />
  );
}

'use client'

import React from 'react'

type MediaBackgroundProps = {
  url: string | null | undefined
  fallbackColor?: string
  overlayClassName?: string
}

export function MediaBackground({ 
  url, 
  fallbackColor = 'bg-navy-deep',
  overlayClassName = 'bg-navy-deep/80' // default elegant dark overlay
}: MediaBackgroundProps) {
  if (!url) {
    return <div className={`absolute inset-0 z-0 ${fallbackColor}`} />
  }

  const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm')

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${fallbackColor}`}>
      {isVideo ? (
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        >
          <source src={url} type={url.toLowerCase().endsWith('.mp4') ? 'video/mp4' : 'video/webm'} />
        </video>
      ) : (
        <img 
          src={url} 
          alt="Background" 
          className="w-full h-full object-cover" 
          loading="lazy"
        />
      )}
      
      {/* Overlay */}
      <div className={`absolute inset-0 ${overlayClassName}`} />
    </div>
  )
}

"use client"

import React, { useState } from "react"

interface CustomImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: string
  lazy?: boolean
}

export function Image({
  src,
  alt,
  fallback,
  lazy = true,
  className,
  onError,
  onLoad,
  ...props
}: CustomImageProps) {
  const [error, setError] = useState(false)

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={error && fallback ? fallback : src}
      alt={alt}
      loading={lazy ? "lazy" : undefined}
      onLoad={onLoad}
      onError={(event) => {
        setError(true)
        onError?.(event)
      }}
      className={className}
      style={{
        transition: "opacity 0.3s ease",
        ...props.style,
      }}
    />
  )
}

import React, { useState, useEffect } from "react";
import { formatImageUrl } from "@/lib/utils";

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  fallbackNode?: React.ReactNode;
}

export function LazyImage({
  src,
  fallbackSrc,
  alt,
  fallbackNode,
  className,
  onClick,
  ...props
}: LazyImageProps) {
  const formattedMain = formatImageUrl(src);
  const formattedFallback = formatImageUrl(fallbackSrc);

  const [currentSrc, setCurrentSrc] = useState<string | null>(formattedMain || formattedFallback || null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const main = formatImageUrl(src);
    const fb = formatImageUrl(fallbackSrc);
    setCurrentSrc(main || fb || null);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentSrc === formattedMain && formattedFallback && formattedFallback !== formattedMain) {
      setCurrentSrc(formattedFallback);
    } else if (currentSrc && currentSrc.includes("/images/") && !currentSrc.includes("/images/thumbs/")) {
      const derivedThumb = currentSrc.replace("/images/", "/images/thumbs/");
      setCurrentSrc(derivedThumb);
    } else {
      setHasError(true);
    }
  };

  if (!currentSrc || hasError) {
    return fallbackNode ? <>{fallbackNode}</> : null;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className={className}
      onClick={onClick}
      {...props}
    />
  );
}

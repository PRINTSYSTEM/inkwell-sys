import React, { useState, useEffect, useRef } from "react";
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
  const [isIntersected, setIsIntersected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const main = formatImageUrl(src);
    const fb = formatImageUrl(fallbackSrc);
    setCurrentSrc(main || fb || null);
    setHasError(false);
  }, [src, fallbackSrc]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsIntersected(true);
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "300px 0px" }
      );
      observer.observe(element);
      return () => observer.disconnect();
    } else {
      setIsIntersected(true);
    }
  }, []);

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
    <div ref={containerRef} className={className} onClick={onClick}>
      {isIntersected ? (
        <img
          src={currentSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={handleError}
          className="h-full w-full object-cover"
          {...props}
        />
      ) : (
        <div className="h-full w-full bg-slate-100/80 animate-pulse rounded" />
      )}
    </div>
  );
}


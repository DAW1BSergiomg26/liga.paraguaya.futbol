"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

function isExternalUrl(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return src.startsWith("/") || src.startsWith("./");
  }
}

interface SmartImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  fallback?: ReactNode;
}

export default function SmartImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  className,
  priority,
  fallback,
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed || !isExternalUrl(src)) {
    return <>{fallback ?? null}</>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";

type Props = { src: string; alt: string; className?: string; sizes?: string; priority?: boolean };

export function ArticleImage({ src, alt, className, sizes, priority }: Props) {
  const [failed, setFailed] = useState(false);
  if (src.startsWith("https://") && !failed) return <img src={src} alt={alt} className={`external-article-image ${className || ""}`} loading={priority ? "eager" : "lazy"} onError={() => setFailed(true)} />;
  if (failed) return <Image src="/stardust-hero.png" alt={alt} fill sizes={sizes} priority={priority} className={className} />;
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
}

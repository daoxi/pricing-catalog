"use client";

import Image from "next/image";
import { useState } from "react";
import { FiImage } from "react-icons/fi";

import type { ProductImageData } from "@/lib/catalog-types";

interface ProductImageProps {
  image?: ProductImageData;
  productTitle: string;
  priority?: boolean;
}

export function ProductImage({ image, productTitle, priority = false }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!image || hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 px-4 text-center text-slate-500">
        <FiImage aria-hidden="true" className="text-3xl" />
        <span className="text-sm font-semibold">Image unavailable</span>
      </div>
    );
  }

  return (
    <Image
      src={image.url}
      alt={image.alt || productTitle}
      fill
      priority={priority}
      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
      onError={() => setHasError(true)}
      className="object-contain p-6"
    />
  );
}

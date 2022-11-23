import { useEffect, useState } from "react";

import { default as NextJsImage, ImageProps as ImageNextJsProps } from "next/image";

interface ImageProps extends ImageNextJsProps {
  fallbackSrc: string;
}

export const Image = ({
  fallbackSrc,
  alt,
  src,
  ...props
}: ImageProps) => {
  const [withFallbackImage, setWithFallbackImage] = useState(false);

  useEffect(() => {
    setWithFallbackImage(false);
  }, [src]);

  return (
    <NextJsImage
      alt={alt || "Image"}
      onError={() => setWithFallbackImage(true)}
      src={withFallbackImage ? fallback : src}
      {...props}
    />
  );
};

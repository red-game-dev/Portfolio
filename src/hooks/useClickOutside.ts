import { useEffect, useRef, RefObject } from "react";

const useClickOutside = <TElement>(handler: () => void): RefObject<TElement> => {
  const domNode = useRef<TElement>();

  useEffect(() => {
    const maybeHandler = (event: Event) => {
      if (!(domNode.current as HTMLElement)?.contains(event?.target as Node)) {
        handler();
      }
    };

    document.addEventListener("mousedown", maybeHandler);

    return () => {
      document.removeEventListener("mousedown", maybeHandler);
    };
  });

  return domNode as RefObject<TElement>;
};

export default useClickOutside;

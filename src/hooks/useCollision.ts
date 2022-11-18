import React from "react";


function changeCollision(elementId: string, onCollision: (value: boolean) => void) {
  const element = document.getElementById(elementId);

  const top_of_element = element?.offsetTop;

  if (top_of_element) {

    const bottom_of_element = Number(element?.offsetTop + element?.offsetHeight + element?.style.marginTop);
    const bottom_of_screen = Number(window.scrollY + window.innerHeight);
    const top_of_screen = Number(window.scrollY);

    onCollision((bottom_of_screen > top_of_element) && (top_of_screen < bottom_of_element));

    return;
  }

  onCollision(false);

  return;
}

export default function useCollisionSize(elementId: string, onCollision?: (value: boolean) => void) {
  const isSSR = typeof window === "undefined";
  const [collision, setCollision] = React.useState(false);

  React.useEffect(() => {
    if (isSSR) {
      return;
    }

    const callback = changeCollision.bind(null, elementId, (value: boolean) => {
      setCollision(value);

      if (typeof onCollision === "function") {
        onCollision(value);
      }
    });

    window.addEventListener("scroll", callback);

    return () => {
      window.removeEventListener("scroll", callback);
    };
  }, [elementId, isSSR, onCollision]);

  return [collision];
}

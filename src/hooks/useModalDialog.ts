import { MouseEvent, RefObject, useCallback, useEffect, useRef } from "react";

import useScrollLock from "@/hooks/useScrollLock";

interface ModalOptions {
  // Keep the page from scrolling behind the dialog. On by default.
  lockScroll?: boolean;
}

// A native <dialog> shown as a modal while `isOpen`: the browser brings focus trapping, Escape and the
// backdrop. Holds the page still while it is open, and returns the click handler that closes it when the
// backdrop (the dialog element itself, outside its content) is clicked: pressed there and let go there, so text
// selected in the dialog by dragging out over the backdrop (a message being written) never closes it.
export default function useModalDialog(ref: RefObject<HTMLDialogElement>, isOpen: boolean, { lockScroll = true }: ModalOptions = {}) {
  const isPressedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) {
      return undefined;
    }

    const onPointerDown = (event: PointerEvent) => {
      isPressedOnBackdrop.current = event.target === dialog;
    };

    dialog.addEventListener("pointerdown", onPointerDown);

    return () => dialog.removeEventListener("pointerdown", onPointerDown);
  }, [ref]);

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen, ref]);

  useScrollLock(lockScroll && isOpen);

  return useCallback((event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && isPressedOnBackdrop.current) {
      event.currentTarget.close();
    }

    isPressedOnBackdrop.current = false;
  }, []);
}

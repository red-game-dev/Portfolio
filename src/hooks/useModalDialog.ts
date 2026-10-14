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
  // Where the last press began and ended: a click the browser lands on the dialog itself after a drag between its
  // content and the backdrop closes nothing.
  const press = useRef({ isDownOnBackdrop: false, isUpOnBackdrop: false });

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) {
      return undefined;
    }

    const onPointerDown = (event: PointerEvent) => {
      press.current.isDownOnBackdrop = event.target === dialog;
    };
    const onPointerUp = (event: PointerEvent) => {
      press.current.isUpOnBackdrop = event.target === dialog;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);

    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
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
    const { isDownOnBackdrop, isUpOnBackdrop } = press.current;

    if (event.target === event.currentTarget && isDownOnBackdrop && isUpOnBackdrop) {
      event.currentTarget.close();
    }

    press.current = { isDownOnBackdrop: false, isUpOnBackdrop: false };
  }, []);
}

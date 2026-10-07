import { MouseEvent, RefObject, useCallback, useEffect } from "react";

import useScrollLock from "@/hooks/useScrollLock";

interface ModalOptions {
  // Keep the page from scrolling behind the dialog. On by default.
  lockScroll?: boolean;
}

// A native <dialog> shown as a modal while `isOpen`: the browser brings focus trapping, Escape and the
// backdrop. Holds the page still while it is open, and returns the click handler that closes it when the
// backdrop (the dialog element itself, outside its content) is clicked.
export default function useModalDialog(ref: RefObject<HTMLDialogElement>, isOpen: boolean, { lockScroll = true }: ModalOptions = {}) {
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
    if (event.target === event.currentTarget) {
      event.currentTarget.close();
    }
  }, []);
}

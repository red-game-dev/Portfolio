import { RefObject, useCallback, useEffect, useRef } from "react";

import type { Pilot } from "@/services/voyage/pilot";

// Progress is kept this long after the last change, so a burst of finds is one write.
const SAVE_DELAY_MS = 800;
// Tabs tell one another on this channel that they saved.
const CHANNEL = "redgame.voyage";

// Keeps the pilot's progress in this browser and in step across its tabs. A change is written shortly after it
// happens, at once when the page is hidden or left (phones often kill a page without unloading it), and when the
// voyage closes. A tab that saves says so; another tab with no changes of its own waiting takes that save on, so
// two open tabs do not keep overwriting each other. On close the store's connection is let go. Returns the
// function to call on every change.
export const usePilotSync = (pilot: RefObject<Pilot | null>) => {
  const timer = useRef<number | null>(null);
  const lastSaved = useRef(0);
  const isAdopting = useRef(false);
  const channel = useRef<BroadcastChannel | null>(null);

  const saveNow = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }

    const opened = pilot.current;

    if (!opened) {
      return;
    }

    const profile = { ...opened.hangar.toProfile(), career: opened.career.toProfile(), armory: opened.armory.toProfile(), progress: opened.progress.toProfile() };

    void opened.repository.save(profile).then((isSaved) => {
      if (isSaved) {
        lastSaved.current = profile.savedAt;
        channel.current?.postMessage(profile.savedAt);
      }
    });
  }, [pilot]);

  const scheduleSave = useCallback(() => {
    // Taking on another tab's save is not a change of this tab's own.
    if (isAdopting.current) {
      return;
    }

    if (timer.current !== null) {
      window.clearTimeout(timer.current);
    }

    timer.current = window.setTimeout(saveNow, SAVE_DELAY_MS);
  }, [saveNow]);

  useEffect(() => {
    channel.current = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL);

    const onHidden = () => {
      if (document.visibilityState === "hidden" && timer.current !== null) {
        saveNow();
      }
    };
    const onOtherTab = () => {
      const opened = pilot.current;

      if (!opened || timer.current !== null) {
        return;
      }

      void opened.repository.load().then((profile) => {
        if (timer.current === null && profile.savedAt > lastSaved.current) {
          lastSaved.current = profile.savedAt;
          isAdopting.current = true;
          // The armoury first: the hangar's bar asks it which weapons are owned.
          opened.armory.replace(profile.armory);
          opened.progress.replace(profile.progress);
          opened.hangar.replace(profile);
          opened.career.replace(profile.career);
          isAdopting.current = false;
        }
      });
    };

    // The pilot is opened after this effect starts, so it is read when the voyage closes, not now. The store
    // finishes any write still in flight before the connection actually closes.
    const release = () => pilot.current?.repository.close();

    channel.current?.addEventListener("message", onOtherTab);
    window.addEventListener("pagehide", saveNow);
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      window.removeEventListener("pagehide", saveNow);
      document.removeEventListener("visibilitychange", onHidden);

      if (timer.current !== null) {
        saveNow();
      }

      channel.current?.close();
      channel.current = null;
      release();
    };
  }, [pilot, saveNow]);

  return scheduleSave;
};

// The entrance plays once per choice, so its code is fetched when a choice is about to be made: when the
// chooser opens or the header switch is opened.
export const loadEntrance = () => import("@/components/Lens/Entrance");

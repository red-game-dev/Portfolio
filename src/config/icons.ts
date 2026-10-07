import { IconDefinition, IconName } from "@fortawesome/fontawesome-svg-core";

// Icons the free Font Awesome set has no match for, drawn here on its 512 unit grid so they sit beside the
// free icons at the same size and weight. Everything else comes from @fortawesome/free-solid-svg-icons.
const icon = (iconName: string, path: string, width = 512): IconDefinition => ({
  prefix: "fas",
  iconName: iconName as IconName,
  icon: [width, 512, [], "", path],
});

// Two crenellated towers joined by a wall, with an arched gate.
export const faCastle = icon(
  "castle",
  "M32 480V112h32v48h32v-48h32v48h32v-48h32v112h128V112h32v48h32v-48h32v48h32v-48h32v368H320v-96a64 64 0 0 0-128 0v96H32z",
);

// Two candles on a chart's axes: a body for open and close, a wick for the high and low.
export const faChartCandlestick = icon(
  "chart-candlestick",
  "M32 32h40v408h408v40H32V32zm112 128h48v-48h32v48h48v160h-48v48h-32v-48h-48V160zm160 64h48v-80h32v80h48v128h-48v56h-32v-56h-48V224z",
);

// A chest with a rounded lid, its band split by a lock plate.
export const faTreasureChest = icon(
  "treasure-chest",
  "M64 208v-32C64 106 120 64 192 64h128c72 0 128 42 128 112v32H64zM48 240h168v224H80c-17.7 0-32-14.3-32-32V240zm248 0h168v192c0 "
  + "17.7-14.3 32-32 32H296V240zm-64 0h48v104h-48V240z",
);

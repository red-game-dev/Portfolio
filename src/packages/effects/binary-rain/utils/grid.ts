import { RainConfig } from "../config";
import { RainGrid } from "../domain/types";

export const createGrid = (width: number, height: number, config: RainConfig): RainGrid => {
  const fontSize = width < config.narrowWidth ? config.narrowFontSize : config.wideFontSize;
  const cellWidth = Math.round(fontSize * config.cellWidthRatio);
  const cellHeight = Math.round(fontSize * config.cellHeightRatio);

  return {
    width,
    height,
    fontSize,
    cellWidth,
    cellHeight,
    columns: Math.max(1, Math.ceil(width / cellWidth)),
    rows: Math.max(1, Math.ceil(height / cellHeight)),
  };
};

export const cellKey = (grid: RainGrid, column: number, row: number) => row * grid.columns + column;

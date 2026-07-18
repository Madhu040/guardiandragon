/**
 * Parameterized grid background for world levels (default 100×100 cells over the
 * 1920×1080 scene space).
 *
 * The grid is stored as a flat row-major vector of cells; each cell records its
 * coordinate, fill color, and whether the player can walk through it. Levels are
 * painted onto a GridMap with the builder methods below
 * (`src/content/gridLevels.ts`), drawn to a canvas layer
 * (`src/render/gridBackground.ts`), and used for center-point collision in
 * `WorldRuntime`.
 */

import { WORLD_H, WORLD_W, pointInAabb, type Aabb, type Vec2 } from "./Collision.js";

export const GRID_COLS = 100;
export const GRID_ROWS = 100;

export interface GridCellStyle {
  color: string;
  walkable: boolean;
}

export interface GridCell extends GridCellStyle {
  col: number;
  row: number;
}

export class GridMap {
  readonly cols: number;
  readonly rows: number;
  /** Flat row-major vector: cells[row * cols + col]. */
  readonly cells: GridCell[];

  constructor(fill: GridCellStyle, cols = GRID_COLS, rows = GRID_ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.cells = new Array<GridCell>(cols * rows);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.cells[row * cols + col] = { col, row, ...fill };
      }
    }
  }

  /** World-pixel width of one cell (1920 / cols). */
  get cellW(): number {
    return WORLD_W / this.cols;
  }

  /** World-pixel height of one cell (1080 / rows). */
  get cellH(): number {
    return WORLD_H / this.rows;
  }

  cellAt(col: number, row: number): GridCell | null {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return null;
    return this.cells[row * this.cols + col];
  }

  cellAtWorld(wx: number, wy: number): GridCell | null {
    return this.cellAt(Math.floor(wx / this.cellW), Math.floor(wy / this.cellH));
  }

  /** World-space center of a cell (spawn points, markers). */
  cellCenterWorld(col: number, row: number): Vec2 {
    return { x: (col + 0.5) * this.cellW, y: (row + 0.5) * this.cellH };
  }

  /** A world point outside the grid is never walkable. */
  isWalkableWorld(wx: number, wy: number): boolean {
    return this.cellAtWorld(wx, wy)?.walkable ?? false;
  }

  paint(col: number, row: number, style: Partial<GridCellStyle>): this {
    const cell = this.cellAt(col, row);
    if (cell) Object.assign(cell, style);
    return this;
  }

  paintRect(col: number, row: number, w: number, h: number, style: Partial<GridCellStyle>): this {
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) this.paint(c, r, style);
    }
    return this;
  }

  paintBorder(thickness: number, style: Partial<GridCellStyle>): this {
    this.paintRect(0, 0, this.cols, thickness, style);
    this.paintRect(0, this.rows - thickness, this.cols, thickness, style);
    this.paintRect(0, 0, thickness, this.rows, style);
    this.paintRect(this.cols - thickness, 0, thickness, this.rows, style);
    return this;
  }

  paintEllipse(
    centerCol: number,
    centerRow: number,
    radiusCols: number,
    radiusRows: number,
    style: Partial<GridCellStyle>,
  ): this {
    for (let r = Math.floor(centerRow - radiusRows); r <= centerRow + radiusRows; r++) {
      for (let c = Math.floor(centerCol - radiusCols); c <= centerCol + radiusCols; c++) {
        const dx = (c - centerCol) / radiusCols;
        const dy = (r - centerRow) / radiusRows;
        if (dx * dx + dy * dy <= 1) this.paint(c, r, style);
      }
    }
    return this;
  }
}

/**
 * World-space center of a cell in the default 100×100 grid — pure helper for
 * placements authored in cells (stage objects) without needing a GridMap
 * instance. Matches `GridMap.cellCenterWorld` for default-sized maps.
 */
export function gridCellToWorld(col: number, row: number): Vec2 {
  return {
    x: (col + 0.5) * (WORLD_W / GRID_COLS),
    y: (row + 0.5) * (WORLD_H / GRID_ROWS),
  };
}

/**
 * Axis-separated collision for a single point (the main character's center)
 * against the grid: X then Y, each axis rejected independently so the avatar
 * slides along obstacle edges. Optional `solids` (NPC boxes) also block the point.
 */
export function moveWithGridCollision(
  center: Vec2,
  delta: Vec2,
  grid: GridMap,
  solids: Aabb[] = [],
): Vec2 {
  const blocked = (x: number, y: number): boolean =>
    !grid.isWalkableWorld(x, y) || solids.some((s) => pointInAabb(x, y, s));

  let { x, y } = center;
  if (delta.x !== 0 && !blocked(x + delta.x, y)) x += delta.x;
  if (delta.y !== 0 && !blocked(x, y + delta.y)) y += delta.y;
  return { x, y };
}

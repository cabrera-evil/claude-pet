import { HEIGHT, WIDTH } from '../art/pixels'
import { cellSize } from '../render/render'

export const SIZES: Record<string, number> = { small: 0.5, medium: 1, large: 2 }

export const isSize = (value: string) => Object.keys(SIZES).includes(value)

export const fitScale = (wanted: number, maxRows: number) =>
  [2, 1, 0.5].filter(candidate => candidate <= wanted).find(candidate => cellSize(WIDTH, HEIGHT, candidate).rows <= maxRows) ?? 0.5

import { C, type Pixels, fill } from '../pixels'
import { BEZEL, WOOD_SIDE, WOOD_TOP } from './constants'
import { colorFor } from './identity'

const mix = (color: number, toward: number, weight: number) => {
  const channel = (shift: number) =>
    Math.round(((color >> shift) & 255) * (1 - weight) + ((toward >> shift) & 255) * weight)
  return (channel(16) << 16) | (channel(8) << 8) | channel(0)
}

export const drawDesk = (px: Pixels) => {
  fill(px, 0, 8, 18, 1, WOOD_TOP)
  fill(px, 0, 9, 18, 1, WOOD_SIDE)
  fill(px, 1, 10, 1, 2, WOOD_SIDE)
  fill(px, 16, 10, 1, 2, WOOD_SIDE)
}

export const drawFrame = (px: Pixels, kind: string) => {
  fill(px, 10, 1, 8, 6, mix(BEZEL, colorFor(kind), 0.5))
  fill(px, 11, 2, 6, 4, C.screen)
  fill(px, 9, 7, 9, 1, C.edge)
}

import { C, CLEAR, type Pixels, type Point } from './pixels'

export type Ghost = readonly [x: number, y: number, alpha: number]

const mix = (from: number, to: number, alpha: number) =>
  [16, 8, 0].reduce((out, shift) => {
    const a = (from >> shift) & 0xff
    const b = (to >> shift) & 0xff
    return out | (Math.round(a + (b - a) * alpha) << shift)
  }, 0)

export const ghost = (px: Pixels, cells: readonly Ghost[], tint: number = C.white) => {
  for (const [x, y, alpha] of cells) {
    const under = px[y]?.[x]
    if (under !== undefined) px[y][x] = mix(under === CLEAR ? C.key : under, tint, alpha)
  }
}

const shape = (x: number, y: number, alpha: number, points: readonly Point[]): Ghost[] =>
  points.map(([dx, dy]) => [x + dx, y + dy, alpha])

const span = (length: number) => Array.from({ length }, (_, i) => i)

export const zed = (x: number, y: number, size: number, alpha: number) =>
  shape(x, y, alpha, [
    ...span(size).flatMap((i): Point[] => [[i, 0], [i, size - 1]]),
    ...span(size - 2).map((i): Point => [size - 2 - i, 1 + i]),
  ])

export const bang = (x: number, y: number, height: number, alpha: number) =>
  shape(x, y, alpha, [...span(height - 2).map((i): Point => [0, i]), [0, height - 1]])

export const question = (x: number, y: number, alpha: number) =>
  shape(x, y, alpha, [[0, 0], [1, 0], [2, 0], [2, 1], [1, 2], [1, 4]])

export const cloud = (x: number, y: number, alpha: number) =>
  shape(x, y, alpha, [...span(5).map((i): Point => [1 + i, 0]), ...span(7).map((i): Point => [i, 1]), ...span(5).map((i): Point => [1 + i, 2])])

const WISP_SWAY = [0, 1, 1, 0, 0] as const

export const wisp = (x: number, y: number, flip: boolean, alpha: number): Ghost[] =>
  WISP_SWAY.map((dx, i) => [x + (flip ? -dx : dx), y - i, alpha * (1 - i * 0.18)])

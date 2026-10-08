import type { Mood } from '../../types'

export const WIDTH = 27
export const HEIGHT = 14
export const CLEAR = -1

export type Pixels = number[][]

export const C = {
  body: 0xd97757,
  light: 0xe99a7e,
  shade: 0xb5573b,
  eye: 0x1c1917,
  screen: 0x0b1220,
  glow: 0x142238,
  bezel: 0x2d3340,
  base: 0xaab2bf,
  edge: 0xd2d8e0,
  key: 0x6b7280,
  green: 0x4ade80,
  red: 0xf87171,
  white: 0xe5e7eb,
  slate: 0x7d8aa0,
  blue: 0x60a5fa,
  amber: 0xfbbf24,
} as const

export type Draw = (x: number, y: number, w: number, h: number, color: number) => void

export type Point = readonly [number, number]

export const canvas = (width = WIDTH, height = HEIGHT): Pixels =>
  Array.from({ length: height }, () => Array<number>(width).fill(CLEAR))

export const fill = (px: Pixels, x: number, y: number, w: number, h: number, color: number) => {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (px[j]?.[i] !== undefined) px[j][i] = color
    }
  }
}

export const dots = (px: Pixels, color: number, points: readonly Point[]) => {
  for (const [x, y] of points) fill(px, x, y, 1, 1, color)
}

const mix = (from: number, to: number, alpha: number) =>
  [16, 8, 0].reduce((out, shift) => {
    const a = (from >> shift) & 0xff
    const b = (to >> shift) & 0xff
    return out | (Math.round(a + (b - a) * alpha) << shift)
  }, 0)

export type Zed = { x: number; y: number; size: number; alpha: number }

export const drawZs = (px: Pixels, zs: readonly Zed[]) => {
  for (const { x, y, size, alpha } of zs) {
    const cells: Point[] = [
      ...Array.from({ length: size }, (_, i): Point => [x + i, y]),
      ...Array.from({ length: size }, (_, i): Point => [x + i, y + size - 1]),
      ...Array.from({ length: size - 2 }, (_, i): Point => [x + size - 2 - i, y + 1 + i]),
    ]
    for (const [cx, cy] of cells) {
      const under = px[cy]?.[cx]
      if (under !== undefined) px[cy][cx] = mix(under === CLEAR ? C.key : under, C.white, alpha)
    }
  }
}

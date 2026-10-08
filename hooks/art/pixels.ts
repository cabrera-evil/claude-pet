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

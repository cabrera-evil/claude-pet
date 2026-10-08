import { C, type Pixels, dots, fill } from '../pixels'
import { ALARM_BG } from '../palette'
import type { Activity } from '../../logic/activity'
import { LINE_COLORS, LINE_INDENTS, LINE_LENGTHS } from './constants'

export const drawScreen = (px: Pixels, activity: Activity, frame: number) => {
  switch (activity) {
    case 'coding':
      for (let row = 0; row < 4; row++) {
        const n = (row + frame) % LINE_LENGTHS.length
        fill(px, 11 + LINE_INDENTS[n], 2 + row, Math.min(LINE_LENGTHS[n], 6 - LINE_INDENTS[n]), 1, LINE_COLORS[n % LINE_COLORS.length])
      }
      if (frame % 2 === 0) fill(px, 11, 5, 2, 1, C.white)
      break
    case 'researching':
      for (let row = 0; row < 4; row++) {
        fill(px, 11, 2 + row, [5, 4, 6, 3][row], 1, row === Math.floor(frame / 2) % 4 ? C.amber : C.slate)
      }
      break
    case 'running':
      dots(px, C.green, [[11, 2], [11, 3], [11, 4], [11, 5]])
      fill(px, 13, 2, 3, 1, C.slate)
      fill(px, 13, 3, 2 + (frame % 3), 1, C.green)
      fill(px, 13, 4, 4 - (frame % 3), 1, C.green)
      if (frame % 2 === 0) fill(px, 13, 5, 1, 1, C.white)
      break
    case 'browsing':
      fill(px, 11, 2, 6, 1, C.blue)
      fill(px, 11, 3, 3, 3, frame % 2 === 0 ? C.amber : C.green)
      fill(px, 15, 3 + (frame % 2), 2, 1, C.slate)
      fill(px, 15, 5, 2, 1, C.slate)
      break
    case 'tooling': {
      const palette = [C.green, C.blue, C.amber] as const
      ;[[12, 3], [14, 3], [16, 3], [12, 5], [14, 5], [16, 5]].forEach(([x, y], i) =>
        dots(px, palette[(i + frame) % 3], [[x, y]]),
      )
      break
    }
    case 'planning': {
      const ticks = Math.floor(frame / 2) % 3
      for (let row = 0; row < 2; row++) {
        fill(px, 11, 2 + row * 2, 2, 1, row < ticks ? C.green : C.slate)
        fill(px, 14, 2 + row * 2, 3, 1, row < ticks ? C.key : C.slate)
      }
      break
    }
    case 'delegating':
      fill(px, 13, 2, 2, 1, C.blue)
      fill(px, 12, 3, 4, 1, C.slate)
      fill(px, 11, 4, 2, 2, frame % 2 === 0 ? C.green : C.amber)
      fill(px, 15, 4, 2, 2, frame % 2 === 0 ? C.amber : C.green)
      break
    case 'testing': {
      const passed = Math.floor(frame / 2) % 3
      for (const [row, y] of [2, 4].entries()) {
        fill(px, 11, y, 2, 1, row < passed ? C.green : C.slate)
        fill(px, 14, y, 3, 1, C.slate)
      }
      fill(px, 11, 5, ((frame % 3) + 1) * 2, 1, C.blue)
      break
    }
    case 'asking':
      dots(px, frame % 2 === 0 ? C.amber : C.white, [[13, 2], [14, 2], [15, 3], [14, 5]])
      break
    case 'alarmed':
      if (frame % 2 === 0) fill(px, 11, 2, 6, 4, ALARM_BG)
      fill(px, 13, 2, 2, 2, C.red)
      fill(px, 13, 5, 2, 1, C.red)
      break
    default:
      if (frame % 2 === 0) fill(px, 11, 5, 2, 1, C.key)
  }
}

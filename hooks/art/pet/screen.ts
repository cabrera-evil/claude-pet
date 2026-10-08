import { C, type Pixels, dots, fill } from '../pixels'
import { ALARM_BG } from '../palette'
import type { Mood } from '../../../types'
import type { Activity } from '../../logic/activity'
import { DROP_BOXES, LINE_COLORS, LINE_INDENTS, LINE_LENGTHS, POINTS_QUESTION, READ_LENGTHS } from './constants'

export const drawScreen = (px: Pixels, mood: Mood, activity: Activity, frame: number) => {
  fill(px, 15, 1, 11, 9, 0x2d3340)
  fill(px, 16, 2, 9, 7, mood === 'working' ? 0x142238 : C.screen)
  fill(px, 14, 10, 13, 1, C.edge)
  fill(px, 14, 11, 13, 1, C.base)
  for (let x = 16; x < 25; x += 2) fill(px, x, 11, 1, 1, C.key)

  if (mood === 'done') return void dots(px, C.green, [[17, 5], [18, 6], [19, 5], [20, 4], [21, 3], [22, 2]])
  if (mood === 'error') {
    return void dots(px, C.red, [[18, 3], [22, 3], [19, 4], [21, 4], [20, 5], [19, 6], [21, 6], [18, 7], [22, 7]])
  }
  if (mood === 'idle') return void (frame % 2 === 0 && fill(px, 17, 7, 2, 1, C.key))

  switch (activity) {
    case 'coding':
      for (let row = 0; row < 6; row++) {
        const n = (row + frame) % LINE_LENGTHS.length
        fill(px, 16 + LINE_INDENTS[n], 2 + row, Math.min(LINE_LENGTHS[n], 8 - LINE_INDENTS[n]), 1, LINE_COLORS[n % LINE_COLORS.length])
      }
      if (frame % 2 === 0) fill(px, 17, 8, 2, 1, C.white)
      break
    case 'researching':
      for (let row = 0; row < 6; row++) {
        fill(px, 16, 2 + row, READ_LENGTHS[row], 1, row === Math.floor(frame / 2) % 6 ? C.amber : C.slate)
      }
      break
    case 'running':
      for (const y of [2, 4, 6]) {
        dots(px, C.green, [[16, y]])
        fill(px, 18, y, 3 + ((y + frame) % 4), 1, C.slate)
      }
      for (const y of [3, 5, 7]) fill(px, 18, y, 2 + ((y + frame) % 5), 1, C.green)
      if (frame % 2 === 0) fill(px, 18, 8, 1, 1, C.white)
      break
    case 'browsing':
      fill(px, 16, 2, 9, 1, C.blue)
      fill(px, 16, 3, 4, 4, frame % 2 === 0 ? C.amber : C.green)
      for (const [y, w] of [[3, 4], [5, 3], [7, 4]] as const) fill(px, 21, y + (frame % 2), w, 1, C.slate)
      break
    case 'tooling': {
      const palette = [C.green, C.blue, C.amber] as const
      let i = 0
      for (const y of [3, 5, 7]) {
        for (const x of [17, 20, 23]) dots(px, palette[(i++ + frame) % 3], [[x, y]])
      }
      break
    }
    case 'planning': {
      const ticks = Math.floor(frame / 2) % 5
      for (let row = 0; row < 4; row++) {
        const isDone = row < ticks
        fill(px, 16, 2 + row * 2, 2, 1, isDone ? C.green : C.slate)
        fill(px, 19, 2 + row * 2, 5, 1, isDone ? C.key : C.slate)
      }
      break
    }
    case 'delegating': {
      fill(px, 19, 2, 3, 2, C.blue)
      dots(px, C.slate, [[20, 4]])
      fill(px, 17, 5, 7, 1, C.slate)
      fill(px, 16, 6, 3, 2, DROP_BOXES[frame % 2])
      fill(px, 22, 6, 3, 2, DROP_BOXES[(frame + 1) % 2])
      break
    }
    case 'testing': {
      const passed = Math.floor(frame / 2) % 4
      for (const [row, y] of [2, 4, 6].entries()) {
        fill(px, 16, y, 2, 1, row < passed ? C.green : C.slate)
        fill(px, 19, y, 5, 1, C.slate)
      }
      fill(px, 16, 8, ((frame % 5) + 1) * 2 - 1, 1, C.blue)
      break
    }
    case 'asking':
      dots(px, frame % 2 === 0 ? C.amber : C.white, POINTS_QUESTION)
      break
    case 'alarmed':
      if (frame % 2 === 0) fill(px, 16, 2, 9, 7, ALARM_BG)
      fill(px, 19, 2, 3, 4, C.red)
      fill(px, 19, 7, 3, 2, C.red)
      break
    default:
      if (frame % 2 === 0) fill(px, 17, 7, 3, 1, C.key)
  }
}

import type { Mood } from '../../types'
import type { Activity } from '../logic/activity'
import { C, canvas, dots, fill, type Pixels } from './pixels'

const COFFEE = 0x6b4423
const ALARM_BG = 0x3b0d0d
const PHONE_BAND = 0x4b5563
const PHONE_CUP = 0x374151
const BOOK_A = 0x60a5fa
const BOOK_B = 0xfbbf24
const BOOK_SPINE = 0x2563eb
const SWEAT = 0x60a5fa

const LINE_LENGTHS = [5, 3, 7, 4, 6, 2, 5, 7, 3, 6] as const
const LINE_INDENTS = [0, 1, 1, 2, 0, 1, 2, 0, 1, 0] as const
const LINE_COLORS = [C.green, C.slate, C.amber, C.blue, C.slate] as const
const READ_LENGTHS = [7, 5, 8, 4, 6, 3] as const
const DROP_BOXES = [C.green, C.amber] as const

type Draw = (x: number, y: number, w: number, h: number, color: number) => void
type Point = readonly [number, number]

const TYPING = new Set<Activity>(['coding', 'running', 'tooling', 'planning', 'delegating', 'testing'])
const POINTS_QUESTION: readonly Point[] = [[19, 2], [20, 2], [21, 2], [18, 3], [22, 3], [22, 4], [21, 5], [20, 5], [20, 6], [20, 8]]

const drawZ = (px: Pixels, frame: number) => {
  const y = 1 - (frame % 2)
  fill(px, 12, y, 3, 1, C.white)
  fill(px, 12, y + 4, 3, 1, C.white)
  dots(px, C.white, [[14, y + 1], [13, y + 2], [12, y + 3]])
}

const drawScreen = (px: Pixels, mood: Mood, activity: Activity, frame: number) => {
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

const drawEyes = (mood: Mood, activity: Activity, frame: number, at: Draw, px: Pixels) => {
  if (mood === 'idle') {
    fill(px, 3, 6, 2, 1, C.eye)
    fill(px, 8, 6, 2, 1, C.eye)
    return
  }
  if (mood === 'done') return void dots(px, C.eye, [[3, 6], [4, 5], [5, 6], [8, 6], [9, 5], [10, 6]])
  if (mood === 'error') {
    return void dots(px, C.eye, [[3, 5], [5, 5], [4, 6], [3, 7], [5, 7], [8, 5], [10, 5], [9, 6], [8, 7], [10, 7]])
  }

  const blink = frame % 9 === 8
  const eyes = (left: number, right: number, top: number) => {
    at(left, blink ? top + 1 : top, 1, blink ? 1 : 2, C.eye)
    at(right, blink ? top + 1 : top, 1, blink ? 1 : 2, C.eye)
  }
  switch (activity) {
    case 'researching': {
      const dart = Math.floor(frame / 2) % 2 === 0 ? -1 : 1
      eyes(4 + dart, 9 + dart, 5)
      break
    }
    case 'running':
      at(4, 6, 2, 1, C.eye)
      at(9, 6, 2, 1, C.eye)
      break
    case 'alarmed':
      eyes(4, 9, 5)
      at(11, 4, 1, 2, SWEAT)
      break
    case 'coffee':
      if (frame % 4 >= 2) {
        for (const [x, y] of [[3, 6], [4, 5], [5, 6], [8, 6], [9, 5], [10, 6]]) at(x, y, 1, 1, C.eye)
      } else {
        eyes(4, 9, 5)
      }
      break
    case 'sleepy':
      at(3, 6, 3, 1, C.eye)
      at(8, 6, 3, 1, C.eye)
      at(3, 5, 3, 1, C.shade)
      at(8, 5, 3, 1, C.shade)
      break
    case 'asking':
      at(4, 4, 1, 3, C.eye)
      at(9, 4, 1, 3, C.eye)
      break
    case 'thinking':
      eyes(4, 9, 4)
      break
    case 'planning':
      eyes(3, 8, 4)
      break
    case 'browsing':
      eyes(5, 10, 4)
      break
    default:
      eyes(5, 10, 5)
  }
}

const drawArms = (px: Pixels, mood: Mood, activity: Activity, frame: number, at: Draw) => {
  const beat = frame % 2
  const isUp = mood === 'done' || (mood === 'working' && activity === 'alarmed')
  if (isUp) {
    at(0, 4 - beat, 2, 2, C.body)
    at(12, 4 - beat, 2, 2, C.body)
    return
  }
  const isTyping = mood === 'working' && TYPING.has(activity)
  at(0, activity === 'asking' ? 4 + beat : 7 + (isTyping ? beat : 0), 2, 2, C.body)
  at(12, 7, 2, 2, C.body)
  fill(px, 13, 9, 2, 1, C.body)
  if (isTyping && beat) fill(px, 14, 10, 2, 1, C.body)
}

const drawProps = (px: Pixels, activity: Activity, frame: number) => {
  switch (activity) {
    case 'coding':
      fill(px, 3, 2, 8, 1, PHONE_BAND)
      fill(px, 1, 3, 1, 4, PHONE_CUP)
      fill(px, 12, 3, 1, 4, PHONE_CUP)
      break
    case 'researching':
      fill(px, 2, 7, 4, 1, C.white)
      fill(px, 7, 7, 4, 1, C.white)
      dots(px, BOOK_SPINE, [[6, 7]])
      fill(px, 1, 8, 11, 3, BOOK_A)
      fill(px, 6, 8, 1, 3, BOOK_SPINE)
      fill(px, 3, 9, 2, 1, BOOK_B)
      dots(px, BOOK_B, [[9, 11], [9, 12 - (frame % 2)]])
      break
    case 'running':
      if (frame % 2 === 0) dots(px, C.green, [[25, 0]])
      break
    case 'browsing':
      dots(px, C.blue, [[18 + (frame % 3) * 3, 0]])
      break
    case 'tooling':
      dots(px, C.amber, [[frame % 2 === 0 ? 14 : 26, 0]])
      break
    case 'delegating':
      fill(px, 6, 1, 1, 2, C.shade)
      dots(px, frame % 2 === 0 ? C.amber : C.light, [[6, 0]])
      break
    case 'coffee': {
      const lift = frame % 4 >= 2 ? -1 : 0
      fill(px, 0, 10 + lift, 4, 4, C.white)
      fill(px, 0, 10 + lift, 4, 1, COFFEE)
      fill(px, 4, 11 + lift, 1, 2, C.edge)
      dots(px, C.slate, lift === 0 ? [[1 - (frame % 2), 8], [2, 7 - (frame % 2)]] : [])
      break
    }
    case 'sleepy':
      drawZ(px, frame)
      break
    case 'testing':
      fill(px, 0, 10, 4, 4, C.edge)
      fill(px, 1, 11, 2, 3, C.green)
      dots(px, C.white, [[2, 9 - (frame % 2)], [1, 8 - (frame % 3 === 0 ? 1 : 0)]])
      break
    case 'alarmed':
      dots(px, C.red, [[0, 1], [26, 1], [1, 0], [25, 0]])
      break
    case 'thinking':
      for (const i of [0, 1, 2]) dots(px, i === frame % 3 ? C.white : C.key, [[3 + i * 2, 1]])
      break
  }
}

export const draw = (mood: Mood, frame: number, activity: Activity): Pixels => {
  const px = canvas()
  const hop = mood === 'done' || (mood === 'working' && activity === 'alarmed') ? -(frame % 2) : 0
  const at: Draw = (x, y, w, h, color) => fill(px, x, y + hop, w, h, color)

  drawScreen(px, mood, activity, frame)
  at(2, 3, 10, 8, C.body)
  at(2, 3, 10, 1, C.light)
  at(11, 4, 1, 7, C.shade)
  at(2, 10, 10, 1, C.shade)
  for (const x of [3, 5, 8, 10]) at(x, 11, 1, 2, C.shade)
  drawArms(px, mood, activity, frame, at)
  drawEyes(mood, activity, frame, at, px)
  if (mood === 'working') drawProps(px, activity, frame)
  if (mood === 'idle') drawZ(px, frame)
  return px
}

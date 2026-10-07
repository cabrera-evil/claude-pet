import type { Member } from '../types'
import { activityFor, VERBS, type Activity } from './activity'
import { C, canvas, dots, fill, type Pixels } from './pixels'

export const MINI_WIDTH = 18
export const MINI_HEIGHT = 12

const ACCENTS = [0x4fb3a5, 0x9b7ede, 0xe07aa8, 0x8fbf4a, 0x5aa0e0] as const
const BEZEL = 0x2d3340
const SWEAT = 0x60a5fa
const WOOD_TOP = 0xc29a6b
const WOOD_SIDE = 0x8b6b4a
const PHONE_BAND = 0x4b5563
const PHONE_CUP = 0x374151
const BOOK_A = 0x60a5fa
const BOOK_B = 0xfbbf24
const COFFEE = 0x6b4423
const ALARM_BG = 0x3b0d0d
const LINE_LENGTHS = [4, 2, 6, 3, 5, 2, 6] as const
const LINE_INDENTS = [0, 1, 0, 2, 0, 1, 0] as const
const LINE_COLORS = [C.green, C.slate, C.amber, C.blue, C.slate] as const


const hash = (text: string) => [...text].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 7)

export const colorFor = (kind: string): number => ACCENTS[hash(kind) % ACCENTS.length]

export const labelFor = (kind: string): string => kind.split(':').pop() ?? kind

type Mini = Pick<Member, 'status' | 'kind' | 'tool' | 'since' | 'alert'>

export const noteFor = (member: Mini, now: number): string => {
  if (member.status === 'done') return 'done'
  if (member.status === 'error') return 'failed'
  return VERBS[activityFor(member, now)]
}

const mix = (color: number, toward: number, weight: number) => {
  const channel = (shift: number) =>
    Math.round(((color >> shift) & 255) * (1 - weight) + ((toward >> shift) & 255) * weight)
  return (channel(16) << 16) | (channel(8) << 8) | channel(0)
}

const drawDesk = (px: Pixels) => {
  fill(px, 0, 8, 18, 1, WOOD_TOP)
  fill(px, 0, 9, 18, 1, WOOD_SIDE)
  fill(px, 1, 10, 1, 2, WOOD_SIDE)
  fill(px, 16, 10, 1, 2, WOOD_SIDE)
}

const drawFrame = (px: Pixels, kind: string) => {
  fill(px, 10, 1, 8, 6, mix(BEZEL, colorFor(kind), 0.5))
  fill(px, 11, 2, 6, 4, C.screen)
  fill(px, 9, 7, 9, 1, C.edge)
}

const drawScreen = (px: Pixels, activity: Activity, frame: number) => {
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
    case 'asking':
      dots(px, frame % 2 === 0 ? C.amber : C.white, [[13, 2], [14, 2], [15, 3], [14, 4], [14, 5]])
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

const drawEyes = (activity: Activity, frame: number, at: Draw) => {
  const blink = frame % 9 === 8
  switch (activity) {
    case 'researching': {
      const dart = Math.floor(frame / 2) % 2 === 0 ? -1 : 1
      at(4 + dart, 4, 1, 2, C.eye)
      at(7 + dart, 4, 1, 2, C.eye)
      break
    }
    case 'running':
      at(3, 5, 2, 1, C.eye)
      at(6, 5, 2, 1, C.eye)
      break
    case 'alarmed':
      at(4, blink ? 5 : 4, 1, blink ? 1 : 2, C.eye)
      at(7, blink ? 5 : 4, 1, blink ? 1 : 2, C.eye)
      at(8, 3, 1, 2, SWEAT)
      break
    case 'coffee': {
      const isSipping = frame % 4 >= 2
      if (isSipping) {
        for (const [x, y] of [[3, 5], [4, 4], [5, 5], [6, 5], [7, 4], [8, 5]]) at(x, y, 1, 1, C.eye)
      } else {
        at(4, 4, 1, 2, C.eye)
        at(7, 4, 1, 2, C.eye)
      }
      break
    }
    case 'sleepy':
      at(3, 5, 2, 1, C.eye)
      at(6, 5, 2, 1, C.eye)
      break
    case 'asking':
      at(4, 3, 1, 3, C.eye)
      at(7, 3, 1, 3, C.eye)
      break
    case 'planning':
      at(3, blink ? 4 : 3, 1, blink ? 1 : 2, C.eye)
      at(6, blink ? 4 : 3, 1, blink ? 1 : 2, C.eye)
      break
    case 'thinking':
      at(4, blink ? 4 : 3, 1, blink ? 1 : 2, C.eye)
      at(7, blink ? 4 : 3, 1, blink ? 1 : 2, C.eye)
      break
    case 'browsing':
      at(5, blink ? 4 : 3, 1, blink ? 1 : 2, C.eye)
      at(7, blink ? 4 : 3, 1, blink ? 1 : 2, C.eye)
      break
    default:
      at(4, blink ? 5 : 4, 1, blink ? 1 : 2, C.eye)
      at(7, blink ? 5 : 4, 1, blink ? 1 : 2, C.eye)
  }
}

type Draw = (x: number, y: number, w: number, h: number, color: number) => void

const drawProps = (px: Pixels, activity: Activity, frame: number) => {
  switch (activity) {
    case 'coding':
      fill(px, 1, 1, 8, 1, PHONE_BAND)
      fill(px, 0, 2, 1, 3, PHONE_CUP)
      fill(px, 9, 2, 1, 3, PHONE_CUP)
      break
    case 'researching':
      fill(px, 2, 7, 4, 1, BOOK_B)
      fill(px, 3, 6, 3, 1, BOOK_A)
      break
    case 'running':
      if (frame % 2 === 0) dots(px, C.green, [[17, 0]])
      break
    case 'coffee': {
      const lift = frame % 4 >= 2 ? -1 : 0
      fill(px, 1, 5 + lift, 3, 3, C.white)
      fill(px, 1, 5 + lift, 3, 1, COFFEE)
      dots(px, C.edge, [[4, 6 + lift]])
      dots(px, C.slate, lift === 0 ? [[2 - (frame % 2), 3], [3, 4 - (frame % 2)]] : [])
      break
    }
    case 'alarmed':
      dots(px, C.red, [[9, 0], [17, 0]])
      break
    case 'delegating':
      dots(px, C.shade, [[4, 1]])
      dots(px, frame % 2 === 0 ? C.amber : C.light, [[4, 0]])
      break
    case 'sleepy':
      dots(px, C.white, [[3 + (frame % 2), 1 - (frame % 2)], [6, 0]])
      break
    case 'browsing':
      dots(px, C.blue, [[12 + (frame % 3) * 2, 0]])
      break
    case 'tooling':
      dots(px, C.amber, [[frame % 2 === 0 ? 9 : 17, 0]])
      break
    default:
      for (const i of [0, 1, 2]) dots(px, i === frame % 3 ? C.white : C.key, [[3 + i * 2, 0]])
  }
}

const drawPet = (px: Pixels, member: Mini, frame: number, activity: Activity) => {
  const { status } = member
  const beat = frame % 2
  const hop = status === 'done' || activity === 'alarmed' ? -beat : 0
  const at: Draw = (x, y, w, h, color) => fill(px, x, y + hop, w, h, color)

  at(1, 2, 8, 6, C.body)
  at(1, 2, 8, 1, C.light)
  at(8, 3, 1, 5, C.shade)
  at(1, 7, 8, 1, C.shade)

  if (status === 'working') {
    drawEyes(activity, frame, at)
    const isTyping = ['coding', 'running', 'tooling', 'planning', 'delegating'].includes(activity)
    const isRaised = activity === 'alarmed'
    at(0, isRaised ? 3 : activity === 'asking' ? 3 + beat : 5 + (isTyping ? beat : 0), 1, 2, C.body)
    at(9, isRaised ? 3 : 5, 1, 2, C.body)
    if (isTyping) fill(px, 9, 7, 1, 1, beat ? C.body : C.edge)
  } else if (status === 'done') {
    dots(px, C.eye, [[3, 5 + hop], [4, 4 + hop], [5, 5 + hop], [6, 5 + hop], [7, 4 + hop], [8, 5 + hop]])
    at(0, 3, 1, 2, C.body)
    at(9, 3, 1, 2, C.body)
  } else {
    dots(px, C.eye, [[3, 4], [5, 4], [4, 5], [3, 6], [5, 6], [6, 4], [8, 4], [7, 5], [6, 6], [8, 6]])
    dots(px, SWEAT, [[9, 2], [9, 3]])
    at(0, 6, 1, 2, C.body)
    at(9, 6, 1, 2, C.body)
  }
}

export const drawMini = (member: Mini, frame: number, now: number): Pixels => {
  const px = canvas(MINI_WIDTH, MINI_HEIGHT)
  const activity = member.status === 'working' ? activityFor(member, now) : 'thinking'

  drawFrame(px, member.kind)
  drawPet(px, member, frame, activity)
  drawDesk(px)

  if (member.status === 'working') {
    drawScreen(px, activity, frame)
    drawProps(px, activity, frame)
  } else if (member.status === 'done') {
    dots(px, C.green, [[12, 4], [13, 5], [14, 4], [15, 3], [16, 2]])
  } else {
    dots(px, C.red, [[13, 2], [15, 2], [14, 3], [13, 4], [15, 4]])
  }
  return px
}

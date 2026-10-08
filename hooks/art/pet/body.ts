import { C, type Draw, type Pixels, dots, fill } from '../pixels'
import type { Mood } from '../../../types'
import type { Activity } from '../../logic/activity'
import { TYPING } from './constants'

export const drawZ = (px: Pixels, frame: number) => {
  const y = 1 - (frame % 2)
  fill(px, 12, y, 3, 1, C.white)
  fill(px, 12, y + 4, 3, 1, C.white)
  dots(px, C.white, [[14, y + 1], [13, y + 2], [12, y + 3]])
}

export const drawArms = (px: Pixels, mood: Mood, activity: Activity, frame: number, at: Draw) => {
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

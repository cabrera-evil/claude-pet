import { C, type Draw, type Pixels, dots, fill } from '../pixels'
import { ghost, zed } from '../ghost'
import type { Mood } from '../../../types'
import type { Activity } from '../../logic/activity'
import { TYPING } from './constants'

export const drawZ = (px: Pixels, frame: number) => {
  const bob = frame % 2
  ghost(px, [...zed(10, 2 + bob, 3, 0.35), ...zed(14, 1 + bob, 4, 0.5), ...zed(19, bob, 5, 0.65)])
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

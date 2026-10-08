import { C, type Draw, type Pixels, dots, drawZs, fill } from '../pixels'
import type { Mood } from '../../../types'
import type { Activity } from '../../logic/activity'
import { TYPING } from './constants'

export const drawZ = (px: Pixels, frame: number) => {
  const bob = frame % 2
  drawZs(px, [
    { x: 10, y: 2 + bob, size: 3, alpha: 0.35 },
    { x: 14, y: 1 + bob, size: 4, alpha: 0.5 },
    { x: 19, y: 0 + bob, size: 5, alpha: 0.65 },
  ])
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

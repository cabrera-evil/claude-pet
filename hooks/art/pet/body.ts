import { C, type Draw, type Pixels } from '../pixels'
import { ghost, zed } from '../ghost'
import type { Mood } from '../../../types'
import type { Activity } from '../../logic/activity'
import { TYPING } from './constants'

export const drawZ = (px: Pixels, frame: number) => {
  const bob = frame % 2
  ghost(px, [...zed(10, 2 + bob, 3, 0.35), ...zed(14, 1 + bob, 4, 0.5), ...zed(19, bob, 5, 0.65)])
}

export const drawArms = (mood: Mood, activity: Activity, frame: number, at: Draw) => {
  const beat = frame % 2
  const isUp = mood === 'done' || (mood === 'working' && activity === 'alarmed')
  if (isUp) {
    const top = 4 - beat
    const length = 5 + beat
    for (const [outer, inner] of [[0, 1], [13, 12]]) {
      at(outer, top, 1, length, C.body)
      at(inner, top, 1, length, C.shade)
      at(outer, top, 1, 1, C.light)
    }
    return
  }
  const isTyping = mood === 'working' && TYPING.has(activity)
  at(1, activity === 'asking' ? 4 + beat : 7, 1, 2, C.body)
  if (isTyping) at(12, 8 + beat, 2, 2, C.body)
  else at(12, 7, 1, 2, C.body)
}

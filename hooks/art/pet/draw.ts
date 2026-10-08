import { C, type Draw, type Pixels, canvas, fill } from '../pixels'
import type { Mood } from '../../../types'
import type { Activity } from '../../logic/activity'
import { drawArms, drawZ } from './body'
import { drawEyes } from './eyes'
import { drawProps } from './props'
import { drawScreen } from './screen'

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
  drawArms(mood, activity, frame, at)
  drawEyes(mood, activity, frame, at, px)
  if (mood === 'working') drawProps(px, activity, frame)
  if (mood === 'idle') drawZ(px, frame)
  return px
}

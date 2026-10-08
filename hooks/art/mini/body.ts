import { C, type Draw, type Pixels, dots, fill } from '../pixels'
import { SWEAT } from '../palette'
import type { Activity } from '../../logic/activity'
import { drawEyes } from './eyes'
import type { Mini } from './identity'

export const drawPet = (px: Pixels, member: Mini, frame: number, activity: Activity) => {
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
    const isTyping = ['coding', 'running', 'tooling', 'planning', 'delegating', 'testing'].includes(activity)
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

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

  const raise = (x: number) => at(x, 3 - beat, 1, 4 + beat, C.body)

  at(1, 2, 8, 6, C.body)
  at(1, 2, 8, 1, C.light)
  at(8, 3, 1, 5, C.shade)
  at(1, 7, 8, 1, C.shade)

  if (status === 'working') {
    drawEyes(activity, frame, at)
    const isTyping = ['coding', 'running', 'tooling', 'planning', 'delegating', 'testing'].includes(activity)
    const isRaised = activity === 'alarmed'
    if (isRaised) {
      raise(0)
      raise(9)
    } else {
      at(0, activity === 'asking' ? 3 + beat : 5, 1, 2, C.body)
      at(9, isTyping ? 6 + beat : 5, 1, 2, C.body)
    }
  } else if (status === 'done') {
    dots(px, C.eye, [[2, 5 + hop], [3, 4 + hop], [4, 5 + hop], [6, 5 + hop], [7, 4 + hop], [8, 5 + hop]])
    raise(0)
    raise(9)
  } else {
    dots(px, C.eye, [[2, 3], [4, 3], [3, 4], [2, 5], [4, 5], [6, 3], [8, 3], [7, 4], [6, 5], [8, 5]])
    dots(px, SWEAT, [[9, 2], [9, 3]])
    at(0, 6, 1, 2, C.body)
    at(9, 6, 1, 2, C.body)
  }
}

import { C, type Pixels, canvas, dots } from '../pixels'
import { activityFor } from '../../logic/activity'
import { drawPet } from './body'
import { MINI_HEIGHT, MINI_WIDTH } from './constants'
import { drawDesk, drawFrame } from './desk'
import type { Mini } from './identity'
import { drawProps } from './props'
import { drawScreen } from './screen'

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

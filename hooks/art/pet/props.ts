import { C, type Pixels, dots, fill } from '../pixels'
import { COFFEE, PHONE_BAND, PHONE_CUP, BOOK_A, BOOK_B, BOOK_SPINE } from '../palette'
import type { Activity } from '../../logic/activity'
import { cloud, ghost, question, wisp } from '../ghost'
import { drawZ } from './body'

export const drawProps = (px: Pixels, activity: Activity, frame: number) => {
  switch (activity) {
    case 'coding':
      fill(px, 4, 1, 6, 1, PHONE_BAND)
      fill(px, 2, 2, 2, 1, PHONE_BAND)
      fill(px, 10, 2, 2, 1, PHONE_BAND)
      fill(px, 0, 3, 2, 4, PHONE_CUP)
      fill(px, 12, 3, 2, 4, PHONE_CUP)
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
      ghost(px, [...wisp(1, 9 + lift, frame % 2 === 0, 0.85), ...wisp(3, 9 + lift, frame % 2 !== 0, 0.85)])
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
    case 'thinking':
      ghost(px, cloud(7, 0, 0.5))
      for (const i of [0, 1, 2]) dots(px, i === frame % 3 ? C.white : C.key, [[8 + i * 2, 1]])
      break
    case 'asking':
      ghost(px, question(10, frame % 2, 0.85))
      break
  }
}

import { C, type Pixels, dots, fill } from '../pixels'
import { COFFEE, PHONE_BAND, PHONE_CUP, BOOK_A, BOOK_B, BOOK_SPINE } from '../palette'
import type { Activity } from '../../logic/activity'

export const drawProps = (px: Pixels, activity: Activity, frame: number) => {
  switch (activity) {
    case 'coding':
      fill(px, 1, 1, 8, 1, PHONE_BAND)
      fill(px, 0, 2, 1, 3, PHONE_CUP)
      fill(px, 9, 2, 1, 3, PHONE_CUP)
      break
    case 'researching':
      fill(px, 1, 6, 3, 1, C.white)
      fill(px, 5, 6, 3, 1, C.white)
      fill(px, 1, 7, 8, 1, BOOK_A)
      dots(px, BOOK_SPINE, [[4, 6], [4, 7]])
      dots(px, BOOK_B, [[2, 7]])
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
    case 'testing':
      fill(px, 1, 5, 3, 3, C.edge)
      fill(px, 2, 6, 1, 2, C.green)
      dots(px, C.white, [[2, 4 - (frame % 2)]])
      break
    case 'alarmed':
      dots(px, C.red, [[9, 0], [17, 0]])
      break
    case 'delegating':
      dots(px, C.shade, [[4, 1]])
      dots(px, frame % 2 === 0 ? C.amber : C.light, [[4, 0]])
      break
    case 'sleepy':
      fill(px, 6, 0, 3, 1, frame % 2 === 0 ? C.white : C.slate)
      fill(px, 6, 3, 3, 1, frame % 2 === 0 ? C.white : C.slate)
      dots(px, frame % 2 === 0 ? C.white : C.slate, [[8, 1], [7, 2]])
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

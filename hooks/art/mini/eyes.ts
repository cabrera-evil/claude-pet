import { C, type Draw } from '../pixels'
import { SWEAT } from '../palette'
import type { Activity } from '../../logic/activity'

export const drawEyes = (activity: Activity, frame: number, at: Draw) => {
  const blink = frame % 9 === 8
  switch (activity) {
    case 'researching': {
      const dart = Math.floor(frame / 2) % 2 === 0 ? -1 : 1
      at(4 + dart, 4, 1, 2, C.eye)
      at(7 + dart, 4, 1, 2, C.eye)
      break
    }
    case 'running':
      at(3, 5, 2, 1, C.eye)
      at(6, 5, 2, 1, C.eye)
      break
    case 'alarmed':
      at(4, blink ? 5 : 4, 1, blink ? 1 : 2, C.eye)
      at(7, blink ? 5 : 4, 1, blink ? 1 : 2, C.eye)
      at(8, 3, 1, 2, SWEAT)
      break
    case 'coffee': {
      const isSipping = frame % 4 >= 2
      if (isSipping) {
        for (const [x, y] of [[3, 5], [4, 4], [5, 5], [6, 5], [7, 4], [8, 5]]) at(x, y, 1, 1, C.eye)
      } else {
        at(4, 4, 1, 2, C.eye)
        at(7, 4, 1, 2, C.eye)
      }
      break
    }
    case 'sleepy':
      at(3, 5, 2, 1, C.eye)
      at(6, 5, 2, 1, C.eye)
      break
    case 'asking':
      at(4, 3, 1, 3, C.eye)
      at(7, 3, 1, 3, C.eye)
      break
    case 'planning':
      at(3, blink ? 4 : 3, 1, blink ? 1 : 2, C.eye)
      at(6, blink ? 4 : 3, 1, blink ? 1 : 2, C.eye)
      break
    case 'thinking':
      at(4, blink ? 4 : 3, 1, blink ? 1 : 2, C.eye)
      at(7, blink ? 4 : 3, 1, blink ? 1 : 2, C.eye)
      break
    case 'browsing':
      at(5, blink ? 4 : 3, 1, blink ? 1 : 2, C.eye)
      at(7, blink ? 4 : 3, 1, blink ? 1 : 2, C.eye)
      break
    default:
      at(4, blink ? 5 : 4, 1, blink ? 1 : 2, C.eye)
      at(7, blink ? 5 : 4, 1, blink ? 1 : 2, C.eye)
  }
}

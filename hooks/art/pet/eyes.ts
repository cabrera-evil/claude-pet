import { C, type Draw, type Pixels, dots, fill } from '../pixels'
import { SWEAT } from '../palette'
import type { Mood } from '../../../types'
import type { Activity } from '../../logic/activity'

export const drawEyes = (mood: Mood, activity: Activity, frame: number, at: Draw, px: Pixels) => {
  if (mood === 'idle') {
    fill(px, 3, 6, 2, 1, C.eye)
    fill(px, 8, 6, 2, 1, C.eye)
    return
  }
  if (mood === 'done') return void dots(px, C.eye, [[3, 6], [4, 5], [5, 6], [8, 6], [9, 5], [10, 6]])
  if (mood === 'error') {
    return void dots(px, C.eye, [[3, 5], [5, 5], [4, 6], [3, 7], [5, 7], [8, 5], [10, 5], [9, 6], [8, 7], [10, 7]])
  }

  const blink = frame % 9 === 8
  const eyes = (left: number, right: number, top: number) => {
    at(left, blink ? top + 1 : top, 1, blink ? 1 : 2, C.eye)
    at(right, blink ? top + 1 : top, 1, blink ? 1 : 2, C.eye)
  }
  switch (activity) {
    case 'researching': {
      const dart = Math.floor(frame / 2) % 2 === 0 ? -1 : 1
      eyes(4 + dart, 9 + dart, 5)
      break
    }
    case 'running':
      at(4, 6, 2, 1, C.eye)
      at(9, 6, 2, 1, C.eye)
      break
    case 'alarmed':
      eyes(4, 9, 5)
      at(11, 4, 1, 2, SWEAT)
      break
    case 'coffee':
      if (frame % 4 >= 2) {
        for (const [x, y] of [[3, 6], [4, 5], [5, 6], [8, 6], [9, 5], [10, 6]]) at(x, y, 1, 1, C.eye)
      } else {
        eyes(4, 9, 5)
      }
      break
    case 'sleepy':
      at(3, 6, 3, 1, C.eye)
      at(8, 6, 3, 1, C.eye)
      at(3, 5, 3, 1, C.shade)
      at(8, 5, 3, 1, C.shade)
      break
    case 'asking':
      at(4, 4, 1, 3, C.eye)
      at(9, 4, 1, 3, C.eye)
      break
    case 'thinking':
      eyes(4, 9, 4)
      break
    case 'planning':
      eyes(3, 8, 4)
      break
    case 'browsing':
      eyes(5, 10, 4)
      break
    default:
      eyes(5, 10, 5)
  }
}

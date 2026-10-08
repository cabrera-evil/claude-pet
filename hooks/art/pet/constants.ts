import { C, type Point } from '../pixels'
import type { Activity } from '../../logic/activity'

export const LINE_LENGTHS = [5, 3, 7, 4, 6, 2, 5, 7, 3, 6] as const

export const LINE_INDENTS = [0, 1, 1, 2, 0, 1, 2, 0, 1, 0] as const

export const LINE_COLORS = [C.green, C.slate, C.amber, C.blue, C.slate] as const

export const READ_LENGTHS = [7, 5, 8, 4, 6, 3] as const

export const DROP_BOXES = [C.green, C.amber] as const

export const TYPING = new Set<Activity>(['coding', 'running', 'tooling', 'planning', 'delegating', 'testing'])

export const POINTS_QUESTION: readonly Point[] = [[19, 2], [20, 2], [21, 2], [18, 3], [22, 3], [22, 4], [21, 5], [20, 5], [20, 6], [20, 8]]

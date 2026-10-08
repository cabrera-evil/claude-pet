import type { Member } from '../../../types'
import { activityFor, VERBS } from '../../logic/activity'
import { ACCENTS } from './constants'

const hash = (text: string) => [...text].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 7)

export const colorFor = (kind: string): number => ACCENTS[hash(kind) % ACCENTS.length]

export const labelFor = (kind: string): string => kind.split(':').pop() ?? kind

export type Mini = Pick<Member, 'status' | 'kind' | 'tool' | 'since' | 'alert'>

export const noteFor = (member: Mini, now: number): string => {
  if (member.status === 'done') return 'done'
  if (member.status === 'error') return 'failed'
  return VERBS[activityFor(member, now)]
}

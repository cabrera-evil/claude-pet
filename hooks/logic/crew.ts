import type { Member, MemberStatus } from '../../types'

export const OVERFLOW_COLUMNS = 10

const MAX_SHOWN = 5

export type CrewFit = {
  shown: Member[]
  overflow: { total: number; working: number; failed: number } | null
}

export const fitCrew = (members: readonly Member[], room: number, slot: number): CrewFit => {
  const ordered = [...members].sort((a, b) => Number(b.status === 'working') - Number(a.status === 'working'))
  const fits = Math.min(MAX_SHOWN, Math.floor(room / slot))
  if (ordered.length <= fits) return { shown: ordered, overflow: null }
  if (room < OVERFLOW_COLUMNS) return { shown: [], overflow: null }

  const count = Math.max(0, Math.min(MAX_SHOWN, Math.floor((room - OVERFLOW_COLUMNS - 1) / slot)))
  const hidden = ordered.slice(count)
  return {
    shown: ordered.slice(0, count),
    overflow: {
      total: hidden.length,
      working: hidden.filter(m => m.status === 'working').length,
      failed: hidden.filter(m => m.status === 'error').length,
    },
  }
}

export const isActive = (member: Member) => member.status === 'working'

export const statusFor = (reason: string): MemberStatus => (reason === 'answer' ? 'done' : 'error')

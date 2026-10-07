export type Mood = 'idle' | 'working' | 'done' | 'error'

export type MemberStatus = 'working' | 'done' | 'error'

export type Member = {
  id: string
  kind: string
  tool: string | null
  status: MemberStatus
  since: number
  alert: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'tiny-pet': { mood: Mood; frame: number; tool: string | null; toolSince: number; alert: boolean; isHidden: boolean; hasStarted: boolean; size: string; crew: Member[] }
  }
}

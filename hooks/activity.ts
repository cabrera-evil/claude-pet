export type Activity =
  | 'thinking'
  | 'coding'
  | 'researching'
  | 'running'
  | 'browsing'
  | 'tooling'
  | 'planning'
  | 'delegating'
  | 'asking'
  | 'coffee'
  | 'sleepy'
  | 'alarmed'

export type Pulse = { tool: string | null; since: number; alert: boolean }

const COFFEE_AFTER_MS = 6000
const SLEEPY_AFTER_MS = 25000
const SLOW_COMMAND_MS = 12000

const READ_TOOLS = new Set(['Read', 'Grep', 'Glob', 'LS', 'NotebookRead'])
const WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const WEB_TOOLS = new Set(['WebFetch', 'WebSearch'])
const PLAN_TOOLS = new Set(['TodoWrite', 'ExitPlanMode', 'EnterPlanMode'])
const DELEGATE_TOOLS = new Set(['Task', 'Agent', 'SendMessage', 'TeamCreate'])

export const VERBS: Record<Activity, string> = {
  thinking: 'thinking',
  coding: 'coding',
  researching: 'reading',
  running: 'running',
  browsing: 'browsing',
  tooling: 'working',
  planning: 'planning',
  delegating: 'delegating',
  asking: 'asking',
  coffee: 'coffee',
  sleepy: 'sleepy',
  alarmed: 'error!',
}

export const activityOf = (tool: string): Activity => {
  if (READ_TOOLS.has(tool)) return 'researching'
  if (WRITE_TOOLS.has(tool)) return 'coding'
  if (tool === 'Bash') return 'running'
  if (WEB_TOOLS.has(tool)) return 'browsing'
  if (PLAN_TOOLS.has(tool)) return 'planning'
  if (DELEGATE_TOOLS.has(tool)) return 'delegating'
  if (tool === 'AskUserQuestion') return 'asking'
  return 'tooling'
}

export const activityFor = (pulse: Pulse, now: number): Activity => {
  const waited = now - pulse.since
  if (pulse.alert) return 'alarmed'
  if (pulse.tool === null) {
    if (waited > SLEEPY_AFTER_MS) return 'sleepy'
    return waited > COFFEE_AFTER_MS ? 'coffee' : 'thinking'
  }
  if (pulse.tool === 'Bash' && waited > SLOW_COMMAND_MS) return 'coffee'
  return activityOf(pulse.tool)
}

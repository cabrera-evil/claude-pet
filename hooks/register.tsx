import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Member, Mood } from '../types'
import { activityFor } from './logic/activity'
import { isActive, statusFor } from './logic/crew'
import { isSize } from './logic/size'
import {
  ALERT_MS,
  ARGUMENT_HINT,
  CREW_REST_MS,
  IDLE_TICK_MS,
  MAX_TRACKED,
  REST_MS,
  SIZE_KEY,
  USAGE,
  WORK_TICK_MS,
} from './config'
import { renderBand } from './view/band'

const mood = atom({ plugin: 'tiny-pet', key: 'mood' } as const, 'idle')
const frame = atom({ plugin: 'tiny-pet', key: 'frame' } as const, 0)
const tool = atom({ plugin: 'tiny-pet', key: 'tool' } as const, null)
const toolSince = atom({ plugin: 'tiny-pet', key: 'toolSince' } as const, 0)
const alert = atom({ plugin: 'tiny-pet', key: 'alert' } as const, false)
const isHidden = atom({ plugin: 'tiny-pet', key: 'isHidden' } as const, false)
const hasStarted = atom({ plugin: 'tiny-pet', key: 'hasStarted' } as const, false)
const size = atom({ plugin: 'tiny-pet', key: 'size' } as const, 'medium')
const crew = atom({ plugin: 'tiny-pet', key: 'crew' } as const, [])

let ticker: { cancel: () => void } | null = null

const retime = ($: EngineInterface, ms: number) => {
  ticker?.cancel()
  ticker = $.clock.every(ms, () => void update($, frame, n => n + 1))
}

const settle = async ($: EngineInterface) => {
  const isBusy = (await read($, mood)) === 'working' || (await read($, crew)).some(isActive)
  retime($, isBusy ? WORK_TICK_MS : IDLE_TICK_MS)
}

export const register: Register = (on, options) => {
  const defaultSize = String(options.size)
  let rest: { cancel: () => void } | null = null
  let startedAt = 0

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'pet',
      description: 'Show, hide or resize the Claude pet',
      argumentHint: ARGUMENT_HINT,
      immediate: true,
    })
    const saved = String((await $.store.get(SIZE_KEY)) ?? '')
    await update($, size, () => (isSize(saved) ? saved : isSize(defaultSize) ? defaultSize : 'medium'))
    retime($, IDLE_TICK_MS)
    if ((await $.session.turns()) > 0) await update($, hasStarted, () => true)

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    if (!e.text.trimStart().startsWith('/')) await update($, hasStarted, () => true)

    return next(e)
  }).catch((_$, e, next) => next(e))

  on('command.run', { command: 'pet' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()

    if (isSize(arg)) {
      await $.store.set(SIZE_KEY, arg)
      await update($, size, () => arg)
      await update($, isHidden, () => false)

      return { text: `Pet size set to ${arg}.` }
    }
    if (arg === '' || arg === 'hide' || arg === 'show') {
      const hidden = arg === '' ? !(await read($, isHidden)) : arg === 'hide'
      await update($, isHidden, () => hidden)

      return { text: hidden ? 'Pet is taking a nap (hidden).' : 'Pet is back.' }
    }

    return { text: USAGE }
  })

  on('turn.start', async ($, e, next) => {
    rest?.cancel()
    startedAt = await $.clock.now()
    await update($, hasStarted, () => true)
    await update($, mood, (): Mood => 'working')
    await update($, tool, () => null)
    await update($, toolSince, () => startedAt)
    await update($, alert, () => false)
    await settle($)

    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if ('agentId' in started && started.agentId) {
      const member: Member = {
        id: started.agentId,
        kind: e.subagentType,
        tool: null,
        status: 'working',
        since: await $.clock.now(),
        alert: false,
      }
      await update($, crew, list => [...list.filter(m => m.id !== member.id), member].slice(-MAX_TRACKED))
      await settle($)
    }

    return started
  }).catch((_$, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    const agentId = e.agentId
    if (agentId === undefined) {
      await update($, tool, () => e.tool)
      const mainStarted = await $.clock.now()
      await update($, toolSince, () => mainStarted)
      const mainRan = await next(e)
      await update($, tool, () => null)
      const mainEnded = await $.clock.now()
      await update($, toolSince, () => mainEnded)
      if (mainRan.isError === true) {
        await update($, alert, () => true)
        $.clock.after(ALERT_MS, () => void update($, alert, () => false))
      }

      return mainRan
    }

    const startedCall = await $.clock.now()
    await update($, crew, list => list.map(m => (m.id === agentId ? { ...m, tool: e.tool, since: startedCall } : m)))
    const ran = await next(e)
    const endedCall = await $.clock.now()
    const failed = ran.isError === true
    await update($, crew, list =>
      list.map(m => (m.id === agentId ? { ...m, tool: null, since: endedCall, alert: m.alert || failed } : m)),
    )
    if (failed) {
      $.clock.after(ALERT_MS, () => {
        void update($, crew, list => list.map(m => (m.id === agentId ? { ...m, alert: false } : m)))
      })
    }

    return ran
  }).catch((_$, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const agentId = e.agentId
    if (agentId !== undefined) {
      const status = statusFor(e.reason)
      await update($, crew, list => list.map(m => (m.id === agentId ? { ...m, status, tool: null, alert: false } : m)))
      $.clock.after(CREW_REST_MS, () => {
        void update($, crew, list => list.filter(m => m.id !== agentId)).then(() => settle($))
      })
      await settle($)

      return next(e)
    }

    await update($, mood, (): Mood => (e.reason === 'answer' ? 'done' : e.reason === 'aborted' ? 'idle' : 'error'))
    await update($, tool, () => null)
    await update($, alert, () => false)
    await settle($)
    rest = $.clock.after(REST_MS, () => void update($, mood, (): Mood => 'idle'))

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden)) || !(await read($, hasStarted))) {
      return next(e)
    }

    const current = await read($, mood)
    const label = await read($, tool)
    const members = await read($, crew)
    const tick = await read($, frame)
    const now = await $.clock.now()
    const seconds = current === 'working' ? Math.round((now - startedAt) / 1000) : 0
    const activity = current === 'working' ? activityFor({ tool: label, since: await read($, toolSince), alert: await read($, alert) }, now) : 'thinking'
    return renderBand({
      elements: $.ui.resolve(e),
      surface: e.surface,
      maxRows: e.props.maxRows,
      bodyColumns: e.props.bodyColumns,
      sizeName: await read($, size),
      current,
      activity,
      label,
      seconds,
      tick,
      now,
      members,
    })
  })
}

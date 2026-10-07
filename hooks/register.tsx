import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Member, MemberStatus, Mood } from '../types'
import { activityFor, type Activity } from './activity'
import { fitCrew, OVERFLOW_COLUMNS } from './crew'
import { colorFor, drawMini, labelFor, MINI_HEIGHT, MINI_WIDTH, noteFor } from './mini'
import { draw } from './pet'
import { HEIGHT, WIDTH } from './pixels'
import { cellSize, toCells, toSvg } from './render'

const WORK_TICK_MS = 300
const IDLE_TICK_MS = 900
const REST_MS = 5000
const CREW_REST_MS = 3000
const ALERT_MS = 3000
const MAX_TRACKED = 64
const SVG_SCALE = 6
const SIZES: Record<string, number> = { small: 0.5, medium: 1, large: 2 }
const SIZE_KEY = 'size'
const isSize = (value: string) => Object.keys(SIZES).includes(value)
const ARGUMENT_HINT = '[small|medium|large|hide|show]'
const USAGE = `Usage: /pet ${ARGUMENT_HINT}. With no argument it hides or shows the pet.`
const CAPTION_COLUMNS = 24
const COLUMN_GAP = 2
const LABEL_COLUMNS = 10

const mood = atom({ plugin: 'tiny-pet', key: 'mood' } as const, 'idle')
const frame = atom({ plugin: 'tiny-pet', key: 'frame' } as const, 0)
const tool = atom({ plugin: 'tiny-pet', key: 'tool' } as const, null)
const toolSince = atom({ plugin: 'tiny-pet', key: 'toolSince' } as const, 0)
const alert = atom({ plugin: 'tiny-pet', key: 'alert' } as const, false)
const isHidden = atom({ plugin: 'tiny-pet', key: 'isHidden' } as const, false)
const hasStarted = atom({ plugin: 'tiny-pet', key: 'hasStarted' } as const, false)
const size = atom({ plugin: 'tiny-pet', key: 'size' } as const, 'medium')
const crew = atom({ plugin: 'tiny-pet', key: 'crew' } as const, [])

const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`
const clip = (text: string, width: number) => (text.length > width ? `${text.slice(0, width - 1)}~` : text)
const isActive = (member: Member) => member.status === 'working'

const TITLES: Record<Activity, string> = {
  thinking: 'Thinking…',
  coding: 'Coding',
  researching: 'Reading',
  running: 'Running',
  browsing: 'Browsing',
  testing: 'Testing',
  tooling: 'Working',
  planning: 'Planning',
  delegating: 'Delegating',
  asking: 'Asking you',
  coffee: 'Coffee break',
  sleepy: 'Getting sleepy…',
  alarmed: 'Found an error!',
}

const DETAILS: Partial<Record<Activity, string>> = {
  coffee: 'Waiting on the model',
  sleepy: 'Waiting a long while',
  alarmed: 'A tool call failed',
}

const caption = (current: Mood, activity: Activity, label: string | null, seconds: number, helpers: number) => {
  const crewNote = helpers > 0 ? ` · ${helpers} helper${helpers === 1 ? '' : 's'}` : ''
  switch (current) {
    case 'working': {
      const tail = DETAILS[activity] ?? (label ? `${clip(label.split('__').pop() ?? label, CAPTION_COLUMNS - 8)} · ${seconds}s` : `${seconds}s`)
      return { title: TITLES[activity], detail: `${tail}${crewNote}` }
    }
    case 'done':
      return { title: 'All done!', detail: helpers > 0 ? `${helpers} helper${helpers === 1 ? '' : 's'} still working` : 'Ready when you are' }
    case 'error':
      return { title: 'Oops', detail: 'Something went wrong' }
    default:
      return helpers > 0
        ? { title: 'Supervising', detail: `${helpers} helper${helpers === 1 ? '' : 's'} at work` }
        : { title: 'Zzz', detail: 'Napping by the laptop · /pet to hide or resize' }
  }
}

const fitScale = (wanted: number, maxRows: number) =>
  [2, 1, 0.5].filter(candidate => candidate <= wanted).find(candidate => cellSize(WIDTH, HEIGHT, candidate).rows <= maxRows) ?? 0.5

const statusFor = (reason: string): MemberStatus => (reason === 'answer' ? 'done' : 'error')

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
    const pixels = draw(current, tick, activity)
    const { title, detail } = caption(current, activity, label, seconds, members.filter(isActive).length)
    const scale = fitScale(SIZES[await read($, size)] ?? 1, e.props.maxRows)
    const main = cellSize(WIDTH, HEIGHT, scale)
    const mini = cellSize(MINI_WIDTH, MINI_HEIGHT, scale)
    const elements = $.ui.resolve(e)
    const { Box, Text } = elements
    const art =
      e.surface === 'terminal'
        ? elements.Raster({ key: 'pet', columns: main.columns, rows: main.rows, cells: toCells(pixels, scale) })
        : elements.Svg({ source: toSvg(pixels, SVG_SCALE * scale), alt: `Claude pet is ${current}` })

    const room = e.props.bodyColumns - main.columns - CAPTION_COLUMNS - COLUMN_GAP * 2
    const { shown, overflow } = fitCrew(members, room, Math.max(mini.columns, LABEL_COLUMNS) + 1)

    const minis = shown.map((member, index) => {
      const sprite = drawMini(member, tick + index, now)
      const picture =
        e.surface === 'terminal'
          ? elements.Raster({ key: `crew-${member.id}`, columns: mini.columns, rows: mini.rows, cells: toCells(sprite, scale) })
          : elements.Svg({ source: toSvg(sprite, SVG_SCALE * scale), alt: `${labelFor(member.kind)} subagent is ${member.status}` })
      const note = noteFor(member, now)

      return (
        <Box key={member.id} flexDirection="column" width={Math.max(mini.columns, LABEL_COLUMNS)}>
          {picture}
          <Text bold color={hex(colorFor(member.kind))}>{clip(labelFor(member.kind), Math.max(mini.columns, LABEL_COLUMNS))}</Text>
          <Text dimColor>{clip(note, Math.max(mini.columns, LABEL_COLUMNS))}</Text>
        </Box>
      )
    })

    return (
      <Box flexDirection="row" gap={COLUMN_GAP}>
        {art}
        {(shown.length > 0 || overflow) && (
          <Box flexDirection="row" gap={1} marginTop={Math.max(0, main.rows - mini.rows - 2)}>
            {minis}
            {overflow && (
              <Box flexDirection="column" width={OVERFLOW_COLUMNS} height={mini.rows + 2} justifyContent="center">
                <Text bold color="claude">+{overflow.total} more</Text>
                <Text dimColor>{overflow.working} working</Text>
                {overflow.failed > 0 && <Text dimColor>{overflow.failed} failed</Text>}
              </Box>
            )}
          </Box>
        )}
        <Box flexDirection="column" marginTop={Math.max(0, Math.floor((main.rows - 2) / 2))} width={CAPTION_COLUMNS}>
          <Text bold color="claude">{title}</Text>
          <Text dimColor>{detail}</Text>
        </Box>
      </Box>
    )
  })
}

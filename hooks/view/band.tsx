import type { EngineInterface } from 'claude-code'

import type { Member, Mood } from '../../types'
import { MINI_HEIGHT, MINI_WIDTH } from '../art/mini/constants'
import { drawMini } from '../art/mini/draw'
import { colorFor, labelFor, noteFor } from '../art/mini/identity'
import { draw } from '../art/pet/draw'
import { HEIGHT, WIDTH } from '../art/pixels'
import { CAPTION_COLUMNS, COLUMN_GAP, LABEL_COLUMNS, SVG_SCALE } from '../config'
import { clip, hex } from '../format'
import type { Activity } from '../logic/activity'
import { caption } from '../logic/caption'
import { fitCrew, isActive, OVERFLOW_COLUMNS } from '../logic/crew'
import { fitScale, SIZES } from '../logic/size'
import { cellSize, toCells, toSvg } from '../render/render'

type Elements = ReturnType<EngineInterface['ui']['resolve']>

export type BandInput = {
  elements: Elements
  surface: string
  maxRows: number
  bodyColumns: number
  sizeName: string
  current: Mood
  activity: Activity
  label: string | null
  seconds: number
  tick: number
  now: number
  members: readonly Member[]
}

export const renderBand = ({ elements, surface, maxRows, bodyColumns, sizeName, current, activity, label, seconds, tick, now, members }: BandInput) => {
  const pixels = draw(current, tick, activity)
  const { title, detail } = caption(current, activity, label, seconds, members.filter(isActive).length)
  const scale = fitScale(SIZES[sizeName] ?? 1, maxRows)
  const main = cellSize(WIDTH, HEIGHT, scale)
  const mini = cellSize(MINI_WIDTH, MINI_HEIGHT, scale)
  const { Box, Text } = elements
  const art =
    surface === 'terminal'
      ? elements.Raster({ key: 'pet', columns: main.columns, rows: main.rows, cells: toCells(pixels, scale) })
      : elements.Svg({ source: toSvg(pixels, SVG_SCALE * scale), alt: `Claude pet is ${current}` })

  const room = bodyColumns - main.columns - CAPTION_COLUMNS - COLUMN_GAP * 2
  const { shown, overflow } = fitCrew(members, room, Math.max(mini.columns, LABEL_COLUMNS) + 1)

  const minis = shown.map((member, index) => {
    const sprite = drawMini(member, tick + index, now)
    const picture =
      surface === 'terminal'
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
}

import { CLEAR, type Pixels } from './pixels'

const DEFAULT_COLOR = 0x01000000
const UPPER_HALF = 0x2580
const LOWER_HALF = 0x2584
const SPACE = 0x20
const QUADRANTS = [0x20, 0x2598, 0x259d, 0x2580, 0x2596, 0x258c, 0x259e, 0x259b, 0x2597, 0x259a, 0x2590, 0x259c, 0x2584, 0x2599, 0x259f, 0x2588] as const

export const columnsOf = (px: Pixels) => px[0].length
export const rowsOf = (px: Pixels) => px.length

export const cellSize = (width: number, height: number, scale: number) =>
  scale < 1
    ? { columns: Math.ceil(width / 2), rows: Math.ceil(height / 2) }
    : { columns: width * scale, rows: (height * scale) / 2 }

const upscale = (px: Pixels, factor: number): Pixels =>
  px.flatMap(line => {
    const wide = line.flatMap(color => Array<number>(factor).fill(color))
    return Array.from({ length: factor }, () => wide)
  })

const distance = (a: number, b: number) => {
  if (a === b) return 0
  if (a === CLEAR || b === CLEAR) return 1e9
  const d = (shift: number) => ((a >> shift) & 255) - ((b >> shift) & 255)
  return d(16) ** 2 + d(8) ** 2 + d(0) ** 2
}

const pack = (words: Uint32Array) => new Uint8Array(words.buffer).toBase64()

const halfBlocks = (px: Pixels): string => {
  const rows = rowsOf(px) / 2
  const columns = columnsOf(px)
  const words = new Uint32Array(columns * rows * 3)
  let at = 0
  for (let row = 0; row < rows; row++) {
    for (let x = 0; x < columns; x++) {
      const top = px[row * 2][x]
      const bottom = px[row * 2 + 1][x]
      const hasTop = top !== CLEAR
      const hasBottom = bottom !== CLEAR
      words[at++] = hasTop ? UPPER_HALF : hasBottom ? LOWER_HALF : SPACE
      words[at++] = hasTop ? top : hasBottom ? bottom : DEFAULT_COLOR
      words[at++] = hasTop && hasBottom ? bottom : DEFAULT_COLOR
    }
  }
  return pack(words)
}

const quadrants = (px: Pixels): string => {
  const rows = Math.ceil(rowsOf(px) / 2)
  const columns = Math.ceil(columnsOf(px) / 2)
  const words = new Uint32Array(columns * rows * 3)
  let at = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cell = [
        px[row * 2]?.[col * 2] ?? CLEAR,
        px[row * 2]?.[col * 2 + 1] ?? CLEAR,
        px[row * 2 + 1]?.[col * 2] ?? CLEAR,
        px[row * 2 + 1]?.[col * 2 + 1] ?? CLEAR,
      ]
      const counts = new Map<number, number>()
      for (const color of cell) counts.set(color, (counts.get(color) ?? 0) + 1)
      const [first, second = first] = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([color]) => color)
      const isForeground = (color: number) => distance(color, first) <= distance(color, second)
      let mask = cell.reduce((bits, color, i) => (isForeground(color) ? bits | (1 << i) : bits), 0)
      let fg = first
      let bg = second
      if (fg === CLEAR && bg !== CLEAR) {
        fg = second
        bg = first
        mask = ~mask & 15
      }
      words[at++] = fg === CLEAR ? SPACE : QUADRANTS[mask]
      words[at++] = fg === CLEAR ? DEFAULT_COLOR : fg
      words[at++] = bg === CLEAR || bg === fg ? DEFAULT_COLOR : bg
    }
  }
  return pack(words)
}

export const toCells = (px: Pixels, scale: number): string => (scale < 1 ? quadrants(px) : halfBlocks(upscale(px, scale)))

const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`

export const toSvg = (px: Pixels, scale: number): string => {
  const rects: string[] = []
  px.forEach((line, y) =>
    line.forEach((color, x) => {
      if (color !== CLEAR) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${hex(color)}"/>`)
    }),
  )
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${columnsOf(px)} ${rowsOf(px)}" width="${columnsOf(px) * scale}" height="${rowsOf(px) * scale}" shape-rendering="crispEdges">${rects.join('')}</svg>`
}

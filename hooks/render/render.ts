import { C, CLEAR, type Pixels } from '../art/pixels'

const DEFAULT_COLOR = 0x01000000
const UPPER_HALF = 0x2580
const LOWER_HALF = 0x2584
const SPACE = 0x20
const MIN_OPAQUE = 2

export const columnsOf = (px: Pixels) => px[0].length
export const rowsOf = (px: Pixels) => px.length

export const cellSize = (width: number, height: number, scale: number) =>
  scale < 1
    ? { columns: Math.ceil(width / 2), rows: Math.ceil(Math.ceil(height / 2) / 2) }
    : { columns: width * scale, rows: (height * scale) / 2 }

const upscale = (px: Pixels, factor: number): Pixels =>
  px.flatMap(line => {
    const wide = line.flatMap(color => Array<number>(factor).fill(color))
    return Array.from({ length: factor }, () => wide)
  })

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

const downsample = (px: Pixels): Pixels => {
  const rows = Math.ceil(rowsOf(px) / 2)
  const columns = Math.ceil(columnsOf(px) / 2)
  const small: Pixels = Array.from({ length: rows + (rows % 2) }, () => Array<number>(columns).fill(CLEAR))
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const block = [px[y * 2]?.[x * 2], px[y * 2]?.[x * 2 + 1], px[y * 2 + 1]?.[x * 2], px[y * 2 + 1]?.[x * 2 + 1]]
      const opaque = block.filter((c): c is number => c !== undefined && c !== CLEAR)
      if (opaque.length < MIN_OPAQUE) continue
      if (opaque.includes(C.eye)) {
        small[y][x] = C.eye
        continue
      }
      const counts = new Map<number, number>()
      for (const color of opaque) counts.set(color, (counts.get(color) ?? 0) + 1)
      small[y][x] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    }
  }
  return small
}

export const toCells = (px: Pixels, scale: number): string =>
  scale < 1 ? halfBlocks(downsample(px)) : halfBlocks(upscale(px, scale))


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

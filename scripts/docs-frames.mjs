// Prints the README preview frames as JSON. Usage: node --no-warnings scripts/docs-frames.mjs
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

const hook = `
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context)
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.')) return next(specifier + '.ts', context)
    throw error
  }
}`
register('data:text/javascript,' + encodeURIComponent(hook))

const art = (path) => import(pathToFileURL(new URL(`../hooks/${path}.ts`, import.meta.url).pathname))
const { draw } = await art('art/pet/draw')
const { drawMini } = await art('art/mini/draw')
const { activityFor } = await art('logic/activity')

const FRAMES = 12
const DEMO_FRAMES = 8
const NOW = 100000
const KIND = 'Explore'

const pulse = (tool, wait = 0, alert = false) => ({ tool, since: NOW - wait, alert })
const petOf = (frame, p) => draw('working', frame, activityFor(p, NOW))
const miniOf = (frame, p, status = 'working') => drawMini({ status, kind: KIND, ...p }, frame, NOW)

const LOOKS = [
  ['thinking', pulse(null)],
  ['coding', pulse('Edit')],
  ['reading', pulse('Read')],
  ['running', pulse('Bash')],
  ['browsing', pulse('WebFetch')],
  ['testing', pulse('mcp__playwright__x')],
  ['working', pulse('Foo')],
  ['planning', pulse('TodoWrite')],
  ['delegating', pulse('Task')],
  ['asking', pulse('AskUserQuestion')],
  ['coffee', pulse(null, 7000)],
  ['sleepy', pulse(null, 30000)],
]
const ALARM = pulse('Bash', 0, true)
const IDLE = pulse(null)

const range = (n) => Array.from({ length: n }, (_, i) => i)

const pet = (f) => [
  ...LOOKS.map(([name, p]) => [name, petOf(f, p)]),
  ['error found', petOf(f, ALARM)],
  ['done', draw('done', f, 'thinking')],
  ['error', draw('error', f, 'thinking')],
  ['idle', draw('idle', f, 'thinking')],
]

const crew = (f) => [
  ...LOOKS.map(([name, p]) => [name, miniOf(f, p)]),
  ['alarmed', miniOf(f, ALARM)],
  ['done', miniOf(f, IDLE, 'done')],
  ['failed', miniOf(f, IDLE, 'error')],
]

const demo = (f) => ({
  pet: petOf(f, pulse('Edit')),
  minis: [pulse('Read'), pulse(null), pulse(null, 7000), ALARM].map((p) => miniOf(f, p)),
})

console.log(JSON.stringify({ pet: range(FRAMES).map(pet), crew: range(FRAMES).map(crew), demo: range(DEMO_FRAMES).map(demo) }))

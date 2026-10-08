import type { Mood } from '../../types'
import { CAPTION_COLUMNS } from '../config'
import { clip } from '../format'
import type { Activity } from './activity'

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

export const caption = (current: Mood, activity: Activity, label: string | null, seconds: number, helpers: number) => {
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

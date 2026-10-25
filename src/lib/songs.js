import catalog from '../data/catalog.json' with { type: 'json' }
export const songs = catalog
export const legacySongs = [
  { id: 'scott-joplin-the-entertainer-demo-v1', title: 'The Entertainer', artist: 'Scott Joplin',
    audio: '/music/the-entertainer/piano.mp3', chartRoot: '/music/the-entertainer', duration: '1 min 03', previewAt: 7.5,
    description: 'Piano solo · Mélodie synchronisée · Démo', hint: 'Suivez la mélodie du piano. Les mêmes phrases reviennent avec les mêmes touches.' },
  { id: 'joe-dassin-dans-les-yeux-emilie', title: 'Dans les yeux d’Émilie', artist: 'Joe Dassin',
    audio: '/music/emilie.mp3', chartRoot: '/music', duration: '3 min 42', previewAt: 35,
    description: 'Version précédente · Pour comparer', hint: 'La version précédente reste disponible pour comparer les sensations.' },
]
export function songRecords(records, songId) { return records.filter(record => record.songId === songId) }

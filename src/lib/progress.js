export const starsFor = accuracy => accuracy >= 95 ? 3 : accuracy >= 80 ? 2 : accuracy >= 60 ? 1 : 0
export function progressFor(records, songId) {
  const rounds = records.filter(r => r.songId === songId)
  return { played: rounds.length > 0, stars: Math.max(0, ...rounds.map(r => starsFor(r.accuracy))),
    accuracy: Math.max(0, ...rounds.map(r => r.accuracy || 0)), score: Math.max(0, ...rounds.map(r => r.score || 0)) }
}
export function dailySong(songs, date = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  const hash = [...day].reduce((value, letter) => (value * 31 + letter.charCodeAt(0)) >>> 0, 7)
  return songs[hash % songs.length]
}
export function readFavorites(storage) {
  try { storage ??= globalThis.localStorage; const value = JSON.parse(storage.getItem('promodev-favorites') || '[]'); return Array.isArray(value) ? value.filter(x => typeof x === 'string') : [] } catch { return [] }
}

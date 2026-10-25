export function nickname(value) {
 const name = typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\s+/gu, ' ') : ''
 if (name.length < 2 || name.length > 24 || !/^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u.test(name)) {
  throw Object.assign(new Error('Choisissez un pseudo de 2 à 24 caractères : lettres, chiffres, espaces, tirets ou points.'), {status:400})
 }
 // Case, accents and equivalent Unicode forms cannot reserve the same nickname twice.
 const key = name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
 return {name, key}
}

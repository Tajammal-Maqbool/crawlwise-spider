const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' })

export function isValidHreflang(code: string): boolean {
  const value = code.trim()
  if (value.toLowerCase() === 'x-default') return true
  const [lang, region, ...rest] = value.split('-')
  if (rest.length > 0 || !/^[a-z]{2,3}$/i.test(lang)) return false
  if (!knownLanguage(lang)) return false
  return region === undefined || (/^[a-z]{2}$/i.test(region) && knownRegion(region))
}

function knownLanguage(lang: string): boolean {
  try {
    const name = languageNames.of(lang.toLowerCase())
    return !!name && name.toLowerCase() !== lang.toLowerCase()
  } catch {
    return false
  }
}

function knownRegion(region: string): boolean {
  try {
    const name = regionNames.of(region.toUpperCase())
    return !!name && name !== region.toUpperCase()
  } catch {
    return false
  }
}

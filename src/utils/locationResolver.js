// Resolução estruturada de locais — substitui fuzzy .includes() matching
// Usado por: callsheet, production, locations

/**
 * Encontra um local registado que corresponda ao nome de cena do guião.
 * Prioridade: exact name → exact displayName → case-insensitive → substring
 */
export function resolveLocation(locations, sceneName) {
  if (!sceneName || !locations?.length) return null
  const lower = sceneName.toLowerCase()

  // 1. Match exacto por name
  const exact = locations.find(l => l.name === sceneName)
  if (exact) return exact

  // 2. Match exacto por displayName
  const byDisplay = locations.find(l => l.displayName === sceneName)
  if (byDisplay) return byDisplay

  // 3. Case-insensitive match
  const ci = locations.find(l =>
    l.name?.toLowerCase() === lower ||
    l.displayName?.toLowerCase() === lower
  )
  if (ci) return ci

  // 4. Substring match (o nome do guião contém ou está contido no do local)
  const sub = locations.find(l => {
    const ln = (l.displayName || l.name || '').toLowerCase()
    return ln && (lower.includes(ln) || ln.includes(lower))
  })
  return sub || null
}

/**
 * Filtra cenas que correspondem a um local registado.
 */
export function scenesForLocation(allScenes, loc) {
  if (!loc) return []
  const names = [loc.name, loc.displayName].filter(Boolean).map(n => n.toLowerCase())
  return allScenes.filter(sc => {
    if (!sc.location) return false
    const sl = sc.location?.toLowerCase()
    return names.some(n => sl === n || sl.includes(n) || n.includes(sl))
  })
}

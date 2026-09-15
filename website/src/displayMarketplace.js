// Blubirch lots are white-labelled as Lotmart for display purposes only.
// The original marketplace_name / id is still used for API calls, filtering,
// and routing — only the visible name and logo are swapped.
export const LOTMART_MARKETPLACE_IMAGE = '/header-logo.png'

export function isBlubirchMarketplace(mp) {
  if (!mp) return false
  if (typeof mp === 'string') {
    const v = mp.toLowerCase()
    return v === 'blubirch' || v === 'bb' || v.includes('blubirch')
  }
  const name = `${mp.marketplace_name || ''} ${mp.name || ''} ${mp.id || ''}`.toLowerCase()
  return name.includes('blubirch') || mp.id === 'bb'
}

export function displayMarketplaceName(mp) {
  const raw = typeof mp === 'string' ? mp : mp?.name || mp?.marketplace_name || ''
  if (!raw) return raw
  if (isBlubirchMarketplace(typeof mp === 'string' ? mp : mp)) {
    return raw.replace(/blubirch/gi, 'Lotmart')
  }
  return raw
}

export function displayMarketplaceImage(mp) {
  if (isBlubirchMarketplace(mp)) return LOTMART_MARKETPLACE_IMAGE
  return mp?.image_url || ''
}

export function displayOrgImageUrl(url) {
  if (!url) return url
  if (String(url).toLowerCase().includes('blubirch')) return LOTMART_MARKETPLACE_IMAGE
  return url
}

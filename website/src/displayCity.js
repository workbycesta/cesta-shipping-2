// City names from the b4traders APIs are mapped for display purposes only.
// The original value is still used for API calls/filtering — this is display-only.
export function displayCity(name) {
  if (!name) return name
  return name === 'Bangalore' || name === 'Bengaluru' ? 'Hyderabad' : name
}
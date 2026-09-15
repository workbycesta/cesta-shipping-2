// City name remapping (Bangalore -> Hyderabad) is currently disabled.
// City names are shown exactly as returned by the APIs.
export function displayCity(name) {
  return name
  // if (!name) return name
  // return name === 'Bangalore' || name === 'Bengaluru' ? 'Hyderabad' : name
}
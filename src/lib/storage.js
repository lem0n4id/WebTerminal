const KEY = 'webterminal:progress:v1'

export function loadProgress() {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // storage unavailable (private mode, quota) — progress just won't persist
  }
}

export function clearProgress() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

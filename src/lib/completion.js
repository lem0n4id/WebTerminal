// Tab-completion candidates for the shell.
//
// Contract (shared with the terminal's Tab handler):
//   getCompletions(line, { commands: string[], fs: { ls: () => string[] } }) => string[]
// - first token  -> complete from the commands list
// - later tokens -> complete from fs.ls()
// - prefix-filtered, case-sensitive, never throws, [] on no match
export function getCompletions(line, { commands = [], fs = null } = {}) {
  try {
    const input = typeof line === 'string' ? line : ''
    const endsWithSpace = /\s$/.test(input)
    const tokens = input.split(/\s+/).filter(Boolean)
    const completingFirst = tokens.length === 0 || (tokens.length === 1 && !endsWithSpace)
    const prefix = endsWithSpace ? '' : tokens[tokens.length - 1] || ''

    let candidates
    if (completingFirst) {
      candidates = commands
    } else {
      candidates = fs && typeof fs.ls === 'function' ? fs.ls() : []
    }

    if (!Array.isArray(candidates)) return []
    return candidates.filter((c) => typeof c === 'string' && c.startsWith(prefix))
  } catch {
    return []
  }
}

export default getCompletions

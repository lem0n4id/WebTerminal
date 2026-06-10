// Pure, terminal-agnostic tab-completion logic. Kept free of any
// jquery.terminal / xterm.js specifics so it survives terminal migrations.

/**
 * Compute completion candidates for the last token of an input line.
 *
 * - First token still being typed (leading whitespace ignored): candidates
 *   come from `ctx.commands` filtered by prefix. Multi-word entries in the
 *   command list (e.g. 'cd ..') are skipped — they are not real command
 *   names and would pollute matches for plain 'cd'.
 * - After the first token: the last token is treated as a path and
 *   candidates come from `ctx.fs.ls()` (current directory) filtered by
 *   prefix. A trailing space means an empty prefix, i.e. all entries.
 *
 * Matching is case-sensitive, like a real shell.
 *
 * @param {string} line - full input line so far (e.g. 'cd Doc')
 * @param {{ commands: string[], fs: { ls: () => string[] } }} ctx
 * @returns {string[]} candidate completions for the LAST token of line
 */
export function getCompletions(line, ctx) {
  try {
    if (typeof line !== 'string' || !ctx) return []

    const prefix = line.slice(line.lastIndexOf(' ') + 1)
    // First token still being typed (nothing but whitespace before it, like a
    // shell ignoring leading spaces): complete command names
    const firstToken = line.slice(0, line.length - prefix.length).trim() === ''

    if (firstToken) {
      const commands = Array.isArray(ctx.commands) ? ctx.commands : []
      return commands.filter(
        name =>
          typeof name === 'string' &&
          !name.includes(' ') &&
          name.startsWith(prefix)
      )
    }

    // Past the first token: complete file/directory names from the cwd
    if (!ctx.fs || typeof ctx.fs.ls !== 'function') return []
    const entries = ctx.fs.ls()
    if (!Array.isArray(entries)) return []
    return entries.filter(
      name => typeof name === 'string' && name.startsWith(prefix)
    )
  } catch {
    return []
  }
}

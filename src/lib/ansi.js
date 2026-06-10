// ANSI escape sequence helpers — xterm.js renders these natively
const wrap = (code) => (s) => `\x1b[${code}m${s}\x1b[0m`

export const bold = wrap('1')
export const green = wrap('1;32')
export const red = wrap('1;31')
export const yellow = wrap('1;33')
export const white = wrap('1;37')

// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g

export const stripAnsi = (s) => String(s).replace(ANSI_PATTERN, '')

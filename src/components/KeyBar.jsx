import React from 'react'

// On-screen helper keys for touch devices (the Termux/Blink extra-keys
// pattern): keys that are awkward or impossible to reach on mobile soft
// keyboards. Each press is forwarded to the shell via `send`, which is
// exactly equivalent to typing the same data.
const KEYS = [
  { testId: 'key-tab', label: 'Tab', aria: 'Tab key', data: '\t' },
  { testId: 'key-up', label: '↑', aria: 'History up', data: '\x1b[A' },
  { testId: 'key-down', label: '↓', aria: 'History down', data: '\x1b[B' },
  { testId: 'key-tilde', label: '~', aria: 'Tilde key', data: '~' },
  { testId: 'key-slash', label: '/', aria: 'Slash key', data: '/' },
  { testId: 'key-dash', label: '-', aria: 'Dash key', data: '-' },
  { testId: 'key-dot', label: '.', aria: 'Dot key', data: '.' },
]

export default function KeyBar({ send }) {
  return (
    <div className="key-bar" data-testid="key-bar">
      {KEYS.map((key) => (
        <button
          key={key.testId}
          type="button"
          data-testid={key.testId}
          aria-label={key.aria}
          // preventDefault keeps the press from stealing focus away from
          // the terminal (and from dismissing the soft keyboard)
          onPointerDown={(e) => {
            e.preventDefault()
            send(key.data)
          }}
        >
          {key.label}
        </button>
      ))}
    </div>
  )
}

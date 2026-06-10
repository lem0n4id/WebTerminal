import React, { useMemo } from 'react'

const MAX_CHIPS = 4

// Educational command suggestion chips (the Swift Playgrounds
// insert-don't-run pattern): tapping a chip inserts the command text into
// the shell's input buffer — trailing space, no newline — so the learner
// still finishes and runs the command themselves.
//
// `getPending()` returns the not-yet-completed command names; the parent
// bumps `version` after every executed command so the chips refresh.
export default function CommandChips({ send, getPending, version = 0 }) {
  const pending = useMemo(() => getPending(), [version, getPending])

  return (
    <div className="command-chips" data-testid="command-chips">
      {pending.slice(0, MAX_CHIPS).map((name) => (
        <button
          key={name}
          type="button"
          data-testid={`chip-${name}`}
          aria-label={`Insert ${name} command`}
          // preventDefault keeps focus on the terminal; the chip only
          // inserts text, it never runs the command
          onPointerDown={(e) => {
            e.preventDefault()
            send(name + ' ')
          }}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

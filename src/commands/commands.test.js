import { describe, it, expect, beforeEach } from 'vitest'
import CounterService from './counter.service'

describe('CounterService', () => {
  let counter

  beforeEach(() => {
    counter = new CounterService()
  })

  it('all commands start as not done', () => {
    for (const cmd of counter.allCommands()) {
      expect(counter.getStatus(cmd)).toContain('Not completed')
    }
  })

  it('setDone marks a command done', () => {
    counter.setDone('echo')
    expect(counter.getStatus('echo')).toContain('Completed')
  })

  it('setDone for unknown command does not throw', () => {
    expect(() => counter.setDone('nonexistent')).not.toThrow()
  })

  it('completedCount starts at 0', () => {
    expect(counter.completedCount()).toBe(0)
  })

  it('completedCount increments on setDone', () => {
    counter.setDone('echo')
    counter.setDone('pwd')
    expect(counter.completedCount()).toBe(2)
  })

  it('totalCount matches allCommands length', () => {
    expect(counter.totalCount()).toBe(counter.allCommands().length)
  })

  it('allCommands contains expected commands', () => {
    const cmds = counter.allCommands()
    expect(cmds).toContain('echo')
    expect(cmds).toContain('ls')
    expect(cmds).toContain('mkdir')
    expect(cmds).toContain('cat')
    expect(cmds).toContain('touch')
    expect(cmds).toContain('cp')
    expect(cmds).toContain('rm')
    expect(cmds).toContain('history')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import CounterService from './counter.service'

describe('CounterService', () => {
  let counter

  beforeEach(() => {
    window.localStorage.clear()
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

  it('progress persists across instances', () => {
    counter.setDone('echo')
    counter.setDone('pwd')
    const fresh = new CounterService()
    expect(fresh.getStatus('echo')).toContain('Completed')
    expect(fresh.getStatus('pwd')).toContain('Completed')
    expect(fresh.completedCount()).toBe(2)
  })

  it('corrupt JSON in localStorage is ignored', () => {
    window.localStorage.setItem('webterminal:progress:v1', '{not valid json!!')
    let fresh
    expect(() => {
      fresh = new CounterService()
    }).not.toThrow()
    expect(fresh.completedCount()).toBe(0)
  })

  it('non-object JSON in localStorage is ignored', () => {
    window.localStorage.setItem('webterminal:progress:v1', '"just a string"')
    const fresh = new CounterService()
    expect(fresh.completedCount()).toBe(0)
  })

  it('unknown command keys in storage are ignored', () => {
    window.localStorage.setItem(
      'webterminal:progress:v1',
      JSON.stringify({ echo: true, bogus: true, 'rm -rf /': true, toString: true })
    )
    const fresh = new CounterService()
    expect(fresh.getStatus('echo')).toContain('Completed')
    expect(fresh.allCommands()).not.toContain('bogus')
    expect(fresh.allCommands()).not.toContain('rm -rf /')
    expect(fresh.allCommands()).not.toContain('toString')
    expect(fresh.completedCount()).toBe(1)
  })

  it('resetProgress marks everything undone and clears storage', () => {
    counter.setDone('echo')
    counter.setDone('ls')
    counter.resetProgress()
    expect(counter.completedCount()).toBe(0)
    expect(window.localStorage.getItem('webterminal:progress:v1')).toBeNull()
    const fresh = new CounterService()
    expect(fresh.completedCount()).toBe(0)
  })
})

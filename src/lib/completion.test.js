import { describe, it, expect, beforeEach } from 'vitest'
import { getCompletions } from './completion.js'
import FileSystem from './fs.js'

const COMMANDS = ['echo', 'pwd', 'ls', 'cd', 'cat', 'clear', 'cp', 'help']

describe('getCompletions', () => {
  let fs
  let ctx

  beforeEach(() => {
    fs = new FileSystem()
    ctx = { commands: COMMANDS, fs }
  })

  describe('command-name completion (first token)', () => {
    it('completes a command prefix', () => {
      expect(getCompletions('ec', ctx)).toEqual(['echo'])
    })

    it('returns all commands for an empty line', () => {
      expect(getCompletions('', ctx)).toEqual(COMMANDS)
    })

    it('returns multiple matches sharing a prefix', () => {
      expect(getCompletions('c', ctx)).toEqual(['cd', 'cat', 'clear', 'cp'])
    })

    it('matches case-sensitively', () => {
      expect(getCompletions('EC', ctx)).toEqual([])
    })

    it('returns [] when nothing matches', () => {
      expect(getCompletions('zzz', ctx)).toEqual([])
    })

    it('ignores leading whitespace, like a shell', () => {
      expect(getCompletions(' ec', ctx)).toEqual(['echo'])
    })

    it('skips multi-word command-list entries so they do not break plain prefixes', () => {
      // Some command lists include variants like 'cd ..' or 'cd ~'; these are
      // not typeable command names, so completion ignores them entirely.
      const withMultiWord = {
        commands: ['cd', 'cd ..', 'cd ~', 'cat'],
        fs,
      }
      expect(getCompletions('cd', withMultiWord)).toEqual(['cd'])
      expect(getCompletions('c', withMultiWord)).toEqual(['cd', 'cat'])
    })
  })

  describe('file completion (after the first token)', () => {
    it('completes a file/dir prefix from the cwd', () => {
      expect(getCompletions('cd Doc', ctx)).toEqual(['Documents'])
    })

    it('returns all cwd entries after a trailing space', () => {
      expect(getCompletions('cat ', ctx)).toEqual([
        'Documents',
        'Downloads',
        'readme.txt',
      ])
    })

    it('completes the LAST token of a multi-argument line', () => {
      expect(getCompletions('cp readme.txt Dow', ctx)).toEqual(['Downloads'])
    })

    it('reflects the current directory after cd', () => {
      fs.cd('Documents')
      expect(getCompletions('cat read', ctx)).toEqual([])
      expect(getCompletions('ls ', ctx)).toEqual([])
    })

    it('returns [] when no entry matches', () => {
      expect(getCompletions('cat zzz', ctx)).toEqual([])
    })
  })

  describe('robustness — never throws', () => {
    it('handles missing or malformed context', () => {
      expect(getCompletions('ec', null)).toEqual([])
      expect(getCompletions('ec', {})).toEqual([])
      expect(getCompletions('cat r', {})).toEqual([])
      expect(getCompletions('cat r', { commands: COMMANDS })).toEqual([])
      expect(getCompletions('cat r', { fs: { ls: () => null } })).toEqual([])
      expect(getCompletions('cat r', { fs: { ls: () => { throw new Error('boom') } } })).toEqual([])
    })

    it('handles non-string lines', () => {
      expect(getCompletions(null, ctx)).toEqual([])
      expect(getCompletions(undefined, ctx)).toEqual([])
      expect(getCompletions(42, ctx)).toEqual([])
    })
  })
})

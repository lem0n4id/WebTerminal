import { describe, it, expect, beforeEach } from 'vitest'
import FileSystem from './fs.js'

describe('FileSystem', () => {
  let fs

  beforeEach(() => {
    fs = new FileSystem()
  })

  describe('pwd', () => {
    it('starts at /home/user', () => {
      expect(fs.pwd()).toBe('/home/user')
    })
  })

  describe('ls', () => {
    it('lists Documents, Downloads, readme.txt in home', () => {
      const contents = fs.ls()
      expect(contents).toContain('Documents')
      expect(contents).toContain('Downloads')
      expect(contents).toContain('readme.txt')
    })
  })

  describe('cd', () => {
    it('changes into a valid directory', () => {
      const result = fs.cd('Documents')
      expect(result.ok).toBe(true)
      expect(fs.pwd()).toBe('/home/user/Documents')
    })

    it('returns error for non-existent directory', () => {
      const result = fs.cd('nonexistent')
      expect(result.ok).toBe(false)
    })

    it('cd ".." goes up one level', () => {
      fs.cd('Documents')
      fs.cd('..')
      expect(fs.pwd()).toBe('/home/user')
    })

    it('cd "~" goes back to /home/user', () => {
      fs.cd('Documents')
      fs.cd('~')
      expect(fs.pwd()).toBe('/home/user')
    })

    it('cd "" goes back to /home/user', () => {
      fs.cd('Documents')
      fs.cd('')
      expect(fs.pwd()).toBe('/home/user')
    })

    it('cannot cd into a file', () => {
      const result = fs.cd('readme.txt')
      expect(result.ok).toBe(false)
    })
  })

  describe('mkdir', () => {
    it('creates a directory', () => {
      fs.mkdir('TestDir')
      expect(fs.ls()).toContain('TestDir')
    })

    it('returns error for duplicate', () => {
      fs.mkdir('TestDir')
      const result = fs.mkdir('TestDir')
      expect(result.ok).toBe(false)
    })

    it('created dir is navigable', () => {
      fs.mkdir('NewDir')
      fs.cd('NewDir')
      expect(fs.pwd()).toBe('/home/user/NewDir')
    })

    it('mkdir contents survive cd and return', () => {
      fs.cd('Documents')
      fs.mkdir('Notes')
      fs.cd('..')
      fs.cd('Documents')
      expect(fs.ls()).toContain('Notes')
    })
  })

  describe('touch', () => {
    it('creates a file', () => {
      fs.touch('test.txt')
      expect(fs.ls()).toContain('test.txt')
    })

    it('touching existing file is idempotent', () => {
      fs.touch('test.txt')
      const result = fs.touch('test.txt')
      expect(result.ok).toBe(true)
    })
  })

  describe('cat', () => {
    it('reads file content', () => {
      const result = fs.cat('readme.txt')
      expect(result.ok).toBe(true)
      expect(result.message).toContain('WebTerminal')
    })

    it('returns error for non-existent file', () => {
      const result = fs.cat('nope.txt')
      expect(result.ok).toBe(false)
    })

    it('returns error for directory', () => {
      const result = fs.cat('Documents')
      expect(result.ok).toBe(false)
    })
  })

  describe('rm', () => {
    it('removes a file', () => {
      fs.touch('temp.txt')
      fs.rm('temp.txt')
      expect(fs.ls()).not.toContain('temp.txt')
    })

    it('returns error for non-existent item', () => {
      const result = fs.rm('ghost.txt')
      expect(result.ok).toBe(false)
    })
  })

  describe('cp', () => {
    it('copies a file', () => {
      fs.cp('readme.txt', 'readme-copy.txt')
      expect(fs.ls()).toContain('readme-copy.txt')
      expect(fs.cat('readme-copy.txt').message).toBe(fs.cat('readme.txt').message)
    })

    it('returns error for non-existent source', () => {
      const result = fs.cp('ghost.txt', 'copy.txt')
      expect(result.ok).toBe(false)
    })
  })
})

let fs_commands = (context, counter, fs) => {
  return {
    ls: () => {
      counter.setDone('ls')
      const contents = fs.ls()
      if (contents.length === 0) {
        context.echo('(empty directory)\n')
      } else {
        context.echo(contents.join('  ') + '\n')
      }
      context.echo('> [[b;#ff3300;]ls] lists the files and directories in the current directory.')
      context.echo('> Now try [[b;#ff3300;]cd Documents] to change directories.\n')
    },

    cd: (arg) => {
      const target = arg || '~'
      if (target === '..') counter.setDone('cd ..')
      else if (target === '~' || target === '') counter.setDone('cd ~')
      else counter.setDone('cd')
      const result = fs.cd(target)
      context.echo(result.message + '\n')
      if (result.ok) {
        context.echo(`> You are now in [[b;#44D544;]${fs.pwd()}]`)
        context.echo('> Type [[b;#ff3300;]ls] to see what\'s here.\n')
      }
    },

    mkdir: (arg) => {
      if (!arg) { context.echo('Usage: mkdir <directory-name>\n'); return }
      counter.setDone('mkdir')
      const result = fs.mkdir(arg)
      context.echo(result.message + '\n')
      if (result.ok) context.echo('> [[b;#ff3300;]mkdir] creates a new directory.\n')
    },

    touch: (arg) => {
      if (!arg) { context.echo('Usage: touch <filename>\n'); return }
      counter.setDone('touch')
      const result = fs.touch(arg)
      context.echo(result.message + '\n')
      context.echo('> [[b;#ff3300;]touch] creates an empty file (or updates its timestamp).\n')
    },

    cat: (arg) => {
      if (!arg) { context.echo('Usage: cat <filename>\n'); return }
      counter.setDone('cat')
      const result = fs.cat(arg)
      context.echo(result.message + '\n')
      if (result.ok) context.echo('> [[b;#ff3300;]cat] displays the contents of a file.\n')
    },

    cp: (src, dst) => {
      if (!src || !dst) { context.echo('Usage: cp <source> <destination>\n'); return }
      counter.setDone('cp')
      const result = fs.cp(src, dst)
      context.echo(result.message + '\n')
      if (result.ok) context.echo('> [[b;#ff3300;]cp] copies a file.\n')
    },

    rm: (arg) => {
      if (!arg) { context.echo('Usage: rm <filename>\n'); return }
      counter.setDone('rm')
      const result = fs.rm(arg)
      context.echo(result.message + '\n')
      if (result.ok) context.echo('> [[b;#ff3300;]rm] removes a file. Be careful — there\'s no trash!\n')
    },
  }
}

export { fs_commands }

import { green, red } from '../lib/ansi'

let basic = (context, counter, fs) => {
  return {
    help: () => {
      context.echo('List of available commands:\n')
      context.echo('===========================\n')
      for (const cmd of counter.allCommands()) {
        const padded = cmd.padEnd(12, ' ')
        context.echo(`> ${green(padded)} ${counter.getStatus(cmd)}`)
      }
      context.echo(`\nProgress: ${counter.completedCount()}/${counter.totalCount()} commands tried\n`)
    },

    echo: (text) => {
      counter.setDone('echo')
      context.echo(text + '\n')
      context.echo(`> The ${red('echo')} command prints back your arguments.`)
      context.echo(`> Type ${red('pwd')} to continue.\n`)
    },

    pwd: () => {
      counter.setDone('pwd')
      context.echo(fs.pwd() + '\n')
      context.echo(`> ${red('pwd')} means "print working directory".`)
      context.echo(`> Now try ${red('ls')} to list files.\n`)
    },

    uname: () => {
      counter.setDone('uname')
      context.echo('Linux\n')
      context.echo(`> ${red('uname')} prints the operating system name.`)
      context.echo(`> Now try ${red('date')}.\n`)
    },

    date: () => {
      counter.setDone('date')
      context.echo(new Date().toString() + '\n')
      context.echo(`> ${red('date')} shows the current date and time.`)
      context.echo(`> Now try ${red('ifconfig')}.\n`)
    },

    clear: () => {
      counter.setDone('clear')
      context.clear()
    },

    history: function() {
      counter.setDone('history')
      // the shell exposes history via context.history().data()
      const hist = context.history().data()
      if (!hist || hist.length === 0) {
        context.echo('No history yet.\n')
        return
      }
      hist.slice(-20).forEach((cmd, i) => context.echo(`${i + 1}  ${cmd}`))
      context.echo(`\n> ${red('history')} shows your recent commands.\n`)
    },

    ifconfig: () => {
      counter.setDone('ifconfig')
      context.echo('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500')
      context.echo('        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255')
      context.echo('        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>')
      context.echo('        ether 02:42:ac:11:00:02  txqueuelen 0  (Ethernet)')
      context.echo('lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536')
      context.echo('        inet 127.0.0.1  netmask 255.0.0.0')
      context.echo(`\n> ${red('ifconfig')} shows network interface configuration.\n`)
    },

    tty: () => {
      counter.setDone('tty')
      context.echo('/dev/pts/0\n')
      context.echo(`> ${red('tty')} prints the filename of the terminal connected to standard input.\n`)
    },

    reset: () => {
      counter.resetProgress()
      context.echo(`Progress reset. Type ${red('help')} to see the task list.\n`)
    },

    about: () => {
      context.echo('> The shell is basically a program that takes your commands from the keyboard')
      context.echo('> and sends them to the operating system to perform.\n')
      context.echo(`> The ${green('Terminal')} is a program that launches a shell for you.\n`)
    },

    contribute: () => {
      context.echo('> WebTerminal is open source! Contribute at github.com/lem0n4id/WebTerminal\n')
    },
  }
}

export { basic }

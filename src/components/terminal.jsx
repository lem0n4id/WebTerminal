import React from 'react'
import $ from 'jquery'

// jquery.terminal's CommonJS build exports a factory that must be called to
// attach $.fn.terminal (webpack used its AMD branch; Vite/Rollup do not)
import initTerminal from 'jquery.terminal'
import 'jquery.terminal/css/jquery.terminal.css'
import commands from '../commands'
import { getCompletions } from '../lib/completion'

initTerminal(window, $)
const intro={
        
    // DANGER: high
    // Don't mess with this part or else all HELL will fall loose.

    prompt:"[[b;#44D544;]user@localhost:~$] ",
    greetings: "Welcome to [[b;#FFFFFF;]WebTerminal] \n We [[b;#FF0000;]❤]  Open Source \n"+
               "If you want to contribute, you can at github @lem0n4id/WebTerminal. \n Type  [[b;#FFFFFF;]help] to get started \n" +
               "> The shell is basically a program that takes your commands from the keyboard and sends them to the operating system to perform.\n" +
               "> The [[b;#44D544;]Terminal] is a program that launches a shell for you.\n" +
               "> Type [[b;#ff3300;]help] to see the list of [[b;#44D544;]commands/tasks].\n\n" +
               '> Start with [[b;#ff3300;]echo "any string"].\n',
    onBlur: function() {
        // prevent loosing focus
        return false;
    }       
}
export default class Terminal extends React.Component{

    componentDidMount(){
        this.$el = $(this.el)
        const interpreter = commands(this.$el)
        const fs = interpreter.__fs // shared FileSystem (see src/commands/index.js)
        delete interpreter.__fs // keep the interpreter a pure command map
        const names = Object.keys(interpreter)
        this.terminal = this.$el.terminal(interpreter, {
            ...intro,
            // Tab completion: jquery.terminal passes the current token, but the
            // pure logic works off the line so far, so fetch it from the terminal
            completion: function(string, callback) {
                const line = this.before_cursor(false)
                callback(getCompletions(line, { commands: names, fs }))
            },
        })
    }

    componentWillUnmount(){
        if (this.terminal) this.terminal.destroy()
    }


    render(){
        return <div  style= {{display:'block',position:'absolute',width:'100%'}} ref={el => this.el = el} /> 
    }
}
const readline = require('readline-sync')
const state = require('./robots/state.js')
const robots = {
    input: require('./robots/input.js'),
    text: require('./robots/text.js')
}

async function start() {
    
    robots.input()
    await robots.text()

    const content = state.load()
    console.dir(content, { depth: null })
}
start()
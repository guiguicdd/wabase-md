// De 104 para 47
const { default: makeWASocket, BufferJSON, initInMemoryKeyStore, DisconnectReason } = require("@adiwajshing/baileys-md")
const fs = require('fs')
const connfile = './wabasemdConnection.json';

const loadState = () => {
    let state = undefined
    try {
        const value = JSON.parse(fs.readFileSync(connfile, { encoding: 'utf-8' }), BufferJSON.reviver)
        state = { creds: value.creds, keys: initInMemoryKeyStore(value.keys) }
    } catch (e) { console.log('+ ' + e) }
    return state
}

const saveState = (state) => {
    console.log('+ saving pre-keys')
    fs.writeFileSync(connfile, JSON.stringify(state, BufferJSON.replacer, 2))
}

const startSock = () => {
    const sock = makeWASocket({ printQRInTerminal: true, auth: loadState() })

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if (!msg.key.fromMe && m.type === 'notify') {
            console.log('+ respondendo: ', msg.key.remoteJid)
            await sock.sendReadReceipt(msg.key.remoteJid, msg.key.participant, [msg.key.id])
            await sock.sendMessage(msg.key.remoteJid, { text: 'Opa! WABaseMD funcionando!' })
        }
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                ? startSock()
                : console.log('+ connection closed')
        }
        console.log('+ connection update', update)
    })

    sock.ev.on('auth-state.update', () => saveState(sock.authState))

    return sock
}

startSock()
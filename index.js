// De 104 para 
const makeWASocket = require('@adiwajshing/baileys-md').default
const { BufferJSON, initInMemoryKeyStore, DisconnectReason } = require('@adiwajshing/baileys-md')
const fs = require('fs')
const connfile = './wabasemdConnection.json'

async function startwabasemd() {
    let sock = undefined

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
        state = state || sock?.authState
        var towrite = JSON.stringify(state, BufferJSON.replacer, 2)
        fs.writeFileSync(connfile, towrite)
    }

    const startSock = () => {
        const sock = makeWASocket({ printQRInTerminal: true, auth: loadState() })
        sock.ev.on('messages.upsert', async m => {
            const msg = m.messages[0]
            if (!msg) return
            if (!msg.message || msg.key.fromMe) return
            if (m.type === 'notify') {
                console.log('+ respondendo: ', m.messages[0].key.remoteJid)
                await sock.sendReadReceipt(msg.key.remoteJid, msg.key.participant, [msg.key.id])
                await sock.sendMessage(msg.key.remoteJid, { text: 'Fala meu bom! WABaseMD funcionando perfeitamente!' })
            }
        })
        return sock
    }

    sock = startSock()

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const Reconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
            Reconnect ? sock = startSock() && console.log('+ Reconnectando...')
                : fs.unlinkSync(connfile) && console.log("+ Logged Out")
            console.log('+ connection closed due to ', lastDisconnect.error, ' reconnecting ', Reconnect)
        }
        console.log('+ connection update', update)
    })

    sock.ev.on('auth-state.update', () => saveState())
}

startwabasemd()
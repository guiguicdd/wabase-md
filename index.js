// De 104 para 32
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require("@adiwajshing/baileys-md")
const { state, saveState } = useSingleFileAuthState('./wabasemdConnection.json')
const { core } = require('./lib')

const startSock = () => {
    const sock = makeWASocket({ printQRInTerminal: true, auth: state })
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                ? startSock()
                : console.log('+ connection closed')
        }
        console.log('+ connection update', update)
    })
    sock.ev.on('creds.update', saveState)
    return sock
}

const sock = startSock()

sock.ev.on('messages.upsert', async m => await core(sock, m))
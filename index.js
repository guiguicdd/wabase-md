const { core } = require('./lib')
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@adiwajshing/baileys")
const { state, saveState } = useSingleFileAuthState('./wabasemdConnection.json')

const startSock = async () => {
    const { version } = await fetchLatestBaileysVersion()
    const sock = makeWASocket({ version, printQRInTerminal: true, auth: state })
    sock.ev.on('messages.upsert', async m => await core(sock, m))
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
            ? startSock() : console.log('+ connection closed')
    })
    sock.ev.on('creds.update', saveState)
}

startSock()
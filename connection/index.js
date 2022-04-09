const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@adiwajshing/baileys")
const { connectionFileName } = require("../config/configFile")
const { state, saveState } = useSingleFileAuthState(connectionFileName())

exports.createConnection = new Promise((resolve, reject) => {
    try {
        const startSock = async () => {
            const { version } = await fetchLatestBaileysVersion()
            const sock = makeWASocket({ version, printQRInTerminal: true, auth: state })
            sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect } = update
                if (connection === 'close')
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                        ? startSock() : console.log('+ connection closed')
            })
            sock.ev.on('creds.update', saveState)
            if (sock.user) resolve(sock)
        }
        startSock()
    } catch (e) { reject(e) }
})
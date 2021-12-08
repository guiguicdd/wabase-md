// De 104 para 32
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require("@adiwajshing/baileys-md")
const { state, saveState } = useSingleFileAuthState('./wabasemdConnection.json')

const startSock = () => {
    const sock = makeWASocket({ printQRInTerminal: true, auth: state })

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if (!msg.key.fromMe && m.type === 'notify') {
            console.log('+ respondendo: ', msg.key.remoteJid)
            await sock.sendReadReceipt(msg.key.remoteJid, msg.key.participant, [msg.key.id])
            await sock.sendMessage(msg.key.remoteJid, { text: 'Opa! WABaseMD funcionando! Agora a estrela do https://github.com/guiguicdd/wabase-md' })
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

    sock.ev.on('creds.update', saveState)

    return sock
}

startSock()
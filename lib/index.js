const { global } = require('./global')
const { main } = require('./controller')
const conf = require('../config/configFile').info
const fs = require('fs')
const { generateWAMessageFromContent, proto } = require('@adiwajshing/baileys')
const process = require('node:process');
// const { reset } = require('./modules/functions/reset') implement on your side for your server. (optional)
let initialized = false

exports.core = async (sock, mei) => {
    let now = Date.now();

    if (!initialized) {
        initialized = true
        console.log('INIT');
        process.on('uncaughtException', async (err) => {
            console.log('ANTOFF', JSON.stringify(err));
            if (err.output) {
                let status = err.output.statusCode
                if (status == 428) {
                    // await resetServer() (optional)
                }
            } else {
                let text = 'ANTOFF ' + err
                conf.dono.numero.forEach(async (num) => {
                    await sock.sendMessage(num, { text: text })
                });
            }
        });
    }

    try {
        require('./modules/functions/meiprocess').process(sock, mei)
        mei = global.d.verificarMei(mei)
        if (!mei) return
        const objKeys = Object.keys(mei.message)
        const type = objKeys[0] == 'senderKeyDistributionMessage'
            ? objKeys[1] == 'messageContextInfo' ? objKeys[2] : objKeys[1]
            : objKeys[0]
        let body = global.d.body(type, mei)
        let budy = global.d.budy(type, mei)
        let bodyLNR = body.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        let budyLNR = budy.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")

        // bot
        let number = sock.user.id.split(':')[0] + '@s.whatsapp.net'

        // Message
        const content = JSON.stringify(mei.message)
        const from = mei.key.remoteJid
        const id = mei.key.id
        let deviceModel =
            (id.startsWith("BAE") || id.startsWith('3EB0') || id.startsWith('XYZ0')) &&
                (id.length === 16 || id.length === 12)
                ? 'BOT' : id.length > 21 ? 'android' : id.substring(0, 2) == '3A' ? 'ios' : 'web'

        // Is
        let cmd = body.startsWith(conf.prefix)
        let group = from.endsWith('@g.us')
        let sender = group ? mei.key.participant : mei.key.remoteJid
        let fromPC = group ? sender.includes(':') ? true : false : false
        sender = fromPC ? sender.split(':')[0] + '@s.whatsapp.net' : sender
        let dono = conf.dono.numero.includes(sender)
        let bot = deviceModel == 'BOT'
        // messages type
        let media = global.has(['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'], content) > 0
        let voice = content.includes('audioMessage') && content.includes('ptt":true')
        let music = content.includes('audioMessage') && content.includes('ptt":false')
        let img = content.includes('imageMessage')
        let sticker = content.includes('stickerMessage')
        let video = content.includes('videoMessage')
        let giffromwa = content.includes('"gifAttribution":"GIPHY"')
        let gif = content.includes('"gifPlayback":true')
        let quotedM = type === 'extendedTextMessage' && content.includes('quotedMessage')
        let quoted = type === 'extendedTextMessage'
        let vcard = content.includes('contactMessage')
        let multipleVcard = content.includes('contactsArrayMessage')
        let liveLocation = content.includes('liveLocationMessage')
        let location = content.includes('locationMessage')
        let document = content.includes('documentMessage')
        let product = content.includes('productMessage')
        let forwarded = content.includes('forwardingScore')
        let mentioned = content.includes('mentionedJid')
        let requestPayment = content.includes('requestPaymentMessage')
        let sendPayment = content.includes('sendPaymentMessage')
        let cancelPayment = content.includes('cancelPaymentRequestMessage')
        let templateButtonReplyMessage = content.includes('templateButtonReplyMessage')
        let buttonsResponseMessage = content.includes('buttonsResponseMessage')
        let singleselectlist = content.includes('singleSelectReply')
        let docJS = document && content.includes('text/javascript')
        let docJson = document && content.includes('application/json')
        let docPdf = document && content.includes('application/pdf')
        let docWordDoc = document && content.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        let docHTML = document && content.includes('text/html')
        let docIMG = document && content.includes('"mimetype":"image/')

        // Group
        const participant = mei.key.participant

        // Others
        const command = body.slice(conf.prefix.length).trim().split(/ +/).shift().toLowerCase()

        mei.key.participant = sender

        let g = {
            sock,
            conf,
            global,
            func: {
                async reply(txt) {
                    await sock.sendReadReceipt(from, participant, [id])
                    let response = await sock.sendMessage(from, { text: txt }, { quoted: mei })
                    return response
                },
                async replyAudio(path) {
                    await sock.sendReadReceipt(from, participant, [id])
                    await sock.sendMessage(
                        from, { audio: { url: path }, mimetype: 'audio/mpeg', ptt: true }, { quoted: mei }
                    )
                },
                async replySticker(path) {
                    await sock.sendReadReceipt(from, participant, [id])
                    await sock.sendMessage(from, { sticker: { url: path } })
                },
                async replyImage(path, description) {
                    await sock.sendReadReceipt(from, participant, [id])
                    await sock.sendMessage(from, { image: { url: path }, caption: description })
                },
                async send(to, txt) {
                    await sock.sendMessage(to, { text: txt })
                },
                async replyMarked(txt, members) {
                    let template = generateWAMessageFromContent(from, proto.Message.fromObject({
                        extendedTextMessage: {
                            text: txt,
                            previewType: "NONE",
                            contextInfo: { mentionedJid: members },
                            inviteLinkGroupType: "DEFAULT"
                        }
                    }), { quoted: mei });
                    await sock.relayMessage(from, template.message, { messageId: template.key.id })
                },
                async deleteMessage(messageID, f = from) {
                    await sock.sendMessage(f, { delete: messageID })
                },
                async downloadMedia(messageObj = false, metype, returnBuffer = false) {
                    const { downloadContentFromMessage } = require("@adiwajshing/baileys")
                    let typed;

                    if (quoted) {
                        let objkeysDown = Object.keys(mei.message.extendedTextMessage.contextInfo.quotedMessage)
                        typed = objkeysDown[0] == 'senderKeyDistributionMessage'
                            ? objkeysDown[1] == 'messageContextInfo' ? objkeysDown[2] : objkeysDown[1]
                            : objkeysDown[0]
                    } else if (type == 'viewOnceMessage') {
                        let objkeysDown = Object.keys(mei.message.viewOnceMessage.message)
                        typed = objkeysDown[0] == 'senderKeyDistributionMessage'
                            ? objkeysDown[1] == 'messageContextInfo' ? objkeysDown[2] : objkeysDown[1]
                            : objkeysDown[0]
                    } else if (type == 'ephemeralMessage') {
                        let objkeysDown = Object.keys(mei.message.ephemeralMessage.message)
                        typed = objkeysDown[0] == 'senderKeyDistributionMessage'
                            ? objkeysDown[1] == 'messageContextInfo' ? objkeysDown[2] : objkeysDown[1]
                            : objkeysDown[0]
                    } else if (messageObj) {
                        typed = metype
                    } else {
                        typed = type
                    }

                    let mety = messageObj ? messageObj
                        : quoted ? mei.message.extendedTextMessage.contextInfo.quotedMessage[typed]
                            : type == 'viewOnceMessage' ? mei.message.viewOnceMessage.message[typed]
                                : type == 'ephemeralMessage' ? mei.message.ephemeralMessage.message[typed]
                                    : mei.message[typed]

                    const stream = await downloadContentFromMessage(mety, typed.replace('Message', ''))
                    let buffer = Buffer.from([])
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk])
                    }

                    if (returnBuffer) return buffer

                    let mediaPath = './assets/downloads/'
                    let mediaName = (Math.random() + 1).toString(36).substring(7)
                    let mediaExtension = mety.mimetype.replace('audio/mp4', 'audio/mp3')
                    mediaExtension = mediaExtension.replace('vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx')
                    mediaExtension = mediaExtension.replace('; codecs=opus', '')
                    mediaExtension = '.' + mediaExtension.split('/')[1]

                    let filePath = mediaPath + mediaName + mediaExtension

                    fs.writeFileSync(filePath, buffer)

                    return filePath
                },
                async ban(numeros, grupo, options, f = from) {
                    let response = false
                    if (!numeros || !grupo) {
                        console.log(numeros, grupo)
                        return response
                    }

                    const groupMetadata = group ? await sock.groupMetadata(f) : ''
                    const groupMembers = group ? groupMetadata.participants : ''
                    const groupAdmins = group ? global.d.getGroupAdmins(groupMembers) : ''

                    if (!JSON.stringify(groupAdmins).includes(g.message.sender) && !options?.any) return { message: 'Você não é adm.' }

                    if (options?.force) {
                        try {
                            response = await sock.groupParticipantsUpdate(grupo, numeros, "remove")
                        } catch (error) {
                            response = error
                        }
                        return response
                    }

                    let includesAdm = false

                    for (let i = 0; i < numeros.length; i++) {
                        const num = numeros[i];
                        if (JSON.stringify(groupAdmins).includes(num)) {
                            includesAdm = true
                            numeros.splice(i, 1)
                            i = i - 1
                        }
                    }

                    if (includesAdm)
                        !options?.any ? await g.func.reply('Não posso remover adm')
                            : await this.presence('composing')

                    if (numeros.length <= 0) return response

                    try {
                        response = await sock.groupParticipantsUpdate(grupo, numeros, "remove")
                    } catch (error) {
                        response = error
                    }

                    return response
                },
                async add(pessoas, f = from) {
                    return new Promise(async (resolve, reject) => {
                        sock.ws.on(`CB:iq`, (node) => {
                            if (!node.content) return
                            if (!node.content[0]?.content) return

                            let jid = node.content[0]?.content[0]?.attrs?.jid
                            let error = node.content[0]?.content[0]?.attrs?.error
                            let content = node.content[0]?.content[0]?.content

                            resolve({ jid, error, content })
                        })

                        await sock.groupParticipantsUpdate(f, pessoas, "add")
                    })
                },
                async sendMessageInviteAdd(num, attrs) {
                    const ppUrl = await this.getProfilePicture()
                    const groupInfo = await this.getGroupMeta()
                    const gId = groupInfo.id
                    const gName = groupInfo.subject
                    const thumbPath = await global.d.downloadFromURL(ppUrl)
                    const thumb = fs.readFileSync(thumbPath)

                    let template = generateWAMessageFromContent(num, proto.Message.fromObject({
                        groupInviteMessage: {
                            groupJid: gId,
                            inviteCode: attrs.code,
                            inviteExpiration: attrs.expiration,
                            groupName: gName,
                            jpegThumbnail: thumb,
                            caption: "Opa! Não consegui te adicionar no grupo. Clique no convite para entrar no grupo."
                        }
                    }), {});
                    await sock.relayMessage(num, template.message, { messageId: template.key.id })
                },
                async changeadmto(numbers, type, f = from) {
                    let response = await sock.groupParticipantsUpdate(f, numbers, type)
                    return response
                },
                async leave(f = from) {
                    await this.reply('Saindo :)')
                    await sock.groupLeave(f)
                },
                async mutar(time, chat) {
                    await sock.chatModify({ mute: time }, chat)
                },
                async enterGroup(message, f = from) {
                    let code = message.split('https://chat.whatsapp.com/')[1].trim().split(/ +/).shift()
                    let res;
                    try {
                        let group = await sock.groupAcceptInvite(code)
                        await sock.sendMessage(group, { text: 'Opa! Cheguei :) Fui adicionado por wa.me/' + f.split('@')[0] + ' Agora passa o ADM para que eu possa fazer a boa' })
                        res = 'Show! Acabei de entrar nesse grupo :)'
                    } catch (e) {
                        console.log(e);
                        res = 'Não consegui entrar no grupo.'
                    }
                    return res
                },
                async presence(mode = 'composing', f = from) {
                    // 'unavailable' | 'available' | 'composing' | 'recording' | 'paused'
                    await sock.sendPresenceUpdate(mode, f)
                },
                async getGroupMeta(f = from) {
                    const groupMetadata = group ? await sock.groupMetadata(f) : ''
                    return groupMetadata
                },
                async getGroupCode(f = from) {
                    let code
                    try {
                        code = group ? await sock.groupInviteCode(f) : ''
                    } catch (error) {
                        console.log(error);
                        code = false
                    }

                    return code
                },
                async getProfilePicture(f = from) {
                    const ppUrl = await sock.profilePictureUrl(f)
                    return ppUrl
                },
                async changeGroupSubject(subject, f = from) {
                    await sock.groupUpdateSubject(f, subject)
                },
                async changeGroupDescription(description, f = from) {
                    await sock.groupUpdateDescription(f, description)
                },
                async changeProfilePicture(url, f = from) {
                    await sock.updateProfilePicture(f, { url: url })
                },
                async isMember(number = g.message.sender, f = from) {
                    const groupMetadata = group ? await sock.groupMetadata(f) : ''
                    const groupMembers = group ? groupMetadata.participants : ''
                    const groupAdmins = group ? global.d.getGroupAdmins(groupMembers) : ''
                    let response = JSON.stringify(groupAdmins).includes(number) ? false : groupMetadata
                    return response
                }
            },
            bot: {
                numero: number,
                grupo: conf.grupo
            },
            message: {
                mei,
                type,
                from,
                sender,
                body,
                budy,
                bodyLNR,
                budyLNR,
                id,
                deviceModel
            },
            group: {
                participant
            },
            is: {
                cmd,
                group,
                dono, bot,
                fromPC,
                media, voice, music, img, sticker, video, giffromwa, gif,
                quotedM, quoted, forwarded, mentioned,
                vcard, multipleVcard, liveLocation, location,
                requestPayment, sendPayment, cancelPayment, product,
                buttonsResponseMessage, templateButtonReplyMessage, singleselectlist,
                document, docJS, docJson, docPdf, docWordDoc, docHTML, docIMG
            },
            cmd: {
                command
            },
            sms: {
                aguarde: '⌛ Por favor, aguarde. Processo em andamento... ⌛',
                sucesso: '✔️ Sucesso ✔️',
                erro: {
                    sock: 'Por favor, tente novamente mais tarde',
                    server: 'Ocorreu um erro com o servidor',
                    notFound: 'Não consegui localizar',
                    noadm: 'Eu preciso ser administrador do grupo para funcionar corretamente.',
                    cmdPrivate: 'Comando indisponivel'
                },
                apenas: {
                    grupo: `Exclusivo para grupos!`,
                    grupoP: `Exclusivo para o grupo proprietário!`,
                    dono: `Exclusivo para o ${conf.dono.nome}!`,
                    admin: `Exclusivo para os administradores de grupo!`,
                    botadm: `Exclusivo para o bot administrador!`,
                    cadastrados: `── 「REGISTRE-SE」 ──\nVocê não está registrado no banco de dados. \n\nComando : ${conf.prefix}cadastrar nome|idade\nExemplo : ${conf.prefix}cadastrar Guilherme|18`,
                }
            },
            now
        }

        module.exports = { g }

        await main()
    } catch (e) {
        if (e.toString().includes('this.isZero')) return
        let today = new Date();
        let date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear()
        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        let dateTime = date + '|' + time;
        console.log(`${dateTime}>>>>`, e, '<<<<')
    }
}
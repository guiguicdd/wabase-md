const { global } = require('./global')
const { main } = require('./controller')
const conf = require('../config/configFile').info

exports.core = async (sock, mei) => {
    let now = Date.now();

    try {
        await require('./modules/functions/meiprocess').process(sock, mei)
        mei = global.d.verificarMei(mei)
        if (!mei) return
        const objKeys = Object.keys(mei.message)
        const type = objKeys[0] == 'senderKeyDistributionMessage'
            ? objKeys[1] == 'messageContextInfo' ? objKeys[2] : objKeys[1]
            : objKeys[0]
        body = global.d.body(type, mei)
        budy = global.d.budy(type, mei)
        bodyLNR = body.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        budyLNR = budy.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")

        // bot
        var number = sock.user.id.split(':')[0] + '@s.whatsapp.net'

        // Message
        const content = JSON.stringify(mei.message)
        const from = mei.key.remoteJid
        const id = mei.key.id

        // Is
        var cmd = body.startsWith(conf.prefix)
        var group = from.endsWith('@g.us')
        var sender = group ? mei.key.participant : mei.key.remoteJid
        var fromPC = group ? sender.includes(':') ? true : false : false
        var sender = fromPC ? sender.split(':')[0] + '@s.whatsapp.net' : sender
        var dono = conf.dono.numero.includes(sender)
        // messages type                                                                                                                 
        var media = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(type)
        var voice = content.includes('audioMessage') && content.includes('ptt":true')
        var music = content.includes('audioMessage') && content.includes('ptt":false')
        var img = content.includes('imageMessage')
        var sticker = content.includes('stickerMessage')
        var video = content.includes('videoMessage')
        var giffromwa = content.includes('"gifAttribution":"GIPHY"')
        var gif = content.includes('"gifPlayback":true')
        var quotedM = type === 'extendedTextMessage' && content.includes('quotedMessage')
        var quoted = type === 'extendedTextMessage'
        var vcard = content.includes('contactMessage')
        var multipleVcard = content.includes('contactsArrayMessage')
        var liveLocation = content.includes('liveLocationMessage')
        var location = content.includes('locationMessage')
        var document = content.includes('documentMessage')
        var product = content.includes('productMessage')
        var forwarded = content.includes('forwardingScore')
        var requestPayment = content.includes('requestPaymentMessage')
        var sendPayment = content.includes('sendPaymentMessage')
        var cancelPayment = content.includes('cancelPaymentRequestMessage')
        var singleselectlist = content.includes('singleSelectReply')
        var docJS = document && content.includes('text/javascript')
        var docJson = document && content.includes('application/json')
        var docPdf = document && content.includes('application/pdf')
        var docWordDoc = document && content.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        var docHTML = document && content.includes('text/html')
        var docIMG = document && content.includes('"mimetype":"image/')

        // Group
        const participant = mei.key.participant

        // Others
        const command = body.slice(conf.prefix.length).trim().split(/ +/).shift().toLowerCase()

        var g = {
            sock,
            conf,
            global,
            func: {
                async reply(txt) {
                    await sock.sendReadReceipt(from, participant, [id])
                    var response = await sock.sendMessage(from, { text: txt }, { quoted: mei })
                    return response
                },
                async replyAudio(path) {
                    await sock.sendReadReceipt(from, participant, [id])
                    await sock.sendMessage(
                        from, { audio: { url: path }, mimetype: 'audio/mp4', ptt: true }, { quoted: mei }
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
                    await sock.sendMessage(from, { text: txt, contextInfo: { mentionedJid: members } }, { quoted: mei })
                },
                async deleteMessage(messageID, f = from) {
                    await sock.sendMessage(f, { delete: messageID })
                },
                async downloadMedia() {
                    const fs = require('fs')
                    const { downloadContentFromMessage } = require("@adiwajshing/baileys")

                    if (quoted) {
                        var objkeysDown = Object.keys(mei.message.extendedTextMessage.contextInfo.quotedMessage)
                        var typed = objkeysDown[0] == 'senderKeyDistributionMessage'
                            ? objkeysDown[1] == 'messageContextInfo' ? objkeysDown[2] : objkeysDown[1]
                            : objkeysDown[0]
                    } else if (type == 'viewOnceMessage') {
                        var objkeysDown = Object.keys(mei.message.viewOnceMessage.message)
                        var typed = objkeysDown[0] == 'senderKeyDistributionMessage'
                            ? objkeysDown[1] == 'messageContextInfo' ? objkeysDown[2] : objkeysDown[1]
                            : objkeysDown[0]
                    } else {
                        var typed = type
                    }

                    var mety = quoted
                        ? mei.message.extendedTextMessage.contextInfo.quotedMessage[typed]
                        : type == 'viewOnceMessage'
                            ? mei.message.viewOnceMessage.message[typed]
                            : mei.message[typed]

                    const stream = await downloadContentFromMessage(mety, typed.replace('Message', ''))
                    let buffer = Buffer.from([])
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk])
                    }
                    var mediaPath = './assets/downloads/'
                    var mediaName = (Math.random() + 1).toString(36).substring(7)
                    var mediaExtension = mety.mimetype.replace('audio/mp4', 'audio/mp3')
                    var mediaExtension = mediaExtension.replace('vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx')
                    var mediaExtension = mediaExtension.replace('; codecs=opus', '')
                    var mediaExtension = '.' + mediaExtension.split('/')[1]
                    var filePath = mediaPath + mediaName + mediaExtension

                    fs.writeFileSync(filePath, buffer)
                    return filePath
                },
                async ban(numeros, grupo, options, f = from) {
                    var response = false
                    if (!numeros || !grupo) {
                        console.log(numeros, grupo)
                        return response
                    }

                    const groupMetadata = group ? await sock.groupMetadata(f) : ''
                    const groupMembers = group ? groupMetadata.participants : ''
                    const groupAdmins = group ? global.d.getGroupAdmins(groupMembers) : ''

                    if (!JSON.stringify(groupAdmins).includes(g.message.sender) && !options.any) return { message: 'Você não é adm.' }

                    if (options.force) {
                        try {
                            response = await sock.groupParticipantsUpdate(grupo, numeros, "remove")
                        } catch (error) {
                            response = error
                        }
                        return response
                    }

                    var includesAdm = false

                    for (let i = 0; i < numeros.length; i++) {
                        const num = numeros[i];
                        if (JSON.stringify(groupAdmins).includes(num)) {
                            includesAdm = true
                            numeros.splice(i, 1)
                        }
                    }

                    if (includesAdm)
                        !options.any ? await g.func.reply('Não posso remover adm')
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
                    var response = await sock.groupParticipantsUpdate(f, pessoas, "add")
                    return response
                },
                async changeadmto(numbers, type, f = from) {
                    var response = await sock.groupParticipantsUpdate(f, numbers, type)
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
                    try {
                        var group = await sock.groupAcceptInvite(code)
                        await sock.sendMessage(group, { text: 'Opa! Cheguei :) Fui adicionado por wa.me/' + f.split('@')[0] })
                        var res = 'Show! Acabei de entrar nesse grupo :)'
                    } catch (e) {
                        console.log(e);
                        var res = 'Não consegui entrar no grupo.'
                    }
                    return res
                },
                async presence(mode, f = from) {
                    // 'unavailable' | 'available' | 'composing' | 'recording' | 'paused'
                    await sock.sendPresenceUpdate(mode, f)
                },
                async getGroupMeta(f = from) {
                    const groupMetadata = group ? await sock.groupMetadata(f) : ''
                    return groupMetadata
                },
                async getGroupCode(f = from) {
                    var code
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
                id
            },
            group: {
                participant
            },
            is: {
                cmd,
                group,
                dono,
                fromPC,
                media, voice, music, img, sticker, video, giffromwa, gif,
                quotedM, quoted, forwarded,
                vcard, multipleVcard, liveLocation, location,
                requestPayment, sendPayment, cancelPayment, product,
                singleselectlist,
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
                    noadm: 'Robô necessita de acesso administrativo no grupo.',
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
        var today = new Date();
        var date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear()
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date + '|' + time;
        console.log(`${dateTime}>>>>`, e, '<<<<')
    }
}
const { info, logMode } = require('../config/configFile')
const fetch = require('node-fetch')
const request = require('request')
const axios = require('axios')
const fs = require('fs')

exports.global = {
    isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },
    toFormarted(mess) {
        return JSON.stringify(mess, null, 4)
    },
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    has(words, texto) {
        var result = 0
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (texto.includes(word)) result++
        }
        return result
    },
    emojiStringToArray(str) {
        let split = str.split(/([\uD800-\uDBFF][\uDC00-\uDFFF])/);
        let arr = [];
        for (var i = 0; i < split.length; i++) {
            char = split[i]
            if (char !== "") arr.push(char);
        }
        return arr;
    },
    d: {
        startWithMultiple(text, opcoes = []) {
            let response = false
            for (let i = 0; i < opcoes.length; i++) {
                const opcao = opcoes[i];
                if (text.startsWith(opcao)) response = true
            }
            return response
        },
        verificarMei(mei) {
            mei = mei.messages.length > 1 ? mei.messages[1] : mei.messages[0]
            if (!mei.message) return logMode ? console.log(JSON.stringify(mei)) : false;
            if (mei.message.protocolMessage) return logMode ? console.log(JSON.stringify(mei)) : false;
            if (mei.key && mei.key.remoteJid == 'status@broadcast') return logMode ? console.log(JSON.stringify(mei)) : false;
            if (mei.key.fromMe) return false
            return mei
        },
        body(type, mei) {
            return JSON.parse(JSON.stringify((type === 'conversation'
                && this.startWithMultiple(mei.message.conversation, info.parentPrefix))
                ? mei.message.conversation
                : (type == 'imageMessage')
                    && mei.message.imageMessage.caption
                    ? (type == 'imageMessage')
                        && this.startWithMultiple(mei.message.imageMessage.caption, info.parentPrefix)
                        ? mei.message.imageMessage.caption : ''
                    : (type == 'videoMessage')
                        && mei.message.videoMessage.caption
                        ? (type == 'videoMessage')
                            && this.startWithMultiple(mei.message.videoMessage.caption, info.parentPrefix)
                            ? mei.message.videoMessage.caption : ''
                        : (type == 'extendedTextMessage')
                            && this.startWithMultiple(mei.message.extendedTextMessage.text, info.parentPrefix)
                            ? mei.message.extendedTextMessage.text : ''))
        },
        budy(type, mei) {
            return JSON.parse(JSON.stringify((type === 'conversation')
                ? mei.message.conversation
                : (type == 'imageMessage') && mei.message.imageMessage.caption
                    ? (type == 'imageMessage')
                        ? mei.message.imageMessage.caption : ''
                    : (type == 'videoMessage') && mei.message.videoMessage.caption
                        ? (type == 'videoMessage')
                            ? mei.message.videoMessage.caption : ''
                        : (type == 'extendedTextMessage')
                            ? mei.message.extendedTextMessage.text : ''))
        },
        tosmallletters(text) {
            let mapObj = {
                a: "ᵃ", á: "ᵃ", ã: "ᵃ", b: "ᵇ", c: "ᶜ", ç: "ᶜ", d: "ᵈ", e: "ᵉ", é: "ᵉ", ê: "ᵉ", f: "ᶠ", g: "ᵍ",
                h: "ʰ", i: 'ᶦ', j: "ʲ", k: "ᵏ", l: "ˡ", m: "ᵐ", n: "ⁿ", o: "ᵒ", õ: "ᵒ", ô: "ᵒ", p: "ᵖ", q: "ᑫ",
                r: 'ʳ', s: "ˢ", t: "ᵗ", u: "ᵘ", ú: "ᵘ", v: "ᵛ", w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ",
                0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹"
            };
            let abreviacoes = Object.keys(mapObj)
            for (let i = 0; i < abreviacoes.length; i++) {
                let regexp = new RegExp(abreviacoes[i], "gi");
                text = text.replace(regexp, mapObj[abreviacoes[i]]);
            }
            return text
        },
        segundosFormatados(seconds) {
            const addZero = (s) => (s < 10 ? '0' : '') + s;

            let hours = Math.floor(seconds / (60 * 60));
            let minutes = Math.floor(seconds % (60 * 60) / 60);
            seconds = Math.floor(seconds % 60);

            let message = hours == 0
                ? minutes == 0
                    ? `${addZero(seconds)}seg` : `${addZero(minutes)}min e ${addZero(seconds)}seg`
                : `${addZero(hours)}h ${addZero(minutes)}min e ${addZero(seconds)}seg`

            return message
        },
        getGroupAdmins(participants) {
            return participants.filter((a) => a.admin == 'admin' || a.admin == 'superadmin')
        },
        getRandom(ext = '') {
            return `${Math.floor(Math.random() * 10000)}${ext}`
        },
        getRandomNameString(ext = '') {
            return `${(Math.random() + 1).toString(36).substring(7)}${ext}`
        },
        getFuncNameLenth(func) {
            func = func.substring('async '.length);
            func = func.substring(0, func.indexOf('('))
            return func.length + 1
        },
        getFuncDescription(f) {
            let func = f.split('switch (g.cmd.command) {')[1]
            let cases = func.split('default:')[0];

            let funcnames = cases.split(`case '`);
            let descriptions = cases.split('desc=[');
            let names = []
            let response = []
            let currentIndex = descriptions.length

            for (let i = 1; i != currentIndex; i++) {
                if (funcnames[i].length > 60) {
                    let name = funcnames[i].split(`':`)[0]
                    let desc = ''
                    names.push(name)
                } else {
                    currentIndex++
                }
            }

            for (let i = 1; i != descriptions.length; i++) {
                let desc = '   _' + descriptions[i].split(']+')[0] + '_'
                response.push({ name: names[i - 1], desc })
            }

            return response
        },
        async getBuffer(url, options) {
            try {
                options ? options : {}
                const res = await axios({
                    method: "get",
                    url,
                    headers: {
                        'DNT': 1,
                        'Upgrade-Insecure-Request': 1
                    },
                    ...options,
                    responseType: 'arraybuffer'
                })
                return res.data
            } catch (e) {
                console.log(`getBuffer error path libs/functions/global : ${e}`)
            }
        },
        downloadFromURL(url, ext = 'jpeg') {
            return new Promise((resolve, reject) => {
                let mediaName = (Math.random() + 1).toString(36).substring(7)
                let path = `./assets/downloads/${mediaName}.${ext}`
                request.head(url, (err, res, body) => {
                    request(url).pipe(fs.createWriteStream(path)).on('close', () => resolve(path))
                })
            })
        }
    },
    is: {
        closerList(from) {
            let status = false
            for (let i = 0; i < info.closerListArr.length; i++) {
                const num = info.closerListArr[i];
                if (from.startsWith(num)) status = true
            }
            return status
        }
    }
}

exports.fetchJson = fetchJson = (url, options) => new Promise(async (resolve, reject) => {
    fetch(url, options)
        .then(response => response.json())
        .then(json => {
            // console.log(json)
            resolve(json)
        })
        .catch((err) => {
            reject(err)
        })
})

exports.fetchText = fetchText = (url, options) => new Promise(async (resolve, reject) => {
    fetch(url, options)
        .then(response => response.text())
        .then(text => {
            // console.log(text)
            resolve(text)
        })
        .catch((err) => {
            reject(err)
        })
})

exports.download = download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
        request(url).pipe(fs.createWriteStream(path)).on('close', callback)
    })
}
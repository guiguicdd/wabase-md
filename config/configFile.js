exports.testMode = false

exports.logMode = true
exports.logModeBaileys = false

exports.info = {
    prefix: this.testMode ? '#' : '.',
    parentPrefix: ['.', '/', '!', '#'],
    dono: {
        nome: "Guilherme",
        numero: [
            "COLOQUE_SEU_NUMERO_AQUI_DESSA_FORMA: 5522981274455@s.whatsapp.net"
        ]
    },
    grupo: "",
    closerListArr: ['55']
}

const path = './'
exports.connFileName = path + (this.testMode ? 'wabasemdConnectionTest.json' : 'wabasemdConnection.json')
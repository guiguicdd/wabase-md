exports.testMode = true

exports.info = {
    prefix: this.testMode ? '#' : '.',
    dono: {
        nome: "Guilherme",
        numero: [
            "COLOQUE_SEU_NUMERO_AQUI_DESSA_FORMA: 5522981274455@s.whatsapp.net"
        ]
    },
    grupo: ""
}

const path = './'
exports.connFileName = path + (this.testMode ? 'wabasemdConnectionTest.json' : 'wabasemdConnection.json')
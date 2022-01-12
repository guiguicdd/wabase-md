var { global } = require('../global')

exports.grupo = async () => {
    var { g } = require('../')
    
    const templateButtons = [
        { index: 1, urlButton: { displayText: '⭐ Github!', url: 'https://github.com/guiguicdd/wabase-md' } },
        { index: 2, urlButton: { displayText: '📬 Fazer orçamento', url: 'https://wa.me/5522981274455' } }
    ]
    
    const templateMessage = {
        text: "Opa! Tá funcionando! Deixe aquela estrela e caso queira fazer um orçamento para um bot... Só mandar uma mensagem dizendo o que você precisa no bot 😁",
        footer: 'Seleciona a opção da alegria',
        templateButtons: templateButtons
    }
    
    await g.sock.sendMessage(g.message.from, templateMessage)
}

exports.privado = async () => {
    var { g } = require('../')

    await g.sock.sendMessage(g.message.from, { text: '⭐ Funcionando! Agora manda aquela estrela! https://github.com/guiguicdd/wabase-md' })
}
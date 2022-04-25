const { createConnection } = require('./connection')
const { core } = require('./lib');

createConnection.then(sock => {
    sock.ev.on('messages.upsert', async m => await core(sock, m))
    // setTimeout(() => process.exit(1), 10800000); Apenas se o bot ficar parando de responder depois de 3h
})

createConnection.catch(erro => console.log(erro, 'Conn'))
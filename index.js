const { createConnection } = require('./connection')
const { core } = require('./lib');

createConnection.then(sock => {
    sock.ev.on('messages.upsert', async m => await core(sock, m))
})

createConnection.catch(erro => console.log(erro, 'Conn'))
exports.main = async () => {
    const { grupo, privado } = require('./modules')
    var { g } = require('./')

    g.is.group ? await grupo() : await privado()
}
exports.process = async (sock, mei) => {
    var { g } = require('../../')

    mIndex = JSON.parse(JSON.stringify(mei.messages.length > 1 ? mei.messages[1] : mei.messages[0]))

    // console.log(JSON.stringify(mIndex, null, 4));

    var isAdded = mIndex.messageStubType == 'GROUP_PARTICIPANT_ADD' ? true : false
    var isRemoved = mIndex.messageStubType == 'GROUP_PARTICIPANT_REMOVE' ? true : false
    var isLeaved = mIndex.messageStubType == 'GROUP_PARTICIPANT_LEAVE' ? true : false

}
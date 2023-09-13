const { Schema, model } = require('mongoose');

const lookoutSchema = new Schema({
    guildID: {
        type: String,
    },
    userID: {
        type: String,
    },
    userTag: {
        type: String,
    },
    lookOutEnabled: {
        type: Boolean,
        default: false
    }
});

module.exports = model('Lookout', lookoutSchema);
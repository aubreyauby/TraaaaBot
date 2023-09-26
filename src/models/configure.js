const { Schema, model } = require('mongoose');

const configureSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    guildId: {
        type: String,
        required: true,
    },
    modlogIsEnabled: {
        type: Boolean,
        required: true,
    },
    modlogChannel: {
        type: String,
        required: false,
    },
    pingRoles: {
        type: [String],
        required: false,
        default: [],
    },
    lookoutLogChannel: {
        type: String,
        required: false,
    }
});

module.exports = model('Configure', configureSchema);
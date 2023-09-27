const { Schema, model } = require('mongoose');

const configureSchema = new Schema({
    // general
    guildId: {
        type: String,
        required: true,
    },
    // modlogs
    modlogIsEnabled: {
        type: Boolean,
        required: false,
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
    // lookout
    lookoutLogChannel: {
        type: String,
        required: false,
    },
    // starboard
    starboardIsEnabled: {
        type: Boolean,
        required: false,
    },
    starboardChannel : {
        type: String,
        required: false,
    },
    starboardThreshold: {
        type: Number,
        required: false,
    },
    starboardDeleteUnderThreshold: {
        type: Boolean,
        required: false,
    },
    starboardSpoilerMark: {
        type: Boolean,
        required: false,
    },
    starboardEmojiID: {
        type: String,
        required: false,
    },
    starboardEmojiReaction: {
        type: String,
        required: false,
    },
    starboardLeaderboards: {
        type: Boolean,
        required: false,
    },
    starboardDetectWords: {
        type: Array,
        required: false,
    },
    starboardDetectMedia: {
        type: Array,
        required: false,
    },
    starboardAgeLimit: {
        type: String,
        required: false,
    },
});

module.exports = model('Configure', configureSchema);
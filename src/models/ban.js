const { Schema, model } = require('mongoose');

const banSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    guildId: {
        type: String,
        required: true,
    },
    banExpiration: {
        type: Date,
        required: true,
    }
});

module.exports = model('Ban', banSchema);
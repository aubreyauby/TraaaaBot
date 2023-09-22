const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const strikeSchema = new Schema({
    guildID: {
        type: String
    },
    userID: {
        type: String
    },
    userTag: {
        type: String
    },
    strikeCount: {
        type: Number
    },
    content: [
        {
            ExecutorID: String,
            ExecutorTag: String,
            Reason: String,
        }
    ]
});

// Define the Strike model
const StrikeModel = model('Strike', strikeSchema);

module.exports = StrikeModel;
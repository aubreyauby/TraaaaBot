    const { Schema, model } = require('mongoose');

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

    module.exports = model("Strike", strikeSchema);
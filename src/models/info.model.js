const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InfoSchema = new Schema({
    greetings: {
        text: String
    },
    events: {
        text: String
    },
    about: {
        text: String
    }
});

mongoose.model('info', InfoSchema);


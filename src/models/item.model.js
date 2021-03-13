const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
    name: {
        type: String
    },
    price: {
        type: Number
    },
    weight: {
        type: Number
    },
    photo: {
        type: String
    },
    baseName: {
        type: String
    }
});

mongoose.model('item', ItemSchema);
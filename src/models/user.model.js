const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
    id: {
        type: Number,
        required: true
    },
    username: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String
    }
})

mongoose.model('users', UserSchema)
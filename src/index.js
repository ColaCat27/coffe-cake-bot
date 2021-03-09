const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const user = require('./models/user.model');


const bot = new TelegramBot(config.TOKEN, {polling: true});

// =========================================================


console.log('Bot started...');


// Подключаемся к базе данных

mongoose.connect(config.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected')
}).catch((err) => {
    console.log(err)
});

const User = mongoose.model('users');

const client = {};

const keyboards = {
    first: [
        ['О нас', 'Акции'],
        ['Меню', 'Корзина']
    ]
};


bot.onText(/\/start/, msg => {
    const chat = msg.chat.id;
    bot.sendMessage(chat, 'Введите свой телефон');
});

bot.on('message', msg => {
    const chat = msg.chat.id;
    const regexp = /\D/;
    const id = msg.from.id;

    const candidate = User.findOne({id}, (err, user) => {
        if(err) {
            return;
        } else if (user === null) {
            client.name = msg.from.first_name;
            client.username = msg.from.username;
            client.id = id;
        }
    });

    if (!regexp.test(msg.text)) {
        client.phone = msg.text;
        const newUser = new User(client).save();
        bot.sendMessage(chat, `Привет, ${client.name}`, {
            reply_markup: {
                keyboard: keyboards.first,
                resize_keyboard: true
            }
        });
    }
});
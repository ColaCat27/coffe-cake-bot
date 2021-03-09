const mongoose = require('mongoose');
const fs = require('fs');
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

const menu = {
    first: [
        [
            {
                text: 'Тестовое меню 1',
                callback_data: 'test 1',
                price: '199',
                weight: '500'
            }
        ]
    ],
    second: [
        [
            {
                text: "Тестовое меню 2",
                callback_data: 'test 2'
            }
        ]
    ]
}


bot.onText(/\/start/, msg => {
    const chat = msg.chat.id;
    const id = msg.from.id;

    const candidate = User.findOne({id}, (err, user) => {
        if(err) {
            return;
        }
        if (user === null) {
            client.name = msg.from.first_name;
            client.username = msg.from.username;
            client.id = id;
            bot.sendMessage(chat, 'Введите свой телефон');
        } else {
            bot.sendMessage(chat, `Привет, ${msg.from.first_name}`, {
                reply_markup: {
                    keyboard: keyboards.first,
                    resize_keyboard: true
                }
            })
        }
    });
});

bot.on('message', msg => {
    const chat = msg.chat.id;
    const regexp = /\D/;
    const id = msg.from.id;

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

    // Отправляем меню 

    if (msg.text === 'Меню') {
        bot.sendMessage(chatId, 'Наше меню: ');
        publicMenu(chat);
    }
});

async function sendMenu(chatId) {
    await bot.sendPhoto(chatId, fs.readFileSync(__dirname + '\\img\\roll-1.jpg'), {
        caption: `Суши какие то там`
    });
    bot.sendMessage(chatId, 'test', {
        reply_markup: {
            inline_keyboard: menu.first
        }
    });
}

// bot.on('callback_query', query => {
//     if (query.data = 'test 1') {
//         bot.sendMessage(query.from.id, 'Вы успешно добавили товар в корзину', {
//             reply_markup: 
//         })
//     } 
// });
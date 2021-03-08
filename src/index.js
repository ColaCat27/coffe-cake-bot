const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const user = require('./models/user.model');


const bot = new TelegramBot(config.TOKEN, {polling: true});

// =========================================================

const menu = {
    first: [
      ['О нас 😎', 'Акции 🎉'], ['Сделать заказ 🍣', 'Мой профиль 💼']
    ],
    second: [
      ['Тестовое меню 1'],
      ['Тестовое меню 2'],
      ['Тестовое меню 3'],
      ['Тестовое меню 4'],
      ['Вернуться назад']
    ],
    accept: [
        ['Подтвердить заказ']
    ]
  };

console.log('Bot started...')

mongoose.connect(config.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected')
}).catch((err) => {
    console.log(err)
});

bot.onText(new RegExp('\/start'), function (message, match) {
    // вытаскиваем id клиента из пришедшего сообщения
    var clientId = message.chat.id;
    // посылаем ответное сообщение

    const client = {
      id: message.from.id,
      username: message.from.username,
      name: message.from.first_name  
    };

    
    const User = mongoose.model('users');
    const candidate = User.findOne({id: client.id}, (err, user) => {
        if (err) {
            return;
        }
        if (user === null) {
            // Добавляем нового пользователя
            const newUser = new User(client).save();
            bot.sendMessage(clientId, `Привет ${client.name}, Вы впервые запустили нашего бота, держите скидку 20%!`, {
                reply_markup: {
                    keyboard: menu.first,
                    resize_keyboard: true
                }
            });
        } else {
            //Пользователь уже создан, просто приветствуем его и отправляем
            bot.sendMessage(clientId, `Привет ${client.name}, С возвращением!`, {
                reply_markup: {
                    keyboard: menu.first,
                    resize_keyboard: true
                }
            });
        }
    });
});

bot.on('message', msg => {
    const clientId = msg.chat.id;

    if (msg.text === 'Сделать заказ 🍣') {
        bot.sendMessage(clientId, 'Наше меню', {
            reply_markup: {
                keyboard: menu.second
            }
        });
    } else if (msg.text === 'Вернуться назад') {
        bot.sendMessage(clientId, 'Вернулись назад', {
            reply_markup: {
                keyboard: menu.first,
                resize_keyboard: true
            }
        });
    } else if (msg.text.match(/Тестовое меню/)) {
        const order = msg.text;
        bot.sendMessage(clientId, 'Вам нужно подвердить заказ', {
            reply_markup: {
                keyboard: menu.accept,
                resize_keyboard: true
            }
        });
    }
});

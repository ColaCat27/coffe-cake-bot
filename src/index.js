const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const user = require('./models/user.model');


const bot = new TelegramBot(config.TOKEN, {polling: true});

// =========================================================

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
    // console.log(message);
    const id = message.from.id;
    const name = message.from.first_name;
    const username = message.from.username;

    const client = {
      id: id,
      username: username,
      name: name  
    };
    
    console.log(`ID: ${id}, Имя: ${name}, Юзейрнейм: ${username}`);

    const User = mongoose.model('users');

    const candidate = User.findOne({ id });

    if (!candidate) {
        const newUser = new User(client).save();
    } else {
        console.log('Пользователь уже создан!');
        bot.sendMessage(clientId, `Привет ${name}, Хочешь сделать заказ?`);
    }

});



// mongoose.connect(config.DB_URL, {
//   useUnifiedTopology: true,
//   useNewUrlParser: true
// }).then(() => {
//   console.log('MongoDB connected');
// }).catch((error) => {
//   console.log(error)
// });

// const menu = {
//   first: [
//     ['О нас 😎'], ['Меню 📄'], ['Сделать заказ 🍣']
//   ],
//   second: [
//     ['Тестовое меню 1'],
//     ['Тестовое меню 2'],
//     ['Тестовое меню 3'],
//     ['Тестовое меню 4']
//   ]
// };


// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;

//     if (msg.text === 'О нас 😎') {
//       bot.sendMessage(chatId, 'Бла бла бла что то о нас!', {
//         reply_markup: {
//             keyboard: menu.first,
//             resize_keyboard: true
//           }
//       });
//     } else if (msg.text === 'Меню 📄') {
//       bot.sendMessage(chatId, 'Это наше меню', {
//         reply_markup: {
//             keyboard: menu.second,
//             resize_keyboard: true
//           }
//       });
//     } else {
//       bot.sendMessage(chatId, 'Привет,' + msg.from.first_name + '! Рады тебя видеть!', { // прикрутим клаву
//         reply_markup: {
//             keyboard: menu.first,
//             resize_keyboard: true,
//             one_time_keyboard: true
//         }
//     });
//   }
// });

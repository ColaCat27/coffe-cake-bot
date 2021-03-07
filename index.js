const TelegramBot = require('node-telegram-bot-api');

const token = '1607007415:AAH585TpqHPt04cDvIm4C1qKhuWIeTjHewg';

const bot = new TelegramBot(token, {polling: true});


const keyboard = [
    [
      {
        text: 'О нас', // текст на кнопке
        callback_data: 'about' // данные для обработчика событий
      }
    ],
    [
      {
        text: 'Сделать заказ',
        callback_data: 'order'
      }
    ],
    [
      {
        text: 'Меню',
        callback_data: 'menu' //внешняя ссылка
      }
    ],
    [
        {
            text: 'Заказать доставку',
            callback_data: 'delivery'
        }
    ]
];

const menu = [
    [
        {
            text: 'Суши меню 1',
            callback_data: 'sushi'
        }
    ]
];

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    // отправляем сообщение
    bot.sendMessage(chatId, 'Привет, Друг! чего хочешь?', { // прикрутим клаву
        reply_markup: {
            keyboard: keyboard
        }
    });
});


// Обработчик нажатий на клавиатуру
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
  
    if (query.data === 'about') { // если кот
        bot.sendMessage(chatId, 'Бла бла бла что то о нас!', {
        // прикрутим клаву
            reply_markup: {
                keyboard: keyboard
            }
        });
    }
  
    if (query.data === 'order') { // если пёс
      bot.sendMessage(chatId, 'Вот наше меню, заказывайте:)', {
        reply_markup: {
            keyboard: menu
        }
      });
    }
  
    if (img) {
      bot.sendPhoto(chatId, img, { // прикрутим клаву
        reply_markup: {
          keyboard: keyboard
        }
      });
    } else {
      bot.sendMessage(chatId, 'Непонятно, давай попробуем ещё раз?', {
        // прикрутим клаву
        reply_markup: {
          keyboard: keyboard
        }
      });
    }
});
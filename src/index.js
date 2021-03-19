const mongoose = require('mongoose');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const user = require('./models/user.model');
const info = require('./models/info.model');
const item = require('./models/item.model');

require('https').createServer().listen(process.env.PORT || 5000).on('request', function(req, res){
    res.end('')
  });

const bot = new TelegramBot(config.TOKEN, {polling: true});

//=====================================================================================================

// Подключаемся к базе данных


const User = mongoose.model('users');
const Info = mongoose.model('info');
const Item = mongoose.model('item');

mongoose.connect(config.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');    
}).catch((err) => {
    console.log(err)
});


//=====================================================================================================

let cart = [];

//=====================================================================================================

// Menu keyboards

const keyboards = {
    first: [
        ['О нас 🤩', 'Акции 🔥'],
        ['Меню 🍣', 'Корзина 🛒']
    ],
    cart: [
        ['Подтвердить заказ ✔️', 'Очистить корзину 🚮'],
        ['Добавить еще ➕']
    ],
    menu: [
        ['Пред.страница', 'След.страница'],
        ['Корзина 🛒']
    ]
};


//=====================================================================================================

const client = {};



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
            Info.find((err, res) => {
                if (err) {
                    return;
                }
                bot.sendMessage(chat, `${res[0].greetings}`, {
                    reply_markup: {
                        keyboard: keyboards.first,
                        resize_keyboard: true
                    }
                })
            }
        )}
    });
});


async function sendCart(arr, id) {
    let count = arr.length;
    if (count == 0) {
        return bot.sendMessage(id, `Вы ещё ничего не добавили в корзину`, {
            reply_markup: {
                keyboard: keyboards.first,
                resize_keyboard: true
            }
        })
    }
    let cost = 0;
    for (let item of arr) {
        cost += item.price;
        await bot.sendMessage(id, `Название: ${item.name}\nЦена: ${item.price}грн.\nВес: ${item.weight}гр.`, {
            reply_markup: {
                keyboard: keyboards.cart,
                resize_keyboard: true
            }
        });
    }
    await bot.sendMessage(id, `Количество товаров в корзине: ${count}\nСумма заказа: ${cost}грн.`);
};

async function applyOrder(arr, customer, id) {
    await bot.sendMessage(id, `Новый заказ\nИмя: ${customer[0].name}\nТелефон: ${customer[0].phone}`);
    for (i of arr) {
        await bot.sendMessage(id, `Название: ${i.name}\nЦена: ${i.price}грн.\nВес:${i.weight}гр.`)
    }
};

async function sendItems(id, array) {
    for (let curr of array) {
        await bot.sendPhoto(id, curr.photo, {
            caption: `Название: ${curr.name} \nЦена: ${curr.price}грн. \nВес: ${curr.weight}гр.`,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Добавить в корзину',
                            callback_data: curr.baseName
                        }
                    ]
                ]
            }
        });
    }
}

function sendMenu(chatId, arr) {
    const c = new Promise((resolve, reject) => {
        bot.sendMessage(chatId, 'Наше меню: ')
        .then((e,r) => {
            if (e) return reject(e);
            resolve(r);
        })
        .catch(err => {
            return err;
        })
    })
    .then(() => {
        sendItems(chatId, arr);
    })
    .catch(err => {
        console.log(err);
    });
};

bot.on('message', msg => {
    const chat = msg.chat.id;
    const regexp = /\D/;

    if (!regexp.test(msg.text) && msg.text.length >= 10) {
        client.phone = msg.text;
        new User(client).save();
        bot.sendMessage(chat, `Привет, ${client.name}`, {
            reply_markup: {
                keyboard: keyboards.first,
                resize_keyboard: true
            }
        });
    }

    // Отправляем меню 

    switch(msg.text) {
        case 'Меню 🍣':
            Item.find().exec((err, res) => {
                if (err) {
                    throw err;
                }
                sendMenu(chat, res);
            })
            break;
        case 'Корзина 🛒':
                sendCart(cart, chat);
            break;
        case 'Очистить корзину 🚮':
                cart = [];
                bot.sendMessage(chat, 'Корзина очищена ', {
                    reply_markup: {
                        keyboard: keyboards.first,
                        resize_keyboard: true
                    }
                });
            break;
        case 'Подтвердить заказ ✔️':
                User.find({id: msg.from.id}, (err, user) => {
                    if (err) {
                        return;
                    } else {
                        applyOrder(cart, user, chat)
                        .then(() => {
                            cart = []
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                    }
                });
                
                bot.sendMessage(chat, 'Ваш заказ принят, скоро вам перезвонят', {
                    reply_markup: {
                        keyboard: keyboards.first,
                        resize_keyboard: true
                    }
                });
            break;
        case 'Добавить еще ➕':
                bot.sendMessage(chat, `Вы можете добавить что-то ещё`, {
                    reply_markup: {
                        keyboard: keyboards.first,
                        resize_keyboard: true
                    }
                });
            break;
        case 'О нас 🤩':
                bot.sendMessage(chat, `о нас`, {
                    reply_markup: {
                        keyboard: keyboards.first,
                        resize_keyboard: true
                    }
                });
            break;
        case 'Акции 🔥':
                bot.sendMessage(chat, `акции`, {
                    reply_markup: {
                        keyboard: keyboards.first,
                        resize_keyboard: true
                    }
                });
            break;
    }
});


bot.on('callback_query', query => {
    if (query.data) {
        Item.find().exec((err, res) => {
            if(err) console.log(err)
            res.forEach(item => {
                if (item.baseName === query.data) {
                    cart.push(item);
                    bot.answerCallbackQuery(query.id, `Добавили в корзину: ${item.name}`, {
                        cache_time: 0
                    })
                }
            })
        })
    }
});

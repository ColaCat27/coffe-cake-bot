const mongoose = require('mongoose');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const user = require('./models/user.model');
const info = require('./models/info.model');
const item = require('./models/item.model');
const { create } = require('domain');

const bot = new TelegramBot(config.TOKEN, {polling: true});

//=====================================================================================================

// Подключаемся к базе данных


let information = {};

let catalog = [];

const User = mongoose.model('users');
const Info = mongoose.model('info');
const Item = mongoose.model('item');

mongoose.connect(config.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
    Info.find((err, res) => {
        if(err) console.log(err);
        information = Object.assign(res[0]);
    })
    .catch(e => {
        console.log(e);
    });

    Item.find((err, res) => {
        if(err) console.log(err);
        for (let i = 0; i < res.length; i++) {
            catalog.push(res[i]);
        }
        createButtons(catalog, menu);
    })
    
}).catch((err) => {
    console.log(err)
});


console.log(information);
//=====================================================================================================

//DataBase local

let cart = [];

// const info = {
//     events: 'Какая-то информация о последних акциях',
//     about: 'Какая-то информация о нас'
// }

// const catalog = [
//     {
//         name: 'Вега ролл',
//         price: 99,
//         weight: '240г.',
//         photo: '\\img\\vega.jpg',
//         baseName: 'vega'
//     },
//     {
//         name: 'Футомаки с лососем',
//         price: 109,
//         weight: '270г.',
//         photo: '\\img\\fotomaki-losos.jpg',
//         baseName: 'futomakilosos'
//     },
//     {
//         name: 'Футомаки с тунцом',
//         price: 109,
//         weight: '270г.',
//         photo: '\\img\\fotomaki-tunec.jpg',
//         baseName: 'futomakitunec'
//     },
//     {
//         name: 'Филадельфия с лососем',
//         price: 119,
//         weight: '260г.',
//         photo: '\\img\\philadelfia-losos.jpg',
//         baseName: 'philadelphialosos'
//     },
//     {
//         name: 'Калифорния с креветкой',
//         price: 129,
//         weight: '230г.',
//         photo: '\\img\\california-krevetka.jpg',
//         baseName: 'californiakrevetka'
//     }
// ];

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

let menu = {
    // vega: [
    //     [
    //         {
    //             text: "Добавить в корзину",
    //             callback_data: 'vega'
    //         }
    //     ]
    // ],
    // futomakilosos: [
    //     [
    //         {
    //             text: "Добавить в корзину",
    //             callback_data: 'futomakilosos'
    //         }
    //     ]
    // ],
    // futomakitunec: [
    //     [
    //         {
    //             text: "Добавить в корзину",
    //             callback_data: 'futomakitunec'
    //         }
    //     ]
    // ],
    // philadelphialosos: [
    //     [
    //         {
    //             text: "Добавить в корзину",
    //             callback_data: 'philadelphialosos'
    //         }
    //     ]
    // ],
    // californiakrevetka: [
    //     [
    //         {
    //             text: "Добавить в корзину",
    //             callback_data: 'californiakrevetka'
    //         }
    //     ]

    // ]
}

function createButtons(arr, obj) {
    for ( let i = 0; i < arr.length; i++) {
    obj[arr[i].baseName] = [
      [
        {
          text: 'Добавить в корзину',
          callback_data: arr[i].baseName
        }
      ]
    ]
  }
  return obj;
}

console.log(createButtons(catalog, menu));

// menu = Object.assign(createButtons(catalog, menu));
// console.log(menu);

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
            bot.sendMessage(chat, `${information.greetings}` , {
                reply_markup: {
                    keyboard: keyboards.first,
                    resize_keyboard: true
                }
            })
        }
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
    for (item of arr) {
        await bot.sendMessage(id, `Название: ${item.name}\nЦена: ${item.price}грн.\nВес:${item.weight}`)
    }
};

async function sendItems(id, array) {
    for (let curr of array) {
        await bot.sendPhoto(id, curr.photo, {
            caption: `Название: ${curr.name} \nЦена: ${curr.price}грн. \nВес: ${curr.weight}`,
            reply_markup: {
                inline_keyboard: menu[curr.baseName]
            }
        });
    }
}

function sendMenu(chatId, arr) {
    const c = new Promise((resolve, reject) => {
        resolve(bot.sendMessage(chatId, 'Наше меню: '));
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
                sendMenu(chat, catalog);
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
                sendMenu(chat, catalog);
            break;
        case 'О нас 🤩':
                bot.sendMessage(chat, `${information.about}`, {
                    reply_markup: {
                        keyboard: keyboards.first,
                        resize_keyboard: true
                    }
                });
            break;
        case 'Акции 🔥':
                bot.sendMessage(chat, `${information.events}`, {
                    reply_markup: {
                        keyboard: keyboards.first,
                        resize_keyboard: true
                    }
                });
            break;
    }
});




// Шаблон под ответ на инлайн меню

bot.on('callback_query', query => {
    if (query.data) {
        catalog.forEach(item => {
            if (item.baseName === query.data) {
                cart.push(item);
                bot.answerCallbackQuery(query.id, `Добавили в корзину: ${item.name}`, {
                    cache_time: 0
                })
            }
        });
    }
});


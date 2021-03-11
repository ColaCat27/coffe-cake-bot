const mongoose = require('mongoose');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const user = require('./models/user.model');

const bot = new TelegramBot(config.TOKEN, {polling: true});

//=====================================================================================================

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


//=====================================================================================================

//DataBase local

let cart = [];

const info = {
    events: 'Какая-то информация о последних акциях',
    about: 'Какая-то информация о нас'
}

const catalog = [
    {
        name: 'Вега ролл',
        price: 99,
        weight: '240г.',
        photo: '\\img\\vega.jpg',
        baseName: 'vega'
    },
    {
        name: 'Футомаки с лососем',
        price: 109,
        weight: '270г.',
        photo: '\\img\\fotomaki-losos.jpg',
        baseName: 'futomakilosos'
    },
    {
        name: 'Футомаки с тунцом',
        price: 109,
        weight: '270г.',
        photo: '\\img\\fotomaki-tunec.jpg',
        baseName: 'futomakitunec'
    },
    {
        name: 'Филадельфия с лососем',
        price: 119,
        weight: '260г.',
        photo: '\\img\\philadelfia-losos.jpg',
        baseName: 'philadelphialosos'
    },
    {
        name: 'Калифорния с креветкой',
        price: 129,
        weight: '230г.',
        photo: '\\img\\california-krevetka.jpg',
        baseName: 'californiakrevetka'
    }
];

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

const menu = {
    vega: [
        [
            {
                text: "Добавить в корзину",
                callback_data: 'vega'
            }
        ]
    ],
    futomakilosos: [
        [
            {
                text: "Добавить в корзину",
                callback_data: 'futomakilosos'
            }
        ]
    ],
    futomakitunec: [
        [
            {
                text: "Добавить в корзину",
                callback_data: 'futomakitunec'
            }
        ]
    ],
    philadelphialosos: [
        [
            {
                text: "Добавить в корзину",
                callback_data: 'philadelphialosos'
            }
        ]
    ],
    californiakrevetka: [
        [
            {
                text: "Добавить в корзину",
                callback_data: 'californiakrevetka'
            }
        ]

    ]
}


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
            bot.sendMessage(chat, `Привет, ${msg.from.first_name}`, {
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
        await bot.sendMessage(id, `Название: ${item.name}\nЦена: ${item.price}грн.\nВес: ${item.weight}`, {
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
        await bot.sendPhoto(id, fs.readFileSync(__dirname + curr.photo), {
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
                bot.sendMessage(chat, `${info.about}`, {
                    reply_markup: {
                        keyboard: keyboards.first,
                        resize_keyboard: true
                    }
                });
            break;
        case 'Акции 🔥':
                bot.sendMessage(chat, `${info.events}`, {
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


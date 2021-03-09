const mongoose = require('mongoose');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const user = require('./models/user.model');


const bot = new TelegramBot(config.TOKEN, {polling: true});

//=====================================================================================================

const link = 'mongodb+srv://colacat:sMqHVlIICvEleBln@cluster0.igcby.mongodb.net/coffee';


// Подключаемся к базе данных

mongoose.connect(link, {
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

const cart = [];

const catalog = [
    {
        name: 'Вега ролл',
        price: 99,
        weight: '240г.',
        photo: '\\img\\vega.jpg'
    },
    {
        name: 'Футомаки с лососем',
        price: 109,
        weight: '270г.',
        photo: '\\img\\fotomaki-losos.jpg'
    },
    {
        name: 'Фотомаки с тунцом',
        price: 109,
        weight: '270г.',
        photo: '\\img\\fotomaki-tunec.jpg'
    },
    {
        name: 'Филадельфия с лососем',
        price: 119,
        weight: '260г.',
        photo: '\\img\\philadelfia-losos.jpg'
    },
    {
        name: 'Калифорния с креветкой',
        price: 129,
        weight: '230г.',
        photo: '\\img\\california-krevetka.jpg'
    }
];

//=====================================================================================================

// Menu keyboards

const keyboards = {
    first: [
        ['О нас 🤩', 'Акции 🔥'],
        ['Меню 🍣', 'Корзина 🛒']
    ]
};

const menu = [
    [
        [
            {
                text: 'Добавить в корзину',
                callback_data: 'vega'
            },
            {
                text: 'Убрать из корзины',
                callback_data: 'vega-delete'
            }
        ]
    ],
    [
        [
            {
                text: "Добавить в корзину",
                callback_data: 'fotomakilosos'
            },
            {
                text: 'Убрать из корзины',
                callback_data: 'fotomakilosos-delete'
            }
        ]
    ],
    [
        [
            {
                text: "Добавить в корзину",
                callback_data: 'fotomakitunec'
            },
            {
                text: 'Убрать из корзины',
                callback_data: 'fotomakitunec-delete'
            }
        ]
    ],
    [
        [
            {
                text: "Добавить в корзину",
                callback_data: 'philadelphialosos'
            },
            {
                text: 'Убрать из корзины',
                callback_data: 'philadelphialosos-delete'
            }
        ]
    ],
    [
        [
            {
                text: "Добавить в корзину",
                callback_data: 'californiakrevetka'
            },
            {
                text: 'Убрать из корзины',
                callback_data: 'californiakrevetka-delete'
            }
        ]
    ]

];


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

bot.on('message', msg => {
    const chat = msg.chat.id;
    const regexp = /\D/;

    if (!regexp.test(msg.text)) {
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

    if (msg.text === 'Меню 🍣') {
        bot.sendMessage(chat, 'Наше меню: ');
        catalog.forEach((curr, i) => {
            sendMenu(chat, curr, i)
        })
    }
});



function sendMenu(chatId, item, index) {
     bot.sendPhoto(chatId, fs.readFileSync(__dirname + item.photo), {
        caption: `Название: ${item.name} \n Цена: ${item.price}грн. \n Вес: ${item.weight}`,
        reply_markup: {
            inline_keyboard: menu[index]
        }
    });
}



// Шаблон под ответ на инлайн меню

bot.on('callback_query', query => {
    if (query.data = 'test 1') {
        bot.sendMessage(query.from.id, 'Вы успешно добавили товар в корзину', {
            reply_markup: menu.first
        })
    } 
});


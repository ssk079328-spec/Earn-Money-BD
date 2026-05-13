const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const http = require('http');

// --- আপনার তথ্যগুলো এখানে দিন ---
const token = 'আপনার_বট_টোকেন';
const mongoURI = 'আপনার_মঙ্গোডিবি_কানেকশন_স্ট্রিং';
const monetagLink = 'আপনার_মনিটেগ_লিঙ্ক';

// রেন্ডারের জন্য ছোট সার্ভার (যাতে অফ না হয়ে যায়)
http.createServer((req, res) => {
    res.write("Bot is running!");
    res.end();
}).listen(process.env.PORT || 3000);

const bot = new TelegramBot(token, { polling: true });

mongoose.connect(mongoURI).then(() => console.log("Database Connected!"));

const userSchema = new mongoose.Schema({
    chatId: Number,
    balance: { type: Number, default: 0 },
    refers: { type: Number, default: 0 }
});
const User = mongoose.model('User', userSchema);

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    let user = await User.findOne({ chatId });
    if (!user) user = await User.create({ chatId });

    bot.sendMessage(chatId, `স্বাগতম Earn Money BD!\nব্যালেন্স: ${user.balance} টাকা`, {
        reply_markup: {
            inline_keyboard: [[{ text: 'আয় করুন', url: monetagLink }]]
        }
    });
});

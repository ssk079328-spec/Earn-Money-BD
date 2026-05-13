const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const token = '8828205513:AAE_91wrwvdLA-SIyTZTSdYpFM7El8LaMYQ';
const mongoURI = 'mongodb+srv://admin:Bot1234@cluster0.i8iqhvl.mongodb.net/?appName=Cluster0';
const miniAppUrl = 'https://ssk079328-spec.github.io/Earn-Money-BD/';

const bot = new TelegramBot(token, { polling: true });

mongoose.connect(mongoURI).then(() => console.log("Real-Time DB Connected"));

const userSchema = new mongoose.Schema({
    chatId: Number,
    name: String,
    balance: { type: Number, default: 0.00 }
});
const User = mongoose.model('User', userSchema);

// --- API: ইউজারের তথ্য দেখা ---
app.get('/api/user/:id', async (req, res) => {
    const user = await User.findOne({ chatId: req.params.id });
    res.json(user || { error: "User not found" });
});

// --- API: রিয়াল-টাইম ব্যালেন্স আপডেট (বিজ্ঞাপন দেখার পর) ---
app.post('/api/add-balance', async (req, res) => {
    const { chatId, amount } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { chatId: chatId },
            { $inc: { balance: amount } },
            { new: true }
        );
        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    let user = await User.findOne({ chatId });
    if (!user) await User.create({ chatId, name: msg.from.first_name });

    bot.sendMessage(chatId, `স্বাগতম ${msg.from.first_name}! ব্যালেন্স দেখতে অ্যাপ ওপেন করুন।`, {
        reply_markup: {
            inline_keyboard: [[{ text: "💰 ওপেন মিনি অ্যাপ", web_app: { url: miniAppUrl } }]]
        }
    });
});

app.listen(process.env.PORT || 3000);

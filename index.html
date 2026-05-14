const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- আপনার তথ্য ---
const token = '8828205513:AAE_91wrwvdLA-SIyTZTSdYpFM7El8LaMYQ';
const mongoURI = 'mongodb+srv://admin:bot1234@cluster0.i8iqhvl.mongodb.net/?appName=Cluster0';
const miniAppUrl = 'https://ssk079328-spec.github.io/Earn-Money-BD/';

const bot = new TelegramBot(token, { polling: true });

// ডাটাবেস কানেকশন
mongoose.connect(mongoURI)
    .then(() => console.log("Real-Time DB Connected Successfully!"))
    .catch(err => console.error("DB Connection Error:", err));

// ইউজার মডেল
const userSchema = new mongoose.Schema({
    chatId: Number,
    name: String,
    balance: { type: Number, default: 0.00 }
});
const User = mongoose.model('User', userSchema);

// --- API: মিনি অ্যাপের জন্য ডাটা পাঠানো ---
app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await User.findOne({ chatId: req.params.id });
        res.json(user || { error: "User not found" });
    } catch (e) { res.status(500).send(e); }
});

// --- API: বিজ্ঞাপন দেখার পর ব্যালেন্স যোগ করা ---
app.post('/api/add-balance', async (req, res) => {
    const { chatId, amount } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { chatId: chatId },
            { $inc: { balance: amount } },
            { new: true, upsert: true }
        );
        res.json({ success: true, newBalance: user.balance });
    } catch (err) { res.status(500).json({ success: false }); }
});

// বট কমান্ড
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    let user = await User.findOne({ chatId });
    if (!user) await User.create({ chatId, name: msg.from.first_name });

    bot.sendMessage(chatId, `আসসালামু আলাইকুম ${msg.from.first_name}!\nআপনার ইনকাম শুরু করতে নিচের বাটনে ক্লিক করুন।`, {
        reply_markup: {
            inline_keyboard: [[{ text: "💰 ওপেন মিনি অ্যাপ", web_app: { url: miniAppUrl } }]]
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

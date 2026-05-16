const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const token = '8828205513:AAE_91wrwvdLA-SIyTZTSdYpFM7El8LaMYQ';
const mongoURI = 'mongodb+srv://admin:bot1234@cluster0.i8iqhvl.mongodb.net/?appName=Cluster0';
const bot = new TelegramBot(token, { polling: true });

mongoose.connect(mongoURI)
    .then(() => console.log("Premium Real-Time DB Connected Successfully!"))
    .catch(err => console.error("DB Connection Error:", err));

// ডাটাবেস স্কিমা (ইউজার ও হিস্ট্রি ট্র্যাকিং)
const userSchema = new mongoose.Schema({
    chatId: { type: Number, unique: true },
    name: String,
    balance: { type: Number, default: 0.00 }
});
const User = mongoose.model('User', userSchema);

const historySchema = new mongoose.Schema({
    chatId: Number,
    type: String,
    amount: Number,
    date: { type: Date, default: Date.now }
});
const History = mongoose.model('History', historySchema);

// API: ইউজারের তথ্য দেখা
app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await User.findOne({ chatId: req.params.id });
        res.json(user || { error: "User not found" });
    } catch (e) { res.status(500).send(e); }
});

// API: সাধারণ ব্যালেন্স যোগ (ডেইলি রিওয়ার্ড/রেফার)
app.post('/api/add-balance', async (req, res) => {
    const { chatId, amount, type } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { chatId: chatId },
            { $inc: { balance: amount } },
            { new: true, upsert: true }
        );
        // ট্রানজেকশন হিস্ট্রি সেভ করা
        await History.create({ chatId, type: type || "Bonus", amount });
        res.json({ success: true, newBalance: user.balance });
    } catch (err) { res.status(500).json({ success: false }); }
});

// API: ট্রানজেকশন হিস্ট্রি দেখা
app.get('/api/history/:id', async (req, res) => {
    try {
        const list = await History.find({ chatId: req.params.id }).sort({ date: -1 }).limit(15);
        res.json(list);
    } catch (e) { res.status(500).send(e); }
});

// API: মনিটেগ সিকিউরড সার্ভার-সাইড পোস্টব্যাক
app.get('/api/postback', async (req, res) => {
    const { ymid, estimated_price } = req.query;
    if (!ymid) return res.status(400).send("Missing ymid");

    try {
        const reward = 0.20;
        const user = await User.findOneAndUpdate(
            { chatId: parseInt(ymid) },
            { $inc: { balance: reward } },
            { new: true }
        );

        if (user) {
            // বিজ্ঞাপনের হিস্ট্রি ডাটাবেসে সেভ করা
            await History.create({ chatId: parseInt(ymid), type: "Watched Ad", amount: reward });
            console.log(`[MONETAG] Verified ৳0.20 added to ${ymid}. Est: $${estimated_price || 0}`);
            return res.status(200).send("OK");
        } else {
            return res.status(404).send("User Not Found");
        }
    } catch (err) { return res.status(500).send("Error"); }
});

// রিয়্যাল-টাইম রেফারেল ট্র্যাকিং সিস্টেম
bot.onText(/\/startHeader(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const referrerId = match[1];

    const existingUser = await User.findOne({ chatId });

    if (!existingUser) {
        await User.create({ chatId, name: msg.from.first_name, balance: 0.00 });

        if (referrerId && parseInt(referrerId) !== chatId) {
            const refId = parseInt(referrerId);
            const referBonus = 2.00;

            const referrer = await User.findOneAndUpdate(
                { chatId: refId },
                { $inc: { balance: referBonus } },
                { new: true }
            );

            if (referrer) {
                await History.create({ chatId: refId, type: "Referral Bonus", amount: referBonus });
                bot.sendMessage(refId, `🔔 আপনার রেফার লিঙ্কের মাধ্যমে ${msg.from.first_name} জয়েন করেছে! আপনি পেয়েছেন ৳${referBonus.toFixed(2)}`);
            }
        }
    }

    bot.sendMessage(chatId, `স্বাগতম ${msg.from.first_name}! নিচে ক্লিক করে প্রিমিয়াম অ্যাপে ইনকাম শুরু করুন।`, {
        reply_markup: {
            inline_keyboard: [[{ text: "🚀 ওপেন অ্যাপ", web_app: { url: 'https://ssk079328-spec.github.io/Earn-Money-BD/' } }]]
        }
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

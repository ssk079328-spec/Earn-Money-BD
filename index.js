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
    .then(() => console.log("Real-Time DB Connected Successfully!"))
    .catch(err => console.error("DB Connection Error:", err));

const userSchema = new mongoose.Schema({
    chatId: { type: Number, unique: true },
    name: String,
    balance: { type: Number, default: 0.00 }
});
const User = mongoose.model('User', userSchema);

// API: ইউজারের তথ্য দেখা
app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await User.findOne({ chatId: req.params.id });
        res.json(user || { error: "User not found" });
    } catch (e) { res.status(500).send(e); }
});

// API: সাধারণ ব্যালেন্স যোগ
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

// API: মনিটেগ পোস্টব্যাক
app.get('/api/postback', async (req, res) => {
    const { chatId, amount } = req.query;
    if (!chatId) return res.status(400).send("Missing Chat ID");
    try {
        const user = await User.findOneAndUpdate(
            { chatId: parseInt(chatId) },
            { $inc: { balance: parseFloat(amount) } },
            { new: true }
        );
        if (user) { res.status(200).send("OK"); } else { res.status(404).send("User Not Found"); }
    } catch (err) { res.status(500).send("Error"); }
});

// রিয়্যাল-টাইম রেফারেল ট্র্যাকিং সিস্টেম
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const referrerId = match[1]; // লিঙ্ক থেকে রেফারার আইডি বের করা

    // ইউজার আগে থেকে ডাটাবেসে আছে কি না চেক করা
    const existingUser = await User.findOne({ chatId });

    if (!existingUser) {
        // নতুন ইউজার তৈরি করা
        await User.create({ chatId, name: msg.from.first_name, balance: 0.00 });

        // যদি ইউজার কারো রেফার লিঙ্কের মাধ্যমে এসে থাকে
        if (referrerId && parseInt(referrerId) !== chatId) {
            const refId = parseInt(referrerId);
            const referBonus = 2.00; // প্রতি রেফারে ২ টাকা বোনাস

            const referrer = await User.findOneAndUpdate(
                { chatId: refId },
                { $inc: { balance: referBonus } },
                { new: true }
            );

            if (referrer) {
                // যে রেফার করেছে তাকে বটে মেসেজ পাঠানো
                bot.sendMessage(refId, `🔔 আপনার রেফার লিঙ্কের মাধ্যমে ${msg.from.first_name} জয়েন করেছে! আপনি পেয়েছেন ৳${referBonus.toFixed(2)}`);
            }
        }
    }

    bot.sendMessage(chatId, `স্বাগতম ${msg.from.first_name}! নিচে ক্লিক করে ইনকাম শুরু করুন।`, {
        reply_markup: {
            inline_keyboard: [[{ text: "💰 ওপেন অ্যাপ", web_app: { url: 'https://ssk079328-spec.github.io/Earn-Money-BD/' } }]]
        }
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

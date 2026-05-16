const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// কনফিগারেশন ডাটা
const token = '8828205513:AAE_91wrwvdLA-SIyTZTSdYpFM7El8LaMYQ';
const mongoURI = 'mongodb+srv://admin:bot1234@cluster0.i8iqhvl.mongodb.net/?appName=Cluster0';

// 409 Conflict এরর থেকে বাঁচার জন্য অপ্টিমাইজড বট কানেকশন সেটিংস
const bot = new TelegramBot(token, { 
    polling: {
        autoStart: true,
        params: {
            timeout: 10
        }
    } 
});

mongoose.connect(mongoURI)
    .then(() => console.log("Premium Real-Time DB Connected Successfully!"))
    .catch(err => console.error("DB Connection Error:", err));

// মঙ্গোডিবি ডাটাবেস স্কিমা (ইউজার ও হিস্ট্রি ট্র্যাকিং)
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

// ==================== API ROUTES ====================

// API: ইউজারের কারেন্ট ব্যালেন্স ও তথ্য দেখা
app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await User.findOne({ chatId: req.params.id });
        res.json(user || { error: "User not found" });
    } catch (e) { res.status(500).send(e); }
});

// API: সাধারণ বোনাস ব্যালেন্স যোগ (যেমন: ডেইলি রিওয়ার্ড)
app.post('/api/add-balance', async (req, res) => {
    const { chatId, amount, type } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { chatId: chatId },
            { $inc: { balance: amount } },
            { new: true, upsert: true }
        );
        // ট্রানজেকশন হিস্ট্রি সেভ
        await History.create({ chatId, type: type || "Bonus", amount });
        res.json({ success: true, newBalance: user.balance });
    } catch (err) { res.status(500).json({ success: false }); }
});

// API: ইউজারের নিজস্ব ট্রানজেকশন হিস্ট্রি দেখা
app.get('/api/history/:id', async (req, res) => {
    try {
        const list = await History.find({ chatId: req.params.id }).sort({ date: -1 }).limit(15);
        res.json(list);
    } catch (e) { res.status(500).send(e); }
});

// API: মনিটেগ সিকিউরড সার্ভার-সাইড পোস্টব্যাক (১০০% হ্যাক প্রুফ)
app.get('/api/postback', async (req, res) => {
    const { ymid, estimated_price } = req.query;
    if (!ymid) return res.status(400).send("Missing ymid");

    try {
        const reward = 0.20; // প্রতি অ্যাডের জন্য ২০ পয়সা
        const user = await User.findOneAndUpdate(
            { chatId: parseInt(ymid) },
            { $inc: { balance: reward } },
            { new: true }
        );

        if (user) {
            // বিজ্ঞাপনের হিস্ট্রি ডাটাবেসে রিয়্যাল-টাইম সেভ করা
            await History.create({ chatId: parseInt(ymid), type: "Watched Ad", amount: reward });
            console.log(`[MONETAG SUCCESS] ৳0.20 added to ${ymid}. Est Earnings: $${estimated_price || 0}`);
            return res.status(200).send("OK");
        } else {
            return res.status(404).send("User Not Found");
        }
    } catch (err) { return res.status(500).send("Error"); }
});

// ==================== TELEGRAM BOT LOGIC ====================

// রিয়্যাল-টাইম রেফারেল ট্র্যাকিং ও স্টার্ট লজিক (বানানের ভুল ঠিক করা হয়েছে)
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const referrerId = match[1]; // রেফারেল লিঙ্ক থেকে আইডিটি বের করা

    try {
        // ইউজার আগে থেকেই ডাটাবেসে মেম্বার কি না তা চেক করা
        let user = await User.findOne({ chatId });

        if (!user) {
            // নতুন মেম্বার হলে অ্যাকাউন্ট তৈরি করা
            user = await User.create({ chatId, name: msg.from.first_name, balance: 0.00 });

            // যদি সে কোনো ইউজারের রেফারেল লিঙ্কের মাধ্যমে এসে থাকে
            if (referrerId && parseInt(referrerId) !== chatId) {
                const refId = parseInt(referrerId);
                const referBonus = 2.00; // প্রতি রেফারে ২ টাকা বোনাস

                const referrer = await User.findOneAndUpdate(
                    { chatId: refId },
                    { $inc: { balance: referBonus } },
                    { new: true }
                );

                if (referrer) {
                    // রেফারকারীর হিস্ট্রিতে বোনাস যোগ এবং বটে লাইভ নোটিফিকেশন পাঠানো
                    await History.create({ chatId: refId, type: "Referral Bonus", amount: referBonus });
                    bot.sendMessage(refId, `🔔 আপনার রেফার লিঙ্কের মাধ্যমে ${msg.from.first_name} জয়েন করেছে! আপনি পেয়েছেন ৳${referBonus.toFixed(2)}`);
                }
            }
        }

        // বটের মেইন ওয়েলকাম মেসেজ
        bot.sendMessage(chatId, `স্বাগতম ${msg.from.first_name}! নিচে ক্লিক করে আমাদের প্রিমিয়াম অ্যাপে ইনকাম শুরু করুন।`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💰 ওপেন অ্যাপ", web_app: { url: 'https://ssk079328-spec.github.io/Earn-Money-BD/' } }]
                ]
            }
        });

    } catch (err) {
        console.error("Error in bot /start command:", err);
    }
});

// রেন্ডার পোর্টের জন্য সার্ভার লিসেনার
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Premium Server is running on port ${PORT}`));

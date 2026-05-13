const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const http = require('http');

// --- আপনার তথ্যগুলো এখানে সেট করা হয়েছে ---
const token = '8828205513:AAE_91wrwvdLA-SIyTZTSdYpFM7El8LaMYQ';
const mongoURI = 'mongodb+srv://admin:bot1234@cluster0.i8iqhvl.mongodb.net/?appName=Cluster0';
const monetagLink = 'https://www.example.com'; // আপনার মনিটেগ ডাইরেক্ট লিঙ্কটি এখানে বসান

// রেন্ডার সার্ভার সচল রাখার জন্য (Keep-Alive)
http.createServer((req, res) => {
    res.write("Earn Money BD is running!");
    res.end();
}).listen(process.env.PORT || 3000);

const bot = new TelegramBot(token, { polling: true });

// ডাটাবেস কানেকশন
mongoose.connect(mongoURI)
    .then(() => console.log("Database Connected Successfully!"))
    .catch(err => console.error("Database Connection Error:", err));

// ইউজার ডাটা মডেল
const userSchema = new mongoose.Schema({
    chatId: Number,
    balance: { type: Number, default: 0.00 },
    refers: { type: Number, default: 0 }
});
const User = mongoose.model('User', userSchema);

// স্টার্ট কমান্ড
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name;

    try {
        let user = await User.findOne({ chatId });
        if (!user) {
            user = new User({ chatId });
            await user.save();
        }

        const welcomeMsg = `আসসালামু আলাইকুম ${name}!\n\n**Earn Money BD** বটে আপনাকে স্বাগতম।\n\n💰 আপনার ব্যালেন্স: ${user.balance.toFixed(2)} টাকা\n👥 মোট রেফার: ${user.refers}`;

        bot.sendMessage(chatId, welcomeMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 বিজ্ঞাপন দেখে আয় করুন', url: monetagLink }],
                    [{ text: '💳 উইথড্র করুন', callback_data: 'withdraw' }],
                    [{ text: '📊 প্রোফাইল', callback_data: 'profile' }]
                ]
            }
        });
    } catch (error) {
        console.error(error);
    }
});

// বাটন হ্যান্ডলার
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    
    if (query.data === 'withdraw') {
        bot.sendMessage(chatId, "⚠️ আপনার ব্যালেন্স ২০ টাকা হলে উইথড্র করতে পারবেন। আপনার বিকাশ/নগদ নম্বর লিখে অ্যাডমিনকে জানান।");
    } else if (query.data === 'profile') {
        const user = await User.findOne({ chatId });
        bot.sendMessage(chatId, `👤 আপনার তথ্য:\n\nইউজার আইডি: ${chatId}\nব্যালেন্স: ${user.balance} টাকা`);
    }
    bot.answerCallbackQuery(query.id);
});

console.log("Bot is online...");

const TelegramBot = require('node-telegram-bot-api');
const Stripe = require('stripe');
const dotenv = require('dotenv');

dotenv.config();

// Create a new Telegram bot instance
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// When the user sends the /start command, greet them
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome to the Stripe Key Checker Bot! Please send me a Stripe Secret Key (sk_live_... or sk_test_...) to verify.');
});

// Handle any user message (we assume the user will send an SK key as a message)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userInput = msg.text;

    // Check if the input looks like a Stripe key
    if (userInput.startsWith('sk_')) {
        bot.sendMessage(chatId, 'Verifying your Stripe key, please wait...');

        // Create a Stripe instance using the user's key
        const stripe = Stripe(userInput);

        try {
            // Retrieve the account details from Stripe
            const account = await stripe.accounts.retrieve();
            
            // Send back details about the Stripe account
            bot.sendMessage(chatId, `✅ Valid Stripe Key!\n\nAccount Info:\nID: ${account.id}\nEmail: ${account.email}\nBusiness Name: ${account.business_profile.name}\nCountry: ${account.country}\nType: ${account.type}\nPayouts Enabled: ${account.payouts_enabled}`);
        } catch (error) {
            // Handle invalid key or API errors
            bot.sendMessage(chatId, `❌ Invalid Stripe Key: ${error.message}`);
        }
    } else {
        bot.sendMessage(chatId, 'Please provide a valid Stripe Secret Key (sk_live_... or sk_test_...).');
    }
});

console.log('Bot is running...');

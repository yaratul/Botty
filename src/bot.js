require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Initialize the bot with your token
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Helper function to validate SK key by making a request to Stripe's API
async function checkSKKey(stripeKey) {
    try {
        const response = await axios.get('https://api.stripe.com/v1/account', {
            headers: { Authorization: `Bearer ${stripeKey}` }
        });
        return { valid: true, data: response.data };
    } catch (error) {
        if (error.response && error.response.status === 401) {
            return { valid: false };
        } else {
            throw new Error('Error occurred while checking the SK key.');
        }
    }
}

// Command to handle single SK key check and return full details
bot.onText(/\/check (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const stripeKey = match[1];

    bot.sendMessage(chatId, "Checking SK key, please wait...");

    try {
        const result = await checkSKKey(stripeKey);
        if (result.valid) {
            bot.sendMessage(chatId, `SK Key is valid! Here are the details:\n\nAccount ID: ${result.data.id}\nEmail: ${result.data.email}\nBusiness Name: ${result.data.business_profile.name}`);
        } else {
            bot.sendMessage(chatId, "SK Key is invalid.");
        }
    } catch (error) {
        bot.sendMessage(chatId, "An error occurred while checking the SK key. Please try again.");
    }
});

// Command to handle mass SK key check (only valid/invalid)
bot.onText(/\/masscheck/, async (msg) => {
    const chatId = msg.chat.id;

    // Prompt user to send the list of SK keys (one per line)
    bot.sendMessage(chatId, "Please send the list of SK keys (one per line).");

    // Listener for user response (list of SK keys)
    bot.once('message', async (msg) => {
        const skKeys = msg.text.split('\n').filter(Boolean); // Split by line and filter out empty entries

        bot.sendMessage(chatId, `Checking ${skKeys.length} SK keys, this might take a few moments...`);

        let validCount = 0;
        let invalidCount = 0;

        for (const sk of skKeys) {
            try {
                const result = await checkSKKey(sk);
                if (result.valid) {
                    validCount++;
                } else {
                    invalidCount++;
                }
            } catch (error) {
                bot.sendMessage(chatId, "Error occurred during the mass check process.");
                break;
            }
        }

        bot.sendMessage(chatId, `Mass check complete!\n\nValid SK Keys: ${validCount}\nInvalid SK Keys: ${invalidCount}`);
    });
});

// Basic start command for users
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome to the Stripe SK Key Checker bot!\n\nCommands:\n/check <sk_key> - Check a single SK key and get details.\n/masscheck - Check multiple SK keys (valid/invalid).");
});

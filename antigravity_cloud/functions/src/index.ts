import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const INCEPTION_API_KEY = process.env.INCEPTION_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export const antigravityBot = onRequest({ cors: true, invoker: "public" }, async (req, res) => {
    try {
        const update = req.body;
        if (!update || !update.message) {
            res.status(200).send("OK");
            return;
        }

        const { message } = update;
        const chatId = message.chat.id;
        const text = (message.text || "").trim();

        if (!text) {
            res.status(200).send("OK");
            return;
        }

        logger.info(`Message reçu: ${text}`);

        // Default to Claude Haiku
        let model = "anthropic/claude-3-haiku";
        let url = "https://openrouter.ai/api/v1/chat/completions";
        let apiKey = OPENROUTER_API_KEY;

        // Trigger Mercury with /m
        if (text.toLowerCase().startsWith("/m ")) {
            model = "mercury-2";
            url = "https://api.inceptionlabs.ai/v1/chat/completions";
            apiKey = INCEPTION_API_KEY;
        }

        const aiResponse = await axios.post(url, {
            model: model,
            messages: [{ role: "user", content: text }],
        }, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            timeout: 30000,
        });

        const botText = aiResponse.data.choices[0].message.content;

        // Response to Telegram
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: botText,
        });

        res.status(200).send("OK");
    } catch (error: any) {
        logger.error("Error details:", error.response?.data || error.message);
        res.status(200).send("OK"); // Always send 200 to Telegram to avoid retry loops
    }
});

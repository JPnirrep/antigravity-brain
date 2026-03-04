import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import * as dotenv from "dotenv";
import { MemoryService, Message } from "./MemoryService";

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
        const chatId = message.chat.id.toString();
        const text = (message.text || "").trim();

        if (!text) {
            res.status(200).send("OK");
            return;
        }

        // --- 1. PERSISTANCE IMMEDIATE ---
        await MemoryService.saveMessage(chatId, "user", text);

        // --- 2. RÉSONANCE & ORCHESTRATION (PARALLELE) ---
        // On récupère tout simultanément pour une latence minimale
        const [memories, routingResponse, history, indexJSON] = await Promise.all([
            MemoryService.findSimilarBricks(text),
            axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: "google/gemini-2.0-flash-001",
                messages: [
                    { role: "system", content: "Aiguilleur Antigravity. Réponds uniquement par : REASONING, CREATIVE, ou FAST." },
                    { role: "user", content: text }
                ],
                max_tokens: 10
            }, { headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}` } }),
            MemoryService.getRecentHistory(chatId, 10),
            MemoryService.getContextSummary(chatId)
        ]);

        const intent = routingResponse.data.choices[0].message.content.trim().toUpperCase();
        const memoryContext = memories.length > 0
            ? `\n### RÉSONANCE_MÉMOIRE :\n${memories.map(m => `- ${m.title}: ${m.content}`).join("\n")}`
            : "";

        // --- 3. CONFIGURATION DU MODÈLE CIBLE ---
        let model = "google/gemini-2.0-flash-001";
        let url = "https://openrouter.ai/api/v1/chat/completions";
        let apiKey = OPENROUTER_API_KEY;
        let apiOptions: any = { temperature: 0.7 };

        if (intent.includes("REASONING")) {
            model = "mercury-2";
            url = "https://api.inceptionlabs.ai/v1/chat/completions";
            apiKey = INCEPTION_API_KEY;
            apiOptions.reasoning_effort = "medium";
        } else if (intent.includes("CREATIVE")) {
            model = "anthropic/claude-3.5-sonnet";
        }

        // --- 4. APPEL DU CORPS COGNITIF ---
        const messages: Message[] = [
            {
                role: "system",
                content: `Antigravity Engine | Mode: ${intent}\n${memoryContext}\n### INDEX_DISCUSSION: ${JSON.stringify(indexJSON)}`
            },
            ...history
        ];

        const aiResponse = await axios.post(url, {
            model: model,
            messages: messages,
            ...apiOptions
        }, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            timeout: 90000
        });

        const botText = aiResponse.data.choices[0].message.content;

        // --- 5. POST-PROCESS & RÉPONSE ---
        await MemoryService.saveMessage(chatId, "assistant", botText);
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: botText,
        });

        // Tâches de fond
        const updatedHistory = [...history, { role: "user", content: text }, { role: "assistant", content: botText }];
        MemoryService.triggerSummarization(chatId, updatedHistory).catch(e => logger.error("Sync error", e));

        res.status(200).send("OK");

    } catch (error: any) {
        logger.error("Error in Orchestrator:", error.response?.data || error.message);
        res.status(200).send("OK");
    }
});

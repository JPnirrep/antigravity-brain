import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import * as dotenv from "dotenv";
import * as admin from "firebase-admin";
import { MemoryService, Message } from "./MemoryService";

dotenv.config();

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const INCEPTION_API_KEY = process.env.INCEPTION_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const NIV_MANIFESTE = `
### MANIFESTE NIV : Le chaos et la jubilation
Nous refusons le conformisme intellectuel, la résignation et le monopole du logos.
La jubilation est notre boussole : le frisson de comprendre ce que l'on savait sans mots.
Un livre/réponse NIV doit être une substance active, un rite de passage.
`;

const NIV_AGENTS = `
### DIRECTIVES AGENTS NIV
1. L'Architecte (Mercury-2) : Gardien de la substance et de la jubilation.
2. Épistémo-Neuro : Rigueur scientifique absolue (vmPFC, Cortisol, SNA).
3. Le Garde-Fou : Traque de l'IA-speak et du vide. Impitoyable.
4. Le Styliste (Cyrulnik) : Narration humaine, métaphorique et résiliente.
`;

export const antigravityBot = onRequest({
    cors: true,
    invoker: "public",
    timeoutSeconds: 300, // Augmenté pour laisser le temps à Mercury-2
    memory: "512MiB",
    maxInstances: 10
}, async (req, res) => {
    const startTime = Date.now();

    try {
        const update = req.body;
        if (!update || !update.update_id) {
            res.status(200).send("OK");
            return;
        }

        const updateId = update.update_id.toString();
        const { message } = update;
        if (!message) {
            res.status(200).send("OK");
            return;
        }

        const chatId = message.chat.id.toString();
        const text = (message.text || "").trim();
        if (!text) {
            res.status(200).send("OK");
            return;
        }

        // --- ATOMIC LOCK (Éviter les retries de Telegram pendant l'attente Mercury-2) ---
        const lockRef = admin.firestore().collection("locks").doc(updateId);
        const lockDoc = await lockRef.get();

        if (lockDoc.exists) {
            // Déjà en cours ou terminé, on répond OK pour stopper Telegram
            logger.info(`[LOCK] Skip update ${updateId} (already processing)`);
            res.status(200).send("OK");
            return;
        }

        // On pose le verrou
        await lockRef.set({
            chatId,
            status: "processing",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        logger.info(`[START] Chat: ${chatId} | Update: ${updateId} | Text: ${text.slice(0, 50)}`);

        if (!TELEGRAM_TOKEN || !OPENROUTER_API_KEY || !INCEPTION_API_KEY) {
            throw new Error("Missing API KEYS");
        }

        // --- 0. GESTION DES PREFERENCES & COMMANDES ---
        const prefs = await MemoryService.getChatPrefs(chatId);
        logger.info(`[PREFS] Mode: ${prefs.mode}`);

        if (text === "/mode niv") {
            await MemoryService.updateChatPrefs(chatId, { mode: "niv" });
            const note = "Activation Mode NIV (Mercury-2)";
            // On peut logger dans l'historique
            await MemoryService.saveMessage(chatId, "system", note);
            await MemoryService.saveKnowledgeBrick(chatId, "SYSTEM_MODE", note, ["NIV", "MODE"]);
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId, text: "⚔️ **Mode NIV Activé.**\nL'équipe est mobilisée. Le chaos devient fécond.", parse_mode: "Markdown"
            });
            await lockRef.update({ status: "done" });
            res.status(200).send("OK");
            return;
        }

        if (text === "/mode standard") {
            await MemoryService.updateChatPrefs(chatId, { mode: "standard" });
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId, text: "🕊️ **Mode Standard Activé.**", parse_mode: "Markdown"
            });
            await lockRef.update({ status: "done" });
            res.status(200).send("OK");
            return;
        }

        if (text === "/manifeste") {
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: NIV_MANIFESTE,
                parse_mode: "Markdown"
            });
            await lockRef.update({ status: "done" });
            res.status(200).send("OK");
            return;
        }

        // --- 1. RÉSONANCE & ROUTING ---
        logger.info("[ROUTING] Calling intent detection...");
        const [memories, routingResponse, history, indexJSON] = await Promise.all([
            MemoryService.findSimilarBricks(text),
            axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: "google/gemini-2.0-flash-001",
                messages: [{ role: "system", content: "Routeur Antigravity. Réponds uniquement : REASONING, CREATIVE, ou FAST." }, { role: "user", content: text }],
                max_tokens: 10
            }, { headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}` }, timeout: 15000 }),
            MemoryService.getRecentHistory(chatId, 12),
            MemoryService.getContextSummary(chatId)
        ]);

        const intent = routingResponse.data.choices[0]?.message?.content?.trim().toUpperCase() || "FAST";
        logger.info(`[ROUTING] Intent: ${intent} | Memories: ${memories.length}`);

        // --- 2. CONFIGURATION DU MODÈLE ---
        let model = "google/gemini-2.0-flash-001";
        let url = "https://openrouter.ai/api/v1/chat/completions";
        let apiKey = OPENROUTER_API_KEY;
        let apiOptions: any = { temperature: 0.7 };

        const memoryContext = memories.length > 0 ? `\n### RÉSONANCE_MÉMOIRE :\n${memories.map(m => `- ${m.title}: ${m.content}`).join("\n")}` : "";
        let systemPrompt = `Antigravity Engine | Mode: ${intent}\n${memoryContext}\n### INDEX: ${JSON.stringify(indexJSON)}`;

        if (prefs.mode === "niv") {
            model = "mercury-2";
            url = "https://api.inceptionlabs.ai/v1/chat/completions";
            apiKey = INCEPTION_API_KEY;
            apiOptions.reasoning_effort = "medium";
            systemPrompt += `\n\n${NIV_MANIFESTE}\n${NIV_AGENTS}`;
        } else if (intent.includes("REASONING")) {
            model = "mercury-2";
            url = "https://api.inceptionlabs.ai/v1/chat/completions";
            apiKey = INCEPTION_API_KEY;
            apiOptions.reasoning_effort = "medium";
        } else if (intent.includes("CREATIVE")) {
            model = "anthropic/claude-3.5-sonnet";
        }

        // --- 3. APPEL IA ---
        logger.info(`[LLM] Calling ${model}...`);

        // Sécurité : Max tokens pour éviter le gaspillage
        const maxTokens = (intent.includes("REASONING") || prefs.mode === "niv") ? 4000 : 1500;

        const aiResponse = await axios.post(url, {
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: text } // FIX: Ajout du message actuel
            ],
            max_tokens: maxTokens,
            ...apiOptions
        }, {
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            timeout: 180000 // 3 minutes max pour Mercury-2
        });

        const botText = aiResponse.data.choices[0]?.message?.content;
        if (!botText) throw new Error("Réponse vide de l'IA");

        // --- 3. RÉPONSE TELEGRAM ---
        logger.info(`[TELEGRAM] Sending ${botText.length} chars...`);

        try {
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: botText,
                parse_mode: "Markdown"
            }, { timeout: 20000 });
        } catch (tgError: any) {
            logger.warn("[TELEGRAM] Markdown V1 failed, falling back to plain text", tgError.message);
            // On réessaie sans Markdown si le format est invalide (fréquent avec Mercury-2)
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: botText
            }, { timeout: 20000 });
        }

        // Tâches de fond (asynchrones)
        await Promise.allSettled([
            MemoryService.saveMessage(chatId, "user", text),
            MemoryService.saveMessage(chatId, "assistant", botText),
            MemoryService.triggerSummarization(chatId, [...history, { role: "user", content: text }, { role: "assistant", content: botText }]),
            lockRef.update({ status: "done" })
        ]);

        if (text.length > 100 || intent.includes("REASONING")) {
            MemoryService.saveKnowledgeBrick(chatId, "AUTO_NOTE", `Discussion sur: ${text.slice(0, 50)}...`, ["AUTO", intent]).catch(() => { });
        }

        logger.info(`[DONE] update ${updateId} processed in ${Date.now() - startTime}ms`);
        res.status(200).send("OK");

    } catch (error: any) {
        logger.error(`[FATAL ERROR]`, error.response?.data || error.message);
        // On ne peut plus utiliser res.send ici car on a déjà répondu.
        // On envoie un message d'erreur si possible via Telegram.
        try {
            const chatId = req.body.message?.chat?.id;
            if (chatId) {
                await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    text: `⚠️ **Erreur Technique**\n${error.message.slice(0, 100)}`
                });
            }
        } catch (e) { }
        res.status(200).send("OK");
    }
});

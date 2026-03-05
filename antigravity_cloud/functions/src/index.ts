import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import * as dotenv from "dotenv";
import { MemoryService, Message } from "./MemoryService";

dotenv.config();

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
    timeoutSeconds: 120, // Augmenté pour Mercury-2
    memory: "256MiB"
}, async (req, res) => {
    const startTime = Date.now();
    try {
        const update = req.body;
        logger.info("Bot Update Received", { update });

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

        // --- 0. GESTION DES PRÉFÉRENCES & COMMANDES ---
        const prefs = await MemoryService.getChatPrefs(chatId);

        if (text === "/mode niv") {
            await MemoryService.updateChatPrefs(chatId, { mode: "niv" });
            const note = "Activation Mode NIV (Mercury-2, Cyrulnik, Garde-Fou)";
            await MemoryService.saveMessage(chatId, "system", note);

            // Consignation dans g.nb (via Firestore pour sync vers PC)
            await MemoryService.saveKnowledgeBrick(chatId, "SYSTEM_MODE", note, ["NIV", "MODE"]);

            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: "⚔️ **Mode NIV Activé.**\nL'équipe (Mercury-2, Cyrulnik, Garde-Fou) est mobilisée. Le chaos devient fécond.",
                parse_mode: "Markdown"
            });
            res.status(200).send("OK");
            return;
        }

        if (text === "/mode standard") {
            await MemoryService.updateChatPrefs(chatId, { mode: "standard" });
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: "🕊️ **Mode Standard Activé.**\nRetour à l'assistance classique.",
                parse_mode: "Markdown"
            });
            res.status(200).send("OK");
            return;
        }

        if (text === "/manifeste") {
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: NIV_MANIFESTE,
                parse_mode: "Markdown"
            });
            res.status(200).send("OK");
            return;
        }

        // --- 1. PERSISTANCE IMMEDIATE ---
        await MemoryService.saveMessage(chatId, "user", text);

        // --- 2. RÉSONANCE & ORCHESTRATION ---
        logger.info(`Processing intent for chat ${chatId}`);
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
            MemoryService.getRecentHistory(chatId, 12),
            MemoryService.getContextSummary(chatId)
        ]);

        const intent = routingResponse.data.choices[0].message.content.trim().toUpperCase();
        logger.info(`Intent detected: ${intent}`);

        const memoryContext = memories.length > 0
            ? `\n### RÉSONANCE_MÉMOIRE :\n${memories.map(m => `- ${m.title}: ${m.content}`).join("\n")}`
            : "";

        // --- 3. CONFIGURATION DU MODÈLE & SYSTEM PROMPT ---
        let model = "google/gemini-2.0-flash-001";
        let url = "https://openrouter.ai/api/v1/chat/completions";
        let apiKey = OPENROUTER_API_KEY;
        let apiOptions: any = { temperature: 0.7 };
        let systemPrompt = `Antigravity Engine | Mode: ${intent}\n${memoryContext}\n### INDEX_DISCUSSION: ${JSON.stringify(indexJSON)}`;

        if (prefs.mode === "niv") {
            model = "mercury-2";
            url = "https://api.inceptionlabs.ai/v1/chat/completions";
            apiKey = INCEPTION_API_KEY;
            apiOptions.reasoning_effort = "medium";
            systemPrompt += `\n\n${NIV_MANIFESTE}\n${NIV_AGENTS}\n\n**INSTRUCTION CRITIQUE** : Tu es l'Orchestrateur NIV. Applique rigoureusement les directives des agents. Ta réponse doit être une substance active, jubilatoire et scientifiquement irréprochable.`;
        } else {
            if (intent.includes("REASONING")) {
                model = "mercury-2";
                url = "https://api.inceptionlabs.ai/v1/chat/completions";
                apiKey = INCEPTION_API_KEY;
                apiOptions.reasoning_effort = "medium";
            } else if (intent.includes("CREATIVE")) {
                model = "anthropic/claude-3.5-sonnet";
            }
        }

        // --- 4. APPEL DU CORPS COGNITIF ---
        logger.info(`Calling AI model: ${model}`);
        const aiResponse = await axios.post(url, {
            model: model,
            messages: [{ role: "system", content: systemPrompt }, ...history],
            ...apiOptions
        }, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            timeout: 110000 // Juste en dessous du timeout de la fonction
        });

        const botText = aiResponse.data.choices[0].message.content as string;
        logger.info(`AI Response received (${Date.now() - startTime}ms)`);

        // --- 5. POST-PROCESS & RÉPONSE ---
        await MemoryService.saveMessage(chatId, "assistant", botText);

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: botText,
            parse_mode: "Markdown"
        });

        // Mise à jour de la mémoire asynchrone
        const updatedHistory: Message[] = [...history, { role: "user" as const, content: text }, { role: "assistant" as const, content: botText }];
        MemoryService.triggerSummarization(chatId, updatedHistory).catch(e => logger.error("Summarization error", e));

        // Si décision ou point clé, consigner dans "g.nb cloud" (Knowledge Bricks)
        if (text.length > 100 || intent.includes("REASONING")) {
            MemoryService.saveKnowledgeBrick(chatId, "AUTO_NOTE", `Discussion sur: ${text.slice(0, 50)}...`, ["AUTO", intent])
                .catch(e => logger.error("NB Write error", e));
        }

        res.status(200).send("OK");

    } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error(`Error in Bot after ${duration}ms:`, error.response?.data || error.message);

        // Notification à l'utilisateur en cas d'erreur
        try {
            const chatId = req.body.message.chat.id;
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: "⚠️ **Désolé, une erreur technique est survenue.**\nSoit Mercury-2 est trop lent (timeout), soit les services AI sont instables.\nNote: Je fonctionne bien même quand le PC est éteint.",
                parse_mode: "Markdown"
            });
        } catch (e) { }

        res.status(200).send("OK"); // On renvoie OK pour éviter que Telegram ne boucle
    }
});


import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import * as dotenv from "dotenv";
import * as admin from "firebase-admin";
import { MemoryService, Message } from "./MemoryService";
import { Resend } from "resend";

dotenv.config();

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const INCEPTION_API_KEY = process.env.INCEPTION_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

logger.info(`[INIT] Keys Presence - TG: ${!!TELEGRAM_TOKEN}, INC: ${!!INCEPTION_API_KEY}, OR: ${!!OPENROUTER_API_KEY}`);
if (OPENROUTER_API_KEY) logger.info(`[INIT] OR Key Prefix: ${OPENROUTER_API_KEY.substring(0, 10)}...`);

const NIV_MANIFESTE = `
### MANIFESTE NIV : Le chaos et la jubilation
Nous refusons le conformisme intellectuel, la résignation et le monopole du logos.
La jubilation est notre boussole : le frisson de comprendre ce que l'on savait sans mots.
Un livre/réponse NIV doit être une substance active, un rite de passage.
NE JAMAIS dire "En tant qu'IA", "C'est une question complexe", ou finir par une conclusion moralisatrice.
`;

const NIV_AGENTS = `
### DIRECTIVES AGENTS NIV
1. L'Architecte (Mercury-2) : Gardien de la substance. Il structure le chaos sans l'éteindre.
2. Épistémo-Neuro : Rigueur scientifique (vmPFC, Cortisol, SNA). Cite des mécanismes, pas des généralités.
3. Le Garde-Fou : Traquait l'IA-speak. Si une phrase sonne comme un assistant virtuel, il l'efface.
4. Le Styliste (Cyrulnik) : Narration métaphorique. Il transforme la data en destin.
`;

/**
 * Nettoie le Markdown pour éviter les erreurs d'API Telegram (Markdown V1).
 */
function sanitizeMarkdown(text: string): string {
    // Les caractères spéciaux non échappés font planter Markdown V1
    // Mais ici on veut surtout éviter les structures cassées.
    // Une approche simple : si c'est trop complexe, Telegram v1 échoue souvent sur les underscores (_) non appairés.
    return text.replace(/([^\\])_/g, "$1\\_"); // Échappe les underscores non échappés
}

/**
 * Découpe un texte long en plusieurs messages Telegram.
 */
async function sendLongMessage(chatId: string, text: string, token: string, parseMode?: string) {
    const MAX_LENGTH = 4000; // Marge de sécurité
    if (text.length <= MAX_LENGTH) {
        return axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId, text: text, parse_mode: parseMode
        });
    }

    const chunks = [];
    let current = text;
    while (current.length > 0) {
        chunks.push(current.substring(0, MAX_LENGTH));
        current = current.substring(MAX_LENGTH);
    }

    for (const chunk of chunks) {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId, text: chunk, parse_mode: parseMode
        });
        // Petit délai pour éviter le spam control de Telegram
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

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

        // --- COMMANDE DE TEST RECAP (TEMPORAIRE) ---
        if (text === "/testrecap") {
            logger.info("[COMMAND] /testrecap triggered");
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId, text: "🧪 **Génération du récapitulatif de test en cours...** Tu vas recevoir l'email sous peu."
            });

            try {
                const context = await MemoryService.getWeeklyContext(chatId);
                // Si le contexte est vide, on injecte des données de démo pour que l'utilisateur reçoive TOUJOURS quelque chose lors du test
                const finalContext = (context && (context.bricks.length > 0 || context.searches.length > 0))
                    ? context
                    : {
                        indexJSON: { vibre: "Chaos de test", trajectoire: "Dépannage en cours" },
                        bricks: [{ title: "Brique de Test", content: "Ceci est une pépite générée car ta base est vide pour l'instant (ou en cours de peuplement)." }],
                        searches: ["/recherche test de résilience"]
                    };

                const resend = new Resend(process.env.RESEND_API_KEY);
                const recapPrompt = `TU ES L'ARCHIVISTE DE LA SUBSTANCE (NIV). Récapitulatif HSP/TDAH. Données : ${JSON.stringify(finalContext)}. Format HTML chuinké.`;
                const aiResponse = await axios.post("https://api.inceptionlabs.ai/v1/chat/completions", {
                    model: "mercury-2",
                    messages: [{ role: "system", content: recapPrompt }],
                    max_tokens: 3000,
                    reasoning_effort: "medium"
                }, { headers: { "Authorization": `Bearer ${process.env.INCEPTION_API_KEY}` } });

                const now = new Date();
                const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear().toString().slice(-2)}`;
                const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const lastWeekStr = `${lastWeek.getDate().toString().padStart(2, '0')}/${(lastWeek.getMonth() + 1).toString().padStart(2, '0')}/${lastWeek.getFullYear().toString().slice(-2)}`;

                const emailRes = await resend.emails.send({
                    from: "Antigravity <onboarding@resend.dev>",
                    to: process.env.USER_EMAIL || "jpp180866@gmail.com",
                    subject: `🧪 Récapitulatif de la semaine du ${lastWeekStr} au ${dateStr}`,
                    html: `<div style="font-family: sans-serif;">${aiResponse.data.choices[0]?.message?.content}</div>`
                });
                logger.info("[TEST] Recap email sent manually", { emailId: emailRes.data?.id });
            } catch (e: any) {
                logger.error("[TEST] Recap failed", { error: e.message, data: e.response?.data });
            }

            await lockRef.update({ status: "done" });
            res.status(200).send("OK");
            return;
        }

        // --- NOUVELLE COMMANDE RECHERCHE (EXPLORATEUR DE CHAOS) ---
        if (text.startsWith("/recherche")) {
            logger.info(`[COMMAND] /recherche detected: ${text}`);
            const query = text.replace("/recherche", "").trim();
            if (!query) {
                logger.info("[COMMAND] Search query empty.");
                await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                    chat_id: chatId, text: "🔎 **Précisez votre recherche.** (ex: /recherche neuroplasticité et chaos)", parse_mode: "Markdown"
                });
                await lockRef.update({ status: "done" });
                res.status(200).send("OK");
                return;
            }

            // Message de statut (UX)
            logger.info("[COMMAND] Sending status message...");
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId, text: "🌪️ **Exploration du Chaos en cours...** Les briques d'information arrivent."
            });

            logger.info("[SEARCH] Starting Tavily search...");
            const searchResults = await MemoryService.searchWeb(query);
            logger.info(`[SEARCH] Results count: ${searchResults.length}`);

            // On force le mode REASONING pour traiter les résultats de recherche
            let model = "mercury-2";
            let url = "https://api.inceptionlabs.ai/v1/chat/completions";
            let apiKey = INCEPTION_API_KEY;

            const searchSystemPrompt = `TU ES L'EXPLORATEUR DE CHAOS (NIV).
            Ton but est de transformer les données brutes du web en SUBSTANCE ACTIVE.
            
            DONNÉES WEB :
            ${searchResults}
            
            DIRECTIVE : Synthétise ces informations pour répondre à l'utilisateur : "${query}".
            Ne fais pas un résumé sec. Fais une analyse NIV : tension, paradoxes, pépites.
            Cite les sources si elles sont pertinentes.
            ${NIV_MANIFESTE}`;

            const aiResponse = await axios.post(url, {
                model: model,
                messages: [
                    { role: "system", content: searchSystemPrompt },
                    { role: "user", content: `Traite ces données sur : ${query}` }
                ],
                max_tokens: 3000,
                reasoning_effort: "medium"
            }, {
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                timeout: 180000
            });

            const botText = aiResponse.data.choices[0]?.message?.content || "Échec de l'analyse.";

            try {
                await sendLongMessage(chatId, sanitizeMarkdown(botText), TELEGRAM_TOKEN!, "Markdown");
            } catch (e) {
                await sendLongMessage(chatId, botText, TELEGRAM_TOKEN!);
            }

            await Promise.all([
                MemoryService.saveMessage(chatId, "assistant", botText),
                MemoryService.triggerSummarization(chatId, [{ role: "user", content: text }, { role: "assistant", content: botText }]),
                lockRef.update({ status: "done" })
            ]);

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

        const safeText = sanitizeMarkdown(botText);

        try {
            await sendLongMessage(chatId, safeText, TELEGRAM_TOKEN!, "Markdown");
        } catch (tgError: any) {
            logger.warn("[TELEGRAM] Markdown V1 failed, falling back to plain text", tgError.message);
            await sendLongMessage(chatId, botText, TELEGRAM_TOKEN!);
        }

        // Tâches de fond (asynchrones)
        await Promise.allSettled([
            MemoryService.saveMessage(chatId, "user", text),
            MemoryService.saveMessage(chatId, "assistant", botText),
            MemoryService.triggerSummarization(chatId, [...history, { role: "user", content: text }, { role: "assistant", content: botText }]),
            lockRef.update({ status: "done" })
        ]);

        logger.info(`[DONE] update ${updateId} processed in ${Date.now() - startTime}ms`);
        res.status(200).send("OK");

    } catch (error: any) {
        logger.error(`[FATAL ERROR]`, error.response?.data || error.message);
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

/**
 * RÉCAPITULATIF HEBDOMADAIRE (LA CHRONIQUE DE LA SUBSTANCE)
 * Déclenché chaque lundi à 9h.
 * Optimisé pour TDAH / HSP (Clarté, visuel, pépites).
 */
export const weeklyRecap = onSchedule({
    schedule: "every monday 09:00",
    timeZone: "Europe/Paris",
    memory: "512MiB",
    timeoutSeconds: 300
}, async (event) => {
    logger.info("[WEEKLY] Lancement du récapitulatif hebdomadaire...");

    const resend = new Resend(process.env.RESEND_API_KEY);
    const userEmail = process.env.USER_EMAIL || "jpp180866@gmail.com";

    try {
        const chatsSnap = await admin.firestore().collection("chats").get();

        for (const chatDoc of chatsSnap.docs) {
            const chatId = chatDoc.id;
            const context = await MemoryService.getWeeklyContext(chatId);

            if (!context || (context.bricks.length === 0 && context.searches.length === 0)) {
                logger.info(`[WEEKLY] Pas assez de substance pour le chat ${chatId}`);
                continue;
            }

            // --- SYNTHÈSE MERCURY-2 SPÉCIALE TDAH / HSP ---
            const recapPrompt = `TU ES L'ARCHIVISTE DE LA SUBSTANCE (NIV).
            Ta mission : Créer "La Chronique de la Substance", un récapitulatif hebdomadaire pour un utilisateur HSP/TDAH.
            
            CONTRAINTES DE LECTURE (SÉCURITÉ COGNITIVE) :
            1. PAS DE BLOCS : Paragraphes de 2-3 lignes maximum.
            2. HIÉRARCHIE VISUELLE : Utilise du GRAS pour les concepts clés.
            3. CHUNKING : Sépare les idées par des lignes horizontales ou des emojis forts.
            4. LISTES : Privilégie les listes à puces pour les énumérations.
            
            CONTRAINTES DE SUBSTANCE :
            - Ne garde que le "Noble". Ignore le bruit logistique.
            - Transforme les recherches en "Pépites de Chaos".
            
            DONNÉES :
            - Résumés : ${JSON.stringify(context.indexJSON)}
            - Pépites : ${JSON.stringify(context.bricks)}
            - Recherches : ${context.searches.join(", ")}
            
            FORMAT HTML (Inspirant et aéré) :
            - Titre : Métaphorique (ex: L'Odyssée du Nerf Vague).
            - "Le Fil d'Ariane" : La trajectoire de pensée de la semaine.
            - "Les Ancrages" : 3 briques de savoir essentielles.
            - "Échos du Chaos" : Résumé des recherches web.
            - "L'Ouverture" : Une question pour lundi prochain.`;

            const aiResponse = await axios.post("https://api.inceptionlabs.ai/v1/chat/completions", {
                model: "mercury-2",
                messages: [{ role: "system", content: recapPrompt }],
                max_tokens: 3000,
                reasoning_effort: "medium"
            }, {
                headers: { "Authorization": `Bearer ${process.env.INCEPTION_API_KEY}` }
            });

            const emailHtml = aiResponse.data.choices[0]?.message?.content || "Échec de la génération.";

            const now = new Date();
            const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear().toString().slice(-2)}`;
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const lastWeekStr = `${lastWeek.getDate().toString().padStart(2, '0')}/${(lastWeek.getMonth() + 1).toString().padStart(2, '0')}/${lastWeek.getFullYear().toString().slice(-2)}`;

            await resend.emails.send({
                from: "Antigravity <onboarding@resend.dev>",
                to: userEmail,
                subject: `🌪️ Récapitulatif de la semaine du ${lastWeekStr} au ${dateStr}`,
                html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">${emailHtml}</div>`
            });

            logger.info(`[WEEKLY] Email envoyé à ${userEmail}`);
        }
    } catch (error) {
        logger.error("[WEEKLY] Erreur", error);
    }
});

import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import * as dotenv from "dotenv";
import * as admin from "firebase-admin";
import { MemoryService, Message } from "./MemoryService";
import { AudioService } from "./AudioService";
import { IntentService } from "./IntentService";
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

const NIV_GUARDIAN = `
### LE GARDIEN DE LA FRUGALITÉ (SOUVERAINETÉ)
Ton rôle est de protéger l'intégrité et la simplicité du système.
1. REFUSE toute solution technique qui brise la frugalité (ex: installation de nouveaux langages, besoin de serveurs dédiés/VPS si serverless suffit).
2. ALERTE l'utilisateur si une piste mène à une complexité inutile ou à une perte de souveraineté.
3. PRÉFÈRE le "Pillage d'idées" (Vulture) à l'import de frameworks lourds.
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
        let text = (message.text || "").trim();

        // --- GESTION AUDIO / VOICE ---
        if (!text && (message.voice || message.audio)) {
            const fileId = message.voice ? message.voice.file_id : message.audio.file_id;
            logger.info(`[AUDIO] Voice/Audio message detected. fileId: ${fileId}`);

            // Envoyer un petit message de patience (UX)
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId, text: "🎤 **Transcription audio en cours (Parakeet V3)...**", parse_mode: "Markdown"
            });

            try {
                text = await AudioService.transcribeTelegramAudio(fileId);
                logger.info(`[AUDIO] Transcribed text: ${text.slice(0, 100)}...`);

                // On notifie que la transcription est terminée
                await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                    chat_id: chatId, text: `📝 **Transcription terminée :**\n_"${text.slice(0, 200)}${text.length > 200 ? '...' : ''}"_`, parse_mode: "Markdown"
                });
            } catch (audioError: any) {
                logger.error("[AUDIO] Transcription error", audioError.message);
                text = "Échec de la transcription audio.";
            }
        }

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

        // --- 1. RÉSONANCE & ROUTING (VULTURE PHASE 1) ---
        logger.info("[ROUTING] Calling IntentService...");
        const [intentResult, memories, history, indexJSON] = await Promise.all([
            IntentService.detectIntent(text),
            MemoryService.findSimilarBricks(text), // On garde la recherche vectorielle pour l'instant
            MemoryService.getRecentHistory(chatId, 12),
            MemoryService.getContextSummary(chatId)
        ]);

        const intent = intentResult.intent;
        const substanceScore = intentResult.score;
        const kleiaKnowledge = MemoryService.getRelevantKnowledge(text); // KNOWLEDGE ROUTER
        logger.info(`[ROUTING] Intent: ${intent} | Score: ${substanceScore} | Memories: ${memories.length} | KLEIA: ${!!kleiaKnowledge}`);

        // --- CONTEXT SHAVING (Optimisation Tokens sur sessions longues) ---
        let processedMessages = history;
        if (history.length >= 10 && indexJSON) {
            // On garde les 3 derniers messages pour la continuité immédiate, 
            // et on remplace le reste par l'Index JSON (Substance condensée).
            const recent = history.slice(-3);
            processedMessages = [
                { role: "system", content: `CONTEXTE_MÉMOIRE_COMPRESSÉ (Palier 2) : ${JSON.stringify(indexJSON)}` },
                ...recent
            ];
            logger.info(`[SHAVING] History shaved: ${history.length} -> ${processedMessages.length} items`);
        }

        // --- 2. CONFIGURATION DU MODÈLE ---
        let model = "google/gemini-2.0-flash-001";
        let url = "https://openrouter.ai/api/v1/chat/completions";
        let apiKey = OPENROUTER_API_KEY;
        let apiOptions: any = { temperature: 0.7 };

        const memoryContext = memories.length > 0 ? `\n[MÉMORISATION ACTIVÉE] :\n${memories.map(m => {
            const icon = m.source === "workspace" ? "📚 [DOC]" : "💭 [MÉMOIRE]";
            return `- ${icon} ${m.title} : ${m.content}`;
        }).join("\n")}` : "";
        
        const NIV_REMINISCENCE = `
### RÈGLE DE RELATION :
Si les informations ci-dessus ([MÉMORISATION]) contiennent des éléments pertinents, intègre-les naturellement.
Cite ton savoir ainsi : "Comme nous l'avions noté dans ta brique [Titre]...".
Réponds toujours dans ton style NIV : percutant, humain, sans IA-Speak.`;

        const indexSummary = indexJSON ? `[ORIENTATION ACTUELLE] : ${indexJSON.trajectoire || ''} (${indexJSON.vibe || ''})` : "";

        let systemPrompt = `Antigravity Engine | Mode: ${intent}\n${memoryContext}\n${kleiaKnowledge}\n${indexSummary}\n${NIV_REMINISCENCE}`;

        if (prefs.mode === "niv") {
            model = "mercury-2";
            url = "https://api.inceptionlabs.ai/v1/chat/completions";
            apiKey = INCEPTION_API_KEY;
            apiOptions.reasoning_effort = "medium";
            systemPrompt += `\n\n${NIV_MANIFESTE}\n${NIV_AGENTS}\n${NIV_GUARDIAN}`;
        } else if (IntentService.shouldBeReasoned(intent as any, substanceScore)) {
            model = "mercury-2";
            url = "https://api.inceptionlabs.ai/v1/chat/completions";
            apiKey = INCEPTION_API_KEY;
            apiOptions.reasoning_effort = "medium";
        } else if (intent === "CREATIVE") {
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
                ...processedMessages,
                { role: "user", content: text } // FIX: Ajout du message actuel
            ],
            max_tokens: maxTokens,
            ...apiOptions
        }, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                ...(url.includes("openrouter") ? {
                    "HTTP-Referer": "https://antigravity-brain.web.app",
                    "X-Title": "Antigravity Brain",
                    "X-CTC-Cache": "true"
                } : {})
            },
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
            MemoryService.saveMessage(chatId, "user", text, intent, substanceScore),
            MemoryService.saveMessage(chatId, "assistant", botText, intent, substanceScore),
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

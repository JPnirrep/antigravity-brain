import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import { IntentService } from "./IntentService";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

export interface Message {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: admin.firestore.Timestamp;
    intent?: string; // Ajout pour le filtrage "Vulture"
    score?: number; // Ajout pour le filtrage "Vulture"
}

export interface KnowledgeConnector {
    id: string;
    keywords: string[];
    description: string;
}

export class MemoryService {
    // Registre statique pour la performance (Frugalité)
    private static readonly KNOWLEDGE_REGISTRY: KnowledgeConnector[] = [
        {
            id: "identity",
            keywords: ["forces", "via", "valeurs", "sens", "motivation"],
            description: "Forces signatures, VIA Character, Récit de réussite (Sources L1, L5). Focus: Alignement identitaire."
        },
        {
            id: "stress_logic",
            keywords: ["drivers", "process_com", "peurs", "echec", "anxiete", "stress"],
            description: "Auto-diagnostic Drivers, Profil de stress, Phrases Antidotes. Focus: Permissions mentales sous pression."
        },
        {
            id: "physical_performance",
            keywords: ["ancrage", "respiration", "non-verbal", "regard", "presence", "corps"],
            description: "Respiration abdominale, Ancrage (Arbre), Verticalité, Power Posing. Focus: Stabilité physique et nerveuse."
        },
        {
            id: "content_structure",
            keywords: ["storytelling", "conference", "pitch", "plan", "accroche", "discours"],
            description: "Le Golden Circle, Structure 3 actes, Méthode DESC. Focus: Architecture narrative et impact du message."
        }
    ];

    /**
     * Nettoyage et parsing JSON robuste.
     */
    static tryParseJSON(text: string): any {
        try {
            return JSON.parse(text);
        } catch (e) {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch (e2) {
                    throw new Error("Impossible de parser le JSON");
                }
            }
            throw e;
        }
    }

    /**
     * Knowledge Router (KLEIA-UP)
     * Utilise le registre de connecteurs inspiré du pattern CLAW.
     */
    static getRelevantKnowledge(text: string): string {
        try {
            const query = text.toLowerCase();
            let matchedContent = "";

            for (const connector of this.KNOWLEDGE_REGISTRY) {
                if (connector.keywords.some(k => query.includes(k))) {
                    matchedContent += `\n- [Ref: ${connector.id}] : ${connector.description}`;
                }
            }

            return matchedContent ? `\n### SUBSTANCE KLEIA-UP (Fragments Activés) :${matchedContent}\n` : "";
        } catch (e) {
            return "";
        }
    }

    /**
     * Calcule l'embedding (vecteur) d'un texte via OpenAI/OpenRouter.
     * Modèle : text-embedding-3-small (Ultra low cost : 0.02$ / 1M tokens)
     */
    static async getEmbedding(text: string): Promise<number[]> {
        try {
            const response = await axios.post("https://openrouter.ai/api/v1/embeddings", {
                model: "openai/text-embedding-3-small",
                input: text
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            });
            return response.data.data[0].embedding;
        } catch (error) {
            logger.error("Erreur lors de la génération de l'embedding", error);
            return [];
        }
    }

    /**
     * Récupère l'historique récent d'une conversation.
     */
    static async getRecentHistory(chatId: string, limit: number = 12): Promise<Message[]> {
        try {
            const snapshot = await db.collection("chats")
                .doc(chatId.toString())
                .collection("messages")
                .orderBy("timestamp", "desc")
                .limit(limit)
                .get();

            const messages: Message[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Phase 4 : Filtrage logistique (ne pas traîner les commandes techniques dans l'historique long)
                const isLogistics = data.content.startsWith("/") || data.role === "system";
                if (!isLogistics) {
                    messages.push({
                        role: data.role,
                        content: data.content,
                        intent: data.intent // Vulture: On récupère l'intent
                    });
                }
            });

            return messages.reverse();
        } catch (error) {
            logger.warn(`Mémoire indisponible (Firestore) pour ${chatId}. Mode dégradé activé.`, error);
            return [];
        }
    }

    /**
     * Enregistre un message.
     */
    static async saveMessage(chatId: string, role: "user" | "assistant" | "system", content: string, intent?: string, score?: number): Promise<void> {
        try {
            await db.collection("chats")
                .doc(chatId.toString())
                .collection("messages")
                .add({
                    role,
                    content,
                    intent: intent || "standard",
                    score: score || 0.5,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
        } catch (error: any) {
            logger.warn(`Échec enregistrement message (Firestore) pour ${chatId}: ${error.message}`);
        }
    }

    /**
     * Récupère la mémoire indexée (Palier 2).
     */
    static async getContextSummary(chatId: string): Promise<any | null> {
        try {
            const doc = await db.collection("chats").doc(chatId.toString()).get();
            if (doc.exists && doc.data()?.contextSummary) {
                try {
                    return JSON.parse(doc.data()?.contextSummary);
                } catch (e) {
                    return null;
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Récupère les préférences du chat (ex: mode actif).
     */
    static async getChatPrefs(chatId: string): Promise<any> {
        try {
            const doc = await db.collection("chats").doc(chatId.toString()).get();
            return doc.exists ? (doc.data()?.prefs || { mode: "standard" }) : { mode: "standard" };
        } catch (error) {
            logger.warn(`Prefs indisponibles pour ${chatId}. Par défaut: standard.`);
            return { mode: "standard" };
        }
    }

    /**
     * Met à jour les préférences du chat.
     */
    static async updateChatPrefs(chatId: string, prefs: object): Promise<void> {
        try {
            await db.collection("chats").doc(chatId.toString()).set({
                prefs,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            logger.error(`Erreur mise à jour prefs pour ${chatId}`);
        }
    }

    /**
     * Met à jour la synthèse de contexte.
     */
    static async updateContextSummary(chatId: string, summaryObj: object): Promise<void> {
        try {
            await db.collection("chats").doc(chatId.toString()).set({
                contextSummary: JSON.stringify(summaryObj),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            logger.error(`Erreur mise à jour résumé pour ${chatId}`);
        }
    }

    /**
     * Effectue une recherche web via Tavily (Explorateur de Chaos).
     */
    static async searchWeb(query: string): Promise<string> {
        try {
            const apiKey = process.env.TAVILY_API_KEY;
            if (!apiKey) throw new Error("TAVILY_API_KEY manquante");

            const response = await axios.post("https://api.tavily.com/search", {
                api_key: apiKey,
                query: query,
                search_depth: "advanced",
                max_results: 5,
                include_answer: true
            });

            const results = response.data.results || [];
            const answer = response.data.answer ? `\n### RÉPONSE DIRECTE TAVILY :\n${response.data.answer}\n` : "";

            const formattedResults = results.map((r: any) => `- [${r.title}](${r.url})\n  ${r.content}`).join("\n\n");

            return `${answer}\n### RÉSULTATS DE RECHERCHE :\n${formattedResults}`;
        } catch (error) {
            logger.error("[SEARCH] Échec de la recherche Tavily", error);
            return "⚠️ Échec de la recherche web.";
        }
    }

    /**
     * Recherche de briques par "Résonance" (Vector Search).
     * Retourne les 3 briques les plus proches sémantiquement.
     */
    static async findSimilarBricks(searchText: string): Promise<any[]> {
        try {
            const queryVector = await this.getEmbedding(searchText);
            if (queryVector.length === 0) return [];

            const snapshot = await db.collection("bricks")
                .findNearest({
                    vectorField: "embedding",
                    queryVector: queryVector,
                    distanceMeasure: "COSINE",
                    limit: 5
                })
                .get();

            const results: any[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                results.push({
                    title: data.title,
                    content: data.content,
                    tags: data.tags,
                    source: data.source || "chat"
                });
            });
            return results;
        } catch (error) {
            logger.error("[RESONANCE] Échec de la recherche vectorielle", error);
            return [];
        }
    }

    /**
     * Récupère le contexte de la semaine écoulée pour le récapitulatif email.
     */
    static async getWeeklyContext(chatId: string): Promise<any> {
        try {
            const oneWeekAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

            // 1. Récupérer les résumés récents (Palier 2)
            const chatSnap = await admin.firestore().collection("chats").doc(chatId).get();
            const indexJSON = chatSnap.exists ? chatSnap.data()?.indexJSON : null;

            // 2. Récupérer les "Pépites" (Palier 3) - Simplifié pour éviter index composite
            const bricksSnap = await admin.firestore().collection("bricks")
                .where("chatId", "==", chatId)
                .limit(50) // On en prend un peu plus et on filtre
                .get();

            const bricks = bricksSnap.docs
                .map(doc => ({
                    title: doc.data().title,
                    content: doc.data().content,
                    tags: doc.data().tags,
                    createdAt: doc.data().createdAt?.toDate() || new Date(0)
                }))
                .filter(b => b.createdAt >= oneWeekAgo.toDate())
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 20);

            // 3. Récupérer les recherches web effectuées - Simplifié pour éviter index composite
            const searchMessagesSnap = await admin.firestore().collection("chats").doc(chatId).collection("messages")
                .limit(100)
                .get();

            const searches = searchMessagesSnap.docs
                .map(doc => ({
                    text: doc.data().text || "",
                    role: doc.data().role,
                    createdAt: doc.data().createdAt?.toDate() || new Date(0)
                }))
                .filter(m => m.role === "user" && m.createdAt >= oneWeekAgo.toDate() && m.text.startsWith("/recherche"))
                .map(m => m.text);

            return { indexJSON, bricks, searches };
        } catch (error) {
            logger.error("[WEEKLY] Échec de la récupération du contexte", error);
            return null;
        }
    }

    /**
     * Synthèse de mémoire (Palier 2).
     * Utilise une détection de "substance" au lieu d'un simple compteur.
     */
    static async triggerSummarization(chatId: string, currentHistory: Message[]): Promise<void> {
        try {
            const contentToSummarize = currentHistory.map(m => `${m.role}: ${m.content}`).join("\n");

            // Sécurité : Ne pas synthétiser si le contenu est trop court (< 2000 chars)
            if (contentToSummarize.length < 2000) return;

            // Vulture Phase 1 : Utilisation des Intent Scores pour filtrage précoce
            const averageScore = currentHistory.reduce((acc, m) => acc + (m.score || 0.5), 0) / currentHistory.length;
            if (averageScore < 0.4) {
                logger.info(`[MEMORY] Score de substance trop faible (${averageScore.toFixed(2)}), synthèse annulée.`);
                return;
            }

            logger.info(`[MEMORY] Substance détectée (Score: ${averageScore.toFixed(2)}), lancement de la synthèse...`);

            const nivSystemPrompt = `Tu es le Synthétiseur NIV. Ton rôle est d'extraire la SUBSTANCE de la conversation.
REFUSE l'IA-Speak, les résumés génériques et le vide académique.
Produis un INDEX JSON strict :
{
  "intuitions": [], // Les idées fortes, les moments de bascule, les paradoxes résolus.
  "ancrages": [], // Les faits, décisions, noms, dates techniques.
  "trajectoire": "", // Une phrase sur l'évolution du Logos dans cet échange.
  "vibe": "" // La tonalité émotionnelle/intellectuelle (ex: "Chaos fécond", "Tension analytique").
}
Sois percutant, chirurgical, humain.`;

            const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: "deepseek/deepseek-chat", // OPTIMISATION Phase 3 : DeepSeek est plus performant et moins cher que Haiku pour la synthèse
                messages: [
                    { role: "system", content: nivSystemPrompt },
                    { role: "user", content: contentToSummarize }
                ],
                response_format: { type: "json_object" }
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "X-CTC-Cache": "true" // Tentative d'activation du cache si supporté
                }
            });

            const summaryObj = this.tryParseJSON(response.data.choices[0].message.content);
            await this.updateContextSummary(chatId, summaryObj);
            logger.info(`[MEMORY] Index JSON mis à jour pour ${chatId}`);

            // PALIER 3 : Extraction de briques de substance (asynchrone)
            this.extractBricks(chatId, currentHistory).catch(e => logger.error("[MEMORY] Erreur extractBricks background", e));

        } catch (error) {
            logger.error("[MEMORY] Échec de la synthèse", error);
        }
    }

    /**
     * Extrait des briques de connaissance (Palier 3) à partir de l'historique.
     * Utilise Claude-3 Haiku pour identifier ce qui a une "valeur de substance" réelle.
     */
    static async extractBricks(chatId: string, currentHistory: Message[]): Promise<void> {
        try {
            const content = currentHistory.map(m => `${m.role}: ${m.content}`).join("\n");

            const nivExtractorPrompt = `Tu es l'Extracteur de Substance NIV.
Analyse cet échange et identifie UNIQUEMENT les pépites de connaissance, les concepts originaux ou les décisions stratégiques qui méritent d'être gravés dans la mémoire à long terme.

Produis un JSON sous forme de liste :
{
  "bricks": [
    {
      "title": "Titre court et percutant",
      "content": "Description dense et sans gras",
      "tags": ["Tag1", "Tag2"],
      "relevanceScore": 0.9 // Score de 0 à 1 (substance vs bruit)
    }
  ]
}
Si rien ne mérite d'être sauvé, renvoie une liste vide.
PAS DE BLA-BLA. JUSTE LE JSON.`;

            const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: "deepseek/deepseek-chat", // OPTIMISATION Phase 3
                messages: [
                    { role: "system", content: nivExtractorPrompt },
                    { role: "user", content: content.slice(-5000) } // Focus sur la fin de l'échange
                ],
                response_format: { type: "json_object" }
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "X-CTC-Cache": "true"
                }
            });

            const data = this.tryParseJSON(response.data.choices[0].message.content);
            const bricks = data.bricks || [];

            for (const brick of bricks) {
                if (brick.relevanceScore > 0.7) {
                    await this.saveKnowledgeBrick(chatId, brick.title, brick.content, brick.tags);
                    logger.info(`[MEMORY] Brique extraite : ${brick.title}`);
                }
            }
        } catch (error) {
            logger.error("[MEMORY] Échec extraction briques", error);
        }
    }

    /**
     * Enregistre une brique de connaissance (Palier 3) avec son vecteur.
     */
    static async saveKnowledgeBrick(chatId: string, title: string, content: string, tags: string[] = []): Promise<void> {
        try {
            const embedding = await this.getEmbedding(`${title} ${content}`);

            const docRef = await db.collection("bricks").add({
                chatId,
                title,
                content,
                tags,
                embedding: admin.firestore.FieldValue.vector(embedding),
                source: "niv_extraction",
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Vulture Phase 2 : Marquage pour synchronisation GitHub
            await db.collection("pending_sync").add({
                brickId: docRef.id,
                title,
                content,
                tags,
                status: "pending",
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error: any) {
            logger.warn(`Échec stockage brique (Firestore) pour ${chatId}: ${error.message}`);
        }
    }
}

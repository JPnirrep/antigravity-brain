import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import axios from "axios";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

export interface Message {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: admin.firestore.Timestamp;
}

export class MemoryService {

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
                messages.push({
                    role: data.role,
                    content: data.content
                });
            });

            return messages.reverse();
        } catch (error) {
            logger.error(`Erreur historique pour ${chatId}:`, error);
            return [];
        }
    }

    /**
     * Enregistre un message.
     */
    static async saveMessage(chatId: string, role: "user" | "assistant" | "system", content: string): Promise<void> {
        try {
            await db.collection("chats")
                .doc(chatId.toString())
                .collection("messages")
                .add({
                    role,
                    content,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
        } catch (error) {
            logger.error(`Erreur enregistrement message pour ${chatId}:`, error);
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
                    logger.error("JSON Index corrompu dans Firestore", e);
                    return null;
                }
            }
            return null;
        } catch (error) {
            logger.error(`Erreur recup résumé pour ${chatId}:`, error);
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
            logger.error(`Erreur recup prefs pour ${chatId}:`, error);
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
            logger.error(`Erreur mise à jour prefs pour ${chatId}:`, error);
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
            logger.error(`Erreur mise à jour résumé pour ${chatId}:`, error);
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

            // Utilisation de la recherche vectorielle de Firestore (native et peu coûteuse)
            const snapshot = await db.collection("bricks")
                .findNearest({
                    vectorField: "embedding",
                    queryVector: queryVector,
                    distanceMeasure: "COSINE",
                    limit: 3
                })
                .get();

            const results: any[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                results.push({
                    title: data.title,
                    content: data.content,
                    tags: data.tags
                });
            });
            return results;
        } catch (error) {
            logger.error("Erreur lors de la recherche par résonance", error);
            return [];
        }
    }

    /**
     * Synthèse de mémoire (Palier 2).
     */
    static async triggerSummarization(chatId: string, currentHistory: Message[]): Promise<void> {
        try {
            const snapshot = await db.collection("chats").doc(chatId.toString()).collection("messages").count().get();
            const count = snapshot.data().count;

            if (count > 0 && count % 20 === 0) {
                const contentToSummarize = currentHistory.map(m => `${m.role}: ${m.content}`).join("\n");

                const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                    model: "anthropic/claude-3-haiku",
                    messages: [
                        { role: "system", content: "Transforme l'historique en INDEX JSON : { 'topics': [], 'decisions': [], 'summary': '' }" },
                        { role: "user", content: contentToSummarize }
                    ],
                    response_format: { type: "json_object" }
                }, {
                    headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}` }
                });

                const summaryObj = JSON.parse(response.data.choices[0].message.content);
                await this.updateContextSummary(chatId, summaryObj);
            }
        } catch (error) {
            logger.error(`Échec de la synthèse pour ${chatId}:`, error);
        }
    }

    /**
     * Enregistre une brique de connaissance (Palier 3) avec son vecteur.
     */
    static async saveKnowledgeBrick(chatId: string, title: string, content: string, tags: string[] = []): Promise<void> {
        try {
            // Génération du vecteur de résonance pour cette brique
            const embedding = await this.getEmbedding(`${title} ${content}`);

            await db.collection("bricks").add({
                chatId,
                title,
                content,
                tags,
                embedding: (admin.firestore as any).VectorValue.fromArray(embedding),
                source: "telegram_extraction",
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            logger.info(`Brique stockée avec succès (Vectorisée) : ${title}`);
        } catch (error) {
            logger.error(`Erreur brique pour ${chatId}:`, error);
        }
    }
}

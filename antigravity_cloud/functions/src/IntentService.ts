import axios from "axios";
import * as logger from "firebase-functions/logger";

export type SubstanceIntent = "STRATEGIC" | "CONCEPTUAL" | "EMOTIONAL" | "CREATIVE" | "NOISE" | "FAST";

export interface IntentResult {
    intent: SubstanceIntent;
    score: number; // SubstanceScore 0 to 1
    reasoning?: string;
}

export class IntentService {
    /**
     * Analyse le message pour détecter l'intention et le score de substance.
     * Utilise Gemini Flash Lite pour un compromis idéal coût/vitesse.
     */
    static async detectIntent(text: string): Promise<IntentResult> {
        try {
            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey) {
                logger.error("[INTENT] Missing OPENROUTER_API_KEY");
                return { intent: "FAST", score: 0.1 };
            }

            const systemPrompt = `Tu es le Filtre de Substance Antigravity (NIV). 
Ta mission : Catégoriser le message utilisateur et évaluer sa "Valeur de Substance".

CATEGORIES :
- STRATEGIC : Plans d'action, décisions, gouvernance, vision long terme.
- CONCEPTUAL : Théories, psychologie (HSP/TDAH), biologie, briques de savoir.
- EMOTIONAL : Expression authentique d'un ressenti, tension, jubilation, doute profond.
- CREATIVE : Demande de création de contenu, métaphores, storytelling, poésie.
- NOISE : Logistique ("ok", "merci"), tests techniques, répétitions, salut de politesse.
- FAST : Question simple demandant une réponse factuelle rapide sans réflexion profonde.

SUBSTANCE SCORE (0.0 à 1.0) :
- 0.0 - 0.3 : Bruit, politesse, test.
- 0.4 - 0.7 : Information utile mais transitoire.
- 0.8 - 1.0 : Substance Noble. Doit ABSOLUMENT être gravé dans la mémoire long terme.

RÉPONS UNIQUEMENT EN JSON :
{
  "intent": "STRATEGIC" | "CONCEPTUAL" | "EMOTIONAL" | "CREATIVE" | "NOISE" | "FAST",
  "score": 0.0,
  "reasoning": "Bref motif du score"
}`;

            const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: "google/gemini-2.0-flash-lite-001",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ],
                response_format: { type: "json_object" },
                max_tokens: 150
            }, {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": "https://antigravity-brain.web.app",
                    "X-Title": "Antigravity Brain Intent Service"
                },
                timeout: 10000
            });

            const result = JSON.parse(response.data.choices[0].message.content);
            logger.info(`[INTENT] Detected: ${result.intent} | Score: ${result.score} | ${result.reasoning}`);
            
            return {
                intent: result.intent,
                score: result.score,
                reasoning: result.reasoning
            };

        } catch (error: any) {
            logger.error("[INTENT] Failure", error.message);
            // Fallback frugal
            if (text.length < 10) return { intent: "NOISE", score: 0.1 };
            return { intent: "FAST", score: 0.5 };
        }
    }

    /**
     * Détermine si le message mérite d'être traité avec un modèle de haut niveau (Mercury-2).
     */
    static shouldBeReasoned(intent: SubstanceIntent, score: number): boolean {
        return (intent === "STRATEGIC" || intent === "CONCEPTUAL" || intent === "EMOTIONAL") && score >= 0.6;
    }

    /**
     * Détermine si le message mérite d'être stocké en mémoire long terme.
     */
    static isWorthMLT(score: number): boolean {
        return score >= 0.4;
    }
}

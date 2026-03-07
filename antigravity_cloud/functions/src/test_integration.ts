import * as dotenv from "dotenv";
import * as path from "path";
import { MemoryService } from "./MemoryService";
import axios from "axios";

// Chargement des variables d'environnement
dotenv.config({ path: path.join(__dirname, "../.env") });

async function testSearchAndSubstance() {
    console.log("🚀 Lancement du Test d'Intégration : Explorateur de Chaos (NIV)");

    const query = "L'impact de la neuroplasticité sur la résilience émotionnelle selon Boris Cyrulnik";
    console.log(`🔎 Recherche Tavily pour : "${query}"...`);

    try {
        // 1. Test de la recherche Tavily
        const searchResults = await MemoryService.searchWeb(query);
        console.log("✅ Résultats Tavily reçus (extraits) :");
        console.log(searchResults.slice(0, 500) + "...\n");

        // 2. Test de la synthèse Mercury-2 (Substance Active)
        console.log("🌪️ Simulation du traitement par Mercury-2 (Inception)...");

        const INCEPTION_API_KEY = process.env.INCEPTION_API_KEY;
        if (!INCEPTION_API_KEY) {
            console.error("❌ Erreur : INCEPTION_API_KEY manquante dans le .env");
            return;
        }

        const NIV_MANIFESTE = "### MANIFESTE NIV : Le chaos et la jubilation\nNous refusons le conformisme intellectuel, la résignation et le monopole du logos.";

        const searchSystemPrompt = `TU ES L'EXPLORATEUR DE CHAOS (NIV).
        Ton but est de transformer les données brutes du web en SUBSTANCE ACTIVE.
        
        DONNÉES WEB :
        ${searchResults}
        
        DIRECTIVE : Synthétise ces informations pour répondre à l'utilisateur : "${query}".
        Ne fais pas un résumé sec. Fais une analyse NIV : tension, paradoxes, pépites.
        ${NIV_MANIFESTE}`;

        const aiResponse = await axios.post("https://api.inceptionlabs.ai/v1/chat/completions", {
            model: "mercury-2",
            messages: [
                { role: "system", content: searchSystemPrompt },
                { role: "user", content: `Traite ces données sur : ${query}` }
            ],
            max_tokens: 2000,
            reasoning_effort: "medium"
        }, {
            headers: { "Authorization": `Bearer ${INCEPTION_API_KEY}`, "Content-Type": "application/json" },
            timeout: 180000
        });

        const botText = aiResponse.data.choices[0]?.message?.content;
        console.log("\n✨ REPONSE MERCURY-2 (SUBSTANCE) :\n");
        console.log(botText);
        console.log("\n✅ Test terminé avec succès.");

    } catch (error: any) {
        console.error("❌ Échec du test :", error.response?.data || error.message);
    }
}

testSearchAndSubstance();

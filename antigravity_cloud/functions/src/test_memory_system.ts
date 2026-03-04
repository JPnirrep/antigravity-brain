import * as admin from "firebase-admin";
import { MemoryService } from "./MemoryService";
import * as dotenv from "dotenv";
import * as path from "path";

// Chargement des env pour les clés API
dotenv.config({ path: path.join(__dirname, "../.env") });

async function runTest() {
    console.log("=== Test du Système de Mémoire Antigravity v2 ===");
    const testChatId = "test_audit_999";

    // 1. Simulation d'une conversation dense (longs textes sur l'IA et la psychologie)
    console.log("1. Injection de messages longs...");
    const longTexts = [
        "L'intelligence artificielle générative repose sur des modèles de langage de type transformer. Ces modèles utilisent des mécanismes d'attention pour traiter des séquences de données de manière parallèle, ce qui permet une compréhension contextuelle bien supérieure aux architectures récurrentes classiques.",
        "En psychologie cognitive, la mémoire de travail est souvent comparée à un espace de traitement temporaire. Pour une IA, nous cherchons à répliquer ce concept via des systèmes de context-window gérés dynamiquement.",
        "L'optimisation des tokens est cruciale pour la viabilité économique. Chaque mot inutile envoyé à l'API est un gaspillage de ressources. C'est pourquoi l'indexation JSON est supérieure à la narration textuelle brute.",
        "Nous avons décidé aujourd'hui d'utiliser Mercury-2 pour les tâches de raisonnement profond et Claude-3 Haiku pour les tâches de synthèse rapide. C'est un compromis idéal.",
        "L'architecture Antigravity doit rester modulaire. Chaque service (Memory, Router, Bot) doit être indépendant pour permettre des mises à jour granulaires sans perturber le système global."
    ];

    // On injecte plusieurs fois pour dépasser le seuil de 8000 caractères
    for (let i = 0; i < 4; i++) {
        for (const text of longTexts) {
            await MemoryService.saveMessage(testChatId, i % 2 === 0 ? "user" : "assistant", text);
        }
    }

    const weight = await MemoryService.getChatWeight(testChatId);
    console.log(`Poids actuel du chat : ${weight} caractères.`);

    // 2. Déclenchement de la synthèse
    console.log("2. Lancement de la synthèse (Palier 2)...");
    const history = await MemoryService.getRecentHistory(testChatId);
    await MemoryService.triggerSummarization(testChatId, history);

    // 3. Vérification du résultat
    console.log("3. Vérification de l'index JSON dans Firestore...");
    const summary = await MemoryService.getContextSummary(testChatId);

    if (summary) {
        console.log("SUCCÈS : Index de mémoire récupéré !");
        console.log("Contenu de l'index JSON :");
        console.log(JSON.stringify(summary, null, 2));
    } else {
        console.log("ERREUR : Aucun index n'a été généré. Vérifiez les logs ou le seuil de poids.");
    }
}

runTest().then(() => console.log("Fin du test."));

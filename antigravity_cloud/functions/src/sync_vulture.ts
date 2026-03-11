import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { execSync } from "child_process";

dotenv.config({ path: path.join(__dirname, "../.env") });

// CONFIGURATION
const PROJECT_ID = "antigravity-brain-79792";
const BRICKS_DIR = path.join(__dirname, "../../../bricks");
const KEY_PATH = path.join(__dirname, "../../../serviceAccountKey.json");

/**
 * Script de Synchronisation Vulture
 * Rapatrie les briques de substance noble de Firestore vers le dossier local /bricks.
 */
async function syncVulture() {
    console.log("🚀 Démarrage de la synchronisation Vulture...");

    // 1. Initialisation Firebase
    try {
        if (admin.apps.length === 0) {
            const envKey = process.env.FIREBASE_SERVICE_ACCOUNT;
            
            if (envKey) {
                console.log("🔐 Utilisation de la clé depuis les variables d'environnement (.env)");
                const serviceAccount = JSON.parse(envKey);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: PROJECT_ID
                });
            } else if (fs.existsSync(KEY_PATH)) {
                console.log("📄 Utilisation du fichier serviceAccountKey.json");
                admin.initializeApp({
                    credential: admin.credential.cert(KEY_PATH),
                    projectId: PROJECT_ID
                });
            } else {
                console.warn("⚠️ Aucune clé trouvée (ni .env, ni fichier). Tentative ADC...");
                admin.initializeApp({ projectId: PROJECT_ID });
            }
        }

        const db = admin.firestore();

        // 2. Récupération des briques en attente
        console.log("🧱 Recherche de briques en attente de synchronisation...");
        const pendingRef = db.collection("pending_sync").where("status", "==", "pending");
        const snapshot = await pendingRef.get();

        if (snapshot.empty) {
            console.log("✅ Aucune brique en attente.");
            return;
        }

        if (!fs.existsSync(BRICKS_DIR)) {
            fs.mkdirSync(BRICKS_DIR, { recursive: true });
        }

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const dateStr = data.createdAt ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const safeTitle = data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filename = `${dateStr}_${safeTitle}.md`;
            const filePath = path.join(BRICKS_DIR, filename);

            // Construction du contenu Markdown NIV
            const content = `---
title: "${data.title}"
date: ${dateStr}
source: Telegram/NIV
tags: ${JSON.stringify(data.tags || [])}
substance_id: ${data.brickId}
---

# 🧱 ${data.title}

${data.content}

---
*Généré par Antigravity Brain (Vulture Sync)*
`;

            fs.writeFileSync(filePath, content);
            console.log(`- Créé locally: ${filename}`);

            // Marquage comme synchronisé
            await doc.ref.update({ status: "synced", syncedAt: admin.firestore.FieldValue.serverTimestamp() });
        }

        // 3. GitHub Sync (Auto-Commit)
        console.log("🐙 Synchronisation GitHub...");
        try {
            execSync("git add .", { cwd: path.join(BRICKS_DIR, "..") });
            execSync(`git commit -m "Vulture Sync: ${snapshot.size} nouvelles briques de substance"`, { cwd: path.join(BRICKS_DIR, "..") });
            execSync("git push", { cwd: path.join(BRICKS_DIR, "..") });
            console.log("✅ Push GitHub réussi.");
        } catch (gitError: any) {
            console.warn("⚠️ Échec Git (peut-être rien à committer ou pas de remote) :", gitError.message);
        }

    } catch (error: any) {
        console.error("❌ Erreur critique :", error.message);
        console.log("\n💡 CONSEIL : Assure-toi que serviceAccountKey.json est à la racine du projet.");
    }
}

syncVulture();

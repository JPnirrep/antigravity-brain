import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config({ path: path.join(__dirname, "../.env") });

// Initialisation Firebase
if (admin.apps.length === 0) {
    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (envKey) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(envKey)),
            projectId: "antigravity-brain-79792"
        });
    }
}

const db = admin.firestore();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Calcul d'embedding via OpenRouter (frugal)
 */
async function getEmbedding(text: string): Promise<number[]> {
    try {
        const response = await axios.post("https://openrouter.ai/api/v1/embeddings", {
            model: "openai/text-embedding-3-small",
            input: text.slice(0, 8000) // Sécurité limite
        }, {
            headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}` }
        });
        return response.data.data[0].embedding;
    } catch (error: any) {
        console.error("❌ Erreur Embedding:", error.message);
        return [];
    }
}

/**
 * Scan récursif des fichiers Markdown
 */
function getMarkdownFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getMarkdownFiles(filePath, fileList);
        } else if (filePath.endsWith(".md")) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

/**
 * Extraction simple du titre et contenu
 */
function parseMarkdown(filePath: string): { title: string, content: string, tags: string[] } {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    let title = path.basename(filePath, ".md");
    
    // Essayer de trouver un H1
    const h1Match = content.match(/^#\s+(.*)/m);
    if (h1Match) title = h1Match[1].trim();

    // Tags basiques basés sur le dossier ou le contenu
    const tags = [path.basename(path.dirname(filePath))];
    if (content.includes("workflow")) tags.push("workflow");
    if (content.includes("KLEIA")) tags.push("kleia");

    return { title, content, tags };
}

async function seedAll() {
    console.log("🌱 [VULTURE SEEDER] Lancement de l'indexation globale...");

    const rootDir = path.join(__dirname, "../../../"); // Remonte au root du projet
    const targetDirs = [
        path.join(rootDir, "knowledge"),
        path.join(rootDir, "bricks")
    ];

    let totalIndexed = 0;

    for (const dir of targetDirs) {
        if (!fs.existsSync(dir)) {
            console.warn(`⚠️ Dossier non trouvé: ${dir}`);
            continue;
        }

        console.log(`📂 Scanning: ${dir}`);
        const files = getMarkdownFiles(dir);

        for (const file of files) {
            const { title, content, tags } = parseMarkdown(file);
            console.log(`🧱 Indexation: ${title}...`);

            const embedding = await getEmbedding(content);
            if (embedding.length === 0) continue;

            await db.collection("bricks").add({
                title,
                content,
                tags,
                embedding: admin.firestore.FieldValue.vector(embedding),
                source: "workspace",
                filePath: path.relative(rootDir, file),
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            totalIndexed++;
        }
    }

    console.log(`\n🚀 [TERMINÉ] ${totalIndexed} briques de savoir indexées.`);
}

seedAll().catch(e => console.error("❌ Erreur Fatale:", e));

const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: "antigravity-brain-79792"
    });
}

const db = admin.firestore();

async function getLastExchange() {
    const chatId = "6722033496";
    console.log(`Extraction des messages pour le chat ${chatId}...`);

    try {
        const snapshot = await db.collection("chats")
            .doc(chatId)
            .collection("messages")
            .orderBy("timestamp", "desc")
            .limit(2)
            .get();

        if (snapshot.empty) {
            console.log("Aucun message trouvé.");
            return;
        }

        let messages = [];
        snapshot.forEach(doc => {
            messages.push(doc.data());
        });

        // Du plus ancien au plus récent
        messages.reverse().forEach(msg => {
            const date = msg.timestamp ? msg.timestamp.toDate().toLocaleString() : "N/A";
            console.log(`\n--- [${date}] ${msg.role.toUpperCase()} ---`);
            console.log(msg.content);
        });
    } catch (error) {
        console.error("Erreur Firestore :", error);
    }
}

getLastExchange();

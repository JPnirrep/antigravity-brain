import axios from "axios";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export class AudioService {
    private static TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

    /**
     * Récupère un fichier audio depuis Telegram, le transcrit via Parakeet V3 et retourne le texte.
     */
    static async transcribeTelegramAudio(fileId: string): Promise<string> {
        try {
            logger.info(`[AUDIO] Starting transcription for fileId: ${fileId}`);

            // 1. Obtenir le chemin du fichier via Telegram API
            const fileResponse = await axios.get(`https://api.telegram.org/bot${this.TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
            const filePath = fileResponse.data.result.file_path;
            const downloadUrl = `https://api.telegram.org/file/bot${this.TELEGRAM_TOKEN}/${filePath}`;

            // 2. Télécharger le fichier localement (temp)
            const tempFilePath = path.join(os.tmpdir(), `audio_${fileId}${path.extname(filePath)}`);
            const writer = fs.createWriteStream(tempFilePath);
            const response = await axios({
                url: downloadUrl,
                method: 'GET',
                responseType: 'stream'
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            logger.info(`[AUDIO] File downloaded to ${tempFilePath}`);

            // 3. Envoyer à OpenRouter (Gemini 2.0 Flash)
            const audioBuffer = fs.readFileSync(tempFilePath);
            const extension = path.extname(tempFilePath).replace(".", "") || "wav";
            const transcription = await this.callOpenRouterAudio(audioBuffer, extension);

            // Nettoyage
            fs.unlinkSync(tempFilePath);

            return transcription;
        } catch (error: any) {
            logger.error("[AUDIO] Transcription failed", error.message);
            throw new Error(`Échec de la transcription audio: ${error.message}`);
        }
    }

    private static async callOpenRouterAudio(audioBuffer: Buffer, format: string): Promise<string> {
        const openrouterKey = process.env.OPENROUTER_API_KEY;
        // Gemini 2.0 Flash est le plus robuste pour le multimodal sur OpenRouter actuellement
        const modelId = "google/gemini-2.0-flash-001";
        const url = "https://openrouter.ai/api/v1/chat/completions";

        try {
            const base64Audio = audioBuffer.toString("base64");

            const response = await axios.post(url, {
                model: modelId,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Transcris exactement ce message audio en texte, sans aucun commentaire ajouté."
                            },
                            {
                                type: "input_audio",
                                input_audio: {
                                    data: base64Audio,
                                    format: format // Utilisation du format dynamique (oga, mp3, wav, etc.)
                                }
                            }
                        ]
                    }
                ]
            }, {
                headers: {
                    "Authorization": `Bearer ${openrouterKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://github.com/JPnirrep/antigravity-brain",
                    "X-Title": "Antigravity Brain Bot"
                },
                timeout: 45000
            });

            return response.data.choices[0]?.message?.content?.trim() || "Désolé, transcription vide.";
        } catch (error: any) {
            logger.error("[AUDIO] OpenRouter API Error", error.response?.data || error.message);
            return "Désolé, je n'ai pas pu transcrire ton message audio via OpenRouter.";
        }
    }
}

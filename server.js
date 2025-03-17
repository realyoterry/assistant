require("dotenv").config();

const app = require("express")();
const cors = require("cors");
const path = require('path');
const genAI = new (require("@google/generative-ai")).GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const system = { role: "user", parts: [{ text: "You are a casual chatbot. Keep responses short and simple, like a normal chat conversation." }] };

let memory = [system];

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", async (req, res) => {
    const { message } = req.body;

    memory.push({ role: "user", parts: [{ text: message }] });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({
            contents: memory,
            generationConfig: { maxOutputTokens: 50 },
        });

        const response = result.response.text();

        memory.push({ role: "assistant", parts: [{ text: response }] });

        if (memory.length > 21) {
            memory = [system, ...memory.slice(-20)];
        }

        res.json({ reply: response });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "AI response failed" });
    }
});

app.listen(3000);

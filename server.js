const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    const { provider, model, prompt, apiKey } = req.body;
    if (!apiKey) return res.json({ reply: '⚠️ Thiếu API Key!' });

    try {
        let apiRes, data, reply;
        if (provider === 'gemini') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            apiRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            data = await apiRes.json();
            reply = data.candidates?.[0]?.content?.parts?.[0]?.text || `Lỗi Gemini: ${JSON.stringify(data.error || data)}`;
        } else {
            const endpoints = {
                grok: 'https://api.x.ai/v1/chat/completions',
                openai: 'https://api.openai.com/v1/chat/completions',
                deepseek: 'https://api.deepseek.com/chat/completions',
                groq: 'https://api.groq.com/openai/v1/chat/completions'
            };
            const endpoint = endpoints[provider];
            if (!endpoint) return res.json({ reply: 'Provider không hợp lệ.' });

            apiRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] })
            });
            data = await apiRes.json();
            reply = data.choices?.[0]?.message?.content || `Lỗi API (${provider}): ${JSON.stringify(data.error || data)}`;
        }
        res.json({ reply });
    } catch (err) {
        res.json({ reply: `Lỗi fetch server: ${err.message}` });
    }
});

app.listen(3000, () => console.log('🚀 Proxy server chạy tại http://localhost:3000'));

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();
const auth = require("../middlewares/auth")
import removeMarkdown from "remove-markdown"

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

if (!DEEPSEEK_API_KEY) {
    console.error("DEEPSEEK_API_KEY is not set in environment variables.");
}

router.post('/deepseek-chat', auth,async (req, res) => {
    const userQuestion = req.body.question;
    const user = req.user.username

    if (!userQuestion) {
        return res.status(400).json({ error: '请求体中缺少问题 (question)' });
    }

    if (!DEEPSEEK_API_KEY) {
        return res.status(500).json({ error: '服务器配置错误：DeepSeek API Key 未设置' });
    }

    try {
        const response = await axios.post(DEEPSEEK_API_URL, {
            model: "deepseek-chat",
            messages: [
                { role: "system", content:`
                    你是一个AI智能小助手，请用简短的中文回答用户的问题。
                    请注意以下几点：
                    1. 当前项目叫做"「CCB聊天软件」"，作者名字是"「空佬的z字帽杀」"。
                    2. 当别人问起作者相关消息时，你给他推荐GitHub链接：https://github.com/Marco-Reus-11/Coffee-Chat-Bar。
                    3. 你最喜欢玩三国杀，尤其是选到界徐盛用古锭刀酒杀“冲儿”。
                    4.如果别人不提及当前项目的话，请你不要随意重复上述内容！
                    5.当前访问项目的用户是${user}
                    6.请不要返回 Markdown 或任何格式化符号，直接用纯文本回答。
                    ` },
                { role: "user", content: userQuestion }
            ],
            temperature: 0.7,
            max_tokens: 30,
            stream: false
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            }
        });

        const aiAnswer = response.data.choices[0]?.message?.content || "抱歉，我暂时无法回答您的问题。";
        const plainTextAnswer = removeMarkdown(aiAnswer)

        res.json({ answer: plainTextAnswer });
    } catch (error) {
        console.error('调用 DeepSeek API 失败:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: '从 DeepSeek AI 获取响应失败' });
    }
});

module.exports = router;
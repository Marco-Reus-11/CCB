const express = require('express')
const router = express.Router()
// 确保您的 Users 模型路径正确
const Users = require("../models/Users") 

// 假设您还有一个 Messages 模型用于删除聊天记录
// const Messages = require("../models/Messages")

// ---------------------------------------------
// GET /getUsers：获取所有用户列表
// ---------------------------------------------
router.get('/getUsers', async (req, res) => {
    try {
        // 修复：直接使用 await 等待 Promise 返回结果
        const users = await Users.find().select('-Password -__v');
        
        // 成功返回数据
        res.json({
            message: '用户列表获取成功',
            users: users
        });

    } catch (err) {
        // 捕获错误并返回 500
        console.error("获取用户列表失败", err);
        res.status(500).json({ message: "服务器内部错误" });
    }
});

// ---------------------------------------------
// POST /delUsers：根据 uID 删除指定用户
// ---------------------------------------------
router.post('/delUsers', async (req, res) => {
    // 假设前端在请求体 (req.body) 中发送要删除的用户的 uID
    const { uID } = req.body; 

    if (!uID) {
        return res.status(400).json({ message: '请提供要删除的用户ID (uID)' });
    }

    try {
        // 1. 删除用户记录
        const deletedUser = await Users.findOneAndDelete({ uID: uID });

        if (!deletedUser) {
            // 如果 result 为 null，表示没有找到匹配的 uID
            return res.status(404).json({ message: `未找到 uID 为 ${uID} 的用户` });
        }
        
        // 2. ❗ 关键：删除该用户的所有聊天记录 (如果 Messages 模型可用的话)
        /* await Messages.deleteMany({ 
            $or: [{ from: uID }, { to: uID }] 
        });
        */

        res.status(200).json({ 
            message: `用户 ${deletedUser.uName} (uID: ${uID}) 已成功删除`,
            deletedUser: deletedUser // 返回被删除的用户信息
        });

    } catch (err) {
        console.error(`删除用户 ${uID} 失败:`, err);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

module.exports = router
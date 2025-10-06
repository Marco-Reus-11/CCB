const express = require('express')
const router = express.Router()
const Users = require("../models/Users") 
// const auth = require('../middlewares/auth')

// 假设您还需要引入 Messages 模型进行消息删除
// const Messages = require("../models/Messages")

router.get('/getUsers', async (req, res) => {
    try {
        const users = await Users.find().select('-Password -__v');
        
        // 关键调试行：打印查询结果的长度和内容
        console.log(`[DEBUG] getUsers 找到的用户数量: ${users.length}`); 
        if (users.length === 0) {
            console.log("[DEBUG] 警告：Users.find() 返回空数组！");
        } else {
            console.log("[DEBUG] 部分用户数据:", users.slice(0, 2)); // 只打印前 2 条
        }
        
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
// POST /delUsers：完整的级联删除逻辑
// ---------------------------------------------
router.post('/delUsers', async (req, res) => {
    const { uID } = req.body; 

    if (!uID) {
        return res.status(400).json({ message: '请提供要删除的用户ID (uID)' });
    }

    try {
        // 1. 删除目标用户本身的记录
        const deletedUser = await Users.findOneAndDelete({ uID: uID });

        if (!deletedUser) {
            return res.status(404).json({ message: `未找到 uID 为 ${uID} 的用户` });
        }
        
        // 2. ❗ 关键修复：从所有其他用户的好友列表中移除被删除的用户
        // 使用 $pull 操作符从所有文档的 Friends 数组中拉出匹配的 uID
        await Users.updateMany(
            {}, // 匹配所有用户
            { $pull: { Friends: { uID: uID } } } // 从 Friends 数组中移除 uID 等于目标 uID 的项
        );

        // 3. 删除该用户的所有聊天记录 (请取消注释并确保 Messages 模型已引入)
        /* await Messages.deleteMany({ 
             $or: [
                 { from: uID }, 
                 { to: uID }
             ] 
        });
        */

        res.status(200).json({ 
            message: `用户 ${deletedUser.uName} (uID: ${uID}) 及其相关的好友关系已成功删除`,
            deletedUser: deletedUser
        });

    } catch (err) {
        console.error(`删除用户 ${uID} 失败:`, err);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

module.exports = router
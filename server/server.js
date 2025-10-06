require('dotenv').config();
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const path = require('path');

const connectDB = require('./config/db')
const group_msg = require('./sockets/room')
const private_msg = require("./sockets/chat")
const roomRouter = require('./routes/room')
const userRouter = require('./routes/user')
const chatRouter = require('./routes/chat')
const uploadRouter = require('./routes/upload')
const dsRouter = require("./routes/ds")
const adminRouter = require("./routes/admin")
const auth = require("./middlewares/auth")

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } }) 

connectDB(); 

app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ----------------- API 路由 -----------------
app.use('/room', roomRouter)
app.use('/user', userRouter)
app.use("/chat",chatRouter)
app.use("/api",dsRouter) 
app.use("/admin",adminRouter) 
app.use("/upload",uploadRouter) 

app.get("/user/info", auth, async (req, res) => {
    res.json({ user: req.user })
})

// ----------------- Vue 前端托管与回退 -----------------
const frontendPath = path.join(__dirname, '../ccb/dist')

app.use(express.static(frontendPath))
app.use('/*path', (req, res) => {
    if (!req.path.includes('.')) {
        res.sendFile(path.join(frontendPath, 'index.html'))
    } else {
        res.status(404).send("File Not Found");
    }
})

// ----------------- Socket.IO -----------------
io.on("connection",(socket)=>{
    private_msg(socket,io)
    group_msg(socket,io)
})

server.listen(3000, () => {
    console.log('服务器正在运行在 http://localhost:3000');
});
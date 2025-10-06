import { createRouter, createWebHistory } from 'vue-router'
// 引入用于解析 JWT 载荷的库

import * as jwt_decode from 'jwt-decode'

import Login from '../components/Login.vue'
import ChatView from '../components/ChatView.vue'
import ChatBox from '../components/ChatBox.vue'
import ChatHall from '../views/ChatHall.vue'
import ChatRoom from '../views/ChatRoom.vue'
import Content from '../views/Content.vue'
import Assistant from '../views/Assistant.vue'
import File from '../components/File.vue'
import Admin from '../views/Admin.vue'

// ** 配置：唯一允许访问 /admin 的用户 ID **
const ADMIN_UID = "1759658414421"; 

const routes = [
    { 
        path: '/',
        component: ChatView, 
        children:[
            { path:"/chatdetail", component: Content },
            { path:"/chat-ai", component: Assistant }
        ],
        meta:{requiresAuth:true}
    },
    { 
        path: '/chatbox', 
        component: ChatBox, 
        children:[
            { path:"", redirect:"/chatbox/chathall" },
            { path:"chathall", component:ChatHall },
            { path:"chatroom", component:ChatRoom }
        ],
        meta:{requiresAuth:true}
    },
    {
        path:"/login",
        component:Login
    },
    {
        path:"/test",
        component:File
    },
    {
        path:"/admin",
        component:Admin,
        meta:{requiresAuth:true}
    },
    {
        path: '/:catchAll(.*)', // 通配符路由
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;
    
    // 1. 通用登录检查：需要认证但没有登录
    if (to.meta.requiresAuth && !isLoggedIn) {
        next("/login");
        return;
    }

    // 2. **管理员权限检查**：只针对 /admin 路由
    if (to.path === '/admin') {
        try {
            // ** 关键修复：当使用 * as 导入时，实际的函数可能挂载在 .default 属性上，但对于 jwt-decode 通常可以直接调用导入的对象 **
            // 确保调用的是解码函数
            const decodeFunction = typeof jwt_decode === 'function' ? jwt_decode : jwt_decode.default;
            
            const decoded = decodeFunction(token); 
            const userUID = String(decoded.uid); 

            if (userUID === ADMIN_UID) {
                next();
                alert("管理员用户访问 /admin 页面。");
            } else {
                console.warn(`非管理员用户 ${userUID} 尝试访问管理员页面。`);
                alert("您没有权限访问此页面！");
                next("/"); 
            }
        } catch (error) {
            console.error("JWT 解析失败，请重新登录:", error);
            next("/");
        }
        return;
    }

    // 3. 其他所有情况，允许访问
    next();
})

export default router
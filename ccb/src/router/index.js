import { createRouter, createWebHistory } from 'vue-router'
// **注意：已移除对 jwt_decode 的导入，简化身份验证**
// import * as jwt_decode from 'jwt-decode'

// 导入组件
import Login from '../components/Login.vue'
import ChatView from '../components/ChatView.vue'
import ChatBox from '../components/ChatBox.vue'
import ChatHall from '../views/ChatHall.vue'
import ChatRoom from '../views/ChatRoom.vue'
import Content from '../views/Content.vue'
import Assistant from '../views/Assistant.vue'
import File from '../components/File.vue'
import Admin from '../views/Admin.vue'

// ** 配置：唯一允许访问 /admin 的用户 ID (开发阶段暂时不用，但保留注释) **
// const ADMIN_UID = "1759658414421"; 

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
        meta:{requiresAuth:true} // 仍需要登录
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
    // 简化检查：只要 token 存在，就视为已登录
    const isLoggedIn = !!token; 
    
    // --- 1. 登录检查（针对所有 requiresAuth 路由，包括 /admin） ---
    if (to.meta.requiresAuth && !isLoggedIn) {
        // 需要认证但没有登录（没有 Token）
        console.warn(`需要登录才能访问 ${to.path}，跳转到 /login。`);
        next("/login");
        return;
    }

    // --- 2. 已登录用户访问 /login 时的处理 ---
    if (to.path === '/login' && isLoggedIn) {
        // 用户已登录，访问登录页时，重定向到主页
        console.log(`用户已登录，访问 /login 时重定向到 /。`);
        next('/');
        return;
    }

    // --- 3. 所有其他情况（已登录且访问受保护路由，或访问不需要认证的路由）---
    // **注意：已移除复杂的 try...catch 和权限检查**
    next();
})

export default router
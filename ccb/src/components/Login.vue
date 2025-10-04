<template>
  <div class="login-page">
    <!-- 视频背景组件 - 懒加载（延迟挂载） -->
    <Suspense v-if="shouldMountVideo">
      <template #default>
        <component :is="VideoBackground" ref="videoBackground" />
      </template>
      <template #fallback>
        <div class="video-container">
          <div class="loading-placeholder">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        </div>
      </template>
    </Suspense>

    <!-- 登录卡片 - 提前渲染 -->
    <div class="flip-wrapper" :class="{ flipped: isFlipped }">
      <div 
        class="login-box front"
        @mouseenter="onLoginBoxEnter"
        @mouseleave="onLoginBoxLeave"
      >
        <h1 style="text-align: center;">COFFEE CHAT BAR</h1>
        <h2>登录</h2>
        <label for="login-username">用户名</label>
        <input 
          id="login-username" 
          v-model="username" 
          type="text" 
          placeholder="请输入用户名" 
          autocomplete="off"
        />
        <label for="login-password">密码</label>
        <input 
          id="login-password" 
          v-model="password" 
          type="password" 
          placeholder="请输入密码" 
          autocomplete="off"
        />
        <button @click="login">登录</button>
        <div class="flip-link" @click="toggleFlip">还没有账号？点击注册</div>
      </div>
      <div
        class="login-box back"
        @mouseenter="onLoginBoxEnter"
        @mouseleave="onLoginBoxLeave"
      >
        <h1 style="text-align: center;">COFFEE CHAT BAR</h1>
        <h2>注册</h2>
        <label for="register-username">用户名</label>
        <input 
          id="register-username" 
          v-model="regUsername" 
          type="text" 
          placeholder="请输入用户名" 
          autocomplete="off"
        />
        <label for="register-password">密码</label>
        <input 
          id="register-password" 
          v-model="regPassword" 
          type="password" 
          placeholder="请输入密码" 
          autocomplete="off"
        />
        <label for="register-confirm">确认密码</label>
        <input 
          id="register-confirm" 
          v-model="regConfirm" 
          type="password" 
          placeholder="请再次输入密码" 
          autocomplete="off"
        />
        <button @click="register">注册</button>
        <div class="flip-link" @click="toggleFlip">已有账号？返回登录</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import CryptoJS from 'crypto-js'

// 懒加载视频背景组件
const VideoBackground = defineAsyncComponent(() => import('./VideoBackground.vue'))

const videoBackground = ref(null)
const shouldMountVideo = ref(false)
let idleTimer = null

const mountVideo = () => {
  if (!shouldMountVideo.value) shouldMountVideo.value = true
}

onMounted(() => {
  // 1) 优先渲染登录卡片，视频延迟到空闲再挂载
  if ('requestIdleCallback' in window) {
    idleTimer = requestIdleCallback(() => mountVideo(), { timeout: 1200 })
  } else {
    idleTimer = setTimeout(mountVideo, 800)
  }
  // 2) 用户交互立即挂载，保证体验
  const onFirstInteraction = () => {
    mountVideo()
    window.removeEventListener('scroll', onFirstInteraction)
    window.removeEventListener('mousemove', onFirstInteraction)
    window.removeEventListener('touchstart', onFirstInteraction)
    window.removeEventListener('keydown', onFirstInteraction)
  }
  window.addEventListener('scroll', onFirstInteraction, { once: true, passive: true })
  window.addEventListener('mousemove', onFirstInteraction, { once: true })
  window.addEventListener('touchstart', onFirstInteraction, { once: true, passive: true })
  window.addEventListener('keydown', onFirstInteraction, { once: true })
})

onUnmounted(() => {
  if (idleTimer) {
    if ('cancelIdleCallback' in window) {
      cancelIdleCallback(idleTimer)
    } else {
      clearTimeout(idleTimer)
    }
  }
})

const router = useRouter()

// 节流函数
const throttle = (func, delay) => {
  let timeoutId
  let lastExecTime = 0
  return function (...args) {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args)
      lastExecTime = currentTime
    } else {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(this, args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

// 鼠标事件处理函数
const onLoginBoxEnter = throttle(() => {
  if (videoBackground.value) {
    videoBackground.value.onLoginBoxEnter()
  }
}, 100)

const onLoginBoxLeave = throttle(() => {
  if (videoBackground.value) {
    videoBackground.value.onLoginBoxLeave()
  }
}, 100)
const username = ref('')
const password = ref('')
const AES_SECRET_KEY = '20051111and20031230'

//加密
function encryptPassword(text){
  return CryptoJS.AES.encrypt(text,AES_SECRET_KEY).toString()
}

//登录逻辑
const login = async () => {
  if (!username.value || !password.value) {
    alert('请输入用户名和密码')
    return
  }

  try {
    const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/user/login`, {
      username: username.value,
      password: password.value
    })
    localStorage.setItem('token', res.data.token)
    router.push('/')
  } catch (err) {
    console.error('登录失败', err)
    alert('登录失败，请稍后再试')
  }
}



const regUsername = ref('')
const regPassword = ref('')
const regConfirm = ref('')
const isFlipped = ref(false)

const toggleFlip = () => {
  isFlipped.value = !isFlipped.value
}

// 注册逻辑（数据库出错了明天记得改）
const register = async () => {
  if (!regUsername.value || !regPassword.value || !regConfirm.value) {
    alert('请填写完整信息')
    return
  }
  if (regPassword.value !== regConfirm.value) {
    alert('两次密码不一致')
    return
  }

  try {
    const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/user/register`, {
      username: regUsername.value,
      password: regPassword.value
    })
    const message = res.data.message
    alert(message)
    toggleFlip()
  } catch (err) {
  if (err.response && err.response.status === 409) {
    alert(err.response.data.message)
  } else {
    console.error('注册失败', err)
    alert("注册失败，请稍后再试")
  }
}
}
</script>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: "Microsoft Yahei", sans-serif;
}

.login-page {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.video-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: rgb(252, 255, 252);
}

.loading-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #a52a2a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 外层包裹容器 */
.flip-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 440px;
  height: 520px;
  transform-style: preserve-3d;
  transition: transform 0.4s ease;
  transform: translate(-50%, -50%);
  perspective: 1600px;
  z-index: 2;
  -webkit-app-region: no-drag
}

.flipped {
  transform: translate(-50%, -50%) rotateY(180deg);
}

/* 登录和注册卡片的公用样式 */
.login-box {
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 40px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: center;
  backface-visibility: hidden;
  backdrop-filter: blur(8px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
}

.login-box h1{
  position: absolute;
  top: 0;
  width: 100%;
  left: 0;
}


.login-box:hover {
  box-shadow: 0 16px 50px rgba(0, 0, 0, 0.4);
  transform: scale(1.02);
}

.login-box.front {
  transform: rotateY(0deg);
  z-index: 2;
}

.login-box.back {
  transform: rotateY(180deg);
  position: absolute;
  top: 0;
  left: 0;
}


.login-box h2 {
  text-align: center;
  margin: 0;
  padding: 0;
  font-size: 28px;
  font-weight: bold;
}

.login-box label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.login-box input {
  padding: 12px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  width: 100%;
}

.login-box button {
  padding: 14px;
  background-color: rgba(165, 42, 42, 0.85);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 17px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s;
}

.login-box button:hover {
  background-color: rgba(165, 42, 42, 1);
  transform: scale(1.03);
}

.login-box button:active {
  transform: scale(0.98);
}

.flip-link {
  margin-top: 16px;
  text-align: center;
  color: #0066cc;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
  user-select: none;
}
</style>

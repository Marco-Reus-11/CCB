<template>
  <div
    ref="container"
    class="video-container"
    @mouseenter="onContainerEnter"
    @mouseleave="onContainerLeave"
  >
    <canvas ref="canvas" width="1280" height="720"></canvas>
    <video
      ref="video"
      src="https://reus.oss-cn-shenzhen.aliyuncs.com/videos/Walking_girl.mp4"
      muted
      loop
      playsinline
      style="display: none"
      @canplay="onVideoCanPlay"
    ></video>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const video = ref(null)
const canvas = ref(null)
let ctx = null
let animationFrameId = null
let isVideoReady = false

const isInContainer = ref(false)
const isInLoginBox = ref(false)

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

const drawFrame = () => {
  if (video.value && ctx && isVideoReady) {
    ctx.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height)
    animationFrameId = requestAnimationFrame(drawFrame)
  }
}

const playVideo = async () => {
  if (!video.value || !isVideoReady) return
  await video.value.play()
  drawFrame()
}

const pauseVideo = () => {
  if (video.value && !video.value.paused) {
    video.value.pause()
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

const onVideoCanPlay = () => {
  isVideoReady = true
  if (isInContainer.value && !isInLoginBox.value) {
    playVideo()
  }
}

const onContainerEnter = throttle(() => {
  isInContainer.value = true
  if (!isInLoginBox.value && isVideoReady) {
    playVideo()
  }
}, 100)

const onContainerLeave = throttle(() => {
  isInContainer.value = false
  pauseVideo()
}, 100)

// 暴露给父组件的方法
const onLoginBoxEnter = throttle(() => {
  isInLoginBox.value = true
  pauseVideo()
}, 100)

const onLoginBoxLeave = throttle(() => {
  isInLoginBox.value = false
  if (isInContainer.value && isVideoReady) {
    playVideo()
  }
}, 100)

// 暴露方法给父组件
defineExpose({
  onLoginBoxEnter,
  onLoginBoxLeave
})

onMounted(() => {
  ctx = canvas.value.getContext('2d')
})

onUnmounted(() => {
  pauseVideo()
})
</script>

<style scoped>
.video-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: rgb(252, 255, 252);
}

canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0;
}
</style> 
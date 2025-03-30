<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isVisible = computed(() => themeStore.theme === 'dark')

// 画布相关引用
const canvas = ref(null)
const ctx = ref(null)
let animationId = null

// 星星系统配置
const stars = ref([])
const starColors = [
  { r: 255, g: 255, b: 255 }, // 白色
  { r: 240, g: 240, b: 250 }, // 暖白
  { r: 230, g: 230, b: 255 }, // 冷白
]

// 流星系统配置
const meteors = ref([])
const METEOR_CONFIG = {
  spawnInterval: 3,  // 流星生成间隔（毫秒）
  maxMeteors: 8,        // 同时存在最大流星数
  minSpeed: 2,          // 最小移动速度
  maxSpeed: 5,         // 最大移动速度
  trailLength: 35,      // 拖尾最大长度
  fadeRate: 0.015        // 拖尾淡化速度
}

// 工具函数
const random = (min, max) => Math.random() * (max - min) + min
const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

// 增加离屏Canvas引用
const offscreenCanvas = ref(document.createElement('canvas'))
const offscreenCtx = ref(null)
let bgReady = false
// 初始化背景（只需执行一次）
const initBackground = () => {
  if (!offscreenCtx.value) return
  
  // 设置离屏Canvas尺寸
  offscreenCanvas.value.width = window.innerWidth
  offscreenCanvas.value.height = window.innerHeight
  
  // 绘制渐变
  const bgGradient = offscreenCtx.value.createLinearGradient(
    0, offscreenCanvas.value.height,
    0, 0
  )
  bgGradient.addColorStop(0, 'rgba(173, 216, 255, 0.05)')
  bgGradient.addColorStop(0.7, 'rgba(100, 150, 255, 0.15)')
  bgGradient.addColorStop(1, 'rgba(70, 130, 230, 0.2)')
  
  offscreenCtx.value.fillStyle = bgGradient
  offscreenCtx.value.fillRect(
    0, 0, 
    offscreenCanvas.value.width, 
    offscreenCanvas.value.height
  )
  
  bgReady = true
}

// 初始化星星
const initStars = (count = 800) => {
  stars.value = Array.from({ length: count }, () => ({
    x: random(0, window.innerWidth),
    y: random(0, window.innerHeight),
    radius: random(0.5, 1.5),
    alpha: random(0.3, 0.9),
    blink: random(0.005, 0.015) * (Math.random() > 0.5 ? 1 : -1)
  }))
}

// 创建新流星
const createMeteor = () => {
  const startX = random(window.innerWidth * 0.1, window.innerWidth * 0.9)
  const starty = random(window.innerHeight * 0.1, window.innerHeight * 0.8)
  return {
    x: startX,
    y: starty, // 从屏幕上方开始
    speed: random(METEOR_CONFIG.minSpeed, METEOR_CONFIG.maxSpeed),
    trail: [],
    angle: random(-Math.PI / 6, -Math.PI / 12), // -30度到30度之间的下落角度
    alpha: 1,
    color: {
      head: { r: 255, g: 255, b: 255 },  
      tail: { r: 138, g: 180, b: 248 } // 增强蓝色饱和度
    }
  }
}

// 更新流星系统
const updateMeteors = (deltaTime) => {    
  // 添加新流星
  if (meteors.value.length < METEOR_CONFIG.maxMeteors && 
      performance.now() % METEOR_CONFIG.spawnInterval < deltaTime) {
    meteors.value.push(createMeteor())
  }

  // 更新现有流星
  meteors.value = meteors.value.filter(meteor => {
    // 更新位置
    meteor.x += Math.sin(meteor.angle) * meteor.speed
    meteor.y += Math.cos(meteor.angle) * meteor.speed
    
    // 记录轨迹
    meteor.trail.unshift({ x: meteor.x, y: meteor.y, alpha: 1 })
    if (meteor.trail.length > METEOR_CONFIG.trailLength) meteor.trail.pop()
    
    // 更新拖尾透明度
    meteor.trail.forEach((point, index) => {
      point.alpha = clamp(1 - (index / METEOR_CONFIG.trailLength), 0, 1)
    })
    
    // 更新自身透明度
    //meteor.alpha -= METEOR_CONFIG.fadeRate
    
    // 移除超出屏幕或完全透明的流星
    return meteor.alpha > 0 && 
           meteor.y < window.innerHeight + 100 && 
           meteor.x > 0 && 
           meteor.x < window.innerWidth + 100
  })
}

// 绘制流星
const drawMeteors = () => {
  if (!ctx.value) return
  
  // 批量绘制优化
  ctx.value.save()
  ctx.value.lineCap = 'round'
  
  meteors.value.forEach(meteor => {
    // 头部简化
    ctx.value.beginPath()
    ctx.value.arc(meteor.x, meteor.y, 2, 0, Math.PI * 2)
    ctx.value.fillStyle = `rgba(255, 255, 255, ${meteor.alpha})`
    ctx.value.fill()
    
    // 拖尾批量绘制
    ctx.value.beginPath()
    meteor.trail.forEach((point, index) => {
      const alpha = point.alpha * (1 - index / meteor.trail.length)
      ctx.value.lineWidth = 3 * (1 - index / meteor.trail.length)
      
      if (index === 0) {
        ctx.value.moveTo(point.x, point.y)
      } else {
        ctx.value.lineTo(point.x, point.y)
      }
      
      // 关键点标记（每5个点设置一次样式）
      if (index % 5 === 0) {
        ctx.value.strokeStyle = `rgba(150, 200, 255, ${alpha})`
        ctx.value.stroke()
        ctx.value.beginPath()
        ctx.value.moveTo(point.x, point.y)
      }
    })
    ctx.value.stroke()
  })
  
  ctx.value.restore()
}


// 更新星星
const updateStars = () => {
  stars.value.forEach(star => {
    star.alpha += star.blink
    if (star.alpha > 0.9 || star.alpha < 0.3) star.blink *= -1
    
    ctx.value.beginPath()
    ctx.value.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
    ctx.value.fillStyle = `rgba(255, 255, 255, ${star.alpha})`
    ctx.value.fill()
  })
}

// 动画循环
let lastTime = 0
const animate = (timestamp) => {
    if (!ctx.value || !isVisible.value) return
  
  // 使用缓存背景
  if(bgReady) {
    ctx.value.drawImage(
      offscreenCanvas.value, 
      0, 0,
      canvas.value.width,
      canvas.value.height
    )
  }
  // 使用差异混合模式清除动态元素
  ctx.value.globalCompositeOperation = 'xor'
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  // 绘制动态元素
  ctx.value.globalCompositeOperation = 'lighter'
  updateStars()
  updateMeteors(timestamp)
  drawMeteors()
  animationId = requestAnimationFrame(animate)
}

// 画布调整
const resizeCanvas = () => {
  if (canvas.value) {
    canvas.value.width = window.innerWidth
    canvas.value.height = window.innerHeight
    // 离屏Canvas跟随resize
    offscreenCanvas.value.width = window.innerWidth
    offscreenCanvas.value.height = window.innerHeight
    initBackground() // 重新生成背景
    initStars()
  }
}

// 响应式控制
watch(isVisible, (newVal) => {
  if (newVal) {
    initStars()
    animationId = requestAnimationFrame(animate)
  } else {
    cancelAnimationFrame(animationId)
    ctx.value?.clearRect(0, 0, canvas.value.width, canvas.value.height)
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext('2d')
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
  }
})

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext('2d')
    // 初始化离屏Canvas
    offscreenCtx.value = offscreenCanvas.value.getContext('2d')
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
  }
})
</script>

<template>
  <canvas ref="canvas" class="night-sky"></canvas>
</template>

<style scoped>
.night-sky {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9;
  background: linear-gradient(
    to top, 
    rgba(70, 130, 230, 0.1), 
    rgba(173, 216, 255, 0.01)
  );
  mix-blend-mode: plus-lighter;
}
</style>

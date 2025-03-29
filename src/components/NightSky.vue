<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 控制组件显示
const isVisible = computed(() => themeStore.theme === 'dark')

// 星星数组
const stars = ref([])

// 画布引用
const canvas = ref(null)
// 画布上下文
const ctx = ref(null)
// 动画帧ID
let animationId = null

// 星星颜色
const starColors = [
    { r: 255, g: 255, b: 255 }, // 白色
    { r: 255, g: 255, b: 255 }, // 白色
    { r: 255, g: 255, b: 255 }, // 白色
    { r: 255, g: 255, b: 240 }, // 暖白
    { r: 240, g: 240, b: 255 }, // 冷白
    { r: 255, g: 223, b: 149 }, // 金黄色
    { r: 195, g: 214, b: 255 }, // 淡蓝色
]

// 生成随机数
const random = (min, max) => Math.random() * (max - min) + min

// 初始化星星
const initStars = (count = 300) => {
    const starsArray = []
    for (let i = 0; i < count; i++) {
        const colorIndex = Math.floor(random(0, starColors.length))
        const color = starColors[colorIndex]
        const radius = random(0.3, 1.8)

        starsArray.push({
            x: random(0, window.innerWidth),
            y: random(0, window.innerHeight),
            radius,
            baseRadius: radius,
            alpha: random(0.4, 0.9),
            color,
            blinkingRate: random(0.001, 0.008),
            blinkingDirection: Math.random() > 0.5 ? 1 : -1,
            pulsatingSpeed: random(0.005, 0.02),
            pulsatingDirection: Math.random() > 0.5 ? 1 : -1,
            twinkle: Math.random() > 0.6
        })
    }
    stars.value = starsArray
}

// 更新和绘制星星
const updateStars = (deltaTime) => {
    stars.value.forEach(star => {
        star.alpha += star.blinkingRate * star.blinkingDirection

        if (star.alpha >= 0.9) {
            star.alpha = 0.9
            star.blinkingDirection = -1
        } else if (star.alpha <= 0.4) {
            star.alpha = 0.4
            star.blinkingDirection = 1
        }

        if (star.twinkle) {
            star.radius += star.pulsatingSpeed * star.pulsatingDirection * deltaTime * 0.05

            if (star.radius >= star.baseRadius * 1.3) {
                star.radius = star.baseRadius * 1.3
                star.pulsatingDirection = -1
            } else if (star.radius <= star.baseRadius * 0.7) {
                star.radius = star.baseRadius * 0.7
                star.pulsatingDirection = 1
            }
        }

        if (ctx.value) {
            const { r, g, b } = star.color

            const glow = ctx.value.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, star.radius * 2
            )

            glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${star.alpha})`)
            glow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${star.alpha * 0.3})`)
            glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

            ctx.value.beginPath()
            ctx.value.arc(star.x, star.y, star.radius * 2, 0, Math.PI * 2)
            ctx.value.fillStyle = glow
            ctx.value.fill()

            ctx.value.beginPath()
            ctx.value.arc(star.x, star.y, star.radius * 0.5, 0, Math.PI * 2)
            ctx.value.fillStyle = `rgba(${r}, ${g}, ${b}, ${star.alpha * 1.2})`
            ctx.value.fill()
        }
    })
}

// 调整画布大小
const resizeCanvas = () => {
    if (canvas.value) {
        canvas.value.width = window.innerWidth
        canvas.value.height = window.innerHeight
        initStars()
    }
}

// 动画循环
let lastTime = 0
const animate = (timestamp) => {
    if (!ctx.value || !isVisible.value) return

    const deltaTime = timestamp - (lastTime || timestamp)
    lastTime = timestamp

    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)

    updateStars(deltaTime)

    animationId = requestAnimationFrame(animate)
}

// 监听主题变化
watch(isVisible, (newValue) => {
    if (newValue) {
        if (!animationId && canvas.value) {
            initStars()
            animationId = requestAnimationFrame(animate)
        }
    } else {
        if (animationId) {
            cancelAnimationFrame(animationId)
            animationId = null
        }
        if (ctx.value && canvas.value) {
            ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
        }
    }
}, { immediate: true })

// 组件挂载时
onMounted(() => {
    if (canvas.value) {
        ctx.value = canvas.value.getContext('2d')
        resizeCanvas()

        if (isVisible.value) {
            initStars()
            animationId = requestAnimationFrame(animate)
        }

        window.addEventListener('resize', resizeCanvas)
    }
})

// 组件卸载时
onUnmounted(() => {
    if (animationId) {
        cancelAnimationFrame(animationId)
    }
    window.removeEventListener('resize', resizeCanvas)
})
</script>

<template>
    <canvas ref="canvas" class="night-sky-canvas" v-show="isVisible">
    </canvas>
</template>

<style scoped>
.night-sky-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
}
</style>
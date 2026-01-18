<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useThemeStore } from "@/stores/theme";

const themeStore = useThemeStore();

// 控制组件显示
const isVisible = computed(() => themeStore.theme === "dark");

// 星星数组
const stars = ref([]);

// 画布引用
const canvas = ref(null);
// 画布上下文
const ctx = ref(null);
// 动画帧ID
let animationId = null;

// 星星颜色
const starColors = [
  { r: 255, g: 255, b: 255 }, // 纯白
  { r: 255, g: 240, b: 240 }, // 暖白
  { r: 240, g: 240, b: 255 }, // 冷白
  { r: 255, g: 223, b: 149 }, // 金黄
  { r: 195, g: 214, b: 255 }, // 淡蓝
];

// 流星系统配置
const meteors = ref([]);
const METEOR_CONFIG = {
  spawnInterval: 800, // 缩短生成间隔，使流星出现更频繁
  maxMeteors: 20, // 保持当前最大流星数
  minSpeed: 0.05, // 减慢最小速度
  maxSpeed: 0.09, // 减慢最大速度
  minLength: 200, // 增加最小长度
  maxLength: 300, // 保持最大长度
  minWidth: 2.5, // 保持当前宽度
  maxWidth: 4, // 保持当前宽度
  trailLength: 150, // 保持当前拖尾长度
  fadeRate: 0.0025, // 进一步减慢淡化速度，使流星持续更长时间
  minBrightness: 0.6, // 保持当前最小亮度
  maxBrightness: 0.9, // 保持当前最大亮度
};

// 生成随机数
const random = (min, max) => Math.random() * (max - min) + min;

// 初始化星星
const initStars = (count = 600) => {
  stars.value = Array.from({ length: count }, () => {
    const colorIndex = Math.floor(random(0, starColors.length));
    const color = starColors[colorIndex];
    const radius = random(0.3, 1.8);

    return {
      x: random(0, window.innerWidth),
      y: random(0, window.innerHeight),
      radius,
      baseRadius: radius,
      alpha: random(0.4, 0.9),
      color,
      blinkingRate: random(0.00008, 0.0005), // 进一步减慢闪烁速度
      blinkingDirection: Math.random() > 0.5 ? 1 : -1,
      pulsatingSpeed: random(0.0003, 0.0015), // 进一步减慢脉动速度
      pulsatingDirection: Math.random() > 0.5 ? 1 : -1,
      twinkle: Math.random() > 0.6,
    };
  });
};

// 创建新流星
const createMeteor = () => {
  const width = random(METEOR_CONFIG.minWidth, METEOR_CONFIG.maxWidth);
  const length = random(METEOR_CONFIG.minLength, METEOR_CONFIG.maxLength);
  const brightness = random(
    METEOR_CONFIG.minBrightness,
    METEOR_CONFIG.maxBrightness
  );

  // 平衡左右两侧和顶部的流星生成概率
  const randomValue = Math.floor(random(0, 100));
  let edge;
  if (randomValue < 50) {
    edge = 0; // 顶部 50%
  } else if (randomValue < 75) {
    edge = 1; // 左侧 25%
  } else {
    edge = 2; // 右侧 25%
  }

  let startX, startY, angle;

  switch (edge) {
    case 0: // 顶部边缘
      startX = random(-50, window.innerWidth + 50);
      startY = -30; // 保证在屏幕顶部外

      // 根据x位置调整角度，使其看起来更自然
      if (startX < window.innerWidth * 0.3) {
        // 左侧上方
        angle = random(Math.PI / 6, Math.PI / 3); // 30-60度
      } else if (startX > window.innerWidth * 0.7) {
        // 右侧上方
        angle = random((Math.PI / 3) * 2, (Math.PI / 6) * 5); // 120-150度
      } else {
        // 中间上方
        angle = random(Math.PI / 4, Math.PI / 2.5); // 45-72度
      }
      break;

    case 1: // 左侧边缘
      startX = -30; // 保证在屏幕左侧外
      startY = random(-50, window.innerHeight * 0.7);
      angle = random(Math.PI / 8, Math.PI / 3); // 22.5-60度，向右下方移动
      break;

    case 2: // 右侧边缘
      startX = window.innerWidth + 30; // 保证在屏幕右侧外
      startY = random(-50, window.innerHeight * 0.7);
      angle = random((Math.PI / 3) * 2, Math.PI - Math.PI / 8); // 120-157.5度，向左下方移动
      break;
  }

  return {
    x: startX,
    y: startY,
    width,
    length,
    speed: random(METEOR_CONFIG.minSpeed, METEOR_CONFIG.maxSpeed),
    angle,
    brightness,
    trail: [],
    alpha: 1,
    color: {
      head: { r: 255, g: 255, b: 255 },
      tail: { r: 175, g: 135, b: 255 }, // 紫色尾迹
    },
  };
};

// 更新流星系统
const updateMeteors = (deltaTime) => {
  const now = performance.now();

  // 控制流星生成
  if (
    meteors.value.length < METEOR_CONFIG.maxMeteors &&
    (lastMeteorSpawn === 0 ||
      now - lastMeteorSpawn > METEOR_CONFIG.spawnInterval)
  ) {
    meteors.value.push(createMeteor());
    lastMeteorSpawn = now;
  }

  // 更新现有流星
  meteors.value = meteors.value.filter((meteor) => {
    // 计算移动距离，使用较小的deltaTime避免运动过快
    const adjustedDelta = Math.min(deltaTime, 30);
    const dx = Math.cos(meteor.angle) * meteor.speed * adjustedDelta;
    const dy = Math.sin(meteor.angle) * meteor.speed * adjustedDelta;
    meteor.x += dx;
    meteor.y += dy;

    // 记录轨迹点
    meteor.trail.unshift({ x: meteor.x, y: meteor.y, alpha: meteor.alpha });
    if (meteor.trail.length > METEOR_CONFIG.trailLength) {
      meteor.trail.pop();
    }

    // 更新轨迹点透明度
    meteor.trail.forEach((point, index) => {
      point.alpha = Math.max(
        0,
        meteor.alpha * (1 - index / METEOR_CONFIG.trailLength)
      );
    });

    // 渐隐效果，减慢淡化速度
    meteor.alpha -= METEOR_CONFIG.fadeRate;

    // 移除条件：完全透明或离开屏幕
    return (
      meteor.alpha > 0 &&
      meteor.y < window.innerHeight + meteor.length &&
      meteor.x > -meteor.length &&
      meteor.x < window.innerWidth + meteor.length
    );
  });
};

// 绘制流星
const drawMeteors = () => {
  if (!ctx.value) return;

  ctx.value.save();
  ctx.value.lineCap = "round";
  ctx.value.lineJoin = "round";

  meteors.value.forEach((meteor) => {
    const { head, tail } = meteor.color;

    // 创建线性渐变
    const gradient = ctx.value.createLinearGradient(
      meteor.x,
      meteor.y,
      meteor.x - Math.cos(meteor.angle) * meteor.length,
      meteor.y - Math.sin(meteor.angle) * meteor.length
    );

    // 设置渐变色
    gradient.addColorStop(
      0,
      `rgba(${head.r}, ${head.g}, ${head.b}, ${
        meteor.alpha * meteor.brightness
      })`
    );
    gradient.addColorStop(
      0.1,
      `rgba(${head.r}, ${head.g}, ${head.b}, ${
        meteor.alpha * meteor.brightness * 0.8
      })`
    );
    gradient.addColorStop(
      0.3,
      `rgba(${tail.r}, ${tail.g}, ${tail.b}, ${
        meteor.alpha * meteor.brightness * 0.6
      })`
    );
    gradient.addColorStop(1, `rgba(${tail.r}, ${tail.g}, ${tail.b}, 0)`);

    // 绘制流星主体
    ctx.value.beginPath();
    ctx.value.strokeStyle = gradient;
    ctx.value.lineWidth = meteor.width;
    ctx.value.moveTo(meteor.x, meteor.y);
    ctx.value.lineTo(
      meteor.x - Math.cos(meteor.angle) * meteor.length,
      meteor.y - Math.sin(meteor.angle) * meteor.length
    );
    ctx.value.stroke();

    // 绘制流星头部光晕，增加大小使其更明显
    const glowGradient = ctx.value.createRadialGradient(
      meteor.x,
      meteor.y,
      0,
      meteor.x,
      meteor.y,
      meteor.width * 4 // 增加光晕大小
    );
    glowGradient.addColorStop(
      0,
      `rgba(255, 255, 255, ${meteor.alpha * meteor.brightness})`
    );
    glowGradient.addColorStop(
      0.5,
      `rgba(255, 255, 255, ${meteor.alpha * meteor.brightness * 0.5})`
    );
    glowGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.value.beginPath();
    ctx.value.fillStyle = glowGradient;
    ctx.value.arc(meteor.x, meteor.y, meteor.width * 4, 0, Math.PI * 2);
    ctx.value.fill();
  });

  ctx.value.restore();
};

// 更新星星
const updateStars = (deltaTime) => {
  // 限制deltaTime避免过大的步长
  const adjustedDelta = Math.min(deltaTime, 16); // 限制每帧步长，进一步平滑闪烁

  stars.value.forEach((star) => {
    // 闪烁效果，减慢速度
    star.alpha += star.blinkingRate * star.blinkingDirection * adjustedDelta;
    if (star.alpha > 0.9) {
      star.alpha = 0.9;
      star.blinkingDirection = -1;
    } else if (star.alpha < 0.4) {
      star.alpha = 0.4;
      star.blinkingDirection = 1;
    }

    // 脉动效果，减慢速度
    if (star.twinkle) {
      star.radius +=
        star.pulsatingSpeed * star.pulsatingDirection * adjustedDelta;
      if (star.radius >= star.baseRadius * 1.3) {
        star.radius = star.baseRadius * 1.3;
        star.pulsatingDirection = -1;
      } else if (star.radius <= star.baseRadius * 0.7) {
        star.radius = star.baseRadius * 0.7;
        star.pulsatingDirection = 1;
      }
    }

    // 绘制星星
    const { r, g, b } = star.color;

    // 绘制光晕
    const gradient = ctx.value.createRadialGradient(
      star.x,
      star.y,
      0,
      star.x,
      star.y,
      star.radius * 2
    );
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${star.alpha})`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${star.alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.value.beginPath();
    ctx.value.fillStyle = gradient;
    ctx.value.arc(star.x, star.y, star.radius * 2, 0, Math.PI * 2);
    ctx.value.fill();

    // 绘制星星核心
    ctx.value.beginPath();
    ctx.value.fillStyle = `rgba(${r}, ${g}, ${b}, ${star.alpha * 1.2})`;
    ctx.value.arc(star.x, star.y, star.radius * 0.5, 0, Math.PI * 2);
    ctx.value.fill();
  });
};

// 动画循环
let lastTime = 0;
let lastMeteorSpawn = 0;

const animate = (timestamp) => {
  if (!ctx.value || !isVisible.value) return;

  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  // 清除画布
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

  // 设置全局合成操作
  ctx.value.globalCompositeOperation = "lighter";

  // 更新和绘制
  updateStars(deltaTime);
  updateMeteors(deltaTime);
  drawMeteors();

  // 请求下一帧
  animationId = requestAnimationFrame(animate);
};

// 监听主题变化
watch(
  isVisible,
  (newValue) => {
    if (newValue) {
      if (!animationId && canvas.value) {
        initStars();
        animationId = requestAnimationFrame(animate);
      }
    } else {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      if (ctx.value && canvas.value) {
        ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
      }
    }
  },
  { immediate: true }
);

// 组件挂载时
onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext("2d");
    resizeCanvas();

    if (isVisible.value) {
      initStars();
      animationId = requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resizeCanvas);
  }
});

// 组件卸载时
onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener("resize", resizeCanvas);
});

// 调整画布大小
const resizeCanvas = () => {
  if (canvas.value) {
    canvas.value.width = window.innerWidth;
    canvas.value.height = window.innerHeight;
    initStars();
  }
};
</script>

<template>
  <canvas ref="canvas" class="night-sky-canvas" v-show="isVisible"> </canvas>
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

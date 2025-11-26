<script setup>
import { useProfileStore } from "@/stores/profile";
import { storeToRefs } from "pinia";

const profileStore = useProfileStore();
const { timeline } = storeToRefs(profileStore);
</script>

<template>
  <div class="py-4">
    <div class="timeline-container">
      <div v-for="item in timeline" :key="item.id" class="timeline-item">
        <!-- 时间节点 -->
        <div class="timeline-node">
          <div class="timeline-node-inner"></div>
        </div>

        <!-- 内容卡片 -->
        <div class="timeline-card">
          <div class="timeline-header">
            <h3 class="timeline-title">{{ item.title }}</h3>
            <span class="timeline-year">{{ item.year }}</span>
          </div>
          <div class="timeline-company">{{ item.company }}</div>
          <p class="timeline-description">{{ item.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-container {
  position: relative;
  padding-left: 24px;
  margin-left: 8px;
}

.timeline-container::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    #0366d6 0%,
    #0366d6 15%,
    rgba(3, 102, 214, 0.7) 30%,
    rgba(3, 102, 214, 0.5) 70%,
    rgba(3, 102, 214, 0.3) 100%
  );
}

.timeline-item {
  position: relative;
  padding-bottom: 32px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-node {
  position: absolute;
  left: -8px;
  top: 6px;
  width: 16px;
  height: 16px;
  background-color: var(--color-bg-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--github-blue);
  z-index: 2;
}

.timeline-node-inner {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--github-blue);
  transition: transform 0.3s ease, background-color 0.3s ease;
}

.timeline-item:hover .timeline-node-inner {
  transform: scale(1.5);
  background: #2188ff;
}

.timeline-card {
  padding: 16px;
  background-color: var(--color-bg-primary);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.timeline-year {
  font-size: 14px;
  font-weight: 600;
  color: var(--github-blue);
  padding: 2px 8px;
  border-radius: 10px;
  background-color: rgba(3, 102, 214, 0.08);
}

.timeline-item:hover .timeline-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(3, 102, 214, 0.3);
}

.timeline-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.timeline-company {
  font-size: 14px;
  color: var(--github-gray);
  margin-bottom: 10px;
}

.timeline-description {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-primary);
}

/* 暗黑模式调整 */
@media (prefers-color-scheme: dark) {
  .timeline-container::before {
    background: linear-gradient(
      to bottom,
      #58a6ff 0%,
      #58a6ff 15%,
      rgba(88, 166, 255, 0.7) 30%,
      rgba(88, 166, 255, 0.5) 70%,
      rgba(88, 166, 255, 0.3) 100%
    );
  }

  .timeline-year {
    color: #58a6ff;
    background-color: rgba(88, 166, 255, 0.1);
  }

  .timeline-node {
    border-color: #58a6ff;
  }

  .timeline-node-inner {
    background: #58a6ff;
  }

  .timeline-item:hover .timeline-node-inner {
    background: #79b8ff;
  }

  .timeline-item:hover .timeline-card {
    border-color: rgba(88, 166, 255, 0.3);
  }
}
</style>

---
id: cmq0fbqdu0013ncklaz5pmzd9
title: GSAP (GreenSock Animation Platform)
type: concept
tags:

created: 2026-06-05T04:28:12.498Z
updated: 2026-06-05T04:28:12.580Z
---

---
source_type: chat
date: 2026-06-03
topic: GSAP 前端动画库调研
tags: [工具, 前端, 动画, JavaScript, GSAP, Webflow, ScrollTrigger]
---

# GSAP (GreenSock Animation Platform)

## 概述

GSAP（GreenSock Animation Platform）是 Web 前端最强大的 JavaScript 动画库之一，由 GreenSock 公司开发。自 2008 年起持续迭代，以极高的性能和灵活的 API 在设计驱动的网站中广泛使用。2024 年 10 月 Webflow 收购 GreenSock 公司，2025 年 5 月起 GSAP 全部功能（含原先付费的 Club 插件）对所有用户免费开放。

> [!warning] 注意：免费 ≠ 开源
> GSAP **不是开源项目**。它使用 Webflow 授予的"Standard No Charge"专有许可，源码在 GitHub 可见但不可随意修改/再分发。GreenSock 官方也明确表示 "GreenSock isn't the typical open source project"。详见下方「许可证」章节。

## 核心特性

### 动画引擎

- **gsap.to() / gsap.from() / gsap.fromTo()** — 基础补间动画，单行代码即可驱动任意 CSS/SVG/Canvas/JS 属性
- **Timeline（时间线）** — 精确控制复杂动画序列的编排、嵌套、标签和重复，是 GSAP 区别于其他动画库的核心优势
- **gsap.context()** — 自动清理动画实例，完美适配 React/Vue 等框架的组件生命周期
- **gsap.matchMedia()** — 响应式动画适配，不同断点执行不同动画逻辑

### 性能优化

- 自动使用 `transform` 和 `opacity` 触发 GPU 加速，避免触发布局回流（layout thrashing）
- 智能插值算法处理颜色、路径、贝塞尔曲线等复杂属性
- 内置 `overwrite` 管理机制，自动解决同一元素多个动画的冲突
- 在复杂场景（多元素并发动画）中性能远超 CSS animation/transition

### ScrollTrigger（滚动触发）

GSAP 最受欢迎的插件，让任何 gsap 动画可以绑定到滚动进度上：

- **scrub** — 动画进度与滚动位置同步（实现视频式播放效果）
- **pin** — 滚动时"钉住"元素，创建全屏滚动叙事
- **snap** — 自动吸附到特定滚动位置
- **toggleActions** — 进入/离开视口时触发的四阶段动作（onEnter / onLeave / onEnterBack / onLeaveBack）
- **stagger / batch** — 大量元素的滚动交错入场

```javascript
// 典型 ScrollTrigger 用法
gsap.to('.parallax-element', {
  y: -200,
  scrollTrigger: {
    trigger: '.parallax-element',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,       // 滚动驱动动画进度
  }
});
```

## 插件生态

Webflow 收购后，原先需要付费的 Club GSAP 插件全部免费开放：

| 插件 | 功能 | 说明 |
|------|------|------|
| **ScrollTrigger** | 滚动驱动动画 | 最常用插件，绑定滚动进度 |
| **ScrollToPlugin** | 平滑滚动到指定元素/位置 | 导航锚点、回到顶部 |
| **Draggable** | 拖拽交互 | 滑块、旋转器、可拖拽面板 |
| **Flip** | FLIP 动画（First/Last/Invert/Play） | 列表排序、布局切换动画 |
| **MotionPath** | 沿路径运动 | SVG 路径动画、运动轨迹 |
| **MorphSVG** | SVG 路径变形 | 图形变形、图标过渡（原 Club 付费） |
| **SplitText** | 文字拆分动画 | 逐字/逐行动画（原 Club 付费） |
| **DrawSVG** | SVG 描边动画 | 路径绘制/擦除效果 |
| **GSAP DevTools** | Chrome DevTools 面板 | 调试和可视化 Timeline |
| **Observer** | 统一事件监听 | 替代 scroll/resize/touch 等事件 |

## 框架集成

### React

```jsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function FadeInSection({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    // gsap.context() 自动在组件卸载时清理所有动画
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 60,
        duration: 1,
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
        }
      });
    }, ref);

    return () => ctx.revert(); // 清理
  }, []);

  return <div ref={ref}>{children}</div>;
}
```

### Vue

```vue
<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import gsap from 'gsap';

const boxRef = ref(null);
let ctx;

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.to(boxRef.value, { rotation: 360, duration: 2 });
  });
});

onUnmounted(() => ctx.revert());
</script>
```

### Next.js

Next.js 中注意 Server Components 不能使用 GSAP，需标记 `"use client"` 或在 `useEffect` 中动态加载。

## 与其他动画库对比

| 特性 | GSAP | Framer Motion (Motion) | Anime.js | CSS Animation |
|------|------|------------------------|----------|---------------|
| 定位 | 通用动画引擎 | React/SVG 专用 | 轻量级通用 | 原生浏览器 |
| 性能 | 极高（GPU 加速） | 高（自动硬件加速） | 中 | 高（部分场景） |
| 复杂动画编排 | Timeline 极强 | 中等 | 弱 | 弱 |
| 滚动动画 | ScrollTrigger 极强 | useScroll 中等 | 无 | 需 JS 配合 |
| 代码量 | ~30KB gzip（core） | ~30KB gzip | ~15KB gzip | 0 |
| 框架绑定 | 无（框架无关） | React 强绑定 | 无 | 无 |
| 布局动画 | Flip 插件 | 内置 layout 动画 | 无 | FLIP 技术 |
| SVG 动画 | MorphSVG 极强 | 内置 SVG 支持 | 基础 SVG | SMIL 动画 |
| 学习曲线 | 中等 | 低-中 | 低 | 低 |

> [!tip] 选型建议
> - **复杂滚动叙事 / 设计驱动网站** → GSAP + ScrollTrigger
> - **React UI 组件过渡 / 布局动画** → Framer Motion / Motion
> - **简单轻量动画** → Anime.js 或 CSS Animation
> - **不需要 JS 的简单动效** → CSS transition/animation

## 许可证

> [!important] 关键事实：GSAP 是免费的，但不是开源的

- **许可类型**：Webflow "Standard No Charge" License（专有许可）
- **权利**：免费使用、复制、展示、实现 GSAP 产品，不限项目规模
- **限制**：不可修改源码再分发，不可将 GSAP 作为竞争产品使用
- **对比 MIT**：MIT 允许自由修改和再分发，GSAP 不允许
- **GitHub**：[github.com/greensock/GSAP](https://github.com/greensock/GSAP) — 源码可见但非开源许可
- **Hacker News 社区评价**："GSAP is not open-source → they can pull the rug on you anytime"

### 许可证历史

| 时间 | 事件 |
|------|------|
| 2008-2024 | GreenSock 自有商业许可，核心免费但高级插件需 Club 会员付费 |
| 2024.10 | Webflow 收购 GreenSock 公司 |
| 2025.05 | Webflow 宣布 GSAP 全部免费（含所有 Club 插件），许可改为 "Standard No Charge" |

## 安装与使用

```bash
# npm
npm install gsap

# pnpm
pnpm add gsap

# CDN
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
```

### 核心 API 速查

```javascript
// 注册插件
gsap.registerPlugin(ScrollTrigger, Draggable, MotionPath);

// 基础动画
gsap.to(element, { x: 100, duration: 1, ease: "power2.out" });
gsap.from(element, { opacity: 0, y: 50 });
gsap.fromTo(element, { scale: 0 }, { scale: 1, duration: 0.5 });

// Timeline
const tl = gsap.timeline({ repeat: -1, yoyo: true });
tl.to('.box', { x: 100, duration: 1 })
  .to('.box', { y: 100, duration: 1 })
  .to('.box', { rotation: 360, duration: 0.5 });

// Stagger
gsap.from('.item', { y: 40, opacity: 0, stagger: 0.1 });

// 特殊属性
gsap.to(element, {
  rotation: "+=45",       // 相对值
  scale: 1.5,
  borderRadius: "50%",
  boxShadow: "0px 10px 20px rgba(0,0,0,0.3)",
  duration: 1,
  ease: "elastic.out(1, 0.3)"
});
```

### 常用 Easing

| 缓动函数 | 效果 |
|----------|------|
| `power1.out` ~ `power4.out` | 渐出减速（幂次） |
| `back.out(1.7)` | 轻微回弹 |
| `elastic.out(1, 0.3)` | 弹性效果 |
| `bounce.out` | 弹球效果 |
| `expo.inOut` | 指数型进出 |
| `circ.inOut` | 圆形曲线 |

## 典型应用场景

- **产品着陆页**：全屏滚动叙事（pin + scrub）、视差滚动、元素交错入场
- **数据可视化**：图表动画、数字滚动、SVG 路径绘制
- **交互原型**：拖拽排序（Draggable + Flip）、页面转场
- **品牌官网**：文字动画（SplitText）、形状变形（MorphSVG）、粒子效果
- **Webflow 网站**：原生集成，可在 Webflow 可视化编辑器中直接使用

## 相关链接

- 官方文档：[gsap.com/docs](https://gsap.com/docs)
- GitHub：[github.com/greensock/GSAP](https://github.com/greensock/GSAP)
- 官方社区论坛：[gsap.com/community](https://gsap.com/community/forums/)
- Webflow 免费公告：[webflow.com/updates/gsap-becomes-free](https://webflow.com/updates/gsap-becomes-free)
- 许可证全文：[gsap.com/community/standard-license](https://gsap.com/community/standard-license)

## 相关页面

- [[tailwindcss-实战技巧]] — GSAP 常与 Tailwind 配合，Tailwind 处理布局/样式，GSAP 处理动画
- [[nextjs-技术栈速查]] — Next.js 项目中集成 GSAP 需注意 SSR/CSR 限制
- [[open-design]] — AI 设计工具，可生成使用 GSAP 的交互动效
- [[kami-ai文档排版设计系统]] — Kami 的 Landing Page 模板可配合 GSAP 动画使用，两者都是 AI Agent 的设计工具
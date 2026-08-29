<script setup>
// ヒーローの軌道ダイアグラム。依存グラフを「軌道と入れ子」で表す精密線画。
// 細線の精度が命なので SVG で描き、動きは最小限(低速回転・パルス)にする。
</script>

<template>
  <div class="orbit" role="img"
    aria-label="node_modules を中心に npm / yarn / pnpm が同心円上に配置された依存構造のダイアグラム">
    <svg viewBox="0 0 560 520" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- 同心円(外側から) -->
      <g class="orbit__ring orbit__ring--outer">
        <circle cx="250" cy="260" r="228" class="line line--dashed" />
      </g>
      <circle cx="250" cy="260" r="172" class="line line--dotted" />
      <circle cx="250" cy="260" r="116" class="line" />

      <!-- 軌道上を漂う点(低速回転グループ) -->
      <g class="orbit__drift orbit__drift--a">
        <circle cx="250" cy="32" r="3" class="dot" />
        <circle cx="466" cy="330" r="2.5" class="dot dot--hollow" />
        <circle cx="70" cy="380" r="2.5" class="dot dot--hollow" />
      </g>
      <g class="orbit__drift orbit__drift--b">
        <circle cx="250" cy="88" r="2.5" class="dot dot--hollow" />
        <circle cx="398" cy="340" r="3" class="dot" />
        <circle cx="106" cy="340" r="2.5" class="dot" />
      </g>

      <!-- 中心の依存ツリー -->
      <g class="line">
        <path d="M250 252v34" />
        <path d="M250 286l-34 22M250 286v30M250 286l34 22" />
        <path d="M216 310l-10 24M216 310l6 26" />
        <path d="M250 318l-6 26M250 318l8 24" />
        <path d="M284 310l-6 26M284 310l10 24" />
      </g>
      <circle cx="250" cy="248" r="5" class="dot dot--core" />
      <circle cx="216" cy="309" r="3.5" class="dot" />
      <circle cx="250" cy="317" r="3.5" class="dot" />
      <circle cx="284" cy="309" r="3.5" class="dot" />
      <circle cx="206" cy="335" r="2.5" class="dot dot--hollow" />
      <circle cx="222" cy="337" r="2.5" class="dot dot--hollow" />
      <circle cx="244" cy="345" r="2.5" class="dot dot--hollow" />
      <circle cx="258" cy="343" r="2.5" class="dot dot--hollow" />
      <circle cx="278" cy="337" r="2.5" class="dot dot--hollow" />
      <circle cx="294" cy="335" r="2.5" class="dot dot--hollow" />

      <!-- 引き出し線とラベル -->
      <g class="line line--leader">
        <path d="M330 174h96" />
        <path d="M366 218h60" />
        <path d="M310 262h116" />
        <path d="M352 306h74" />
      </g>
      <circle cx="330" cy="174" r="3" class="dot dot--hollow" />
      <circle cx="366" cy="218" r="3" class="dot" />
      <circle cx="310" cy="262" r="3" class="dot" />
      <circle cx="352" cy="306" r="4" class="dot dot--accent orbit__pulse" />

      <g class="orbit__labels">
        <text x="434" y="178">node_modules</text>
        <text x="434" y="222">npm</text>
        <text x="434" y="266">yarn</text>
        <text x="434" y="310" class="label--accent">pnpm</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.orbit {
  width: 100%;
  max-width: 560px;
}

.orbit svg {
  width: 100%;
  height: auto;
  display: block;
}

.line {
  stroke: var(--v2-ink-3, #9aa1ac);
  stroke-width: 1;
  fill: none;
}

.line--dashed {
  stroke-dasharray: 5 7;
}

.line--dotted {
  stroke-dasharray: 1.5 7;
  stroke-linecap: round;
}

.line--leader {
  stroke: var(--v2-rule, #d9dce2);
}

.dot {
  fill: var(--v2-ink, #1c1e21);
}

.dot--hollow {
  fill: var(--v2-bg, #fafafa);
  stroke: var(--v2-ink-3, #9aa1ac);
  stroke-width: 1;
}

.dot--core {
  fill: var(--v2-ink, #1c1e21);
}

.dot--accent {
  fill: var(--v2-accent, #2563eb);
}

.orbit__labels text {
  font-family: var(--font-mono-tokens);
  font-size: 12.5px;
  letter-spacing: 0.04em;
  fill: var(--v2-ink-2, #4b5563);
}

.orbit__labels .label--accent {
  fill: var(--v2-accent, #2563eb);
  font-weight: 600;
}

/* 動き: 破線リングの低速回転・点群の周回・pnpm のパルス */
@media (prefers-reduced-motion: no-preference) {
  .orbit__ring--outer {
    animation: orbit-spin 140s linear infinite;
    transform-origin: 250px 260px;
  }

  .orbit__drift--a {
    animation: orbit-spin 90s linear infinite;
    transform-origin: 250px 260px;
  }

  .orbit__drift--b {
    animation: orbit-spin-rev 130s linear infinite;
    transform-origin: 250px 260px;
  }

  .orbit__pulse {
    animation: orbit-pulse 3.2s ease-in-out infinite;
    transform-origin: 352px 306px;
  }

  @keyframes orbit-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes orbit-spin-rev {
    to {
      transform: rotate(-360deg);
    }
  }

  @keyframes orbit-pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }

    50% {
      opacity: 0.55;
      transform: scale(1.5);
    }
  }
}
</style>

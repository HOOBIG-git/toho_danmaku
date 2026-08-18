# Touhou Project Sidebar UI Specification (TOUHOU_SPEC)

This document contains high-density specifications for the vertical split sidebar UI layout designed for portrait mobile browsers.

## 1. Coordinates and Sizing
- **Canvas total dimensions**: `480px` Width x `640px` Height.
- **Play Area (Game Field)**: `0` to `360px` X-axis, `0` to `640px` Y-axis. All self bullets, enemy bullets, player and boss coordinates are bounded within `360px` width.
- **Sidebar HUD Area**: `360px` to `480px` X-axis (Width: `120px`), `0` to `640px` Y-axis.
- **Dividing Line**: A vertical solid boundary at `x = 360px` with a metallic gold and dark red trim.

## 2. Visual Layering
- **Play Area Background**: Dark red nuclear radial plasma.
- **Sidebar Background**: Textured dark charcoal grey (`#121214`), looking solid and separated.
- **Dividing Border**:
  - Main border: `ctx.strokeStyle = '#d4af37';` (Gold) at `x = 360` with width `3`.
  - Accent shadow: `ctx.strokeStyle = '#220000';` at `x = 357` with width `1`.

## 3. Sidebar HUD Labels & Font Styles
All HUD text is drawn using Georgia/serif font for retro-arcade authentic fidelity.
- **Label Color**: `#ff4d4d` (Cherry Red) for labels (Hi-Score, Score, Player, Spell, Power, Graze, Spell Bonus).
- **Value Color**: `#ffffff` (Solid White) for values.
- **Graze Value Color**: `#ffffff` (White) with label `#4dff4d` (Vibrant Green).
- **Practice Stars**:
  - Red stars (`★`) for PLAYER lives.
  - Green stars (`★`) for SPELL/BOMB count.

## 4. Vertical Placement in Sidebar (X-start: 375px)
- **Y = 30**: Title Header `"SPELL PRACTICE"` (Font: bold 10px Georgia, color: `#888888`)
- **Y = 65**: `Hi-Score` Label (11px Georgia)
- **Y = 82**: `999999990` White value (13px Georgia)
- **Y = 115**: `Score` Label (11px Georgia)
- **Y = 132**: Current Score White value (13px Georgia)
- **Y = 175**: `Player` Label (11px Georgia)
- **Y = 192**: Red stars value `★★★` (14px Georgia, `#ff4d4d`)
- **Y = 225**: `Spell` (Bomb) Label (11px Georgia)
- **Y = 242**: Green stars value `★★★` (14px Georgia, `#4dff4d`)
- **Y = 285**: `Power` Label (11px Georgia)
- **Y = 302**: `4.00 / 4.00` White value (13px Georgia)
- **Y = 345**: `Graze` Label (11px Georgia, color: `#4dff4d`)
- **Y = 362**: Graze Count White value (13px Georgia)
- **Y = 415**: `Spell Bonus` Label (11px Georgia, color: `#ffaa00`)
- **Y = 432**: Bonus points White value (12px Georgia, padded with zeros)

## 5. Overlay Elements (Inside Play Area)
- **Timer (Remaining Time)**: Drawn inside the Play Area at `x = 350` (top-right of play field), `y = 40` using Georgia 34px. Red if `<= 10`, else White.
- **Spell Card Name**: Drawn inside the Play Area at `x = 350` (bottom-right of play field), `y = 615` using italic 12px Georgia with drop shadow, color `rgba(255,255,255,0.7)`.

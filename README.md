# Conflict Archive 2100 - Interactive Cyberpunk Dashboard

A Next.js application documenting a fictional historical conflict from the year 2100's perspective, featuring cyberpunk minimalist design with interactive data visualizations.

## Features

### Interactive Components

1. **Interactive SVG World Map**
   - Heat-map overlay highlighting conflict zones
   - Hover tooltips displaying population loss % and resource shifts
   - Animated attack vectors between nations
   - Real-time visual effects with SVG animations

2. **Chronos Peace Clock**
   - Terminal-style digital countdown/count-up timer
   - CRT monitor flicker effect
   - Monospace typography
   - Live updating duration since peace treaty

3. **Resource Data Visualization**
   - Radar chart comparing global resources (2024 vs 2100)
   - Interactive tooltips with Recharts
   - Scan-line CSS overlay for dystopian aesthetic
   - Categorized resource analysis (Depletion/Recovery/Stabilized)

### Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom utilities
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Typography**: Rajdhani & Share Tech Mono

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
├── app/
│   ├── globals.css          # Global styles with cyberpunk effects
│   ├── layout.tsx            # Root layout with scanline overlay
│   └── page.tsx              # Main page component
├── components/
│   ├── InteractiveWorldMap.tsx      # SVG map with tooltips
│   ├── ChronosPeaceClock.tsx        # Countdown timer
│   └── ResourceDataVisualization.tsx # Recharts radar chart
├── package.json
├── tailwind.config.js        # Custom colors & animations
├── tsconfig.json
└── next.config.js
```

## Design Language

### Color Palette
- Background: `#0a0a0a` (cyber-dark)
- Primary: `#ffb000` (cyber-amber)
- Secondary: `#00ff41` (cyber-green)
- Accent: `#ff0066` (cyber-red)

### Effects
- Scanline overlay (CRT monitor effect)
- Neon glow text shadows
- Border pulse animations
- Glitch/skew animations
- Flicker effects for digital displays

### Content Tone
All text follows a clinical, post-war historical documentation style:
- Detached, factual language
- Technical terminology (e.g., "Era of Global Restructuring")
- Archive classification markers
- Timestamp formats: `YYYY.MM.DD`

## Key Components Usage

### Interactive World Map
```tsx
import InteractiveWorldMap from '@/components/InteractiveWorldMap'

<InteractiveWorldMap />
```

### Chronos Peace Clock
```tsx
import ChronosPeaceClock from '@/components/ChronosPeaceClock'

<ChronosPeaceClock />
```

### Resource Visualization
```tsx
import ResourceDataVisualization from '@/components/ResourceDataVisualization'

<ResourceDataVisualization />
```

## Customization

### Tailwind Custom Utilities

Custom CSS classes available:
- `.neon-amber` - Amber neon glow effect
- `.neon-green` - Green neon glow effect
- `.scanlines` - CRT scanline overlay
- `.crt-flicker` - CRT flicker animation
- `.scan-overlay` - Animated scan line

### Animation Classes
- `animate-flicker` - 3s flicker loop
- `animate-glitch` - Glitch/skew effect
- `animate-border-pulse` - Border color pulse
- `animate-pulse-slow` - Slow pulse (3s)

## Browser Support

Tested on:
- Chrome/Edge (Latest)
- Firefox (Latest)
- Safari (Latest)

## License

This project is for demonstration purposes. Historical events depicted are fictional.

---

**Archive Classification**: PUBLIC DOMAIN // 2100.03.04
**Version**: 3.7.2

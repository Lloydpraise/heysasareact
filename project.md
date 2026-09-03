# HeySasa! React Project Architecture

## Project Overview
**HeySasa!** is a React-based business analytics and lead management dashboard application. It features a modern, responsive UI with glass-morphism design patterns, mobile-first approach, and uses cutting-edge technologies for optimal performance.

**Project Name:** heysasareact  
**Version:** 0.0.0  
**Type:** React + Vite SPA (Single Page Application)  
**Entry Point:** `src/main.jsx`

---

## Technology Stack

### Core Framework & Build Tools
- **React:** ^19.2.8 - UI library for building interactive components
- **Vite:** ^8.2.0 - Lightning-fast build tool and dev server
- **React DOM:** ^19.2.8 - DOM rendering for React

### Styling & CSS
- **Tailwind CSS:** ^4.3.3 - Utility-first CSS framework
- **@tailwindcss/vite:** ^4.3.3 - Tailwind CSS plugin for Vite
- **PostCSS:** ^8.5.26 - CSS transformer
- **Autoprefixer:** ^10.5.4 - Adds vendor prefixes automatically

### Icons & UI
- **Lucide React:** ^1.31.0 - Clean, consistent icon library
  - Currently used icons: BarChart3, Users, Sliders, Menu, X, LogOut, ShieldCheck, CheckCircle2

### Development & Linting
- **ESLint:** ^10.8.0 - Code quality and style enforcement
- **@eslint/js:** ^10.0.1 - ESLint JavaScript rules
- **eslint-plugin-react-hooks:** ^7.1.1 - Enforces React Hooks best practices
- **eslint-plugin-react-refresh:** ^0.5.3 - Validates React Fast Refresh usage

### Type Support
- **@types/react:** ^19.2.17
- **@types/react-dom:** ^19.2.3
- **globals:** ^17.7.0

### Vite Plugins
- **@vitejs/plugin-react:** ^6.0.4 - Fast Refresh support for HMR

---

## Project Structure

```
heysasareact/
├── public/                          # Static assets (favicon, etc.)
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppShell.jsx        # Main layout shell with sidebar and navigation
│   │   ├── chat/                   # Chat feature components (to be built)
│   │   └── settings/               # Settings/preferences components (to be built)
│   ├── hooks/                      # Custom React hooks (to be populated)
│   ├── services/                   # API calls and external integrations (to be populated)
│   ├── utils/                      # Utility functions and helpers (to be populated)
│   ├── assets/                     # Images, logos, etc. (to be populated)
│   ├── App.jsx                     # Root application component
│   ├── App.css                     # App-level styles (minimal - using Tailwind)
│   ├── main.jsx                    # React app entry point
│   └── index.css                   # Global styles and Tailwind directives
├── index.html                      # HTML entry point
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── eslint.config.js                # ESLint configuration
├── package.json                    # Dependencies and scripts
├── package-lock.json               # Lock file
└── README.md                       # Project readme

```

---

## Application Architecture

### Component Hierarchy
```
main.jsx
  └── App.jsx
       └── AppShell (Layout)
            ├── Sidebar Navigation
            │   ├── Brand Logo (HeySasa!)
            │   └── Nav Items (Analytics, Leads, Preferences)
            ├── Header/Top Bar
            │   ├── Mobile Menu Toggle
            │   └── Profile Dropdown
            └── Main Content Area (children)
```

### State Management
- **Local Component State:** Uses `useState` for UI state (activeTab, mobileOpen, isProfileOpen, etc.)
- **Local Storage:** Persists user profile data (business_name, business_email)
- **No External State Management:** Currently using React built-in state management

---

## Design System & Color Scheme

### Primary Colors
- **Primary Green:** `#28A745` - Brand primary color, used for accents, active states, and highlights
- **Orange Accent:** `#FF8C00` - Used for active indicator bars and secondary accents
- **Light Green Accent:** `#86efac` - Used in gradient backgrounds

### Text & Neutral Colors
- **Primary Text:** `#0F172A` - Dark slate for main text content
- **Secondary Text:** `#64748B` - Medium slate for secondary content
- **Light Text:** `#1E293B` - Dark slate for hover states
- **Tertiary Text:** `#94A3B8` - Slate gray for less important text
- **Muted:** `#94A3B8` - For placeholder and disabled states

### Background Colors
- **Main Background:** `#F7FBF9` - Light cream/green tint background
- **White/Glass:** `white/70` - With backdrop blur for glass morphism effect
- **Overlay:** `slate-900/20` - Semi-transparent dark overlay for modals

### Visual Effects
- **Glass Morphism:** Elements use `backdrop-blur-xl`, `bg-white/70`, `border border-white/70`
- **Mesh Gradient Background:** Radial gradients with blur and opacity
- **Ambient Animation:** `animate-pulse` on background gradient elements
- **Shadow:** `shadow-2xl shadow-[#28A745]/5` - Subtle green-tinted shadows

---

## Key Components

### AppShell.jsx
**Purpose:** Main layout wrapper providing navigation, sidebar, and user profile management

**Props:**
- `activeTab` (string) - Current active navigation tab ID
- `setActiveTab` (function) - Callback to change active tab
- `children` (React nodes) - Main content area content

**Features:**
- Responsive sidebar (expandable on desktop, collapsible on mobile)
- Navigation with 3 tabs: Analytics, Leads, Preferences
- User profile dropdown with logout and password change modals
- Mobile overlay and menu toggle
- Gradient background with mesh pattern overlay
- LocalStorage integration for user profile persistence

**Navigation Items:**
1. **Analytics** (BarChart3 icon) - Data visualization and reporting
2. **Leads** (Users icon) - Lead management interface
3. **Preferences** (Sliders icon) - Settings and preferences

---

## App.jsx (Root Component)

**Purpose:** Main application component, manages activeTab state and passes it to AppShell

**Current Structure:**
- Uses `activeTab` state with 'analytics' as default
- Renders AppShell with navigation
- Placeholder content showing current active tab name
- Ready to accept child components for each tab

**Future Implementation:**
- Will conditionally render different components based on activeTab
- Will integrate with chat and settings components

---

## Styling Conventions

### Tailwind CSS Usage
- **Utility-first approach:** All styles use Tailwind utility classes
- **Responsive Design:** Uses `md:` breakpoint modifier for desktop/mobile differences
- **Custom Colors:** Uses Tailwind color values with hex codes in square brackets (e.g., `bg-[#28A745]`)
- **No CSS Modules:** All styling is inline with Tailwind classes

### Tailwind Configuration
```javascript
// tailwind.config.js
{
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {}  // No custom theme extensions yet
  },
  plugins: []
}
```

### CSS Structure
- **index.css:** Global styles and Tailwind directives (`@import 'tailwindcss'`)
- **App.css:** Application-level styles (minimal usage)
- **Individual Components:** Inline Tailwind classes only

---

## Development Guidelines

### Code Standards
- **Component Structure:** Use functional components with hooks
- **Naming Convention:** PascalCase for component files (e.g., `AppShell.jsx`)
- **Props Management:** Destructure props in function signature
- **React Best Practices:** Use `useEffect` for side effects, proper dependency arrays
- **Accessibility:** Use semantic HTML and ARIA labels where applicable

### Component Creation Pattern
```jsx
import React, { useState } from 'react';
import { IconName } from 'lucide-react';

export default function ComponentName({ prop1, prop2, children }) {
  const [state, setState] = useState(initialValue);

  return (
    <div className="tailwind classes">
      {/* JSX content */}
    </div>
  );
}
```

### Import Organization
1. React imports first
2. Third-party library imports (lucide-react)
3. Local component imports
4. Utility/hook imports

### Event Handling Patterns
- Use camelCase for event handler functions (e.g., `handleClick`)
- Pass callbacks via props from parent to child
- Use `onClick`, `onChange` event handlers on elements

### State Management Patterns
- Use `useState` for UI state
- Use `useEffect` for side effects with proper dependencies
- Use localStorage for persistence (`localStorage.getItem()`, `localStorage.setItem()`)
- No external state management library currently in use

---

## Data & API Integration Points

### Current Data Sources
- **LocalStorage:** User profile data (business_name, business_email)

### Services Directory (To Be Populated)
- API integration utilities
- Authentication services
- Data fetching and caching logic
- WebSocket handlers (if needed for chat)

### Hooks Directory (To Be Populated)
- Custom hooks for data fetching
- Custom hooks for state management
- Custom hooks for common UI patterns

---

## Configuration Files

### vite.config.js
```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```
- Minimal configuration using React and Tailwind plugins
- Default Vite optimization and dev server settings

### postcss.config.js
- Configured for Tailwind CSS with autoprefixer
- Handles CSS transformations during build

### eslint.config.js
- Enforces code quality standards
- Validates React Hooks usage
- Supports React Refresh for HMR

---

## Available NPM Scripts

```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # Run ESLint to check code quality
npm run preview  # Preview production build locally
```

---

## Responsive Design Breakpoints

- **Mobile First:** Styles start with mobile (default)
- **Desktop:** `md:` breakpoint for tablet and desktop adjustments
- **Sidebar Behavior:**
  - Mobile: Fixed sidebar (-left-full when closed, left-4 when open)
  - Desktop: Relative sidebar (w-[88px] default, w-64 on hover)

---

## Mobile-Specific Features

- **Mobile Menu:** Collapsible navigation with overlay
- **Responsive Sidebar:** Hover expansion on desktop, click toggle on mobile
- **Touch-Friendly Buttons:** Adequate padding and sizing
- **Backdrop Blur Overlays:** For modal and menu backgrounds

---

## Performance Considerations

- **Vite HMR:** Fast refresh during development
- **React Strict Mode:** Enabled in development for detecting issues
- **Tailwind Optimization:** Unused CSS removed in production build
- **Image Optimization:** Assets should be placed in public/ directory for static files

---

## Future Development Areas

### Components to Build
- [ ] Analytics tab component and charts
- [ ] Leads management interface
- [ ] Settings/Preferences component
- [ ] Chat component(s)

### Services to Implement
- [ ] Authentication/login service
- [ ] API client for backend integration
- [ ] Data fetching and caching strategies

### Hooks to Create
- [ ] useFetch - For data fetching
- [ ] useLocalStorage - For persistent state
- [ ] useAuth - For authentication logic

### Utils to Develop
- [ ] Date/time formatters
- [ ] Data transformers
- [ ] Validation helpers

---

## Important Notes for AI Code Generation

### Dos ✅
- Use Tailwind CSS for all styling (no CSS-in-JS or external stylesheets)
- Keep component files in appropriate subdirectories (chat/, layout/, settings/)
- Export components as default exports
- Use existing Lucide React icons from the installed set
- Leverage the existing AppShell for layout consistency
- Follow the green (`#28A745`) and orange (`#FF8C00`) color scheme
- Maintain glass-morphism aesthetic with backdrop blur and semi-transparent backgrounds
- Use localStorage for client-side persistence
- Implement responsive design with md: breakpoint

### Don'ts ❌
- Do NOT add new CSS-in-JS libraries (styled-components, emotion, etc.)
- Do NOT import CSS files for styling
- Do NOT use different color schemes outside the defined palette
- Do NOT break the AppShell layout structure without explicit permission
- Do NOT use external state management until discussed (Redux, Zustand, Context API preferred if needed)
- Do NOT add heavy dependencies without reviewing package.json first
- Do NOT hardcode business information - use localStorage values
- Do NOT create responsive designs using hidden elements - use Tailwind responsive classes

---

## Version Control & Dependencies

- **Node Version:** Use modern Node (v18+ recommended)
- **Package Manager:** npm
- **Lock File:** package-lock.json (commit this)
- **Git Ignore:** Standard node_modules and build artifacts

---

Last Updated: 2026-08-14

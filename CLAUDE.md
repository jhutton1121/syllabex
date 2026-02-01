# Syllabex - Development Guide

## Project Overview
Syllabex is a multi-tenant Learning Management System (LMS) built with Django REST Framework (backend) and React 18 (frontend).

## Tech Stack
- **Backend**: Django 4.2.9, Django REST Framework, SQLite/PostgreSQL, JWT auth (SimpleJWT)
- **Frontend**: React 18, React Router v6, react-hook-form, axios, TipTap rich text editor (`@tiptap/react` + starter-kit + extensions)
- **Backend HTML sanitization**: bleach (see `courses/utils.py`)
- **No CSS framework** - all custom CSS with per-component modular files, CSS custom properties for theming

## Running the Project
- **Backend**: `cd backend && source venv/Scripts/activate && python manage.py runserver`
- **Frontend**: `cd frontend && npm start` (runs on port 3000)
- **Migrations**: `cd backend && python manage.py makemigrations && python manage.py migrate`

---

## Syllabex Style Guide

All UI must follow these design tokens and patterns. The app uses a **dark-theme-first** design with an optional light theme toggle.

### Theme System

All colors are defined as **CSS custom properties** in `frontend/src/index.css`. Dark theme is the default (`:root`), light theme activates via `[data-theme="light"]`.

**IMPORTANT: Always use CSS variables for colors. Never hardcode color values.**

```css
/* CORRECT */
.my-component {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

/* WRONG - never do this */
.my-component {
  background: #2a2a4e;
  color: #f0f0ff;
  border: 1px solid #3a3a5e;
}
```

**Theme Context**: `frontend/src/context/ThemeContext.js` provides `useTheme()` hook with `{ theme, toggleTheme, isDark }`. Theme preference stored in localStorage (`syllabex-theme`). Toggle available on Account page.

### Color Tokens (CSS Variables)

#### Backgrounds
| Variable | Dark Value | Light Value | Usage |
|----------|-----------|-------------|-------|
| `--bg-primary` | `#1e1e3f` | `#ffffff` | Cards, navbar, toolbar, modal |
| `--bg-secondary` | `#2a2a4e` | `#f8fafc` | Module cards, editor, inputs, page body |
| `--bg-tertiary` | `#12122b` | `#f1f5f9` | Code blocks, deep backgrounds |
| `--bg-page` | `#2a2a4e` | `#f8fafc` | Page/body background |

#### Borders
| Variable | Dark Value | Light Value | Usage |
|----------|-----------|-------------|-------|
| `--border-default` | `#3a3a5e` | `#e2e8f0` | Cards, inputs, dividers |
| `--border-hover` | `#4a4a6e` | `#cbd5e1` | Hover states |
| `--border-active` | `#6366f1` | `#6366f1` | Focus rings, active states |

#### Text
| Variable | Dark Value | Light Value | Usage |
|----------|-----------|-------------|-------|
| `--text-primary` | `#f0f0ff` | `#0f172a` | Headings, primary content |
| `--text-secondary` | `#e0e0e0` | `#334155` | Body text, input values |
| `--text-muted` | `#b0b0d0` | `#64748b` | Labels, descriptions |
| `--text-subtle` | `#a0a0c0` | `#94a3b8` | Meta info, dates |
| `--text-disabled` | `#8080a8` | `#94a3b8` | Disabled, placeholders |
| `--text-faint` | `#6a6a8e` | `#cbd5e1` | Hints, very low priority |

#### Component Tokens
| Variable | Dark Value | Light Value | Usage |
|----------|-----------|-------------|-------|
| `--input-bg` | `#2a2a4e` | `#ffffff` | Input field backgrounds |
| `--card-bg` | `#2a2a4e` | `#ffffff` | Card backgrounds |
| `--modal-bg` | `#1e1e3f` | `#ffffff` | Modal backgrounds |
| `--code-bg` | `#12122b` | `#f1f5f9` | Code block backgrounds |
| `--shadow-color` | `rgba(0,0,0,0.4)` | `rgba(0,0,0,0.08)` | Box shadows |
| `--shadow-light` | `rgba(0,0,0,0.2)` | `rgba(0,0,0,0.05)` | Light box shadows |
| `--overlay-bg` | `rgba(0,0,0,0.4)` | `rgba(0,0,0,0.3)` | Modal overlays |

#### Accent / Brand (constant across themes)
| Variable | Value | Usage |
|----------|-------|-------|
| `--primary` | `#6366f1` | Buttons, links focus, active tab |
| `--primary-dark` | `#4f46e5` | Gradient start |
| `--primary-light` | `#818cf8` | Link text, hover accents |
| `--purple` | `#8b5cf6` | Gradient end, AI features |
| `--gradient-primary` | `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)` | Primary buttons |

#### Semantic (constant across themes)
| Variable | Value | Usage |
|----------|-------|-------|
| `--success` / `--success-light` / `--success-lighter` | `#10b981` / `#4ade80` / `#34d399` | Published, completed |
| `--error` / `--error-light` | `#ef4444` / `#f87171` | Delete, errors |
| `--warning` / `--warning-light` | `#f59e0b` / `#fbbf24` | Locked, draft, caution |
| `--info` / `--info-light` | `#3b82f6` / `#60a5fa` | Upcoming, informational |

### Typography

- **Primary font**: `'DM Sans'` (weights: 400, 500, 600, 700)
- **Monospace**: `'JetBrains Mono'` (weights: 400, 500) for code and numbers
- **Headings**: 18-32px, weight 600-700, color `var(--text-primary)`
- **Body**: 14-15px, weight 400-500
- **Small/Labels**: 10-13px, weight 500-600, uppercase for labels
- **Line height**: 1.5-1.6 for body, 1.2 for headings

### Spacing

Uses a 4px base scale: 4, 8, 12, 16, 20, 24, 32, 48px.

### Component Patterns

#### Buttons
- **Primary**: `background: var(--gradient-primary)`, white text
- **Secondary**: `background: var(--bg-secondary)`, `border: 1px solid var(--border-default)`, `color: var(--text-secondary)`
- **Danger**: `background: rgba(239,68,68,0.15)`, `color: #f87171`, border variant
- **Shared**: `padding: 10px 20px`, `border-radius: 8px`, `font-weight: 600`
- **Hover**: `transform: translateY(-1px)`, `box-shadow: 0 4px 12px rgba(99,102,241,0.3)`

#### Cards
- `background: var(--card-bg)`, `border: 1px solid var(--border-default)`, `border-radius: 12px`, `padding: 24px`
- Hover: `border-color: var(--border-hover)`, `box-shadow: 0 4px 16px var(--shadow-light)`

#### Forms / Inputs
- Form cards: `background: var(--bg-primary)`, `border: 1px solid var(--border-default)`, `border-radius: 12px`, `padding: 24px`
- Inputs inside form cards: `background: var(--input-bg)`, `border: 1px solid var(--border-default)`, `border-radius: 8px`
- `padding: 12px 14px`, `color: var(--text-secondary)`, `font-size: 15px`
- Focus: `border-color: var(--border-active)`, `box-shadow: 0 0 0 3px rgba(99,102,241,0.1)`
- Placeholder: `color: var(--text-faint)`
- Labels: `font-size: 14px`, `font-weight: 500`, `color: var(--text-muted)`

#### Rich Text Editor
- Use `RichTextEditor` component (`components/RichTextEditor.js`) for all content creation textareas
- Props: `content`, `onChange`, `placeholder`, `editable`, `toolbar` (`"full"` or `"minimal"`)
- Full toolbar (teachers): headings, bold, italic, strike, lists, blockquote, code, link, image, hr
- Minimal toolbar (students): bold, italic, bullet list, ordered list
- Use `RichContent` component (`components/RichContent.js`) for displaying stored HTML
- Props: `html`, `className`
- Backend: all rich text fields sanitized via `courses/utils.py:sanitize_html()` in serializer `validate_*` methods
- AI chat prompt inputs (`AIChatPanel`, `AIModuleChatPanel`) remain plain textareas

#### Badges / Pills
- `padding: 2-3px 8-10px`, `border-radius: 4-12px`
- `font-size: 10-11px`, `font-weight: 600-700`, `text-transform: uppercase`
- Use semantic color backgrounds at 15% opacity with full color text

#### Modals
- Overlay: `background: var(--overlay-bg)`, `z-index: 100`
- Modal: `background: var(--modal-bg)`, `border: 1px solid var(--border-default)`, `border-radius: 12px`, `padding: 24px`
- Shadow: `0 8px 32px var(--shadow-color)`

#### Empty States
- `background: var(--bg-secondary)`, `border: 1px dashed var(--border-default)`, `border-radius: 12px`
- Centered text with large icon (48px), heading in `var(--text-primary)`, description in `var(--text-subtle)`

### CSS Conventions

1. **One CSS file per component** - `ComponentName.css` alongside `ComponentName.js`
2. **No CSS framework** - all styles are custom
3. **Always use CSS variables** - never hardcode color values (see Theme System above)
4. **Class naming**: lowercase with hyphens (e.g., `.module-card-header`)
5. **Transitions**: `all 0.2s` or specific properties at 0.2s
6. **Responsive breakpoints**: 480px (mobile), 768px (tablet), 1024px (desktop)
7. **Dark theme is the default** - always design dark-first, light theme via `[data-theme="light"]`
8. **Font imports**: only in `index.css` - do not duplicate `@import` in component CSS files

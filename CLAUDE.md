# Syllabex - Development Guide

## Project Overview
Syllabex is a multi-tenant Learning Management System (LMS) built with Django REST Framework (backend) and React 18 (frontend).

## Tech Stack
- **Backend**: Django 4.2.9, Django REST Framework, SQLite/PostgreSQL, JWT auth (SimpleJWT)
- **Frontend**: React 18, React Router v6, react-hook-form, axios, TipTap rich text editor (`@tiptap/react` + starter-kit + extensions)
- **Backend HTML sanitization**: bleach (see `courses/utils.py`)
- **No CSS framework** - all custom CSS with per-component modular files

## Running the Project
- **Backend**: `cd backend && source venv/Scripts/activate && python manage.py runserver`
- **Frontend**: `cd frontend && npm start` (runs on port 3000)
- **Migrations**: `cd backend && python manage.py makemigrations && python manage.py migrate`

---

## Syllabex Style Guide

All UI must follow these design tokens and patterns. The app uses a **dark-theme-first** design.

### Color Tokens

#### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| bg-primary | `#1e1e3f` | Cards, navbar, toolbar, modal |
| bg-secondary | `#2a2a4e` | Module cards, editor, inputs, page body |
| bg-tertiary | `#12122b` | Code blocks, deep backgrounds |

#### Borders
| Token | Value | Usage |
|-------|-------|-------|
| border-default | `#3a3a5e` | Cards, inputs, dividers |
| border-hover | `#4a4a6e` | Hover states |
| border-active | `#6366f1` | Focus rings, active states |

#### Text
| Token | Value | Usage |
|-------|-------|-------|
| text-primary | `#f0f0ff` | Headings, primary content |
| text-secondary | `#e0e0e0` | Body text, input values |
| text-muted | `#b0b0d0` | Labels, descriptions |
| text-subtle | `#a0a0c0` | Meta info, dates |
| text-disabled | `#8080a8` | Disabled, placeholders |
| text-faint | `#6a6a8e` | Hints, very low priority |

#### Accent / Brand
| Token | Value | Usage |
|-------|-------|-------|
| primary | `#6366f1` | Buttons, links focus, active tab |
| primary-dark | `#4f46e5` | Gradient start |
| primary-light | `#818cf8` | Link text, hover accents |
| purple | `#8b5cf6` | Gradient end, AI features |

#### Semantic
| Token | Value | Usage |
|-------|-------|-------|
| success | `#10b981` / `#4ade80` / `#34d399` | Published, completed |
| error | `#ef4444` / `#f87171` | Delete, errors |
| warning | `#f59e0b` / `#fbbf24` | Locked, draft, caution |
| info | `#3b82f6` / `#60a5fa` | Upcoming, informational |

### Typography

- **Primary font**: `'DM Sans'` (weights: 400, 500, 600, 700)
- **Monospace**: `'JetBrains Mono'` (weights: 400, 500) for code and numbers
- **Headings**: 18-32px, weight 600-700, color `#f0f0ff`
- **Body**: 14-15px, weight 400-500
- **Small/Labels**: 10-13px, weight 500-600, uppercase for labels
- **Line height**: 1.5-1.6 for body, 1.2 for headings

### Spacing

Uses a 4px base scale: 4, 8, 12, 16, 20, 24, 32, 48px.

### Component Patterns

#### Buttons
- **Primary**: `background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`, white text
- **Secondary**: `background: #2a2a4e`, `border: 1px solid #3a3a5e`, `color: #e0e0e0`
- **Danger**: `background: rgba(239,68,68,0.15)`, `color: #f87171`, border variant
- **Shared**: `padding: 10px 20px`, `border-radius: 8px`, `font-weight: 600`
- **Hover**: `transform: translateY(-1px)`, `box-shadow: 0 4px 12px rgba(99,102,241,0.3)`

#### Cards
- `background: #2a2a4e`, `border: 1px solid #3a3a5e`, `border-radius: 12px`, `padding: 24px`
- Hover: `border-color: #4a4a6e`, `box-shadow: 0 4px 16px rgba(0,0,0,0.2)`

#### Forms / Inputs
- Form cards: `background: #1e1e3f`, `border: 1px solid #3a3a5e`, `border-radius: 12px`, `padding: 24px`
- Inputs inside form cards: `background: #2a2a4e`, `border: 1px solid #3a3a5e`, `border-radius: 8px`
- `padding: 12px 14px`, `color: #e0e0e0`, `font-size: 15px`
- Focus: `border-color: #6366f1`, `box-shadow: 0 0 0 3px rgba(99,102,241,0.1)`
- Placeholder: `color: #6a6a8e`
- Labels: `font-size: 14px`, `font-weight: 500`, `color: #b0b0d0`

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
- Overlay: `background: rgba(0,0,0,0.4)`, `z-index: 100`
- Modal: `background: #1e1e3f`, `border: 1px solid #3a3a5e`, `border-radius: 12px`, `padding: 24px`
- Shadow: `0 8px 32px rgba(0,0,0,0.4)`

#### Empty States
- `background: #2a2a4e`, `border: 1px dashed #3a3a5e`, `border-radius: 12px`
- Centered text with large icon (48px), heading in `#f0f0ff`, description in `#a0a0c0`

### CSS Conventions

1. **One CSS file per component** - `ComponentName.css` alongside `ComponentName.js`
2. **No CSS framework** - all styles are custom
3. **Class naming**: lowercase with hyphens (e.g., `.module-card-header`)
4. **Transitions**: `all 0.2s` or specific properties at 0.2s
5. **Responsive breakpoints**: 480px (mobile), 768px (tablet), 1024px (desktop)
6. **Dark theme is the default** - always design dark-first

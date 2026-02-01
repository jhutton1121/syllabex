# Syllabex Architecture Reference

> For Claude Code instances: use this to orient quickly without reading every file.

## Tech Stack
- **Backend**: Django 4.2.9 + DRF, SQLite (dev) / PostgreSQL (prod), SimpleJWT
- **Frontend**: React 18, React Router v6, Axios, TipTap rich text editor
- **No CSS framework** — custom CSS with CSS variables, dark-theme-first

## Multi-Tenancy Model

Syllabex is **multi-tenant by Account**. Every data entity is scoped to an Account.

```
Account (tenant root)
  ├── Users (unique per email+account)
  ├── Courses (unique per code+account)
  │     ├── CourseModules (time-bounded sections)
  │     │     ├── Assignments
  │     │     └── Pages
  │     ├── CourseMemberships (role: student | instructor)
  │     └── CourseSyllabi (uploaded files for AI context)
  ├── AccountMemberships (role: account_admin | sub_account_admin | member)
  └── AISettings (per-account OpenAI config)
```

**Tenant resolution** (in order): `X-Account-Slug` header → subdomain → authenticated user's account. Middleware sets `request.account` and thread-local for `AccountScopedManager`.

## Key Data Flows

### Authentication
1. `POST /api/auth/login/` → JWT with `account_id` + `account_slug` in token claims
2. Axios interceptor attaches Bearer token + `X-Account-Slug` on every request
3. 401 → automatic token refresh via `/api/auth/refresh/`

### Assignment Submission (Student)
1. Student calls `POST /api/assignments/<id>/submit` with question responses
2. Backend creates `AssignmentSubmission` + `QuestionResponse` records
3. Auto-grades MC and numerical via `QuestionResponse.auto_grade()`
4. If fully auto-gradable → creates `GradeEntry` automatically
5. Text responses remain ungraded until instructor manually grades

### Grading (Instructor)
1. `POST /api/assignments/submissions/<id>/grade-response` with points + remarks
2. Updates `QuestionResponse.points_earned`, `graded=True`, `teacher_remarks`
3. Instructor can then create/update `GradeEntry` for final grade

### AI Generation
1. Instructor sends prompt → `POST /api/ai/generate/` or `/api/ai/generate-modules/`
2. Backend loads account's `AISettings`, builds system prompt with course + syllabus context
3. Calls OpenAI API, returns structured JSON (questions or modules)
4. Frontend shows review UI; instructor accepts/rejects generated items

## Invariants & Business Rules

| Rule | Enforcement |
|------|-------------|
| Users unique per (email, account) | DB unique_together |
| Courses unique per (code, account) | DB unique_together |
| One submission per (student, assignment) | DB unique_together |
| One grade per (membership, assignment) | DB unique_together |
| Assignments not editable after start_date | `Assignment.is_editable_by_teacher()` |
| Students can't see grades before due_date | Serializer-level filtering |
| Locked modules hide content from students | Serializer conditional includes |
| Unpublished pages hidden from students | Serializer filtering |
| All user HTML sanitized server-side | `sanitize_html()` in serializer `validate_*` methods |
| API keys encrypted at rest | Fernet encryption via `SECRET_KEY` |

## Permission Hierarchy

```
SuperUser / is_staff
  └── Account Admin (has admin_profile OR account_admin membership)
        └── Course Instructor (CourseMembership.role == 'instructor')
              └── Student (CourseMembership.role == 'student')
```

Permissions enforced at view level via DRF permission classes in `users/permissions.py`.

## Directory Layout

```
backend/
  accounts/     # Account, AccountMembership, middleware, managers
  users/        # User, AdminProfile, permissions, auth views
  courses/      # Course, CourseModule, CourseMembership, HTML sanitization
  assignments/  # Assignment, Question, Choice, Submission, QuestionResponse
  gradebook/    # GradeEntry
  pages/        # Page (rich text content)
  ai_assistant/ # AISettings, CourseSyllabus, OpenAI integration

frontend/src/
  components/   # Shared UI (RichTextEditor, QuestionBuilder, AI panels, etc.)
  pages/        # Route-level components (Dashboard, CourseDetail, Admin, etc.)
  context/      # AuthContext, ThemeContext, SidebarContext
  services/     # API service modules (courseService, assignmentService, etc.)
  api.js        # Axios instance with interceptors
```

## Frontend Routing Summary

| Path Pattern | Who | What |
|---|---|---|
| `/dashboard` | All | Course list, upcoming assignments |
| `/courses/:id` | All | Tabbed course view (modules, pages, assignments, grades) |
| `/courses/:id/assignments/:id` | Student | Take/view assignment |
| `/courses/:id/assignments/:id/edit` | Instructor | Edit assignment + questions |
| `/courses/:id/assignments/:id/submissions` | Instructor | View/grade submissions |
| `/admin/*` | Admin | Course mgmt, user mgmt, AI settings |
| `/account` | All | Profile, password, theme toggle |
| `/calendar` | All | Cross-course calendar view |

## State Management
- **AuthContext**: user object, login/logout/register, `isAdmin()` helper
- **ThemeContext**: dark/light toggle, persisted in localStorage
- **SidebarContext**: mobile sidebar open/close state
- All other state is local component state (no Redux/Zustand)

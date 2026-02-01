# Syllabex Domain Glossary

> Quick reference for what terms mean in the Syllabex context.

| Term | Meaning |
|------|---------|
| **Account** | A tenant / organization. All data is scoped to an Account. Has a unique `slug` used for login and API routing. Accounts can be hierarchical (parent/child sub-accounts). |
| **Account Admin** | A user with full control over an Account — can manage courses, users, AI settings. Identified by having an `AdminProfile` or `account_admin` role in `AccountMembership`. |
| **User** | A person within an Account. Unique by (email, account) — the same email can exist in different Accounts. Has no inherent role; roles come from memberships. |
| **Course** | A class or learning unit. Identified by (code, account). Contains modules, assignments, pages, and memberships. Has optional start/end dates and an `ai_enabled` flag. |
| **CourseMembership** | The link between a User and a Course. Defines `role` (student or instructor) and `status` (active, dropped, completed). A user can be instructor in one course and student in another. |
| **CourseModule** | A time-bounded section within a course (e.g., "Week 1"). Has start/end dates, an order, and a lock toggle. Modules contain assignments and pages. Status is derived: upcoming, active, or completed. |
| **Assignment** | A graded task within a course. Three types exist as proxy models: **Quiz**, **Test**, **Homework**. Has a start_date (when students can access), due_date, and points_possible. Contains Questions. |
| **Question** | An individual question within an Assignment. Types: `multiple_choice`, `numerical`, `text_response`. MC questions have Choices; numerical questions have a correct answer + tolerance. |
| **Choice** | An answer option for a multiple-choice Question. One is marked `is_correct`. |
| **AssignmentSubmission** | A student's submission for an Assignment. One per (student, assignment). Contains QuestionResponses. |
| **QuestionResponse** | A student's answer to a single Question. Tracks `is_correct`, `points_earned`, `graded` status, and optional `teacher_remarks`. Auto-graded for MC and numerical; manually graded for text. |
| **GradeEntry** | The final recorded grade for a student on an assignment. Links to CourseMembership + Assignment. Stores numeric grade, grader, and comments. One per (membership, assignment). |
| **Page** | A rich-text content page within a course, optionally tied to a module. Has a `is_published` flag — unpublished pages are instructor-only. |
| **CourseSyllabus** | An uploaded file (PDF/DOCX) attached to a course. Text is extracted and used as context for AI generation features. |
| **AISettings** | Per-account configuration for the AI assistant (encrypted OpenAI API key, model name, max tokens, enabled flag). |
| **Locked (Module)** | When a module is locked, students cannot see its assignments or pages. Instructors always see everything. |
| **Available (Assignment)** | An assignment is available to students when: current time is after `start_date` (if set) and the parent module is not locked. |
| **Auto-gradable** | An assignment where all questions are MC or numerical — can be fully graded without instructor intervention. |
| **Account Slug** | The short identifier for a tenant (e.g., "acme-university"). Used in the `X-Account-Slug` header and login flow. |
| **Instructor** | A user with `role='instructor'` in a CourseMembership. Can create/edit assignments, grade submissions, manage modules and pages for that course. |
| **Student** | A user with `role='student'` in a CourseMembership. Can view published content, take assignments, and view their own grades (after due date). |

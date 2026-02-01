# Syllabex LMS Gap Analysis & Feature Roadmap

> Competitive benchmark against Canvas, Moodle, Blackboard, Google Classroom, and Brightspace/D2L.
> **Prerequisites for implementors**: Read `architecture.md` and `domainglossary.md` before starting any ticket.

---

## Current State Summary

Syllabex has: multi-tenant Accounts with JWT auth, Courses with CourseModules, three Assignment types (Quiz/Test/Homework) with auto-grading for MC and numerical Questions, a flat GradeEntry-based gradebook, rich text Pages (TipTap), a cross-course Calendar (react-big-calendar), AI-assisted question/module generation via OpenAI, and a dark/light theme system. See `architecture.md` for full data model and flows.

**What's missing**: Communication features (zero), file management beyond syllabus upload, rubrics, weighted grading, notifications, discussion forums, question banks, quiz timers, bulk enrollment, and content release conditions.

---

## Priority Legend
- **P0** — Table-stakes (every major LMS has this; blocks adoption without it)
- **P1** — High-value (most LMS have this; users will expect it quickly)
- **P2** — Differentiator (competitive advantage; institutional readiness)

---

## 1. ASSIGNMENTS & ASSESSMENTS

### SYL-101: Rubric System [P0]

**Description**: Syllabex currently grades assignments through individual QuestionResponse scoring (points_earned per question) and a single numeric GradeEntry. There is no structured rubric system. In Canvas, Moodle, and Blackboard, rubrics are a foundational grading tool — instructors define criteria (e.g., "Thesis Clarity", "Evidence Quality") with performance levels (e.g., Excellent/Good/Needs Work) and point values. Rubrics attach to assignments and are used during grading to ensure consistency and provide structured feedback. Students see the rubric before submission (as a guide) and after grading (as feedback).

This is especially critical for `text_response` Questions and the upcoming file upload submissions (SYL-102), where grading is subjective and needs structure.

**Acceptance Criteria**:
- [ ] New `Rubric` model with fields: `course` (FK to Course), `title`, `reusable` (bool). New `RubricCriterion` model: `rubric` (FK), `title`, `description`, `order`, `points_possible`. New `RubricRating` model: `criterion` (FK), `label`, `description`, `points`, `order`
- [ ] Rubrics are Account-scoped (through their Course relationship, consistent with existing pattern)
- [ ] API endpoints: CRUD rubrics at `/api/courses/<course_id>/rubrics/`, attach rubric to Assignment via `rubric` FK on Assignment model
- [ ] When grading a submission, instructor selects a rating per criterion. Store as `RubricAssessment` (FK to Submission) with `RubricCriterionScore` entries
- [ ] Total rubric score auto-calculated from selected ratings and written to `QuestionResponse.points_earned` or `GradeEntry.grade`
- [ ] Student view: rubric criteria visible on assignment page before submission; rubric scores and selected ratings visible after grading (respecting existing due_date visibility rule)
- [ ] Instructor view: rubric selection UI in `GradeSubmission.js` page alongside existing per-question grading
- [ ] Rubrics are reusable across assignments within same course
- [ ] Frontend components follow existing CSS variable system and component patterns per `CLAUDE.md`

---

### SYL-102: File Upload Submissions [P0]

**Description**: Currently, `AssignmentSubmission` only supports `answer` (TextField) and linked `QuestionResponse` records. For homework-type assignments, students often need to upload files — essays, lab reports, design documents, code projects. Every major LMS supports file upload as a submission type. This requires backend file storage (Django's `FileField` with media storage), a new submission type concept on Assignment, and a file upload UI on the `TakeAssignment.js` page.

The existing `CourseSyllabus` model in `ai_assistant/models.py` already handles file uploads with `FileField(upload_to='syllabi/')` — use this as a reference pattern.

**Acceptance Criteria**:
- [ ] New `submission_type` field on Assignment: choices `['questions', 'file_upload', 'text_entry', 'url']` (default `'questions'` for backward compatibility with existing assignments)
- [ ] New `SubmissionFile` model: `submission` (FK to AssignmentSubmission), `file` (FileField, upload_to `'submissions/<course_id>/'`), `original_filename`, `file_size`, `uploaded_at`
- [ ] Allow multiple file uploads per submission (configurable max count and max file size on Assignment)
- [ ] `allowed_file_types` field on Assignment (e.g., `['.pdf', '.docx', '.png']`) with backend validation
- [ ] `TakeAssignment.js`: when `submission_type == 'file_upload'`, show drag-and-drop file upload area instead of question list. Show uploaded files with remove option before final submit
- [ ] `ViewSubmissions.js` and `GradeSubmission.js`: display uploaded files with download links
- [ ] File size limit enforced both client-side (before upload) and server-side (serializer validation)
- [ ] Existing question-based submission flow unchanged when `submission_type == 'questions'`
- [ ] Respect existing `AssignmentSubmission` unique constraint (one submission per student per assignment)

---

### SYL-103: Question Banks / Pools [P1]

**Description**: Instructors currently create Questions directly on an Assignment. There is no way to reuse questions across assignments or pull random subsets for exam variation. In Moodle and Canvas, question banks are a course-level repository of questions organized by category/tag. When creating a quiz, instructors can "pull N random questions from bank X" so each student gets a different set.

The existing Question model (`assignments/models.py`) has `assignment` as a required FK. Question banks need questions that exist independently of any assignment.

**Acceptance Criteria**:
- [ ] New `QuestionBank` model: `course` (FK to Course), `title`, `description`, `created_at`. Account-scoped through Course
- [ ] New `BankQuestion` model mirroring existing `Question` fields (`question_type`, `text`, `points`, `correct_answer_numeric`, `numeric_tolerance`) plus `bank` (FK to QuestionBank), `tags` (JSONField, list of strings). Associated `BankChoice` model mirroring `Choice`
- [ ] API: CRUD question banks at `/api/courses/<course_id>/question-banks/`. CRUD bank questions within banks
- [ ] On Assignment, new optional `random_pool` config: `bank` (FK to QuestionBank), `count` (int), `points_per_question` (int). When a student starts the assignment, system randomly selects `count` questions from the bank and creates their QuestionResponse records
- [ ] Randomized questions are fixed per student once generated (stored as a snapshot, not re-randomized on page refresh)
- [ ] Import/export: ability to copy questions from an Assignment into a bank, and from a bank into an Assignment (as regular Questions)
- [ ] Frontend: QuestionBank management page accessible from course navigation; bank selection UI in `AssignmentForm.js`

---

### SYL-104: Quiz Timer & Attempt Limits [P1]

**Description**: Syllabex quizzes and tests have `start_date` and `due_date` for availability windows, but no per-student time limit (e.g., "60 minutes once started") and no attempt limits. Canvas, Moodle, and Blackboard all support timed assessments with auto-submit and multiple attempts with configurable scoring rules (keep highest, keep latest, average).

Currently, `AssignmentSubmission` has a unique constraint on `(assignment, student)` — only one submission per student. Multi-attempt support requires relaxing this.

**Acceptance Criteria**:
- [ ] New fields on Assignment: `time_limit_minutes` (IntegerField, nullable — null means untimed), `max_attempts` (IntegerField, default=1), `scoring_policy` (CharField, choices: `['highest', 'latest', 'average']`, default `'highest'`)
- [ ] New field on AssignmentSubmission: `started_at` (DateTimeField) and `attempt_number` (IntegerField, default=1)
- [ ] Relax unique constraint on `(assignment, student)` to `(assignment, student, attempt_number)`
- [ ] When `time_limit_minutes` is set: `started_at` recorded on first question load; server enforces auto-submit when `started_at + time_limit` is exceeded; late responses after timer expiry are rejected
- [ ] Frontend `TakeAssignment.js`: countdown timer displayed when timed; warning at 5 minutes and 1 minute remaining; auto-submit with confirmation on expiry
- [ ] When `max_attempts > 1`: student sees "Attempt X of Y" header; previous attempts visible as read-only; new "Retake" button available if attempts remain
- [ ] `GradeEntry.grade` calculated based on `scoring_policy` across all attempts
- [ ] Instructor view in `ViewSubmissions.js`: shows all attempts per student with attempt number, grouped by student

---

### SYL-105: Additional Question Types [P1]

**Description**: Syllabex supports three question types: `multiple_choice`, `numerical`, and `text_response`. Moodle supports 15+ types. The most commonly expected types across all LMS platforms that Syllabex is missing are: true/false (simplified MC), matching (pair items from two columns), fill-in-the-blank (text with blanks to complete), and ordering (arrange items in correct sequence). All except fill-in-the-blank can be auto-graded.

The existing `Question` model uses `question_type` as a CharField with choices, and auto-grading logic lives in `QuestionResponse.auto_grade()`. New types need to extend both.

**Acceptance Criteria**:
- [ ] Add question_type choices: `'true_false'`, `'matching'`, `'fill_in_blank'`, `'ordering'`
- [ ] **True/False**: Uses existing Choice model with exactly 2 choices (True/False). Auto-gradable. Simplified UI in QuestionBuilder — just a toggle for correct answer
- [ ] **Matching**: New `MatchingPair` model: `question` (FK), `left_item` (CharField), `right_item` (CharField), `order`. Student response stored as JSON mapping of left→right. Auto-gradable (compare pairs, partial credit = correct_pairs / total_pairs × points)
- [ ] **Fill-in-the-blank**: `Question.text` contains `{{blank}}` placeholders. New `BlankAnswer` model: `question` (FK), `blank_index` (int), `acceptable_answers` (JSONField, list of strings), `case_sensitive` (bool, default False). Auto-gradable with exact or case-insensitive match
- [ ] **Ordering**: New `OrderItem` model: `question` (FK), `text` (CharField), `correct_position` (int). Student response stored as JSON array of item IDs in submitted order. Auto-gradable (exact sequence match for full credit, or partial credit based on correctly positioned items)
- [ ] `QuestionResponse.auto_grade()` extended to handle all new types
- [ ] `QuestionBuilder.js` updated with type-specific editing UI for each new type
- [ ] `TakeAssignment.js` updated with type-specific response UI (drag-and-drop for matching/ordering, text inputs for fill-in-blank, radio for true/false)
- [ ] `AssignmentStudentSerializer` and `QuestionStudentSerializer` hide correct answers for new types (same pattern as existing MC)

---

### SYL-106: Group Assignments [P2]

**Description**: Syllabex has no concept of student groups within a course. In Canvas and Moodle, instructors can create groups (manually or auto-assign), then create assignments where one student submits on behalf of the group and all members receive the same grade. This is foundational for collaborative learning.

Requires a new Group model, group membership, and modifications to the submission/grading flow.

**Acceptance Criteria**:
- [ ] New `CourseGroup` model: `course` (FK), `name`, `created_at`. New `CourseGroupMembership`: `group` (FK), `student` (FK to User), unique on (group, student)
- [ ] Group management UI in the Roster tab of `CourseDetail.js` — create groups, drag students into groups, or auto-assign randomly
- [ ] New field on Assignment: `is_group_assignment` (bool, default False), `group_set` (FK to a GroupSet concept, or directly use CourseGroups)
- [ ] When `is_group_assignment=True`: any group member can submit; submission is shared (visible to all group members); grade applies to all group members
- [ ] `AssignmentSubmission` unique constraint changes: for group assignments, unique on (assignment, group) instead of (assignment, student)
- [ ] Instructor can override individual grades if needed (break from group grade)
- [ ] Student view shows group members on assignment page

---

### SYL-107: Peer Review / Workshop [P2]

**Description**: Peer review allows students to evaluate each other's submissions using instructor-defined criteria, similar to Moodle's Workshop activity. This builds critical thinking and reduces instructor grading load for large classes.

**Acceptance Criteria**:
- [ ] New `PeerReview` model: `assignment` (FK), `reviewer` (FK to User), `reviewee_submission` (FK to AssignmentSubmission), `feedback` (TextField), `score` (IntegerField, nullable), `completed_at`
- [ ] Configuration on Assignment: `peer_review_enabled` (bool), `reviews_per_student` (int), `peer_review_due_date` (DateTimeField), `anonymous_reviews` (bool)
- [ ] Auto-assign reviewers after submission deadline (round-robin distribution ensuring no self-review)
- [ ] Reviewer UI: view anonymized (or named) submission, provide feedback and optional score per rubric criterion
- [ ] Student view: see peer feedback received on their own submission (after peer review deadline)
- [ ] Instructor view: overview of peer review completion, ability to override or discard reviews

---

### SYL-108: Late Submission Policies [P1]

**Description**: Syllabex tracks `is_late` on `AssignmentSubmission` (set to True when `submitted_at > assignment.due_date`), but there is no automatic penalty applied and no configurable policy. Instructors must manually adjust grades. Every major LMS allows configuring late penalties — e.g., 10% per day, hard cutoff after 3 days, or zero credit after deadline.

**Acceptance Criteria**:
- [ ] New fields on Assignment: `late_policy` (CharField, choices: `['none', 'percent_per_day', 'percent_per_hour', 'zero_after_deadline', 'custom_cutoff']`, default `'none'`), `late_penalty_percent` (DecimalField, nullable — e.g., 10.0 for 10% per day), `late_cutoff_date` (DateTimeField, nullable — hard deadline after which no submission accepted)
- [ ] When `late_policy != 'none'`: `AssignmentSubmission` records `late_penalty_applied` (DecimalField) calculated at submission time
- [ ] Auto-grading flow (`QuestionResponse.auto_grade()` → `GradeEntry` creation) applies late penalty to final grade
- [ ] If `late_cutoff_date` is set and current time exceeds it, reject submission with clear error message
- [ ] `TakeAssignment.js`: display late policy info to students (e.g., "Late submissions lose 10% per day"). If past due but before cutoff, show warning with penalty preview
- [ ] `ViewSubmissions.js`: show late penalty amount alongside score for late submissions
- [ ] `GradeSubmission.js`: show original score vs. penalized score; instructor can override/waive penalty

---

## 2. GRADEBOOK & ANALYTICS

### SYL-201: Weighted Grade Categories [P0]

**Description**: The current gradebook is flat — `GradeEntry` records exist per (CourseMembership, Assignment) with a numeric grade and that's it. There are no categories, no weighting, and no final course grade calculation. In every major LMS, instructors define grade categories (e.g., "Homework" at 30%, "Quizzes" at 20%, "Final Exam" at 50%) and the system automatically computes weighted final grades.

The existing Assignment `type` field (`quiz`, `test`, `homework`) provides a natural starting point for categories, but instructors need the ability to define custom categories and weights.

**Acceptance Criteria**:
- [ ] New `GradeCategory` model: `course` (FK to Course), `name` (CharField), `weight` (DecimalField, 0-100), `drop_lowest` (IntegerField, default=0 — number of lowest grades to drop), `order` (IntegerField)
- [ ] Course-level validation: category weights must sum to 100 (or allow "unweighted" mode where all assignments equally weighted)
- [ ] Assignment gets optional `category` FK to GradeCategory (nullable for backward compat — uncategorized assignments go into a default bucket)
- [ ] New `CourseFinalGrade` model or computed property: calculated weighted average across all categories for each student
- [ ] API endpoint: `GET /api/gradebook/course/<course_id>/final-grades/` returns all students with category breakdowns and weighted final
- [ ] Gradebook UI (`CourseDetail.js` Gradebook tab): column grouping by category, category averages, weighted final grade column
- [ ] Student grades view: show category breakdown with individual grades and category averages
- [ ] Default categories auto-created from Assignment types when instructor first enables weighting

---

### SYL-202: Grade Export (CSV/Excel) [P0]

**Description**: There is no way to export grades from Syllabex. Instructors need to submit grades to institutional systems (SIS, registrar). Every LMS supports at minimum CSV export of the gradebook.

**Acceptance Criteria**:
- [ ] New API endpoint: `GET /api/gradebook/course/<course_id>/export/?format=csv` (and `format=xlsx`)
- [ ] CSV format: columns = Student Name, Student Email, [Assignment 1 Title], [Assignment 2 Title], ..., Final Grade. Rows = one per student
- [ ] XLSX format: same structure with formatted headers, auto-sized columns
- [ ] Include category subtotals if weighted categories (SYL-201) are enabled
- [ ] Frontend: "Export" button in Gradebook tab with format dropdown (CSV, Excel)
- [ ] Export respects Account scoping (only students in the course within the current Account)
- [ ] Use `openpyxl` for Excel generation (add to backend requirements)

---

### SYL-203: Course Analytics Dashboard [P1]

**Description**: Instructors have no visibility into class-level trends. Canvas provides New Analytics with student comparisons; Blackboard has a Retention Center for at-risk students; Brightspace has predictive analytics. Syllabex needs at least a basic analytics view showing grade distributions, completion rates, and at-risk student identification.

**Acceptance Criteria**:
- [ ] New "Analytics" tab in `CourseDetail.js` (instructor-only, added to `CourseSubNav`)
- [ ] API endpoint: `GET /api/courses/<course_id>/analytics/` returning aggregated data
- [ ] **Grade distribution**: histogram of overall course grades (A/B/C/D/F buckets)
- [ ] **Assignment completion rates**: per-assignment bar chart showing submitted vs. total students, with average score
- [ ] **At-risk students**: list of students with course average below configurable threshold (default 60%) or with 2+ missing assignments
- [ ] **Module engagement**: submissions per module, showing which modules have lowest completion
- [ ] All data computed server-side from existing GradeEntry and AssignmentSubmission records — no new tracking models needed for V1
- [ ] Frontend: chart library (e.g., recharts or chart.js) for visualizations, following existing CSS variable theming

---

### SYL-204: Student Progress Tracking [P1]

**Description**: There is no way to track whether students have viewed content, completed modules, or made progress through the course. Canvas tracks page views; Moodle has activity completion checkboxes; Brightspace has progress indicators. This feature enables both students (self-awareness) and instructors (identifying disengaged students) to monitor course progression.

**Acceptance Criteria**:
- [ ] New `ContentView` model: `user` (FK), `content_type` (CharField: 'page', 'module', 'assignment'), `content_id` (IntegerField), `course` (FK), `first_viewed_at`, `last_viewed_at`, `view_count`. Unique on (user, content_type, content_id)
- [ ] Backend middleware or view mixin that records views when students access pages, modules, or assignments
- [ ] New `ModuleCompletion` model: `user` (FK), `module` (FK to CourseModule), `completed_at`. A module is "complete" when all its published pages are viewed and all its assignments are submitted
- [ ] Student dashboard: progress bar per course showing modules completed / total modules
- [ ] Course detail page: per-module completion indicators (checkmark or progress ring)
- [ ] Instructor analytics (SYL-203): include student activity data (last active date, content viewed percentage)
- [ ] API: `GET /api/courses/<course_id>/progress/` (student's own), `GET /api/courses/<course_id>/progress/all/` (instructor view of all students)

---

### SYL-205: Configurable Letter Grade Schemes [P1]

**Description**: `GradeEntry.calculate_letter_grade()` exists but uses a hardcoded scale. Institutions have different grading scales (A+ through F, pass/fail, 1-5, etc.). Instructors need to configure this per course.

**Acceptance Criteria**:
- [ ] New `GradeScheme` model: `course` (FK to Course, nullable — null means account-level default), `account` (FK to Account), `name` (CharField)
- [ ] New `GradeSchemeEntry` model: `scheme` (FK), `letter` (CharField, e.g., "A+"), `min_percentage` (DecimalField), `max_percentage` (DecimalField)
- [ ] Account-level default scheme that applies to all courses unless overridden
- [ ] `GradeEntry.calculate_letter_grade()` updated to use course's scheme (falling back to account default)
- [ ] Course settings UI: configure grade scheme with add/remove/edit rows
- [ ] Gradebook and student grades views display letter grades from the configured scheme

---

## 3. CONTENT & MODULES

### SYL-301: File/Resource Management [P0]

**Description**: Syllabex has no general-purpose file management. The only file upload is `CourseSyllabus` in the AI assistant module (for AI context). Instructors cannot share lecture slides, readings, handouts, or media with students. Every LMS has a course-level file area. Canvas has "Files", Moodle has the file picker with repository integration, Blackboard has Content Collection.

**Acceptance Criteria**:
- [ ] New `CourseFile` model: `course` (FK), `module` (FK to CourseModule, nullable), `title` (CharField), `file` (FileField, upload_to `'course_files/<course_id>/'`), `original_filename`, `file_size`, `mime_type`, `uploaded_by` (FK to User), `is_published` (bool, default True), `order` (IntegerField), `created_at`
- [ ] Respect existing visibility rules: unpublished files hidden from students, files in locked modules hidden from students
- [ ] API: CRUD at `/api/courses/<course_id>/files/`. Support file upload via multipart form data
- [ ] Storage quota: configurable per Account in Account.settings JSONField (e.g., `{"storage_quota_mb": 5000}`)
- [ ] Frontend: "Files" tab in `CourseSubNav` showing file list grouped by module (or ungrouped). Upload button (instructor), download links (all), delete (instructor)
- [ ] Files also appear within their module's content section in the Modules tab
- [ ] Supported display: PDF inline preview, image inline preview, other types as download links

---

### SYL-302: Content Release Conditions [P1]

**Description**: Currently, module visibility is binary — locked or unlocked, toggled manually by the instructor via `CourseModule.is_locked`. Canvas and Moodle support prerequisite-based release: "Module 2 unlocks when Module 1 quiz score ≥ 70%", or "Page visible after completing Module 1". This enables self-paced courses and mastery-based progression.

**Acceptance Criteria**:
- [ ] New `ReleaseCondition` model: `content_type` (CharField: 'module', 'page', 'assignment'), `content_id` (IntegerField), `condition_type` (CharField: `'date'`, `'module_completion'`, `'min_grade'`, `'assignment_submission'`), `condition_config` (JSONField — e.g., `{"module_id": 5}` or `{"assignment_id": 3, "min_percentage": 70}`)
- [ ] A content item can have multiple conditions (all must be met = AND logic)
- [ ] Evaluation logic: server-side function `check_release_conditions(user, content_type, content_id)` that checks all conditions for that item
- [ ] Serializers filter content based on release conditions for students (same pattern as existing `is_locked` filtering in `CourseModuleSerializer`)
- [ ] Instructor UI: "Release Conditions" section when editing a module/page/assignment, with condition builder (dropdown for type + configuration fields)
- [ ] Student UI: locked content shows lock icon with description of what's needed to unlock (e.g., "Complete Module 1 to unlock")
- [ ] Backward compatible: content with no release conditions behaves as before (always visible unless module is locked)

---

### SYL-303: Course Templates & Duplication [P1]

**Description**: When a new semester starts, instructors need to recreate their courses from scratch. Canvas has "Copy this Course" and Blueprint Courses; Moodle has backup/restore. Course duplication copies the structure (modules, assignments with questions, pages) without student data (memberships, submissions, grades).

**Acceptance Criteria**:
- [ ] New API endpoint: `POST /api/courses/<course_id>/duplicate/` with options: `{ "include_assignments": true, "include_pages": true, "include_modules": true, "new_code": "CS101-F26", "new_name": "CS 101 Fall 2026" }`
- [ ] Deep copy: Course → CourseModules → Assignments → Questions → Choices, and Pages. All with new IDs, linked to new course
- [ ] Student data NOT copied: no CourseMemberships (except the instructor who duplicated), no submissions, no grades
- [ ] Dates optionally shifted: provide `date_offset_days` to shift all module/assignment dates forward by N days
- [ ] New `is_template` bool on Course: template courses appear in a separate "Templates" section in admin course management. Templates cannot have students enrolled
- [ ] Frontend: "Duplicate Course" button on admin course detail page; template picker when creating a new course

---

### SYL-304: SCORM/LTI Support [P2]

**Description**: SCORM (Shareable Content Object Reference Model) and LTI (Learning Tools Interoperability) are industry standards for content packaging and third-party tool integration. SCORM allows importing interactive eLearning packages; LTI allows embedding external tools (Turnitin, publisher content, virtual labs). Institutional adoption often requires at least basic LTI support.

**Acceptance Criteria**:
- [ ] **LTI 1.3 Consumer**: New `LTITool` model: `account` (FK), `name`, `client_id`, `deployment_id`, `platform_url`, `jwks_url`, `auth_url`, `token_url`, `is_active`
- [ ] LTI launch endpoint that generates JWT and redirects to tool provider with course/user context
- [ ] LTI tool placement: embeddable in Pages (as iframe) and as an assignment submission type
- [ ] **SCORM 1.2 Player**: Upload SCORM zip packages, extract and serve content. Track completion and score via SCORM API bridge (JavaScript runtime)
- [ ] SCORM packages stored as CourseFiles with special `content_type = 'scorm'`
- [ ] Score passback: SCORM scores written to GradeEntry; LTI grade passback via LTI AGS (Assignment and Grade Services)

---

## 4. COMMUNICATION

### SYL-401: Announcements [P0]

**Description**: Syllabex has zero communication features. Instructors cannot broadcast messages to their class. Announcements are the most basic communication feature in every LMS — a one-to-many message from instructor to all enrolled students, displayed prominently on the course page and user dashboard. Currently, the UserDashboard only shows courses and upcoming assignments.

**Acceptance Criteria**:
- [ ] New Django app: `communications/` (or add to existing `courses/` app)
- [ ] New `Announcement` model: `course` (FK to Course), `author` (FK to User), `title` (CharField), `body` (TextField — rich text, sanitized via `sanitize_html()`), `is_published` (bool, default True), `pinned` (bool, default False), `created_at`, `updated_at`
- [ ] Account-scoped through Course relationship (consistent with existing pattern)
- [ ] API: CRUD at `/api/courses/<course_id>/announcements/`. Only instructors/admins can create/edit/delete. All course members can read
- [ ] Course detail page: "Announcements" tab in `CourseSubNav` showing announcements in reverse chronological order, pinned items first
- [ ] User dashboard: "Recent Announcements" section showing latest 5 announcements across all enrolled courses
- [ ] Rich text body using existing `RichTextEditor` component with full toolbar
- [ ] `RichContent` component for rendering announcement body (same as Pages)
- [ ] Scheduled announcements: optional `publish_at` (DateTimeField) — announcement hidden until that datetime (stretch goal, can be V2)

---

### SYL-402: Discussion Forums [P0]

**Description**: Discussion forums are a core engagement tool in every LMS. Canvas, Moodle, and Blackboard all have threaded discussion boards. Forums enable peer-to-peer learning, Q&A, and can be graded (participation grades). Syllabex has no discussion capability.

**Acceptance Criteria**:
- [ ] New `DiscussionTopic` model: `course` (FK), `module` (FK to CourseModule, nullable), `author` (FK to User), `title`, `body` (TextField, sanitized), `is_pinned` (bool), `is_locked` (bool — prevent new replies), `is_graded` (bool), `points_possible` (IntegerField, nullable), `created_at`, `updated_at`
- [ ] New `DiscussionPost` model: `topic` (FK), `author` (FK to User), `parent` (FK to self, nullable — for threading), `body` (TextField, sanitized), `created_at`, `updated_at`
- [ ] API: CRUD topics at `/api/courses/<course_id>/discussions/`. CRUD posts at `/api/discussions/<topic_id>/posts/`
- [ ] Thread display: top-level posts with nested replies (2 levels deep for simplicity, or fully recursive)
- [ ] "Discussions" tab in `CourseSubNav`
- [ ] Graded discussions: instructor can assign participation grades, linked to GradeEntry
- [ ] Permissions: students can create posts and reply; only instructors can create topics, pin, lock, or delete any post; students can edit/delete their own posts
- [ ] Rich text body in posts using `RichTextEditor` with minimal toolbar (same as student assignment responses)
- [ ] Post count badge on topic cards; unread indicator (stretch goal)

---

### SYL-403: Messaging / Inbox [P1]

**Description**: Direct messaging between users within a course context. Separate from announcements (one-to-many) and discussions (public). Canvas has a course-filtered Inbox; Moodle has a site-wide messaging system. Students need to message instructors privately (questions about grades, accommodations). Instructors need to message individual students or the whole class.

**Acceptance Criteria**:
- [ ] New `Conversation` model: `subject` (CharField), `course` (FK to Course, nullable — null for cross-course messages), `created_at`
- [ ] New `ConversationParticipant`: `conversation` (FK), `user` (FK), `last_read_at` (DateTimeField, nullable)
- [ ] New `Message` model: `conversation` (FK), `sender` (FK to User), `body` (TextField, sanitized), `created_at`
- [ ] API: `POST /api/messages/compose/` (create new conversation), `GET /api/messages/inbox/` (list conversations), `GET /api/messages/<conversation_id>/` (get messages), `POST /api/messages/<conversation_id>/reply/`
- [ ] Inbox page: new route `/inbox` showing conversations sorted by most recent message, with unread indicators
- [ ] Compose: select recipients from course roster (or all students in course)
- [ ] Unread count in Navbar (integrates with SYL-601 notification system)
- [ ] Messages are Account-scoped: users can only message others within their Account

---

### SYL-404: Email Notifications [P1]

**Description**: Syllabex sends no emails. Users have no way to know about new content, grades, or deadlines without logging in. Every LMS sends email notifications for key events. This is often the primary driver of student engagement.

**Acceptance Criteria**:
- [ ] Django email backend configuration (SMTP settings in Django settings, configurable per Account via `Account.settings` JSONField)
- [ ] New `NotificationPreference` model: `user` (FK), `event_type` (CharField: 'announcement', 'assignment_posted', 'grade_posted', 'due_date_reminder', 'discussion_reply', 'message_received'), `email_enabled` (bool, default True), `in_app_enabled` (bool, default True)
- [ ] Account settings page (frontend): notification preferences with toggles per event type
- [ ] Email templates (Django templates) for each event type with course branding
- [ ] Email sending: asynchronous via Django signals or Celery tasks (if Celery is added) to avoid blocking request/response cycle. For V1, can use Django's `send_mail` in a post-save signal with `connection.on_commit()`
- [ ] Due date reminders: daily job (management command or Celery beat) that sends reminders for assignments due in next 24 hours
- [ ] Unsubscribe link in every email that toggles the specific notification preference
- [ ] Rate limiting: no more than 1 email per event per user per hour (prevent spam from rapid updates)

---

## 5. ENROLLMENT & USER MANAGEMENT

### SYL-501: Bulk Enrollment (CSV Import) [P1]

**Description**: Currently, admins enroll students one at a time through the user management UI (`UserManagement.js`). For classes of 30-300+ students, this is impractical. Every LMS supports CSV-based bulk enrollment.

**Acceptance Criteria**:
- [ ] New API endpoint: `POST /api/courses/<course_id>/enroll/bulk/` accepting CSV file upload
- [ ] CSV format: `email,role` (one row per enrollment). Role defaults to 'student' if omitted
- [ ] Processing: for each row, find user by (email, account) — if user doesn't exist, create with a temporary password and send welcome email (depends on SYL-404). If user exists, create CourseMembership
- [ ] Response: JSON report — `{ "enrolled": 28, "already_enrolled": 2, "errors": [{"row": 5, "email": "bad@", "reason": "Invalid email"}] }`
- [ ] Frontend: "Bulk Enroll" button on course Roster tab, file upload modal, results display with success/error counts
- [ ] CSV template download link so instructors know the expected format
- [ ] Limit: 500 rows per upload to prevent abuse

---

### SYL-502: Self-Enrollment / Join Codes [P1]

**Description**: In Canvas and Google Classroom, instructors can generate a short code (e.g., "ABC123") that students use to enroll themselves. This eliminates admin bottleneck and is the most common enrollment method for small courses or informal settings.

**Acceptance Criteria**:
- [ ] New fields on Course: `join_code` (CharField, max_length=8, unique, nullable), `self_enrollment_enabled` (bool, default False), `self_enrollment_end_date` (DateTimeField, nullable)
- [ ] Auto-generate join code when `self_enrollment_enabled` is set to True (6-char alphanumeric, uppercase)
- [ ] New API endpoint: `POST /api/courses/join/` with `{ "join_code": "ABC123" }` — creates CourseMembership with role='student' for authenticated user
- [ ] Validation: code must be valid, self-enrollment must be enabled, end date not passed, user not already enrolled
- [ ] Instructor UI: toggle in course settings to enable self-enrollment, display join code with copy button, option to regenerate code
- [ ] Student UI: "Join a Course" button on dashboard with code input field

---

### SYL-503: TA / Grader Role [P1]

**Description**: Currently `CourseMembership.role` is either `'student'` or `'instructor'`. There's no middle ground. TAs (Teaching Assistants) are common in higher education — they can grade submissions and view student work but shouldn't be able to modify course structure (edit assignments, manage modules). Canvas, Moodle, and Blackboard all have TA/grader roles.

**Acceptance Criteria**:
- [ ] Add `'ta'` to `CourseMembership.role` choices
- [ ] Define TA permissions: can view all course content, can view all submissions, can grade submissions (`grade-response` endpoint), can post in discussions. Cannot: create/edit/delete assignments, create/edit/delete modules, create/edit/delete pages, modify course settings, manage roster
- [ ] New permission class `IsCourseTA` in `users/permissions.py`
- [ ] Update existing permission checks: `IsCourseInstructor` should NOT include TAs. Create `IsCourseInstructorOrTA` for endpoints TAs can access (e.g., viewing submissions, grading)
- [ ] Frontend: TA role badge in course views. Conditionally hide edit/create buttons from TAs (same pattern as student vs. instructor in existing code)
- [ ] Admin enrollment: ability to assign TA role when adding members to a course
- [ ] Gradebook: TAs can view but the grade export and category configuration remain instructor-only

---

### SYL-504: Observer / Parent Role [P2]

**Description**: An observer (parent/guardian) is linked to a specific student and gets read-only access to that student's courses, grades, and progress. Canvas supports this as a first-class role. Useful for K-12 and some higher-ed contexts.

**Acceptance Criteria**:
- [ ] Add `'observer'` to `CourseMembership.role` choices
- [ ] New `ObserverLink` model: `observer` (FK to User), `student` (FK to User), `course` (FK to Course). An observer sees exactly what their linked student sees (grades, submissions, progress) but cannot submit or post
- [ ] Observer permissions: read-only access to course content, student's grades, student's submissions. No posting, no submitting, no grading
- [ ] Enrollment: admin links an observer to a student in a course. Or self-enrollment via pairing code generated by student
- [ ] Frontend: observer sees a "Viewing as observer of [Student Name]" banner; grade views show the linked student's data
- [ ] Observer excluded from gradebook student counts and assignment statistics

---

## 6. PLATFORM & INFRASTRUCTURE

### SYL-601: Notification System (In-App) [P0]

**Description**: Syllabex has no notification system. Users must manually check each course for updates. Every LMS has a notification center — a bell icon with unread count showing recent events (new grades, new assignments, announcements, discussion replies, approaching deadlines).

This is a P0 because it's the foundation that SYL-401 (Announcements), SYL-402 (Discussions), SYL-403 (Messaging), and SYL-404 (Email) all depend on for delivery.

**Acceptance Criteria**:
- [ ] New `Notification` model: `user` (FK to User), `event_type` (CharField: 'announcement', 'assignment_posted', 'grade_posted', 'due_date_reminder', 'discussion_reply', 'message_received', 'submission_graded'), `title` (CharField), `body` (TextField), `course` (FK, nullable), `link` (CharField — relative URL to navigate to), `is_read` (bool, default False), `created_at`
- [ ] Account-scoped through User relationship
- [ ] API: `GET /api/notifications/` (list, paginated, newest first), `GET /api/notifications/unread-count/`, `POST /api/notifications/<id>/read/`, `POST /api/notifications/mark-all-read/`
- [ ] Backend: utility function `create_notification(user, event_type, title, body, course, link)` called from relevant views/signals when events occur
- [ ] Frontend: bell icon in `Navbar.js` with unread count badge. Dropdown panel showing recent notifications with click-to-navigate. "Mark all read" button
- [ ] Notifications page: `/notifications` route showing full notification history with filtering by type and read/unread
- [ ] Poll for new notifications every 60 seconds (V1), or WebSocket for real-time (V2)
- [ ] Notification creation hooks: called when announcements are posted, assignments are created, grades are entered, discussion replies are made, messages are received

---

### SYL-602: Global Search [P1]

**Description**: There is no search capability in Syllabex. As courses accumulate content (pages, assignments, modules), users need to find things quickly. Canvas has a global search; Moodle has course-scoped search.

**Acceptance Criteria**:
- [ ] API endpoint: `GET /api/search/?q=<query>&type=<optional_filter>` searching across Courses (name, code), Assignments (title, description), Pages (title, body), CourseModules (title), Announcements (title, body)
- [ ] Results scoped to user's accessible content (enrolled courses only, respecting publish/lock visibility)
- [ ] Account-scoped (only content within user's Account)
- [ ] V1: Django ORM `icontains` / `SearchVector` (PostgreSQL full-text search). V2: Elasticsearch/Meilisearch for better relevance
- [ ] Frontend: search bar in `Navbar.js` with type-ahead dropdown showing categorized results (Courses, Assignments, Pages). Click result to navigate
- [ ] Search results page at `/search?q=<query>` with full results, grouped by type, with pagination

---

### SYL-603: Mobile Responsive Audit [P1]

**Description**: Syllabex defines responsive breakpoints (480px, 768px, 1024px) in component CSS, but there has been no systematic audit of all views at mobile sizes. Key flows — taking an assignment, viewing grades, browsing course content — must work well on phones. Every major LMS has native mobile apps; Syllabex should at minimum have a fully responsive web experience.

**Acceptance Criteria**:
- [ ] Audit all pages at 375px (iPhone SE), 390px (iPhone 14), and 768px (iPad) widths
- [ ] Fix identified issues in: `TakeAssignment.js` (question layout, timer), `CourseDetail.js` (tab navigation overflow), `Gradebook` (table horizontal scroll), `Calendar` (event readability), `QuestionBuilder` (choice management)
- [ ] Sidebar: confirm mobile collapse behavior works (existing `SidebarContext` toggle)
- [ ] Touch targets: all interactive elements at least 44x44px per Apple HIG
- [ ] Form inputs: no zoom on focus (set font-size ≥ 16px on mobile inputs)
- [ ] Document findings and fixes in a checklist

---

### SYL-604: Accessibility Audit (WCAG 2.1 AA) [P1]

**Description**: Institutional LMS adoption (universities, school districts) typically requires WCAG 2.1 AA compliance. Canvas, Moodle, and Blackboard all publish VPATs (Voluntary Product Accessibility Templates). Syllabex has not been audited for accessibility.

**Acceptance Criteria**:
- [ ] Run automated audit (axe-core or Lighthouse) on all pages; fix all critical and serious issues
- [ ] Keyboard navigation: all interactive elements reachable via Tab; logical focus order; visible focus indicators (existing `--border-active` can be used for focus rings)
- [ ] Screen reader: all images have alt text; form inputs have associated labels; ARIA landmarks on page regions; dynamic content updates announced via `aria-live`
- [ ] Color contrast: verify all text/background combinations meet 4.5:1 ratio (both dark and light themes)
- [ ] Rich text editor (`RichTextEditor.js`): keyboard-accessible toolbar; screen reader announcements for formatting changes
- [ ] Skip navigation link at top of page
- [ ] Document compliance status per page in an accessibility report

---

### SYL-605: iCal Feed Export [P2]

**Description**: The existing `CalendarPage.js` uses react-big-calendar to display assignments and module dates. Users should be able to subscribe to this calendar from external apps (Google Calendar, Apple Calendar, Outlook) via a standard iCal (.ics) feed URL.

**Acceptance Criteria**:
- [ ] New API endpoint: `GET /api/calendar/feed/<user_token>/` returning `text/calendar` content type with iCal format
- [ ] `user_token`: unique, non-guessable token per user (stored on User model or separate table) — allows unauthenticated calendar subscription without exposing JWT
- [ ] Events include: assignment due dates (VEVENT with DTSTART=due_date), module start dates
- [ ] Event details: title = "[Course Code] Assignment Title", description = assignment description (stripped of HTML)
- [ ] Frontend: "Subscribe to Calendar" button on Calendar page showing the feed URL with copy button
- [ ] Token regeneration option (invalidate old feed URL)

---

### SYL-606: API Documentation (OpenAPI/Swagger) [P2]

**Description**: Syllabex has a REST API but no documentation. For institutional IT integration, third-party development, and developer onboarding, auto-generated API docs are standard. DRF has excellent support for this via `drf-spectacular` or `drf-yasg`.

**Acceptance Criteria**:
- [ ] Install `drf-spectacular` and configure in Django settings
- [ ] Auto-generate OpenAPI 3.0 schema from existing ViewSets and Serializers
- [ ] Serve Swagger UI at `/api/docs/` and ReDoc at `/api/redoc/`
- [ ] Add schema annotations (descriptions, examples) to key serializers and views
- [ ] Authentication documented (JWT Bearer token, X-Account-Slug header)
- [ ] Schema includes all existing endpoints and new endpoints as they are added
- [ ] Accessible only to authenticated admins (or publicly, configurable)

---

## Suggested Prioritization Roadmap

### Phase 1 — Core Gaps (P0s)
Close the most critical gaps that block adoption:
- SYL-601 Notification System (foundation for communication features)
- SYL-401 Announcements
- SYL-402 Discussion Forums
- SYL-101 Rubrics
- SYL-102 File Upload Submissions
- SYL-201 Weighted Grade Categories
- SYL-202 Grade Export
- SYL-301 File/Resource Management

### Phase 2 — Expected Features (P1s)
Features users will expect shortly after onboarding:
- SYL-108 Late Submission Policies
- SYL-104 Quiz Timer & Attempts
- SYL-105 Additional Question Types
- SYL-103 Question Banks
- SYL-205 Letter Grade Schemes
- SYL-302 Content Release Conditions
- SYL-303 Course Templates
- SYL-403 Messaging
- SYL-404 Email Notifications
- SYL-501 Bulk Enrollment
- SYL-502 Self-Enrollment
- SYL-503 TA Role
- SYL-203 Analytics Dashboard
- SYL-204 Student Progress Tracking
- SYL-602 Search
- SYL-603 Mobile Audit
- SYL-604 Accessibility Audit

### Phase 3 — Differentiators (P2s)
Competitive advantages and institutional readiness:
- SYL-106 Group Assignments
- SYL-107 Peer Review
- SYL-304 SCORM/LTI
- SYL-504 Observer Role
- SYL-605 iCal Export
- SYL-606 API Documentation

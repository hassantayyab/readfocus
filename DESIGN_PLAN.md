# DESIGN PLAN.md — ReadFocus App

## 🎨 Design Summary

**ReadFocus** is a student-focused reading companion app designed for high school and college students with attention difficulties. The app ensures that reading is engaging and interactive by breaking content into chunks, highlighting key words, and inserting comprehension checks. The design must feel **light, fun, student-friendly, and not intimidating** — closer to a gamified learning tool than a strict productivity app.

---

## 🖼️ Core Design Principles

- **Clarity:** Minimal clutter, large readable fonts, comfortable spacing.
- **Focus:** Limit distractions on each screen. One main task visible at a time.
- **Engagement:** Use gamification elements (streak counters, XP points, small animations).
- **Friendly:** Bright, positive colors (blue, green, yellow) rather than corporate gray.
- **Consistency:** Same design system across mobile and web.

---

## 📱 Main Screens & Components

### 1. Onboarding Screen

- **Goal:** Explain the app in 2–3 screens.
- Simple illustrations: “Tired of zoning out? → Read in focus mode → Stay engaged & track progress.”
- Input options: [Paste Text] [Upload PDF].
- CTA button: **Start Reading**.

### 2. Home Dashboard

- Shows:
  - [Start New Reading] button.
  - Daily streak counter (🔥 Day 3 streak).
  - Focus time logged today.
  - Quick access to past sessions.
- Design: clean card layout.

### 3. Guided Reading Screen

- **Top bar:** progress bar (% completed), streak icon, timer.
- **Middle section:** text chunk (3–4 sentences max).
  - Keywords highlighted (bold/colored).
  - Option to auto-scroll or tap to continue.
- **Bottom section:**
  - “Did you get it?” button (bright & inviting).
  - Next button (disabled until reading time threshold met).

### 4. Recall Prompt Modal

- Appears when user taps **“Did you get it?”**.
- Simple card with:
  - Question: short, direct.
  - Options: multiple choice or true/false.
  - Feedback: green checkmark for correct, red X + short explanation if wrong.
- Gamification: XP earned (+10 points, streak +1).

### 5. Session End Screen

- Shows:
  - Time spent.
  - % of recall questions answered correctly.
  - XP earned.
  - Streak continuation.
- Fun visual (confetti, pet growing, plant sprouting).

### 6. Stats & Progress Screen

- Graph of reading time over days.
- Accuracy trend (% correct answers).
- Streak history.
- Design: simple, colorful charts.

---

## 🎨 Visual Style Guide

- **Fonts:** Rounded sans-serif (e.g., Inter, Nunito) → easy on eyes.
- **Colors:**
  - Primary: Blue (#3B82F6) → focus & calm.
  - Accent: Green (#10B981) → success/growth.
  - Warning: Red (#EF4444) → incorrect answers.
  - Backgrounds: Light neutral (#F9FAFB).
- **Buttons:** Large, rounded corners, soft shadows.
- **Animations:** Small micro-interactions (button bounce, confetti, progress bar animation).

---

## 🪜 Design Phases

### Phase 1 (MVP Design)

- Onboarding, Home Dashboard, Guided Reading, Recall Prompt, Session End.

### Phase 2 (Enhanced Design)

- Add Stats & Progress screen.
- Gamification animations (pet/plant growth).
- Browser extension UI (pop-up design).

### Phase 3 (Premium Design)

- Reports UI for parents/students.
- Group focus/study mode screen.

---

## 🔑 Deliverables for Designer

- Wireframes for all screens above.
- High-fidelity mockups in Figma.
- Style guide (colors, fonts, button states, icons).
- Interaction design for:
  - Chunk navigation.
  - Recall prompt pop-up.
  - Session end celebration animation.

➡️ With this plan, a designer can create the full **UI/UX system** for ReadFocus that is student-friendly, engaging, and easy to expand in later phases.

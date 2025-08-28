# ReadFocus App Development Roadmap

## 📖 App Summary

**ReadFocus** is a student-focused reading companion app that helps users maintain attention and improve comprehension. It is built for students who struggle with focus (especially those with ADD/ADHD) and often find themselves zoning out, rereading lines, or failing to understand material.

Unlike distraction blockers (like Forest) or speed-reading tools (like Bionic Reading, BeeLine, or Speechify), **ReadFocus combines guided reading, active comprehension checks, and gamification** to transform passive reading into active learning.

**Main Value Proposition:**

- Stay engaged with text through chunked reading and pacing.
- Prevent zoning out with quick comprehension checks ("Did you get it?").
- Reinforce learning through recall prompts and gamified streaks.
- Support both digital (websites, PDFs) and physical text (via OCR snapshot).

---

## ✅ Phase 1 – Barebones MVP

**Goal:** Build a minimal version to validate the concept.

**Features:**

- Copy-paste text input.
- Upload PDF option.
- Guided Reading Mode:
  - Break text into small chunks.
  - Highlight keywords in each chunk.
  - Simple pacing (tap-to-next or auto-scroll).
- "Did you get it?" button:
  - Show recall prompt with predefined question types.
  - Provide correct answer or quick explanation.
- Streak counter + basic focus timer.

**To-Dos:**

- [ ] Implement text input box and PDF upload handler.
- [ ] Implement chunking function to split text.
- [ ] Add keyword highlighting function.
- [ ] Build guided reading view with navigation (tap/scroll).
- [ ] Add basic recall prompt logic (MCQ or true/false).
- [ ] Add streak counter component.
- [ ] Add focus timer component.

---

## 🚀 Phase 2 – Usability Boost

**Goal:** Reduce friction and extend usability.

**Features:**

- Browser extension to capture webpage text.
- Mobile share-to-app functionality.
- Session stats: reading time, focus score, comprehension accuracy.
- Light gamification: XP points and unlockable achievements.

**To-Dos:**

- [ ] Add browser extension text capture.
- [ ] Add share-to-app import for mobile.
- [ ] Implement stats tracking logic.
- [ ] Build stats dashboard UI.
- [ ] Add XP points system.
- [ ] Add achievements unlocking system.

---

## 🌟 Phase 3 – Killer Features

**Goal:** Add AI-powered functionality and stronger differentiation.

**Features:**

- OCR Snapshot: Import text from a photo of a textbook.
- AI Summaries: Generate short summary at the end of session.
- Adaptive Focus: Adjust chunk size/pacing based on performance.
- Deeper gamification: Growing pet/plant linked to comprehension success.

**To-Dos:**

- [ ] Integrate OCR for image-to-text conversion.
- [ ] Add AI summary generation function.
- [ ] Build adaptive focus logic.
- [ ] Design and implement focus pet/plant growth system.

---

## 🏆 Phase 4 – Premium Evolution

**Goal:** Monetize and prepare for bundling.

**Features:**

- Weekly/Monthly focus reports.
- Premium tier ($3–5/month): unlimited OCR scans, advanced stats, AI summaries.
- Export notes & recall prompts to study apps (Quizlet, Notion).
- Optional study groups: focus with friends.

**To-Dos:**

- [ ] Implement report generation logic.
- [ ] Add paywall and subscription system.
- [ ] Add export-to-Quizlet/Notion integration.
- [ ] Implement study group focus feature.

---

## 🔑 Summary of Development Path

- **Phase 1 (MVP):** Text input/PDF upload + Guided Reading + Recall Prompts + Streaks.
- **Phase 2:** Extensions, sharing, stats, gamification.
- **Phase 3:** OCR, AI summaries, adaptive pacing, gamified pet.
- **Phase 4:** Reports, premium tier, integrations, groups.

➡️ This roadmap is structured for incremental builds where each phase produces a usable version while progressively expanding functionality.

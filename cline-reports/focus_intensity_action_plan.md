# TimezonePulse Action Plan for AI Coding Agent  
*Date: 2025-04-07*  

---

## Overview  
This document maps the **3 major** and **10 minor** priorities from the Focus & Intensity report into **concrete, file-specific, DOM-aware coding tasks**. It includes **where** to make changes, **what** to change, **how**, and **why**.  

---

## 1. Sharpen the Core Product

### 1.1 Fix timezone label formatting  
- **Where:**  
  - `components/clock/TimezoneCard.tsx`  
  - `app/components/TimezoneCard.tsx` (legacy)  
- **What:**  
  - Sanitize timezone labels to remove stray parentheses, ensure consistent abbreviations.  
- **How:**  
  - Use regex replace: `.replace(/[()]/g, '')` on timezone name/offset strings before rendering.  
- **Why:**  
  - Improves clarity and professionalism.  

### 1.2 Improve timezone pinning feedback  
- **Where:**  
  - `components/clock/TimezoneCard.tsx`  
- **What:**  
  - Add a subtle scale or color animation on pin/unpin.  
  - Use Framer Motion or Tailwind transitions.  
- **How:**  
  - Animate border color change (e.g., `border-yellow-400`) with transition.  
- **Why:**  
  - Provides instant, intuitive feedback.  

### 1.3 Add timezone abbreviation/offset info  
- **Where:**  
  - `components/clock/TimezoneCard.tsx`  
- **What:**  
  - Display timezone abbreviation (e.g., CST, GMT) or offset under city name.  
- **How:**  
  - Add a `<span>` below `<h3>` with this info, styled smaller.  
- **Why:**  
  - Adds context, reduces confusion.  

### 1.4 Simplify timezone adding flow  
- **Where:**  
  - `components/views/ListView.tsx`  
  - `components/views/MobileV2ListView.tsx`  
- **What:**  
  - Reduce steps/clicks to add timezone.  
  - Clarify CTA labels.  
- **How:**  
  - Change button text to “Add Timezone” only.  
  - Remove redundant subtitles.  
- **Why:**  
  - Streamlines core action.  

### 1.5 Make close (X) buttons larger and touch-friendly  
- **Where:**  
  - Timezone cards in `components/clock/TimezoneCard.tsx`  
- **What:**  
  - Increase button size, padding.  
  - Add hover/focus ring.  
- **How:**  
  - Use Tailwind `p-2` or `p-3`, `rounded-full`, `focus:ring-2`.  
- **Why:**  
  - Improves usability, especially on mobile.  

---

## 2. Polish UI/UX with Intensity

### 2.1 Add onboarding tooltip/hint  
- **Where:**  
  - `components/clock/TimezoneCard.tsx` or root layout  
- **What:**  
  - Show tooltip on first visit: “Right-click to pin a timezone.”  
- **How:**  
  - Use a tooltip library or custom div with absolute positioning.  
  - Hide after dismiss or timeout.  
- **Why:**  
  - Improves discoverability.  

### 2.2 Enhance sidebar active link highlighting  
- **Where:**  
  - `app/components/Sidebar.tsx`  
- **What:**  
  - Add clear active state (bg-primary-700, font-semibold).  
- **How:**  
  - Use Next.js `usePathname()` to compare current route.  
- **Why:**  
  - Improves navigation clarity.  

### 2.3 Smooth timezone card animations  
- **Where:**  
  - `components/clock/TimezoneCard.tsx`  
- **What:**  
  - Animate card enter/exit, hover scale.  
- **How:**  
  - Use Framer Motion or Tailwind transitions.  
- **Why:**  
  - Adds polish, perceived speed.  

### 2.4 Refine Add Timezone button styling  
- **Where:**  
  - `components/views/ListView.tsx`  
  - `components/views/MobileV2ListView.tsx`  
- **What:**  
  - Use solid background, concise label.  
- **How:**  
  - Change from dashed border to filled button (e.g., `bg-primary-600 text-white`).  
- **Why:**  
  - Clearer CTA.  

### 2.5 Improve contrast of day/night bar and animate 'now' highlight  
- **Where:**  
  - Timezone cards, time slot list  
- **What:**  
  - Use more distinct colors for day/night.  
  - Animate 'now' slot background pulse.  
- **How:**  
  - Tailwind gradients, CSS animations.  
- **Why:**  
  - Better visual cues.  

---

## 3. Cut Distractions and Technical Debt

### 3.1 Remove unused decorative backgrounds/overlays  
- **Where:**  
  - `components/views/ListView.tsx`  
  - `components/views/MobileV2ListView.tsx`  
- **What:**  
  - Delete decorative `<div>`s or SVGs not aiding UX.  
- **How:**  
  - Remove from JSX.  
- **Why:**  
  - Reduce clutter, improve focus.  

### 3.2 Audit accessibility labels  
- **Where:**  
  - All interactive elements  
- **What:**  
  - Improve aria-labels (e.g., 'Remove timezone Chicago').  
  - Add missing labels.  
- **How:**  
  - Use descriptive `aria-label` attributes.  
- **Why:**  
  - Better screen reader support.  

### 3.3 Add `<h1>` heading  
- **Where:**  
  - Likely in `app/layout.tsx` or `app/page.tsx`  
- **What:**  
  - Add `<h1>TimezonePulse</h1>` at top of main content.  
- **Why:**  
  - Semantic correctness, SEO, accessibility.  

### 3.4 Add 'Skip to content' link  
- **Where:**  
  - At top of `app/layout.tsx`  
- **What:**  
  - `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>`  
  - Add `id="main-content"` to main container.  
- **Why:**  
  - Improves keyboard navigation.  

### 3.5 Add `role="region"` and labels to timezone cards  
- **Where:**  
  - `components/clock/TimezoneCard.tsx`  
- **What:**  
  - Wrap each card in `<section role="region" aria-label="Timezone Chicago">`  
- **Why:**  
  - Better grouping for screen readers.  

---

## Summary  
This plan provides **file-specific, DOM-aware, actionable steps** for an AI coding agent to implement the Focus & Intensity report.  
Each task includes **where**, **what**, **how**, and **why** to guide precise, high-impact improvements.

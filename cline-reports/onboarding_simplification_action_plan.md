# Onboarding & Simplification Action Plan for TimezonePulse  
*Date: 2025-04-07*  

---

## Overview  
This document translates the onboarding and simplification plan into **concrete, file-specific, DOM-aware coding tasks**. It specifies **where** to make changes, **what** to change, **how**, and **why**.  

---

## 1. Sharpen the Core User Flow

### 1.1 Start with only local timezone card  
- **Where:**  
  - `components/views/MobileV2ListView.tsx`  
- **What:**  
  - Hide all other timezone cards initially, show only the local timezone card.  
- **How:**  
  - Conditionally render timezone cards based on user state (e.g., if no added timezones, only show local).  
- **Why:**  
  - Avoid overwhelming new users with too many timezones.  

### 1.2 Add a large, clear "Add Timezone" ghost card  
- **Where:**  
  - `components/views/MobileV2ListView.tsx`  
- **What:**  
  - Add a dashed border card with plus icon and "Add Timezone" text.  
  - Clicking opens timezone selector modal.  
- **How:**  
  - Style with Tailwind `border-dashed`, `hover:bg-primary-100`.  
  - Use existing modal trigger logic.  
- **Why:**  
  - Guide users to add their first timezone intuitively.  

### 1.3 Show relative offset badges (already done)  
- **Where:**  
  - `components/views/MobileV2ListView.tsx`  
- **What:**  
  - Display offset difference relative to local timezone.  
- **Why:**  
  - Clarifies time differences at a glance.  

---

## 2. Polish UI/UX and Onboarding

### 2.1 Add onboarding hint for first-time users  
- **Where:**  
  - `components/views/MobileV2ListView.tsx`  
- **What:**  
  - Tooltip or banner: "Add a timezone to compare times."  
  - Hide after first timezone is added.  
- **How:**  
  - Use localStorage flag or React state to track if onboarding hint was shown.  
- **Why:**  
  - Improves discoverability for new users.  

### 2.2 Improve timezone card labels  
- **Where:**  
  - `components/views/MobileV2ListView.tsx`  
- **What:**  
  - Label local timezone as "Your Local Time".  
  - Label others with city name only.  
- **Why:**  
  - Reduces confusion about which timezone is local.  

### 2.3 Add "Selected Time" indicator  
- **Where:**  
  - `components/views/MobileV2ListView.tsx`  
- **What:**  
  - When a time is selected, show a fixed banner:  
    `"Selected time: 5:00 PM (Chicago)"`  
  - Include option to clear selection.  
- **How:**  
  - Use fixed position div or notification bar.  
  - Add clear button to reset selection state.  
- **Why:**  
  - Clarifies what user is currently viewing.  

### 2.4 Animate selected time highlight  
- **Where:**  
  - `components/views/MobileV2ListView.tsx`  
- **What:**  
  - Add subtle pulse or glow to selected time slots.  
- **How:**  
  - Use Tailwind animations or Framer Motion.  
- **Why:**  
  - Improves focus and visual feedback.  

---

## 3. Cut Distractions and Simplify

### 3.1 Hide advanced features initially  
- **Where:**  
  - `components/views/MobileV2ListView.tsx`  
- **What:**  
  - Hide pinning, grouping, or extra buttons for new users.  
- **Why:**  
  - Reduce cognitive load during onboarding.  

### 3.2 Simplify Add Timezone modal  
- **Where:**  
  - `components/clock/TimezoneSelector.tsx`  
- **What:**  
  - Use a clear search bar.  
  - Show recent or popular timezones prominently.  
- **Why:**  
  - Enable faster timezone selection.  

### 3.3 Improve accessibility labels  
- **Where:**  
  - All interactive elements (Add Timezone button, timezone cards, close buttons)  
- **What:**  
  - Add descriptive aria-labels.  
- **Why:**  
  - Enhance screen reader support and accessibility.  

---

## Summary  
This plan will make TimezonePulse:  
- Simple and intuitive for new users  
- Focused on the core task of comparing times  
- Visually clear and accessible  
- Easy to extend with advanced features later  
Each task includes **where**, **what**, **how**, and **why** for precise implementation.

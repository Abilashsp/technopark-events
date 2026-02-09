# 🏢 Technopark Events – Hyper-local Campus News Feed

A community-driven web application designed for the Technopark campus, enabling people to **discover and share events, offers, and announcements** specific to their building or location.

🔗 **GitHub Repository:**  
https://github.com/Abilashsp/technopark-events

---

## 🎯 Problem Statement

Many events within Technopark are **informal, community-driven, or location-specific** and never appear on official platforms.  
Existing social media groups are often **noisy, unfocused, and unreliable** for campus-specific discovery.

**Technopark Events** solves this by providing a **single, hyper-local feed** tailored to buildings and locations inside Technopark.

---

## 🚀 Features (MVP)

### 🟢 Public Feed (No Login Required)
- Card-based event feed with **image, title, date, time, and building**
- Read-only access for anonymous users
- **Search & smart filters** by building, date, and status

### 🔐 Authenticated User Actions
- Google OAuth login via Supabase
- Create posts with:
  - Title & description
  - Event date & time
  - Image upload
  - Specific building / location
- Edit & delete **only own posts**
- Report inappropriate content for moderation

### 🛡️ Moderation & Safety
- Report-based moderation workflow
- Role-based access: **User / Admin**
- Admin review panel for reported or pending posts

---

## 🧠 Moderation Roadmap

- **Phase 1 (Current):** Manual admin moderation
- **Phase 2 (Planned):** AI-based image & content moderation after user growth (300+ users)

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Material UI (MUI)

### Backend (BaaS)
- Supabase
  - PostgreSQL (Database)
  - Auth (Google OAuth)
  - Storage (Image uploads – Free tier 5GB)
  - Realtime APIs

---

## 🧩 Data Model

### User
- Name, Email, Profile Image (from Google Auth)
- Role: `user` | `admin`
- Status: `active` | `under_review` | `rejected`

### Post
- Title & description
- Event date & time
- Image URL (Supabase Storage)
- Building / location
- Owner (User reference)
- Report count & visibility status

---

## 🔐 Roles & Permissions

### Regular User
- Public:
  - View, search, and filter events
- Logged-in:
  - Create posts
  - Edit/delete own posts
  - Report posts

### Admin
- Review reported posts
- Accept / reject posts
- Manage user status if required

---

## 📌 Project Status

- **Stage:** MVP development
- **Next:** Admin moderation panel & AI moderation
- **Future:** Mobile app version

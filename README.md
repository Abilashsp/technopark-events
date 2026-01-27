# Technopark Events - Hyper-local Campus News Feed

A community-driven web application connecting people within the Technopark campus. Users can view and share events, offers, and news specific to their building.

**Current Status:** MVP Planning / Frontend Development
**Future Roadmap:** PCM Mobile App

## 🚀 Features (MVP)

### 🟢 Public Feed (No Auth Required)
- **Card View:** Visual feed of events with Image, Title, Date, and Building tags.
- **Smart Filters:** Filter content by specific Building (e.g., "Building 4", "Food Court") or Time ("Today", "This Week").
- **Search:** Basic text search for event titles.

### 🔐 Posting & User Actions (Auth Required)
- **Create Post:** Users must sign in (Google Auth planned) to upload.
- **Anonymous Mode:** Checkbox to post without displaying the user's name publicly (Privacy).
- **Report System:** Users can flag inappropriate content. (Logic: 5 reports = Auto-hide).

### 🛡️ Safety & Moderation
- **AI Content Filtering:** Automatic rejection of NSFW/Adult images during upload (Integration TBD).
- **Identity Tracking:** All posts are linked to a user identity internally for accountability.
- **Admin Dashboard:** Capability to ban users and review flagged posts.

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS
- **Backend:** *To Be Decided*
- **Database:** *To Be Decided*
- **Authentication:** Google OAuth (Implementation TBD)
- **Image Storage:** *To Be Decided*

## 📂 Data Requirements (Logical Model)

### User Entity
- **Identity:** Name, Email, Profile Picture (from Auth Provider)
- **Role:** User / Admin
- **Status:** Active / Banned

### Post Entity
- **Content:** Title (Max 50 chars), Description, Image URL
- **Context:** Building Name (Dropdown selection), Event Date/Time
- **Owner:** Author ID (Linked to User)
- **Settings:** Is Anonymous? (Boolean)
- **Moderation:** Report Count, Visibility Status (Active/Hidden)

## 🏃‍♂️ Getting Started (Frontend)

1. **Clone the repository**
   ```bash
   git clone [https://github.com/yourusername/technopark-events.git](https://github.com/yourusername/technopark-events.git)
   cd technopark-events
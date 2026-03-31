# 🛠️ FixIt Now - Repair Service Booking System

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Academic Level](https://img.shields.io/badge/Academic_Level-200-blue)
![Tech Stack](https://img.shields.io/badge/Tech_Stack-React_%7C_TypeScript_%7C_Firebase-informational)

## 📖 Overview
**FixIt Now** is a comprehensive, web-based repair service booking platform developed as a Level 200 end-of-semester project. The system bridges the gap between customers needing electronic repairs and service administrators, providing a seamless, real-time booking and management experience. 

## 🎯 Academic Objectives
- Apply modern frontend development practices using **React** and **TypeScript**.
- Implement secure user authentication and **Role-Based Access Control (RBAC)**.
- Utilize a NoSQL cloud database (**Firebase Firestore**) for real-time data synchronization.
- Design an intuitive, responsive, and accessible User Interface (UI) using **Tailwind CSS**.

## ✨ Key Features

### 👤 User Portal
- **Authentication:** Secure sign-up and login using Email/Password or Google OAuth.
- **Interactive Dashboard:** Tabbed interface separating active repairs from booking history.
- **Service Booking:** Visual category selection (Smartphones, Laptops, Tablets, Consoles, etc.) with date, time, and issue description.
- **Booking Management:** Edit pending bookings, cancel requests, and easily "Rebook" past services with pre-filled data.
- **Real-time Updates:** Instant status reflections as admins process the repairs.

### 🛡️ Admin Portal
- **Analytics Dashboard:** Summary cards displaying total, pending, in-progress, and completed bookings.
- **Booking Management:** Update repair statuses, view detailed customer information, and delete invalid requests.
- **Data Table:** Paginated data grid with status filtering (10 items per page).
- **Data Export:** One-click export of all booking records to a CSV file for reporting and external analysis.

## 💻 Technology Stack
- **Frontend Core:** React 18, TypeScript, Vite
- **Styling & UI:** Tailwind CSS, Lucide React (Icons), Shadcn UI (Component patterns)
- **Backend & Database:** Firebase Authentication, Cloud Firestore (NoSQL)
- **Routing:** React Router v6
- **Utilities:** Date-fns (Date formatting), Sonner (Toast notifications)

## 🗄️ Database Schema (Firestore)
The application utilizes two primary collections secured by strict Firestore Security Rules:

1. **`users` Collection:**
   - Stores user profiles, roles (`admin` or `user`), and creation timestamps.
2. **`bookings` Collection:**
   - Stores repair requests, linked to users via `userId`.
   - Contains service details, scheduling (date/time), and status tracking (`pending`, `in-progress`, `completed`).

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A Firebase Project with Authentication (Google & Email/Password) and Firestore enabled.

### Steps
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd fixit-now
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Ensure your Firebase configuration is properly set up in `src/lib/firebase.ts` or via a `.env` file depending on your deployment environment.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🔐 Security Highlights
- **Protected Routes:** Unauthorized users cannot access the dashboard, and regular users cannot access the admin panel.
- **Firestore Rules:** Users can only read, create, and update their own bookings. Only administrators have global read/write access.
- **Data Validation:** Frontend validation ensures passwords meet length requirements and booking forms are fully completed before submission.

## 👨‍💻 Author
Developed by **Mustapha Abdulsalam** for the Level 200 End-of-Semester Project.

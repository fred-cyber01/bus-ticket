## Bus Ticketing System — Combined Documentation

This repository contains a full bus ticketing system: backend API, web frontend, and mobile app. This combined README summarizes setup, quick-start, and cleanup notes.

Quick links:
- INSTALLATION.md
- QUICK_START_GUIDE.md
- frontend/FRONTEND_README.md
- RELEASE_NOTES.md

Quick start:

```powershell
# Start backend
cd backend
npm install
npm run dev

# Start frontend
cd frontend
npm install
npm run dev
```

Database:

```sql
CREATE DATABASE ticketbooking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql -u root -p ticketbooking < database/ticketbooking.sql
```

Release/cleanup:
- Tag: `cleanup/remove-node_modules-2026-01-02`
- See `RELEASE_NOTES.md` for details and collaborator instructions.

If you'd like a different README layout or more details, tell me what to include.
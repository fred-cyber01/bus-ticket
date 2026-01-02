## Bus Ticketing System — Combined Documentation

This repository contains a full bus ticketing system: backend API, web frontend, and mobile app. This combined README merges key setup, quick-start, and usage instructions from the project's various documentation files.

**Quick links:**
- [Installation guide](INSTALLATION.md)
- [Quick start scripts and tips](QUICK_START_GUIDE.md)
- [Frontend notes](frontend/FRONTEND_README.md)
- [Dashboard setup](DASHBOARD_SETUP.md)
- [Company registration guide](COMPANY_REGISTRATION_GUIDE.md)
- [API compliance & endpoints](API_COMPLIANCE_FIXES.md)
- [Implementation status](IMPLEMENTATION_STATUS.md)

## Overview

Core components:
- Backend: Node.js + Express (API, auth, payments, subscriptions)
- Frontend: React + Vite (web dashboard and customer views)
- Mobile: React Native / Expo (mobile apps)
- Database: MySQL (schema in database/)

This README summarizes the essential steps to get the system running locally.

## Prerequisites

- Node.js (v18+)
- npm
- MySQL (or XAMPP MySQL)
- (Optional) Android Studio / Xcode for mobile

## Quick Start

Recommended: start XAMPP MySQL first. Then either run the provided script or start services manually.

1) Start servers (easy):

```powershell
.\START_SERVERS.ps1
```

2) Manual start (if script not used):

Backend:
```powershell
cd backend
npm install
npm run dev
```

Frontend (web):
```powershell
cd frontend
npm install
npm run dev
```

Mobile (if using mobile app):
```bash
cd mobile
npm install
npx expo start
```

Frontend dev runs on `http://localhost:5173` and backend on `http://localhost:3000` (or the port in backend/.env).

## Database setup

1. Create the database (MySQL):

```sql
CREATE DATABASE ticketbooking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Import schema:

```powershell
mysql -u root -p ticketbooking < database/ticketbooking.sql
```

See [DATABASE_IMPORT_SUCCESS.md](DATABASE_IMPORT_SUCCESS.md) for verification and sample data.

## Environment configuration

Copy and edit environment files where needed:

```powershell
copy backend\.env.example backend\.env
```

Update DB credentials and `JWT_SECRET` in `backend/.env`.

For the frontend, set `VITE_API_BASE_URL` in `frontend/.env` or use `VITE_API_BASE_URL=http://localhost:3000/api`.

## Default test accounts

- Admin: admin@ticketbus.rw / admin123
- Company manager: manager@rwandaexpress.rw / manager123
- Customer: customer@example.com / customer123

## Important commands

- Start backend: `cd backend && npm run dev`
- Start frontend: `cd frontend && npm run dev`
- Start mobile (Expo): `cd mobile && npx expo start`

## API & Endpoints

Primary API endpoints and spec are in [API_COMPLIANCE_FIXES.md](API_COMPLIANCE_FIXES.md). Key routes:

- Authentication: `/api/auth/signup`, `/api/auth/signin`
- Trips: `/api/trips`, `/api/trips/:id`
- Bookings: `/api/bookings` (replaces tickets)
- Payments & webhooks: `/api/payments`, `/api/webhooks/*`

## Frontend notes

Frontend-specific instructions and structure are in [frontend/FRONTEND_README.md](frontend/FRONTEND_README.md).

## Project status

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for completed, in-progress, and planned work (payments, QR codes, conductor scanning, etc.).

## Troubleshooting

- If you see connection errors, ensure MySQL and backend server are running.
- Clear browser storage if auth issues persist: `localStorage.clear()` or use `clear-storage.html`.
- Ports: if port conflicts occur, update `backend/.env` and `frontend/.env` accordingly.

## Contributing

Please follow the project's code style. For large changes, open an issue first.

## License

MIT License — see LICENSE file.

---

If you'd like any sections expanded or a different organization (single-file vs. short index linking out), tell me which docs to prioritize and I will update the combined README.
cd backend
npm test

# Mobile
cd mobile
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in .env
2. Update database credentials
3. Generate strong JWT secrets
4. Configure email service
5. Deploy to your server (Heroku, AWS, DigitalOcean, etc.)

### Mobile App Deployment
1. **Android:**
   - Generate signed APK/AAB
   - Upload to Google Play Store

2. **iOS:**
   - Archive in Xcode
   - Upload to App Store Connect

## 🤝 Contributing

This is a professional booking system. Maintain code quality and follow the existing patterns.

## 📄 License

MIT License - feel free to use for your projects.

## 👨‍💻 Support

For issues or questions, please create an issue in the repository.

## 🎯 Roadmap

- [ ] Payment gateway integration (Stripe, PayPal, Mobile Money)
- [ ] SMS notifications
- [ ] Email notifications
- [ ] Real-time tracking
- [ ] QR code tickets
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Advanced analytics
- [ ] Loyalty program

---

**Built with ❤️ for Rwanda's transport industry**

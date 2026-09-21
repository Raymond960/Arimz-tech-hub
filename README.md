Shendam Connect

Connecting Shendam to the Digital World.

Shendam Connect is a modern digital platform built to connect people with hotels, businesses, restaurants, attractions, services, opportunities, and other local resources in Shendam LGA, Plateau State, Nigeria.

🌍 Features

- 🏨 Hotel and accommodation listings
- 🏪 Local business directory
- 🍽️ Restaurant listings
- 📍 Interactive locations and maps
- 🗺️ Google Maps directions
- 📞 One-click business calling
- 💬 WhatsApp contact
- 🔎 Search and discovery
- 📢 Announcements and promotions
- 💼 Jobs and opportunities
- 🖼️ Business image galleries
- ⭐ Featured/promoted listings
- 📱 Mobile-first interface
- 🔐 Secure Admin Dashboard
- 📊 Administrative management and analytics

🛠️ Technology

Shendam Connect is built with modern web technologies:

- React
- Vite
- TypeScript/JavaScript
- Tailwind CSS
- React Router
- React Query
- Node.js
- Express.js
- Prisma
- Database-backed content management
- Leaflet / OpenStreetMap
- Capacitor for Android
- Vercel

🔐 Admin Dashboard

The Admin Dashboard provides centralized management of platform content.

Administrators can manage:

- Hotels
- Businesses
- Restaurants
- Attractions
- Services
- Opportunities
- Locations
- Images
- Promotions
- Announcements
- Platform settings
- Administrator accounts and permissions

Public listing information is intended to come from persistent backend/database data rather than hard-coded frontend content.

📍 Location & Maps

Listings can have their own:

- Address
- Area
- Landmark
- LGA
- State
- Latitude
- Longitude
- Map location

Users can open Get Directions to navigate to a listing through Google Maps.

🏨 Hotel Booking

Shendam Connect supports hotel discovery and booking workflows.

The platform can record booking information and payment-verification status while allowing customers to follow the payment method configured for the individual hotel.

Additional online payment and revenue-sharing functionality may be introduced as the platform develops.

📢 Advertising

The platform supports advertising and promotional functionality, including:

- Featured listings
- Sponsored businesses
- Local business advertising
- Google AdMob integration for supported mobile deployments

Advertising can be enabled or disabled through the appropriate configuration.

📱 Android

Shendam Connect can be packaged as an Android application using Capacitor.

The project is designed with a mobile-first interface for users with different screen sizes and network conditions.

🚀 Deployment

The project can be deployed through:

GitHub → Vercel

Vercel is used for hosting the web application and production deployment.

Production environment variables must be configured in Vercel for services such as authentication, database access, email, storage, advertising, and other integrations.

⚙️ Local Development

Install dependencies:

npm install

Start the development server:

npm run dev

Create a production build:

npm run build

Preview the production build:

npm run preview

🔑 Environment Variables

Sensitive credentials must be stored as environment variables.

Example:

DATABASE_URL=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
PAYSTACK_SECRET_KEY=

Never commit passwords, API secrets, Google App Passwords, private keys, or other credentials to GitHub.

🔒 Security

Security controls include protected authentication, administrator authorization, role-based permissions, protected API endpoints, private server data, secure environment variables, and controlled access to administrative functionality.

Security-sensitive changes should be tested before production deployment.

🎯 Vision

Shendam Connect aims to provide Shendam with a centralized digital platform for:

- Tourism
- Hotels and accommodation
- Local businesses
- Restaurants
- Services
- Events and announcements
- Jobs and opportunities
- Business promotion
- Digital discovery
- Future booking and payment services

The platform can eventually expand beyond Shendam LGA to support wider digital tourism and business discovery across Plateau State.

👨‍💻 Developer

Raymond Domnan

Web Designer • Coder • AI Tools Specialist

Shendam Connect

«Connecting Shendam to the Digital World.»

📄 Project Status

Shendam Connect is an actively developed project. Features, integrations, business listings, and platform services may continue to evolve as the project moves through testing and production deployment.

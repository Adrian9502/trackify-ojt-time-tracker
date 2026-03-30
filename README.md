# 🕒 Trackify - OJT Time Tracker

A modern web application for tracking On-the-Job Training (OJT) hours. Built with Next.js, this application helps students and trainees manage their training hours, tasks, and progress towards completion requirements.

![OJT Time Tracker Screenshot](https://github.com/user-attachments/assets/8f4cf114-5225-4c2b-aa5c-d17a56ce652a)

## ✨ Features

- **User Authentication** - Secure sign-in with Google OAuth using NextAuth.js
- **Task Management** - Add, edit, and delete training tasks with detailed information
- **Time Tracking** - Automatic calculation of hours based on time-in and time-out
- **Progress Dashboard** - Visual overview of completed hours, remaining hours, and overall progress
- **Category Organization** - Organize tasks by categories for better tracking
- **Learning Outcomes** - Document what you learned from each task
- **Export Functionality** - Export your training records for reporting
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [Neon PostgreSQL](https://neon.tech/)
- **ORM**: [Prisma 7](https://www.prisma.io/)
- **Authentication**: [NextAuth.js 5](https://next-auth.js.org/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Notifications**: [React Toastify](https://fkhadra.github.io/react-toastify/)
- **Date Handling**: [date-fns](https://date-fns.org/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon recommended)
- Google OAuth credentials

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Adrian9502/ojt-time-tracker.git
   cd ojt-time-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
ojt-time-tracker/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/            # NextAuth configuration
│   │   ├── entries/         # Entry CRUD operations
│   │   └── settings/        # Settings management
│   ├── auth/                # Authentication pages
│   └── page.tsx             # Main dashboard
├── components/              # React components
│   ├── ConfirmationModal.tsx
│   ├── EntryForm.tsx
│   ├── Header.tsx
│   ├── SettingsModal.tsx
│   ├── StatsCard.tsx
│   └── TaskTable.tsx
├── lib/                     # Utility functions and configurations
│   ├── constants.ts
│   ├── prisma.ts
│   ├── types.ts
│   └── utils.ts
├── prisma/                  # Prisma schema and migrations
│   └── schema.prisma
└── public/                  # Static assets
```

## 🔧 Configuration

### Database Schema

The application uses Prisma with the following main models:

- **User** - User authentication and profile
- **Account** - OAuth account linking
- **Session** - User session management
- **Settings** - User-specific OJT settings
- **Entry** - Training day entries
- **Task** - Individual tasks within entries

### Task Categories

You can customize task categories in `lib/constants.ts`:

```typescript
export const CATEGORIES = [
  "Development",
  "Meeting",
  "Documentation",
  "Testing",
  // Add more categories...
];
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy!

The application is configured with automatic Prisma generation during build.

### Environment Variables for Production

Make sure to set these in your production environment:

- `DATABASE_URL` - Your production PostgreSQL connection string
- `NEXTAUTH_URL` - Your production domain
- `NEXTAUTH_SECRET` - A secure random string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

## 📝 Usage

### Adding a Task

1. Click the "+ Add Task" button
2. Fill in the task details:
   - Date
   - Time in and Time out
   - Task description
   - Category
   - Learning outcome (optional)
3. Click "Save Task"

### Editing a Task

1. Click "Edit" on any task in the table
2. Modify the task details
3. Click "Update Task"

### Deleting a Task

1. Click "Delete" on any task
2. Confirm the deletion in the popup modal

### Configuring Settings

1. Click on your profile picture in the header
2. Select "Settings"
3. Update your OJT requirements:
   - Required hours
   - Student name
   - Start and end dates
4. Click "Save Settings"

### Exporting Data

Click the "Export" button to download your training records (feature implementation may vary).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

- GitHub: [@Adrian9502](https://github.com/Adrian9502)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database hosted on [Neon](https://neon.tech/)
- Authentication powered by [NextAuth.js](https://next-auth.js.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

If you found this project helpful, please consider giving it a ⭐️!

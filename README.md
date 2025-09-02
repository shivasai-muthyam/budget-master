# BudgetMaster - Expense Tracker

A modern, responsive expense tracking and budget management application built with HTML, CSS, JavaScript, and Supabase.

## Features

- 🔐 User authentication (login/signup)
- 💰 Expense tracking with categories
- 📊 Interactive charts and analytics
- 🎯 Budget management and goals
- 🌙 Dark/Light theme toggle
- 📱 Responsive design
- 💾 Data export/import functionality

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Backend**: Supabase (PostgreSQL + Auth)
- **Deployment**: Vercel

## Deployment to Vercel

### Prerequisites

1. Make sure you have a [Vercel account](https://vercel.com)
2. Install Vercel CLI (optional):
   ```bash
   npm i -g vercel
   ```

### Deployment Steps

#### Method 1: Using Vercel Dashboard (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/budgetmaster.git
   git push -u origin main
   ```

2. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect it's a static site
   - Click "Deploy"

#### Method 2: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy from your project directory**:
   ```bash
   vercel
   ```

3. **Follow the prompts**:
   - Link to existing project or create new
   - Set project name
   - Confirm deployment settings

### Environment Variables

Make sure your Supabase configuration is correct in the JavaScript files:

```javascript
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
```

### Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Local Development

```bash
# Start local development server
python3 -m http.server 8000

# Or using npm
npm run dev
```

Then open `http://localhost:8000` in your browser.

## Project Structure

```
budgetmaster/
├── index.html          # Main dashboard page
├── login.html          # Login/signup page
├── script.js           # Main JavaScript logic
├── styles.css          # Styles and themes
├── vercel.json         # Vercel configuration
├── package.json        # Project metadata
└── README.md          # This file
```

## Database Setup

Make sure your Supabase database has the following tables:

- `users` - User profiles
- `expenses` - Expense records
- `categories` - Expense categories
- `budgets` - User budgets

## Support

For issues or questions:
1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the [Vercel documentation](https://vercel.com/docs)
3. Open an issue in this repository

## License

MIT License - feel free to use this project for personal or commercial purposes.

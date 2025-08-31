# BudgetMaster Setup Guide

This guide will walk you through setting up BudgetMaster with Supabase authentication and database integration.

## 🚀 Quick Start

1. **Set up Supabase project**
2. **Configure database tables**
3. **Update configuration files**
4. **Test the application**

## 📋 Prerequisites

- A Supabase account (free at [supabase.com](https://supabase.com))
- Basic knowledge of SQL
- Modern web browser

## 🔧 Step 1: Supabase Project Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `budgetmaster` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project setup to complete (2-3 minutes)

### 1.2 Get Project Credentials
1. In your project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## 🗄️ Step 2: Database Setup

### 2.1 Run SQL Commands
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `database-setup.sql`
4. Click "Run" to execute all commands
5. Verify all tables are created in **Table Editor**

### 2.2 Verify Tables Created
You should see these tables in your **Table Editor**:
- `users` - User profiles
- `budgets` - Monthly budgets
- `categories` - Expense categories
- `expenses` - Individual expenses

## ⚙️ Step 3: Configuration

### 3.1 Update Configuration Files
1. **Edit `config.js`**:
   ```javascript
   SUPABASE_URL: 'https://your-project-id.supabase.co',
   SUPABASE_ANON_KEY: 'your-anon-key-here'
   ```

2. **Edit `auth.js`**:
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

3. **Edit `script.js`**:
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

### 3.2 Update HTML Files
1. **Edit `login.html`**:
   - Ensure Supabase script is loaded: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`

2. **Edit `index.html`**:
   - Ensure Supabase script is loaded: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`

## 🔐 Step 4: Authentication Setup

### 4.1 Enable Email Authentication
1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. Configure email templates if desired (optional)

### 4.2 Email Verification (Optional)
1. In **Authentication** → **Settings**
2. Toggle "Enable email confirmations" if you want email verification
3. Configure SMTP settings for custom email provider

## 🧪 Step 5: Testing

### 5.1 Test Authentication
1. Open `login.html` in your browser
2. Try creating a new account
3. Verify you can log in and out
4. Check that you're redirected to the dashboard after login

### 5.2 Test Database Operations
1. Log in to the dashboard
2. Try adding a new expense
3. Verify it appears in the expenses list
4. Check that data persists after page refresh

### 5.3 Test User Isolation
1. Create two different accounts
2. Verify each user only sees their own data
3. Test that users can't access each other's information

## 🔍 Troubleshooting

### Common Issues

#### 1. "Supabase is not defined" Error
- Ensure Supabase script is loaded before your custom scripts
- Check that the script URL is correct and accessible

#### 2. Authentication Errors
- Verify your Supabase URL and anon key are correct
- Check that email authentication is enabled
- Ensure RLS policies are properly configured

#### 3. Database Permission Errors
- Verify RLS policies are enabled on all tables
- Check that the `handle_new_user` function exists
- Ensure proper permissions are granted to authenticated users

#### 4. CORS Errors
- Add your domain to Supabase CORS settings
- For local development, add `localhost:3000` or your local port

### Debug Steps
1. **Check Browser Console** for JavaScript errors
2. **Check Network Tab** for failed API requests
3. **Verify Supabase Dashboard** for authentication logs
4. **Check Database Logs** for SQL errors

## 🔒 Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies automatically filter data by `user_id`

### Authentication
- Secure password storage (handled by Supabase)
- Session management with automatic expiration
- Email verification support

### Data Validation
- Input validation on frontend and backend
- SQL injection protection through parameterized queries
- XSS protection through proper escaping

## 📱 Deployment

### Local Development
1. Use a local web server (e.g., Live Server in VS Code)
2. Ensure all files are in the same directory
3. Test with different browsers

### Web Hosting
1. Upload all files to your web hosting service
2. Update Supabase CORS settings with your domain
3. Test authentication and database operations
4. Monitor for any errors in production

### Environment Variables (Advanced)
For production, consider using environment variables:
```javascript
const SUPABASE_URL = process.env.SUPABASE_URL || 'fallback-url';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'fallback-key';
```

## 🔄 Updates and Maintenance

### Database Migrations
- Always backup your data before making schema changes
- Test changes in a development environment first
- Use Supabase migrations for complex schema updates

### Security Updates
- Keep Supabase client library updated
- Monitor Supabase security advisories
- Regularly review RLS policies

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Authentication Best Practices](https://supabase.com/docs/guides/auth/auth-overview)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check browser console for error messages
4. Verify all configuration values are correct

---

**🎉 Congratulations!** Your BudgetMaster app is now set up with professional-grade authentication and database integration.


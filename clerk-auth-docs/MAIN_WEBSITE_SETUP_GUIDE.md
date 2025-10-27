# Main Website Setup Guide

This guide will help you set up your main website with Clerk authentication and document editor integration.

## Prerequisites

- Node.js 18+ installed
- Clerk account and application created
- Document editor running on port 3001

## Step 1: Create Next.js Project

```bash
npx create-next-app@latest main-website --typescript --tailwind --eslint --app
cd main-website
```

## Step 2: Install Dependencies

```bash
npm install @clerk/nextjs
```

## Step 3: Set Up Environment Variables

Create `.env.local` file in your main website root:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Document Editor URL
NEXT_PUBLIC_DOCUMENT_EDITOR_URL=http://localhost:3001
```

## Step 4: Replace Files

Replace the following files in your main website:

### 1. `app/layout.js`
Replace with the content from `MAIN_WEBSITE_LAYOUT.js`

### 2. `app/page.js`
Replace with the content from `MAIN_WEBSITE_PAGE.js`

### 3. `app/sign-in/[[...sign-in]]/page.js`
Create this file with content from `MAIN_WEBSITE_SIGNIN.js`

### 4. `app/sign-up/[[...sign-up]]/page.js`
Create this file with content from `MAIN_WEBSITE_SIGNUP.js`

### 5. `app/globals.css`
Replace with content from `MAIN_WEBSITE_GLOBALS.css`

### 6. `next.config.js`
Replace with content from `MAIN_WEBSITE_NEXT.config.js`

### 7. `tailwind.config.js`
Replace with content from `MAIN_WEBSITE_TAILWIND.config.js`

### 8. `postcss.config.js`
Replace with content from `MAIN_WEBSITE_POSTCSS.config.js`

## Step 5: Configure Clerk

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or use existing one
3. Copy the publishable key and secret key
4. Update your `.env.local` file with the actual keys

## Step 6: Set Up Clerk URLs

In your Clerk Dashboard:

1. Go to **Configure** → **Paths**
2. Set the following paths:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/`
   - After sign-up URL: `/`

## Step 7: Test the Integration

1. Start your main website:
   ```bash
   npm run dev
   ```

2. Start your document editor (in another terminal):
   ```bash
   cd ../google-docs
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

4. Test the flow:
   - Sign up for a new account
   - Sign in with your account
   - Click "Create Document" to open the editor
   - Verify you're authenticated in the editor

## Step 8: Customize the UI

You can customize the main website by:

1. **Updating colors** in `tailwind.config.js`
2. **Modifying the layout** in `app/layout.js`
3. **Adding more features** in `app/page.js`
4. **Styling components** in `app/globals.css`

## File Structure

Your main website should have this structure:

```
main-website/
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── globals.css
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.js
│   └── sign-up/
│       └── [[...sign-up]]/
│           └── page.js
├── .env.local
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Troubleshooting

### Common Issues:

1. **Clerk not loading**: Check your environment variables
2. **CORS errors**: Make sure document editor is running on port 3001
3. **Authentication not working**: Verify Clerk configuration
4. **Styling issues**: Check Tailwind CSS configuration

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables are loaded
3. Test Clerk authentication in isolation
4. Check network requests in browser dev tools

## Next Steps

Once your main website is set up:

1. **Add more features** like document management
2. **Customize the UI** to match your brand
3. **Add user profiles** and settings
4. **Implement document sharing** features
5. **Add real-time collaboration** features

## Support

If you encounter any issues:

1. Check the [Clerk Documentation](https://clerk.com/docs)
2. Review the [Next.js Documentation](https://nextjs.org/docs)
3. Check the browser console for error messages
4. Verify all environment variables are set correctly

Your main website is now ready with Clerk authentication and document editor integration!

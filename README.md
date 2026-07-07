<div align="center">
  <h1>Nova AI Chat</h1>
  <p>A premium AI chat application with authentication, database integration, and payment processing</p>
</div>

# Nova AI Chat

A modern, full-featured AI chat application built with React, TypeScript, and integrated with Supabase for authentication and database, Stripe for payments, and Gemini AI for responses.

## About Me

**Name:** Waqar Haider

**University:** The University Of Faisalabad

**Fellowship Track:** Track 2 NLP & AI Agents Visibility Bots Innovation Lab AI Summer Internship

**Career Goals:** To become a leading AI engineer specializing in NLP and intelligent agents, building innovative solutions that bridge human-computer interaction.

**Technical Skills:**
- React & TypeScript
- Node.js & Express
- Supabase & PostgreSQL
- Stripe Integration
- Google Gemini API
- AI/ML Fundamentals
- Full-stack Development

**Learning Goals:**
- Master advanced NLP techniques
- Build production-grade AI agents
- Develop scalable backend systems
- Enhance UI/UX design skills

## Features

- **User Authentication**: Secure login/signup with Supabase Auth
- **Chat Management**: Create, edit, delete, and organize chat sessions
- **AI Integration**: Powered by Google Gemini API
- **Database**: Persistent chat history with Supabase PostgreSQL
- **Payment Processing**: Stripe integration for premium subscriptions
- **Responsive Design**: Beautiful UI with dark mode support
- **Export Options**: Download conversations as Markdown or JSON
- **Voice Input**: Speech-to-text for hands-free messaging

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe
- **AI**: Google Gemini API
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Gemini API key

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nova-ai-chat.git
   cd nova-ai-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   STRIPE_PUBLIC_KEY=your_stripe_public_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```

4. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL migration in `supabase/migrations/001_initial_schema.sql`
   - Enable Email Auth in Supabase Dashboard

5. **Set up Stripe**
   - Create an account at [stripe.com](https://stripe.com)
   - Create products and prices for your subscription plans
   - Set up webhook endpoints for your domain

6. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure environment variables**
   Add the same environment variables from `.env` to Vercel's environment settings

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm run start
   ```

## Database Schema

The application uses the following Supabase tables:

- **profiles**: User profile information
- **chat_sessions**: Chat conversation sessions
- **messages**: Individual messages within sessions
- **subscriptions**: User subscription information

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## API Endpoints

- `POST /api/chat` - Send message to AI
- `GET /api/health` - Health check endpoint

## Project Structure

```
nova-ai-chat/
├── src/
│   ├── components/       # React components
│   ├── lib/             # Utility functions and integrations
│   ├── types.ts         # TypeScript type definitions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── supabase/
│   └── migrations/      # Database migrations
├── server.ts            # Express server
├── vercel.json          # Vercel configuration
└── package.json         # Dependencies and scripts
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run TypeScript linter

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions, please open an issue on GitHub.

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


## Technical Research Report

The Evolution of AI Agents and Modern AI Engineering
Technical Research Report

# 1. LLM Applications

Large Language Model (LLM) applications are the foundational layer of modern AI engineering: a single request-response pipeline where a user prompt is sent to a model (e.g. GPT-4, Claude, Gemini) and a completion is returned. Early LLM applications were largely stateless — chatbots, summarizers, and Q&A tools built by prompt engineering alone. The next stage added Retrieval-Augmented Generation (RAG), where relevant documents are fetched from a vector database and injected into the context window before generation, grounding answers in external knowledge. Real-world examples include ChatGPT's basic chat mode, customer-support Q&A bots, and document-summarization tools embedded in products like Notion AI. These applications are reactive: they respond once per turn and have no ability to independently pursue a multi-step goal, which motivated the shift toward AI agents.

# 2. AI Agents

An AI agent extends an LLM application with autonomy: given a goal, it plans, acts, observes results, and iterates until the goal is satisfied — without a human specifying each step. The LLM becomes a reasoning “controller” wrapped in a loop of Perceive → Plan → Act → Observe. This pattern was popularized by the ReAct (Reason+Act) prompting method and operationalized in tools such as AutoGPT, GitHub Copilot's agent mode, and Claude Code / Claude Agent SDK, which power autonomous coding agents like Devin and Claude's own computer-use agents. Figure 1 contrasts the simple LLM pipeline with the agentic loop.

Figure 1. Linear LLM application pipeline (A) vs. an autonomous agent loop with feedback (B).

# 3. Tool Calling

Tool calling (a.k.a. function calling) lets an LLM invoke external functions — web search, code execution, database queries, or third-party APIs — by emitting a structured JSON call that the host application executes and feeds back as an observation. This is the mechanism that turns a language model into an actor in the real world. Anthropic and OpenAI both expose native tool-use APIs, and the Model Context Protocol (MCP), introduced by Anthropic in late 2024, has become a widely adopted open standard for connecting agents to external tools and data sources in a model-agnostic way. Real-world examples: Claude in Chrome browsing the web, Claude for Excel manipulating spreadsheets, and ChatGPT plugins/Actions calling third-party services.

# 4. Memory

Because LLMs are stateless between calls, agents need explicit memory. Short-term (working) memory lives in the context window — the running conversation and recent tool outputs. Long-term memory persists across sessions, typically via vector databases (Pinecone, Chroma, pgvector) for semantic recall, or structured stores for facts and preferences (as in this very product's cross-conversation memory feature). Memory allows agents to avoid repeating work, personalize behavior, and reason over information larger than the context window through retrieval. Figure 2 shows memory as a component the planner reads from and writes to on every loop iteration.

# 5. Planning

Planning is how an agent decomposes a high-level goal into an ordered sequence of executable steps. Approaches range from simple single-step ReAct reasoning, to explicit task-decomposition (plan-and-execute), to tree-based search (Tree-of-Thoughts) for exploring multiple solution paths. Modern coding agents like Devin and Claude Code combine planning with self-correction: after each tool call, the agent re-evaluates whether the plan still holds and revises it if a step fails. This closes the loop between planning and execution shown in Figure 2.

Figure 2. Detailed agent architecture showing the planner, memory store, tool-calling layer, and the observe-iterate loop.

# 6. Multi-Agent Systems

As tasks grow complex, a single monolithic agent becomes hard to control and debug, motivating multi-agent systems where specialized agents collaborate under an orchestrator. Common patterns include orchestrator-worker (a lead agent routes subtasks to specialist agents), debate/critique (agents check each other's work), and role-based crews. Frameworks such as LangGraph, Microsoft's Agent Framework (successor to AutoGen), CrewAI, OpenAI's Agents SDK, and Google's ADK are the dominant orchestration layers used in production in 2026, with LangGraph reporting the largest enterprise deployment footprint and CrewAI favored for fast prototyping of role-based teams. Real-world example: a software-engineering multi-agent system with a planning agent, a coding agent, and a QA/review agent working over a shared task board, mirrored in Figure 3.

Figure 3. Orchestrator-worker multi-agent pattern with a shared memory/blackboard for coordination.

# 7. Future of AI Engineering

Standardized interoperability: protocols like MCP are becoming the “USB-C for AI tools,” letting any agent connect to any tool or data source without custom glue code.
Agent-native infrastructure: observability, evaluation, and guardrail tooling (LangSmith, tracing, sandboxed execution) is maturing as agents move from demos to production.
Convergence toward fewer, more capable frameworks after 2024-2025's Cambrian explosion of agent libraries, as noted across current framework comparisons.
Longer-horizon autonomy: agents increasingly execute multi-hour tasks (e.g., full coding projects) with human checkpoints rather than turn-by-turn supervision.
AI engineering as a discipline is shifting from prompt engineering toward system design: context management, tool design, evaluation harnesses, and safety guardrails are now core skills.

# References

1. Yao, S. et al. “ReAct: Synergizing Reasoning and Acting in Language Models.” ICLR 2023.
2. Anthropic. “Introducing the Model Context Protocol.” anthropic.com/news, Nov. 2024.
3. LangChain. “The Best AI Agent Frameworks in 2026.” langchain.com/resources/ai-agent-frameworks.
4. Presenc AI. “Multi-Agent Orchestration Frameworks 2026 (LangGraph, CrewAI, AutoGen, Swarm).” presenc.ai/research, May 2026.
5. DEV Community. “LangGraph vs CrewAI vs AutoGen: The Complete Multi-Agent AI Orchestration Guide for 2026.” dev.to, Jun. 2026.
6. Alice Labs. “Best AI Agent Frameworks 2026: 7 Compared.” alicelabs.ai/en/insights, Jun. 2026.
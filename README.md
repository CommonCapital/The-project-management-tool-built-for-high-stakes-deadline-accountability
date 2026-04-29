# APEX

**The project management tool built for high-stakes deadline accountability.**

Built because a VC partner missed an LP call. Tasks were assigned. Reminders were sent. Everyone assumed someone else had it covered. No one did.

---

## What is APEX?

APEX is an open-source, self-hosted project management platform designed for teams where missing a deadline has real consequences — investor calls, LP meetings, regulatory filings, board presentations.

Most project management tools are built for software teams shipping features. **APEX is built for the operators, chiefs of staff, and investors who run the machine behind the scenes** — where a missed deadline isn't a sprint setback, it's a relationship destroyed.

## The Problem It Solves

Deadlines slip not because people are lazy — they slip because:

- **Fragmentation**: Tasks live in Slack threads, email chains, and verbal conversations.
- **Noise**: Reminders are single-point notifications that get buried.
- **Bystander Effect**: Nobody escalates until it's too late.
- **Opacity**: There is no single source of truth.

APEX creates that source of truth and backs it with an automatic **escalation engine** that doesn't let critical tasks go quietly overdue.

---

## Core Features

### 🚨 Deadline Escalation Engine
Not just a reminder. A cascade.
- **T-72h**: Assignee and manager notified.
- **T-24h**: Assignee, manager, and admin alerted. Task flagged as "At Risk" if still untouched.
- **T-2h**: Critical alert across all levels. Google Calendar event updated.
- **T-0**: Immediate escalation. Task turns red across every view. Admin receives overdue digest.

### ✅ Task Management
Full task lifecycle with priorities, dependencies, recurring tasks, completion submissions, and a **two-step review flow**. Members submit, admins approve. No self-signing.

### 📅 Google Calendar Sync
Every deadline becomes a calendar event for every assignee. Updates when the deadline moves. Disappears when the task is done.

### 💬 Real-time Chat
Channels, DMs, @mentions, file attachments, and thread replies — all scoped to your organization. No more context living in Slack while tasks live somewhere else.

### 📊 Admin Dashboard & Analytics
Kanban across all projects. Workload per team member. Upcoming deadlines. Activity feed. Audit log. Includes burndown charts, team velocity, and workload heatmaps.

---

## Design Philosophy

**APEX is intentionally monochrome and institutional.**

- **No Gradients**: No rounded pill buttons. No pastel priority colors.
- **Sharp Edges**: Dense information, 1px borders, Inter and IBM Plex Mono typography.
- **Critical Color**: Color is reserved for one purpose — **RED means something is wrong.** When a task turns red in APEX, you feel it.

The aesthetic is closer to a Bloomberg Terminal or a Vercel dashboard than a typical SaaS product. This is intentional — the tool should feel as serious as the work it supports.

---

## Technical Architecture

APEX is built as a high-performance monorepo designed for real-time reliability.

- **Frontend**: Next.js 14 (App Router, Server Components)
- **API**: tRPC (Type-safe communication)
- **Real-time**: Custom WebSocket Server + Redis Pub/Sub
- **Auth**: Better-auth (Multi-tenancy + 2FA)
- **Database**: PostgreSQL + Drizzle ORM
- **Worker**: Standalone Node.js process for Cron jobs and the Escalation Engine.

---

## Getting Started

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 20+

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/CommonCapital/The-project-management-tool-built-for-high-stakes-deadline-accountability.git
cd apex

# Install dependencies
npm install

# Setup environment
cp apps/web/.env.example apps/web/.env.local
```

### 3. Launch
```bash
# Start infrastructure (Postgres, Redis)
docker-compose up -d

# Run migrations
npx drizzle-kit migrate

# Start the application
npm run dev
```

---

&copy; 2026 APEX Systems // High-Stakes Operational Intelligence.
# The-project-management-tool-built-for-high-stakes-deadline-accountability

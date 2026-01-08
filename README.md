# 10xdevs-flashcards

[![Project Status: MVP Complete](https://img.shields.io/badge/status-MVP_complete-green.svg)](https://github.com/10xdevs/10xdevs-flashcards)
[![Node Version](https://img.shields.io/badge/node-22.14.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A web-based learning tool designed for "casual learners" to streamline the creation of educational flashcards by leveraging AI.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

The **10xdevs-flashcards** application is a web-based learning tool designed for "casual learners." It aims to streamline the creation of educational flashcards by leveraging AI. The core feature allows users to paste a block of text (up to 5000 characters) and automatically generate flashcard candidates using AI, which they can then review, edit, and save. The application also supports manual flashcard creation and management.

## Tech Stack

The project is built with modern web technologies and follows best practices for type safety, testing, and code quality:

### Frontend
- **[Astro](https://astro.build/)** (v5.13.7) - Modern web framework for content-focused websites
- **[React](https://react.dev/)** (v19.1.1) - UI component library
- **[TypeScript](https://www.typescriptlang.org/)** (v5) - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** (v4.1.13) - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Re-usable components built with Radix UI

### State Management & Forms
- **[Zustand](https://zustand-demo.pmnd.rs/)** (v5.0.9) - Lightweight state management
- **[React Hook Form](https://react-hook-form.com/)** (v7.69.0) - Performant form handling
- **[Zod](https://zod.dev/)** (v3.25.76) - TypeScript-first schema validation

### Backend and Database
- **[Supabase](https://supabase.io/)** - Backend-as-a-Service for authentication and database
  - PostgreSQL database
  - Row-level security
  - Real-time subscriptions

### AI Integration
- **[OpenRouter.ai](https://openrouter.ai/)** - AI model routing service for flashcard generation

### Testing
- **[Vitest](https://vitest.dev/)** (v4.0.16) - Unit and integration testing framework
- **[React Testing Library](https://testing-library.com/react)** (v16.3.1) - React component testing
- **[Playwright](https://playwright.dev/)** (v1.57.0) - End-to-end testing
- **[@vitest/coverage-v8](https://vitest.dev/guide/coverage.html)** - Code coverage reporting

### Development Tools
- **[ESLint](https://eslint.org/)** - Linting with TypeScript, React, and Astro rules
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Husky](https://typicode.github.io/husky/)** - Git hooks for pre-commit checks
- **[lint-staged](https://github.com/okonet/lint-staged)** - Run linters on staged files

### Hosting & CI/CD
- **[GitHub Actions](https://github.com/features/actions)** - Continuous integration and deployment
- **[Cloudflare Pages](https://pages.cloudflare.com/)** - Production hosting with global CDN

## Getting Started Locally

To get the project running on your local machine, follow these steps:

### Prerequisites

- **Node.js** v22.14.0 (specified in `.nvmrc`)
- **npm** (comes with Node.js)
- **Supabase account** for database and authentication
- **OpenRouter.ai API key** for AI flashcard generation

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/10xdevs/10xdevs-flashcards.git
   cd 10xdevs-flashcards
   ```

2. **Set up the Node.js version:**

   This project uses a specific version of Node.js. If you have `nvm` (Node Version Manager) installed, you can use:

   ```sh
   nvm use
   ```

   If you don't have `nvm`, please install Node.js version **22.14.0** from [nodejs.org](https://nodejs.org/).

3. **Install dependencies:**

   ```sh
   npm install
   ```

4. **Set up environment variables:**

   Create a `.env` file in the project root with the following variables:

   ```env
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key

   # OpenRouter
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

   > **Note:** Contact the project maintainers or refer to the project's internal documentation for the actual values.

5. **Run the development server:**

   ```sh
   npm run dev
   ```

   The application will be available at `http://localhost:3000`.

## Available Scripts

In the project directory, you can run the following commands:

### Development

- **`npm run dev`** - Runs the app in development mode at `http://localhost:3000`
- **`npm run dev:e2e`** - Runs the app in test mode for E2E testing
- **`npm run build`** - Builds the app for production to the `dist/` folder
- **`npm run preview`** - Runs a local preview of the production build

### Code Quality

- **`npm run lint`** - Lints the project files (TypeScript, React, Astro)
- **`npm run lint:fix`** - Lints and automatically fixes problems where possible
- **`npm run format`** - Formats all code using Prettier

### Testing - Unit & Integration

- **`npm test`** - Run all unit and integration tests once
- **`npm run test:unit`** - Run only unit tests
- **`npm run test:integration`** - Run only integration tests
- **`npm run test:watch`** - Run tests in watch mode (re-runs on file changes)
- **`npm run test:watch:unit`** - Run unit tests in watch mode
- **`npm run test:watch:integration`** - Run integration tests in watch mode
- **`npm run test:ui`** - Open Vitest UI for interactive test exploration
- **`npm run test:coverage`** - Run tests with coverage report
- **`npm run test:coverage:unit`** - Run unit tests with coverage report
- **`npm run test:coverage:integration`** - Run integration tests with coverage report

### Testing - End-to-End (E2E)

- **`npm run test:e2e`** - Run Playwright E2E tests in headless mode
- **`npm run test:e2e:ui`** - Run E2E tests in interactive UI mode
- **`npm run test:e2e:debug`** - Run E2E tests in debug mode with step-by-step execution
- **`npm run test:e2e:codegen`** - Generate E2E test code using Playwright's codegen tool

### Testing - All

- **`npm run test:all`** - Run all tests (unit, integration, and E2E)

### Testing Documentation

For detailed testing guides and best practices:

- **Unit & Integration Tests:** [src/test/README.md](src/test/README.md)
- **E2E Tests - Writing Tests:** [e2e/README.md](e2e/README.md)
- **E2E Tests - Setup & Running:** [PLAYWRIGHT-GUIDE.md](PLAYWRIGHT-GUIDE.md)
- **Test IDs Reference:** [TEST-IDS.md](TEST-IDS.md)

## Project Scope

### In Scope for MVP

- ✅ AI-generated flashcards from user-pasted text (up to 5000 characters)
- ✅ Full manual flashcard creation and editing capabilities
- ✅ Browsing, editing, and deleting saved flashcards
- ✅ Simple email and password user account system for storing flashcards
- ✅ Single, searchable list for all user flashcards
- ✅ Web-only application

### Out of Scope for MVP

- ❌ Integration with a pre-existing open-source spaced-repetition algorithm
- ❌ Developing a custom, advanced spaced-repetition algorithm
- ❌ Importing content from various file formats (PDF, DOCX, etc.)
- ❌ Sharing flashcard sets or collaborating between users
- ❌ Integrations with other educational platforms (LMS, etc.)
- ❌ Native mobile applications (iOS, Android)
- ❌ Organizing flashcards into decks or folders

## Project Status

The project has **completed its MVP (Minimum Viable Product)** phase. All core features have been implemented and tested:

- ✅ User authentication (registration, login, logout)
- ✅ AI-powered flashcard generation
- ✅ Manual flashcard creation and management
- ✅ Flashcard library with search and filtering
- ✅ Comprehensive test coverage (unit, integration, E2E)
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Production deployment on Cloudflare Pages

The application is ready for production use.

## Deployment

The application is automatically deployed to Cloudflare Pages when changes are pushed to the `master` branch. The deployment pipeline includes:

1. **Code Linting** - Ensures code quality standards
2. **Unit Tests** - Validates individual components and functions
3. **Build** - Creates optimized production bundle
4. **Deploy** - Publishes to Cloudflare Pages global CDN

### Required Secrets

For the CI/CD pipeline to work, the following GitHub secrets must be configured:

- `CLOUDFLARE_API_TOKEN` - API token for Cloudflare deployment
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous key
- `OPENROUTER_API_KEY` - OpenRouter API key for AI generation

> **Note:** The Cloudflare project name (`10xdevs-flashcards`) is configured in `wrangler.toml`.

### Cloudflare Configuration (Required Before First Deploy!)

**⚠️ Important:** Configure these settings in Cloudflare dashboard BEFORE pushing to master:

1. **Environment Variables** (Settings → Environment variables):
   - Add `SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY`

2. **Compatibility Flag** (Settings → Functions → Compatibility flags):
   - Add `nodejs_compat` flag
   - This is **required** for React 19 - deployment will fail without it!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup instructions.

## License

This project is licensed under the **MIT License** - see the [LICENSE.md](LICENSE.md) file for details.

Copyright (c) 2024 10xdevs

---

**Need help?** Check out the [testing documentation](src/test/README.md) or open an issue on GitHub.

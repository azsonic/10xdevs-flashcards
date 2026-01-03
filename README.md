# 10xdevs-flashcards

[![Project Status: Initial Development](https://img.shields.io/badge/status-initial_development-blue.svg)](https://github.com/10xdevs/10xdevs-flashcards)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A web-based learning tool designed for "casual learners" to streamline the creation of educational flashcards by leveraging AI.
voila
## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

The **10xdevs-flashcards** application is a web-based learning tool designed for "casual learners." It aims to streamline the creation of educational flashcards by leveraging AI. The core feature allows users to paste a block of text and automatically generate flashcard candidates, which they can then review, edit, and save. The application also supports manual flashcard creation and management. Saved flashcards can be studied using an integrated spaced repetition system to enhance learning efficiency.

## Tech Stack

The project is built with the following technologies:

- **Frontend:**
  - [Astro 5](https://astro.build/)
  - [React 19](https://react.dev/)
  - [TypeScript 5](https://www.typescriptlang.org/)
  - [Tailwind CSS 4](https://tailwindcss.com/)
  - [Shadcn/ui](https://ui.shadcn.com/)
- **Backend and Database:**
  - [Supabase](https://supabase.io/)
- **AI Integration:**
  - [Openrouter.ai](https://openrouter.ai/)
- **Testing:**
  - [Vitest](https://vitest.dev/) - Unit testing framework
  - [React Testing Library](https://testing-library.com/react) - React component testing
  - [Playwright](https://playwright.dev/) - End-to-end testing
- **CI/CD and Hosting:**
  - [GitHub Actions](https://github.com/features/actions)
  - [DigitalOcean](https://www.digitalocean.com/)

## Getting Started Locally

To get the project running on your local machine, follow these steps:

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/10xdevs/10xdevs-flashcards.git
    cd 10xdevs-flashcards
    ```

2.  **Set up the Node.js version:**
    This project uses a specific version of Node.js. If you have `nvm` (Node Version Manager) installed, you can use the following command to switch to the correct version:

    ```sh
    nvm use
    ```

    If you don't have `nvm`, please install Node.js version `22.14.0`.

3.  **Install dependencies:**

    ```sh
    npm install
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

In the project directory, you can run the following commands:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run preview`: Runs a local preview of the production build.
- `npm run lint`: Lints the project files.
- `npm run lint:fix`: Lints and automatically fixes problems.
- `npm run format`: Formats the code using Prettier.

## Project Scope

### In Scope for MVP

- AI-generated flashcards from user-pasted text (up to 5000 characters).
- Full manual flashcard creation and editing capabilities.
- Browsing, editing, and deleting saved flashcards.
- A simple email and password user account system for storing flashcards.
- Integration with a pre-existing open-source spaced-repetition algorithm.
- A single, searchable list for all user flashcards.
- Web-only application.

### Out of Scope for MVP

- Developing a custom, advanced spaced-repetition algorithm.
- Importing content from various file formats (PDF, DOCX, etc.).
- Sharing flashcard sets or collaborating between users.
- Integrations with other educational platforms (LMS, etc.).
- Native mobile applications (iOS, Android).
- Organizing flashcards into decks or folders.

## Project Status

The project is currently in the **initial development phase**. The core features are being built, and the application is not yet ready for production use.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

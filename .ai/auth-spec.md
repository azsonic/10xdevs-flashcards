# Authentication Architecture Specification

## 1. User Interface Architecture

### 1.1 Frontend Pages

The authentication flow will introduce new Astro pages and modify existing layouts to support user sessions.

*   **`src/pages/login.astro`**
    *   **Access**: Public (Guest only).
    *   **Content**: Renders the `LoginForm` component centered in a layout.
    *   **Behavior**: Redirects to the dashboard (`/`) if the user is already authenticated.
*   **`src/pages/register.astro`**
    *   **Access**: Public (Guest only).
    *   **Content**: Renders the `RegisterForm` component.
    *   **Behavior**: Redirects to the dashboard (`/`) if the user is already authenticated.
*   **`src/pages/api/auth/signout.ts`**
    *   **Type**: API Route.
    *   **Purpose**: Handles the server-side logout process (cookie clearing) and redirects to the login page.
*   **`src/pages/api/auth/callback.ts`**
    *   **Type**: API Route.
    *   **Purpose**: Handles the server-side exchange of code for session (required for robust SSR flows and email confirmation links).

### 1.2 Components

#### React Components (Client-Side)
New components will be placed in `src/components/auth/` to isolate authentication logic.

*   **`LoginForm.tsx`**
    *   **Responsibilities**:
        *   Capture Email and Password.
        *   Client-side validation (Zod schema).
        *   Invoke Supabase Client `signInWithPassword`.
        *   Handle error states (invalid credentials, rate limits).
        *   On success: Refresh the page or navigate to trigger middleware/session update.
*   **`RegisterForm.tsx`**
    *   **Responsibilities**:
        *   Capture Email, Password, and Password Confirmation.
        *   Client-side validation (Zod schema: format, min length, matching passwords).
        *   Invoke Supabase Client `signUp`.
        *   Handle error states (user already exists).
        *   On success: Auto-login and navigate (US-001 requirements).

#### Layout Modifications (`src/layouts/Layout.astro`)
*   **Navigation Bar**:
    *   **State: Guest**: Show "Login" and "Register" buttons.
    *   **State: Authenticated**: Show User Avatar/Email and "Logout" button.
*   **Implementation**: Use `Astro.locals.user` (populated by middleware) to conditionally render header elements.

### 1.3 Validation & Error Handling
*   **Schema Validation**: Use `zod` for all form inputs.
    *   *Email*: Valid email format.
    *   *Password*: Min 6 characters (Supabase default).
*   **Error UI**:
    *   Field-level errors displayed below inputs (Shadcn `FormMessage`).
    *   Global errors (e.g., "Invalid login credentials") displayed in a `Alert` component or `sonner` toast.
*   **Scenarios**:
    *   *Invalid Credentials*: Show "Invalid email or password".
    *   *Existing User*: On registration, show "User already registered".
    *   *Weak Password*: Show specific requirements.

## 2. Backend Logic

### 2.1 Server-Side Rendering & Configuration
The project is configured with `output: "server"`, enabling dynamic rendering and cookie-based authentication.

*   **Dependency**: `@supabase/ssr` (replacing or augmenting basic client usage).
*   **Cookie Management**: Secure, HttpOnly cookies will store the `access_token` and `refresh_token` to persist sessions across server-side renders.

### 2.2 Middleware (`src/middleware/index.ts`)
The middleware is the core security enforcement point.

1.  **Session Refresh**: On every request, create a Supabase Server Client and call `getUser()`. This handles token validation and refreshing automatically.
2.  **Locals Population**:
    *   `context.locals.supabase`: The Supabase client instance.
    *   `context.locals.user`: The user object (or null).
    *   `context.locals.session`: The session object (or null).
3.  **Route Protection**:
    *   Define `PROTECTED_ROUTES` (e.g., `/` (root), `/generate`, `/study`).
    *   If a request matches a protected route and `user` is null, redirect to `/login`.
    *   Define `GUEST_ROUTES` (e.g., `/login`, `/register`).
    *   If a request matches a guest route and `user` is present, redirect to `/`.

### 2.3 API Structure
*   **`src/lib/supabase.server.ts`**: Helper to create the Supabase client for server-side contexts (API routes, Astro pages) using cookies.
*   **`src/lib/supabase.client.ts`**: Helper to create the Supabase client for client-side contexts (React components).

## 3. Authentication System

### 3.1 Supabase Integration
*   **Library**: `@supabase/ssr` for robust server-side cookie handling.
*   **Auth Flow**:
    1.  **Sign Up**: `supabase.auth.signUp({ email, password })`.
    2.  **Sign In**: `supabase.auth.signInWithPassword({ email, password })`.
    3.  **Sign Out**: `supabase.auth.signOut()` (Client) + Call `/api/auth/signout` (Server cleanup).

### 3.2 Requirements Mapping
*   **US-001 (Registration)**: Handled by `RegisterForm` + `signUp`. "Automatically logged in" is supported by Supabase default behavior (ensure "Confirm email" is disabled in Supabase project settings for MVP).
*   **US-002 (Login)**: Handled by `LoginForm` + `signInWithPassword`.
*   **US-003 (Logout)**: Handled by Layout Logout button triggering sign-out logic.

### 3.3 Data Security
*   **Row Level Security (RLS)**: Although not part of the auth implementation strictly, the architecture relies on RLS policies in the database `flashcards` table to ensure users can only access their own cards (`auth.uid() = user_id`).
*   **Environment Variables**:
    *   `PUBLIC_SUPABASE_URL`
    *   `PUBLIC_SUPABASE_ANON_KEY`


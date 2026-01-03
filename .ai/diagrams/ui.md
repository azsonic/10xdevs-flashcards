# Diagram UI - Architektura Autentykacji

## Analiza Architektury

1. **Komponenty z plików referencyjnych**:
   - Strony: `src/pages/login.astro`, `src/pages/register.astro`, `src/pages/index.astro`, `src/pages/api/auth/signout.ts`, `src/pages/api/auth/callback.ts`
   - Komponenty React: `LoginForm.tsx`, `RegisterForm.tsx`
   - Layout: `src/layouts/Layout.astro` (z dynamicznym paskiem nawigacji)
   - Middleware: `src/middleware/index.ts`
   - Serwisy: `supabase.client.ts`, `supabase.server.ts`

2. **Główne strony i komponenty**:
   - **Strona Logowania**: Zawiera `LoginForm`. Dostępna tylko dla gości.
   - **Strona Rejestracji**: Zawiera `RegisterForm`. Dostępna tylko dla gości.
   - **Strona Główna (Dashboard)**: Chroniona, dostępna dla zalogowanych.
   - **Layout**: Zarządza nawigacją (stan zalogowany/wylogowany).

3. **Przepływ danych**:
   - Użytkownik wprowadza dane w formularzach (Client-side).
   - Formularze komunikują się z Supabase Auth (Client).
   - Sesja jest przechowywana w ciasteczkach.
   - Middleware (Server-side) weryfikuje sesję przy każdym żądaniu.
   - Middleware udostępnia obiekt użytkownika w `Astro.locals`.
   - Layout odczytuje `Astro.locals.user` by dostosować UI.

4. **Opis funkcjonalności**:
   - **LoginForm/RegisterForm**: Walidacja Zod, obsługa błędów, wywołania Supabase SDK.
   - **Middleware**: Strażnik tras (Route Guard), odświeżanie sesji.
   - **API Routes**: Obsługa wylogowania i callbacków OAuth/MagicLink (wymiana kodu na sesję).

## Diagram Mermaid

```mermaid
flowchart TD
    %% Definicje stylów
    classDef page fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef component fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
    classDef logic fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef external fill:#eeeeee,stroke:#616161,stroke-dasharray: 5 5;

    %% Aktor
    User((Użytkownik))

    %% Podgraf: Warstwa Routingu i Stron (Astro)
    subgraph "Strony (Astro Pages)"
        direction TB
        PageLogin["/login (Login Page)"]:::page
        PageRegister["/register (Register Page)"]:::page
        PageHome["/ (Dashboard)"]:::page
        
        subgraph "API Routes"
            ApiSignOut["/api/auth/signout"]:::logic
            ApiCallback["/api/auth/callback"]:::logic
        end
    end

    %% Podgraf: Warstwa Komponentów UI (React/Astro)
    subgraph "Komponenty UI"
        direction TB
        Layout["Layout Główny (NavBar)"]:::component
        CompLoginForm["LoginForm (React)"]:::component
        CompRegisterForm["RegisterForm (React)"]:::component
        CompUserMenu["Menu Użytkownika/Logout"]:::component
        CompGuestMenu["Menu Gościa (Login/Register)"]:::component
    end

    %% Podgraf: Logika i Middleware
    subgraph "Logika Serwerowa i Stan"
        Middleware["Middleware (Auth Guard)"]:::logic
        Locals["Astro.locals (User/Session)"]:::logic
        SupabaseClient["Supabase Client (SSR/Browser)"]:::database
    end

    %% Relacje - Użytkownik i Nawigacja
    User --> Layout
    Layout -->|Gość| PageLogin
    Layout -->|Gość| PageRegister
    Layout -->|Zalogowany| PageHome
    
    %% Relacje - Struktura Stron
    PageLogin --- CompLoginForm
    PageRegister --- CompRegisterForm
    PageHome -.-> Layout

    %% Relacje - Layout Dynamiczny
    Layout -->|Sprawdza Stan| Locals
    Locals -->|Zalogowany| CompUserMenu
    Locals -->|Gość| CompGuestMenu

    %% Relacje - Akcje Formularzy
    CompLoginForm -->|SignIn| SupabaseClient
    CompRegisterForm -->|SignUp| SupabaseClient
    CompUserMenu -->|SignOut| ApiSignOut

    %% Relacje - Middleware i Ochrona
    User -.->|Żądanie HTTP| Middleware
    Middleware -->|Weryfikacja Tokena| SupabaseClient
    Middleware -->|Popuje| Locals
    Middleware -->|Przekierowanie| PageLogin
    Middleware -->|Przekierowanie| PageHome

    %% Relacje - API
    ApiSignOut -->|Czyści Cookies| SupabaseClient
    ApiCallback -->|Wymiana Kodu| SupabaseClient

    %% Legenda zmian (implied by visualization logic)
    %% Elementy nowe/zmienione to głównie Auth components i Middleware logic
```

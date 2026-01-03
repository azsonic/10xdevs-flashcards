# Diagram Auth - Sekwencja Autentykacji

<authentication_analysis>

1. **Przepływy autentykacji**:
   - **Logowanie (Sign In)**: Użytkownik podaje email/hasło -> Supabase weryfikuje -> Zwraca tokeny -> Zapis w cookies -> Przekierowanie.
   - **Rejestracja (Sign Up)**: Użytkownik podaje dane -> Utworzenie konta w Supabase -> Automatyczne logowanie (jeśli email conf wyłączone) lub oczekiwanie.
   - **Weryfikacja Sesji (Middleware)**: Każde żądanie do serwera przechodzi przez Middleware -> Pobranie tokena z cookies -> Weryfikacja w Supabase -> Ustawienie kontekstu lub przekierowanie.
   - **Odświeżanie Tokena (Token Refresh)**: Middleware wykrywa wygasający Access Token -> Używa Refresh Token do pobrania nowego -> Aktualizacja cookies.
   - **Wylogowanie (Sign Out)**: Żądanie klienta -> Wyczyszczenie sesji w Supabase -> Usunięcie cookies -> Przekierowanie na login.

2. **Główni Aktorzy**:
   - **User (Użytkownik)**: Inicjuje akcje.
   - **Browser (Przeglądarka)**: Renderuje UI, przechowuje cookies, wysyła żądania.
   - **Middleware (Astro Server)**: Pośrednik weryfikujący każde żądanie serwerowe, zarządza sesją SSR.
   - **Astro API / Pages**: Endpointy i strony renderowane po stronie serwera.
   - **Supabase Auth**: Zewnętrzny dostawca tożsamości (Identity Provider).

3. **Procesy weryfikacji i odświeżania**:
   - Tokeny są przechowywane w ciasteczkach `HttpOnly` (bezpieczne).
   - `@supabase/ssr` automatycznie zarządza cyklem życia tokenów w middleware.
   - Jeśli Access Token wygasł, ale Refresh Token jest ważny, Supabase SDK automatycznie wymienia go na nową parę.

4. **Kroki autentykacji**:
   - Użytkownik wchodzi na stronę chronioną -> Middleware sprawdza cookies -> Brak? Redirect Login.
   - Użytkownik loguje się -> Client SDK wywołuje Supabase -> Supabase zwraca sesję -> Client ustawia cookies (lub wywołuje API callback) -> Przeładowanie/Przekierowanie.
     </authentication_analysis>

```mermaid
sequenceDiagram
    autonumber

    participant User as Użytkownik
    participant Browser as Przeglądarka (UI)
    participant Middleware as Astro Middleware
    participant API as Astro API / Pages
    participant Supabase as Supabase Auth

    %% Scenariusz 1: Próba dostępu do strony chronionej bez sesji
    Note over User, Supabase: Scenariusz 1: Dostęp do strony chronionej (Brak Sesji)
    User->>Browser: Wchodzi na /dashboard
    Browser->>Middleware: GET /dashboard
    activate Middleware
    Middleware->>Supabase: Sprawdź sesję (Cookies)
    activate Supabase
    Supabase-->>Middleware: Brak aktywnej sesji
    deactivate Supabase
    Middleware-->>Browser: Redirect 302 do /login
    deactivate Middleware
    Browser->>User: Wyświetla formularz logowania

    %% Scenariusz 2: Logowanie Użytkownika
    Note over User, Supabase: Scenariusz 2: Logowanie
    User->>Browser: Wprowadza email/hasło
    Browser->>Supabase: signInWithPassword(email, pass)
    activate Supabase
    Supabase-->>Browser: Sukces (Access & Refresh Token)
    deactivate Supabase
    Note right of Browser: Tokeny zapisywane w Cookies
    Browser->>Browser: Przekierowanie na /dashboard

    %% Scenariusz 3: Dostęp z ważną sesją (i odświeżanie)
    Note over User, Supabase: Scenariusz 3: Dostęp do Dashboard (Z sesją + Auto Refresh)
    User->>Browser: Wchodzi na /dashboard
    Browser->>Middleware: GET /dashboard (z Cookies)
    activate Middleware

    Middleware->>Supabase: getUser() (Weryfikacja tokena)
    activate Supabase

    alt Token ważny
        Supabase-->>Middleware: Zwraca obiekt User
    else Token wygasł
        Note right of Supabase: Auto-refresh przy użyciu Refresh Token
        Supabase-->>Middleware: Nowe tokeny + User
        Middleware->>Browser: Set-Cookie (Nowe Tokeny)
    end
    deactivate Supabase

    Middleware->>API: Przekaż żądanie (locals.user ustawione)
    activate API
    API-->>Middleware: Wyrenderowana strona HTML
    deactivate API
    Middleware-->>Browser: 200 OK (HTML)
    deactivate Middleware
    Browser->>User: Wyświetla Dashboard

    %% Scenariusz 4: Wylogowanie
    Note over User, Supabase: Scenariusz 4: Wylogowanie
    User->>Browser: Klika "Wyloguj"
    Browser->>API: POST /api/auth/signout
    activate API
    API->>Supabase: signOut() (Unieważnij sesję)
    activate Supabase
    Supabase-->>API: Sukces
    deactivate Supabase
    API->>Browser: Clear Cookies + Redirect /login
    deactivate API
    Browser->>User: Wyświetla stronę logowania
```

# Diagram Journey - Podróż Użytkownika

<user_journey_analysis>

1. **Ścieżki użytkownika (z PRD i Auth Spec)**:
   - **Nowy Użytkownik**: Wejście na stronę -> Rejestracja -> Auto-login -> Dashboard (Onboarding).
   - **Powracający Użytkownik (Niezalogowany)**: Wejście na stronę -> Przekierowanie na Login -> Logowanie -> Dashboard.
   - **Zalogowany Użytkownik**: Wejście na stronę -> Dashboard -> Generowanie/Przeglądanie/Nauka -> Wylogowanie.
   - **Błędy Autentykacji**: Błędne hasło, istniejący email przy rejestracji.

2. **Główne Stany**:
   - **Niezalogowany (Guest)**: Dostęp tylko do Login/Register. Próba wejścia na Dashboard przekierowuje.
   - **Proces Logowania**: Wprowadzanie danych, walidacja.
   - **Proces Rejestracji**: Wprowadzanie danych, tworzenie konta.
   - **Zalogowany (Authenticated)**: Dostęp do Dashboard, Generowania, Listy Fiszek, Trybu Nauki.

3. **Punkty Decyzyjne**:
   - Czy użytkownik ma konto? (Tak -> Login, Nie -> Register).
   - Czy dane logowania poprawne? (Tak -> Dashboard, Nie -> Błąd).
   - Czy użytkownik jest już zalogowany przy wejściu? (Tak -> Dashboard, Nie -> Login).

4. **Opis Stanów**:
   - **Landing/Login**: Punkt startowy dla niezalogowanych.
   - **Dashboard**: Główne centrum dowodzenia (Lista fiszek, przycisk generuj).
   - **Generowanie**: Proces tworzenia fiszek z tekstu.
   - **Review**: Przegląd i edycja wygenerowanych kandydatów.
   - **Nauka**: Tryb Spaced Repetition.
</user_journey_analysis>

```mermaid
stateDiagram-v2
    direction LR

    %% Stany Początkowe
    [*] --> SprawdzenieSesji

    state if_sesja <<choice>>
    SprawdzenieSesji --> if_sesja
    if_sesja --> StanNiezalogowany: Brak Sesji
    if_sesja --> StanZalogowany: Sesja Aktywna

    %% Podróż Niezalogowanego Użytkownika
    state "Strefa Gościa" as StanNiezalogowany {
        [*] --> EkranLogowania

        state "Logowanie" as EkranLogowania {
            [*] --> WprowadzanieDanychLog
            WprowadzanieDanychLog --> WeryfikacjaLog: Kliknij "Zaloguj"
            
            state if_login_ok <<choice>>
            WeryfikacjaLog --> if_login_ok
            if_login_ok --> [*]: Sukces (Przejdź do Dashboard)
            if_login_ok --> WprowadzanieDanychLog: Błąd (Pokaż komunikat)
        }

        state "Rejestracja" as EkranRejestracji {
            [*] --> WprowadzanieDanychReg
            WprowadzanieDanychReg --> TworzenieKonta: Kliknij "Zarejestruj"
            
            state if_reg_ok <<choice>>
            TworzenieKonta --> if_reg_ok
            if_reg_ok --> [*]: Sukces (Auto-login)
            if_reg_ok --> WprowadzanieDanychReg: Błąd (np. email zajęty)
        }

        EkranLogowania --> EkranRejestracji: Nie mam konta
        EkranRejestracji --> EkranLogowania: Mam już konto
    }

    %% Przejście do strefy zalogowanej
    StanNiezalogowany --> StanZalogowany: Pomyślna Autentykacja

    %% Podróż Zalogowanego Użytkownika
    state "Strefa Użytkownika" as StanZalogowany {
        [*] --> Dashboard

        state "Dashboard (Lista Fiszek)" as Dashboard {
            [*] --> WidokListy
            WidokListy --> Onboarding: Brak fiszek
            WidokListy --> Filtrowanie: Szukaj/Filtruj
        }

        state "Proces Generowania AI" as Generowanie {
            [*] --> WklejanieTekstu
            WklejanieTekstu --> GenerowanieKandydatow: Kliknij "Generuj"
            GenerowanieKandydatow --> PrzegladKandydatow: Sukces
            PrzegladKandydatow --> EdycjaKandydata: Edytuj
            PrzegladKandydatow --> OdrzucenieKandydata: Odrzuć
            PrzegladKandydatow --> ZapisFiszek: Zapisz Wybrane
        }

        state "Tryb Nauki" as Nauka {
            [*] --> WyswietlPrzod
            WyswietlPrzod --> WyswietlTyl: Pokaż odpowiedź
            WyswietlTyl --> OcenaPamieci: Oceń (Easy/Hard)
            OcenaPamieci --> WyswietlPrzod: Następna karta
        }

        state "Zarządzanie Manualne" as Manualne {
            [*] --> KreatorFiszki
            KreatorFiszki --> ZapisManualny
        }

        %% Nawigacja wewnątrz strefy zalogowanej
        Dashboard --> Generowanie: "Generuj z AI"
        Dashboard --> Manualne: "Dodaj Ręcznie"
        Dashboard --> Nauka: "Rozpocznij Naukę"
        Generowanie --> Dashboard: Powrót po zapisie
        Manualne --> Dashboard: Powrót po zapisie
        Nauka --> Dashboard: Koniec sesji
    }

    %% Wylogowanie
    StanZalogowany --> StanNiezalogowany: Wyloguj
```


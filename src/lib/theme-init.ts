/**
 * Initializes theme on page load to prevent FOUC (Flash of Unstyled Content).
 * This runs before the page renders to apply the correct theme class immediately.
 */
const VALID_THEMES = ["light", "dark", "system"] as const;
type Theme = (typeof VALID_THEMES)[number];

function isValidTheme(value: string | null): value is Theme {
  return value !== null && VALID_THEMES.includes(value as Theme);
}

const storedTheme = localStorage.getItem("theme");
const theme: Theme = isValidTheme(storedTheme) ? storedTheme : "system";

const resolvedTheme =
  theme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : theme;

document.documentElement.classList.add(resolvedTheme);

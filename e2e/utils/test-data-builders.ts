/**
 * Test Data Builders
 * Use builder pattern to create test data with sensible defaults and easy customization
 */

/**
 * Flashcard data builder
 * Provides fluent API for creating flashcard test data
 */
export class FlashcardBuilder {
  private data = {
    front: "What is the capital of France?",
    back: "Paris",
  };

  /**
   * Set custom front text
   */
  withFront(front: string): this {
    this.data.front = front;
    return this;
  }

  /**
   * Set custom back text
   */
  withBack(back: string): this {
    this.data.back = back;
    return this;
  }

  /**
   * Create flashcard with long content (tests text handling)
   */
  withLongContent(): this {
    this.data.front =
      "This is a very long question that tests how the application handles extensive text content. ".repeat(5);
    this.data.back =
      "This is a very long answer that tests how the application handles extensive text content in the response field. ".repeat(
        5
      );
    return this;
  }

  /**
   * Create flashcard with special characters (tests XSS protection)
   */
  withSpecialCharacters(): this {
    this.data.front = "What is <script>alert('XSS')</script>?";
    this.data.back = "Test & verification with 'quotes' and \"double quotes\"";
    return this;
  }

  /**
   * Create flashcard with emojis (tests Unicode support)
   */
  withEmojis(): this {
    this.data.front = "What is TypeScript? 🚀";
    this.data.back = "A typed superset 💪 of JavaScript ⚡";
    return this;
  }

  /**
   * Create flashcard with HTML entities
   */
  withHtmlEntities(): this {
    this.data.front = "What is &lt;div&gt; in HTML?";
    this.data.back = "A block-level element used for grouping &amp; styling";
    return this;
  }

  /**
   * Create flashcard with newlines (tests multiline support)
   */
  withMultilineText(): this {
    this.data.front = "List three programming languages:\n1. JavaScript\n2. Python\n3. TypeScript";
    this.data.back = "These are:\n- High-level languages\n- Interpreted/compiled\n- Popular choices";
    return this;
  }

  /**
   * Create flashcard with markdown-like content
   */
  withMarkdown(): this {
    this.data.front = "What is **React**?";
    this.data.back = "A *JavaScript* library for building `user interfaces`";
    return this;
  }

  /**
   * Create flashcard with code snippets
   */
  withCodeSnippet(): this {
    this.data.front = "What does this do: const add = (a, b) => a + b;";
    this.data.back = "Creates an arrow function that adds two numbers";
    return this;
  }

  /**
   * Create flashcard with numbers and symbols
   */
  withNumbersAndSymbols(): this {
    this.data.front = "Calculate: 2 + 2 × 2 = ?";
    this.data.back = "6 (multiplication first: 2 + 4)";
    return this;
  }

  /**
   * Create flashcard with minimum valid length
   */
  withMinimumLength(): this {
    this.data.front = "Q";
    this.data.back = "A";
    return this;
  }

  /**
   * Build and return the flashcard data
   */
  build(): { front: string; back: string } {
    return { ...this.data };
  }
}

/**
 * User data builder
 * Provides fluent API for creating user test data
 */
export class UserBuilder {
  private static counter = 0;

  private data = {
    email: "",
    password: "SecurePassword123!",
  };

  constructor() {
    // Generate unique email by default
    this.withUniqueEmail();
  }

  /**
   * Set custom email
   */
  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  /**
   * Set custom password
   */
  withPassword(password: string): this {
    this.data.password = password;
    return this;
  }

  /**
   * Generate unique email (default)
   */
  withUniqueEmail(): this {
    UserBuilder.counter++;
    const timestamp = Date.now();
    this.data.email = `test${timestamp}_${UserBuilder.counter}@example.com`;
    return this;
  }

  /**
   * Use a weak password (for validation testing)
   */
  withWeakPassword(): this {
    this.data.password = "weak";
    return this;
  }

  /**
   * Use a strong password with special characters
   */
  withStrongPassword(): this {
    this.data.password = "VeryStr0ng!P@ssw0rd#2024$";
    return this;
  }

  /**
   * Use invalid email format (for validation testing)
   */
  withInvalidEmail(): this {
    this.data.email = "invalid-email-format";
    return this;
  }

  /**
   * Build and return the user data
   */
  build(): { email: string; password: string } {
    return { ...this.data };
  }
}

/**
 * Quick helper functions for common test data
 */
export const TestData = {
  /**
   * Generate a unique email
   */
  uniqueEmail: () => {
    const timestamp = Date.now();
    return `test${timestamp}@example.com`;
  },

  /**
   * Generate a random string
   */
  randomString: (length = 10) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Create a simple flashcard
   */
  simpleFlashcard: () => ({
    front: "What is React?",
    back: "A JavaScript library for building user interfaces",
  }),

  /**
   * Create multiple flashcards with sequential numbers
   */
  multipleFlashcards: (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      front: `Question ${i + 1}`,
      back: `Answer ${i + 1}`,
    }));
  },
};

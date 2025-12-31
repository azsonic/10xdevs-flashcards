# Product Requirements Document (PRD) - 10xdevs-flashcards

## 1. Product Overview

The 10xdevs-flashcards application is a web-based learning tool designed for "casual learners." It aims to streamline the creation of educational flashcards by leveraging AI. The core feature allows users to paste a block of text and automatically generate flashcard candidates, which they can then review, edit, and save. The application also supports manual flashcard creation and management. Saved flashcards can be studied using an integrated spaced repetition system to enhance learning efficiency. The Minimum Viable Product (MVP) focuses on delivering a seamless AI generation workflow and a simple, effective study experience.

## 2. User Problem

Many individuals, particularly "casual learners," recognize the effectiveness of flashcards and spaced repetition for learning and memorization. However, the process of manually creating high-quality flashcards is often tedious and time-consuming. This friction discourages potential users from adopting this powerful study method, especially when dealing with large volumes of text or complex subjects. The 10xdevs-flashcards application directly addresses this by automating the most labor-intensive part of the process, making flashcard-based learning more accessible and appealing.

## 3. Functional Requirements

- FR-01: User Authentication
  - Users must be able to create an account using an email address and a password.
  - Users must be able to log in and log out of their accounts.
  - The system must securely store user credentials.
- FR-02: AI Flashcard Generation
  - Users can input up to 5000 characters of source text.
  - The system will synchronously generate flashcard "candidates" from the provided text.
  - The generation process will display a loading indicator and has a timeout of 30 seconds.
  - The system will present user-friendly error messages if generation fails or times out.
  - A "regenerate" option will be available to re-run the AI generation on the current input text.
- FR-03: Flashcard Review and Curation
  - AI-generated flashcards are presented to the user as "candidates" and are not saved automatically.
  - Users must be able to review each candidate card.
  - For each candidate, users can Accept it as-is, Edit its content before accepting, or Reject it.
  - Accepted and edited cards are saved to the user's account in a single bulk action after the review is complete.
- FR-04: Manual Flashcard Management
  - Users must be able to create flashcards manually.
  - Flashcard fronts are limited to 200 characters; backs are limited to 500 characters.
  - The UI will display real-time character counters on input fields.
  - Users can edit and delete any previously saved flashcard, with deletion requiring a confirmation step.
- FR-05: Flashcard Library
  - All of a user's saved flashcards will be displayed in a single, paginated list.
  - A simple search function will be available to filter the list by querying text on both the front and back of cards.
  - For the MVP, there will be no "decks" or folders.
- FR-06: Spaced Repetition Study Mode
  - The application will integrate with an existing open-source spaced repetition algorithm.
  - Users can initiate a "study session" where the system presents flashcards based on the algorithm's scheduling.
  - The UI will provide options for the user to self-assess their recall to provide input for the algorithm.
- FR-07: Onboarding
  - For new users or users with no flashcards, the main view will display an empty state with a clear call to action to begin by entering text for AI generation.
- FR-08: Analytics and Logging
  - The system must log all AI generation events, including the number of candidates generated and the number the user accepts.
  - The system must track the origin of every saved flashcard (AI-generated or manually created).

## 4. Product Boundaries

### In Scope for MVP:

- AI-generated flashcards from user-pasted text (up to 5000 characters).
- Full manual flashcard creation and editing capabilities.
- Browsing, editing, and deleting saved flashcards.
- A simple email and password user account system for storing flashcards.
- Integration with a pre-existing open-source spaced-repetition algorithm.
- A single, searchable list for all user flashcards.
- Web-only application.

### Out of Scope for MVP:

- Developing a custom, advanced spaced-repetition algorithm.
- Importing content from various file formats (PDF, DOCX, etc.).
- Sharing flashcard sets or collaborating between users.
- Integrations with other educational platforms (LMS, etc.).
- Native mobile applications (iOS, Android).
- Organizing flashcards into decks or folders.

## 5. User Stories

### User Account Management

- ID: US-001
- Title: New User Registration
- Description: As a new user, I want to create an account using my email and a password so that I can save and manage my flashcards.
- Acceptance Criteria:
  - Given I am on the registration page,
  - When I enter a valid email and a password that meets the security criteria, and I click "Sign Up",
  - Then my account is created, and I am automatically logged in and redirected to the main application page.

- ID: US-002
- Title: Existing User Login
- Description: As an existing user, I want to log in with my email and password so that I can access my saved flashcards.
- Acceptance Criteria:
  - Given I am on the login page,
  - When I enter my correct email and password and click "Log In",
  - Then I am successfully authenticated and redirected to my main flashcard list.

- ID: US-003
- Title: User Logout
- Description: As a logged-in user, I want to log out of my account to ensure my session is secure.
- Acceptance Criteria:
  - Given I am logged into the application,
  - When I click the "Logout" button,
  - Then my session is terminated, and I am redirected to the login page.

### AI Flashcard Generation & Curation

- ID: US-004
- Title: Generate Flashcards from Text
- Description: As a user, I want to paste a block of text and have the AI generate flashcard candidates so I can save time on manual creation.
- Acceptance Criteria:
  - Given I am on the main page,
  - When I paste up to 5000 characters of text into the input field and click "Generate",
  - Then the system initiates the generation process.

- ID: US-005
- Title: View Generation Progress and Handle Failures
- Description: As a user, I want to see that the system is working on my request and be notified if something goes wrong.
- Acceptance Criteria:
  - Given I have started a generation process,
  - When the AI is generating cards,
  - Then a loading indicator is displayed.
  - Given the generation takes longer than 30 seconds,
  - When the process times out,
  - Then a user-friendly error message is displayed.
  - Given the generation fails for another reason,
  - Then a relevant error message is shown.

- ID: US-006
- Title: Review AI-Generated Candidates
- Description: As a user, I want to review the AI-generated candidates so that my final study set is accurate and personalized.
- Acceptance Criteria:
  - Given the AI has successfully generated flashcards,
  - When the process completes,
  - Then I am presented with a list of "candidate" flashcards.
  - And for each candidate, I have options to "Accept", "Edit", or "Reject".

- ID: US-007
- Title: Edit and Accept a Candidate
- Description: As a user, I want to edit a candidate flashcard to correct or personalize it before accepting it.
- Acceptance Criteria:
  - Given I am reviewing candidate flashcards,
  - When I click the "Edit" button on a candidate,
  - Then the card's text fields become editable, with character counters visible.
  - And I can modify the text within the character limits (200 front, 500 back).
  - And after editing, the card is marked for acceptance.

- ID: US-008
- Title: Reject a Candidate
- Description: As a user, I want to reject an irrelevant or poor-quality candidate so it is not added to my flashcards.
- Acceptance Criteria:
  - Given I am reviewing candidate flashcards,
  - When I click the "Reject" button on a candidate,
  - Then the card is removed from the list of candidates.

- ID: US-009
- Title: Bulk Save Reviewed Flashcards
- Description: As a user, I want to save all my accepted and edited flashcards at once after I finish my review.
- Acceptance Criteria:
  - Given I have finished reviewing all candidates,
  - When I click the "Save Flashcards" button,
  - Then all cards I have accepted or edited are saved to my account.
  - And I am redirected to my main flashcard list, where the new cards appear.

### Manual Flashcard Management

- ID: US-010
- Title: Manual Flashcard Creation
- Description: As a user, I want to be able to create a flashcard from scratch to add specific knowledge that wasn't in the source text.
- Acceptance Criteria:
  - Given I am on the main page,
  - When I choose the "Create Manually" option,
  - Then I am presented with a blank flashcard form with "front" and "back" fields.
  - And I can enter text, respecting the character limits (200 front, 500 back) shown by a counter.
  - And when I click "Save", the new flashcard is added to my list.

- ID: US-011
- Title: View All Flashcards
- Description: As a user, I want to view all my saved flashcards in a single list so I can get an overview of my study material.
- Acceptance Criteria:
  - Given I have saved flashcards,
  - When I navigate to the main application page,
  - Then I see a list of my flashcards.
  - And the list is paginated if it contains more cards than can fit on one page.

- ID: US-012
- Title: Search Flashcards
- Description: As a user, I want to search my flashcards so I can quickly find specific information.
- Acceptance Criteria:
  - Given I am viewing my flashcard list,
  - When I type a query into the search bar and press Enter,
  - Then the list is filtered to show only flashcards where the query text exists in either the front or the back.

- ID: US-013
- Title: Edit a Saved Flashcard
- Description: As a user, I want to edit a saved flashcard to correct errors or update information.
- Acceptance Criteria:
  - Given I am viewing my flashcard list,
  - When I click the "Edit" icon on a flashcard,
  - Then I can modify the front and back text.
  - And when I save my changes, the flashcard is updated in my list.

- ID: US-014
- Title: Delete a Saved Flashcard
- Description: As a user, I want to delete a flashcard I no longer need.
- Acceptance Criteria:
  - Given I am viewing my flashcard list,
  - When I click the "Delete" icon on a flashcard,
  - Then a confirmation dialog appears.
  - And when I confirm the deletion, the flashcard is permanently removed from my list.

### Studying

- ID: US-015
- Title: Start a Study Session
- Description: As a user, I want to start a study session that uses a spaced repetition algorithm to show me cards at the optimal time for learning.
- Acceptance Criteria:
  - Given I have saved flashcards,
  - When I click the "Study" button,
  - Then a study session begins.
  - And I am shown the front of the first flashcard selected by the spaced repetition algorithm.

- ID: US-016
- Title: Self-Assess Recall During Study
- Description: As a user, I want to rate how well I remembered a flashcard so the spaced repetition algorithm can schedule it for the future.
- Acceptance Criteria:
  - Given I am in a study session and viewing the front of a card,
  - When I view the back of the card,
  - Then I am presented with self-assessment options (e.g., "Easy," "Good," "Hard").
  - And when I select an option, my response is recorded, and the next card is shown.

### Onboarding

- ID: US-017
- Title: View Onboarding Empty State
- Description: As a new user, I want to see a clear starting point so I know how to use the application.
- Acceptance Criteria:
  - Given I have just signed up or have no saved flashcards,
  - When I view the main page,
  - Then I see an empty state message.
  - And the message includes a clear call to action to paste text and generate my first flashcards.

## 6. Success Metrics

- SM-01: AI-Generated Flashcard Quality
  - Metric: 75% of AI-generated flashcards are accepted by users.
  - Measurement: This will be measured by analyzing the generation logs. For each generation event, the system will record the number of candidates generated versus the number of candidates accepted by the user (either as-is or after editing). The ratio of accepted_cards / generated_cards will be tracked.
- SM-02: AI Generation Feature Adoption
  - Metric: Users create 75% of their flashcards using the AI generation feature.
  - Measurement: This will be measured by tracking the origin of each flashcard saved to the database. Each card will have a flag indicating if it originated from the "AI-generated" flow or the "manual creation" flow. We will calculate the ratio of AI-generated_cards / total_cards per user and in aggregate.

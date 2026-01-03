# UI Reorganization - Code Examples

## Real Before & After Code Examples

This document shows actual code changes for specific files in the reorganization.

---

## Example 1: LibraryView Component

### BEFORE: `src/components/LibraryView.tsx`

```typescript
import { useFlashcardLibrary } from "../lib/hooks/useFlashcardLibrary";
import { LibraryToolbar } from "./LibraryToolbar";
import { FlashcardList } from "./FlashcardList";
import { EmptyState } from "./EmptyState";
import { PaginationControls } from "./PaginationControls";
import { EditFlashcardDialog } from "./EditFlashcardDialog";
import { CreateManualDialog } from "./CreateManualDialog";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { LoadingDisplay } from "./LoadingDisplay";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

export function LibraryView() {
  // ... component implementation
}
```

**Issues:**

- ❌ All relative imports from same directory
- ❌ No distinction between feature-specific and shared components
- ❌ UI imports look the same as feature imports

### AFTER: `src/components/library/LibraryView.tsx`

```typescript
// External dependencies
import { useFlashcardLibrary } from "@/lib/hooks/useFlashcardLibrary";

// Feature-specific components (relative imports within feature)
import { LibraryToolbar } from "./LibraryToolbar";
import { FlashcardList } from "./FlashcardList";
import { EmptyState } from "./EmptyState";

// Feature dialogs (grouped import)
import { EditFlashcardDialog, CreateManualDialog, DeleteAlertDialog } from "./dialogs";

// Shared components (absolute imports)
import { LoadingDisplay } from "@/components/shared";
import { PaginationControls } from "@/components/shared";

// UI primitives (absolute imports)
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LibraryView() {
  // ... component implementation
}
```

**Benefits:**

- ✅ Clear import organization (external → feature → shared → UI)
- ✅ Grouped related imports (dialogs)
- ✅ Easy to distinguish component types by import path

---

## Example 2: Page Component

### BEFORE: `src/pages/library.astro`

```astro
---
import Layout from "../layouts/Layout.astro";
import { LibraryView } from "../components/LibraryView";

const { user } = Astro.locals;

if (!user) {
  return Astro.redirect("/login");
}

export const prerender = false;
---

<Layout title="Flashcard Library">
  <LibraryView client:load />
</Layout>
```

### AFTER: `src/pages/library.astro`

```astro
---
import Layout from "@/layouts/Layout.astro";
import { LibraryView } from "@/components/library";

const { user } = Astro.locals;

if (!user) {
  return Astro.redirect("/login");
}

export const prerender = false;
---

<Layout title="Flashcard Library">
  <LibraryView client:load />
</Layout>
```

**Changes:**

- ✅ Path alias instead of relative path
- ✅ Cleaner, more semantic imports
- ✅ Barrel export from feature folder

---

## Example 3: Dialog Component

### BEFORE: `src/components/EditFlashcardDialog.tsx`

```typescript
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { FlashcardForm } from "./FlashcardForm";
import type { FlashcardDto } from "@/types";

interface EditFlashcardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flashcard: FlashcardDto | null;
  onSave: (id: string, data: { front: string; back: string }) => Promise<void>;
}

export function EditFlashcardDialog({ isOpen, onClose, flashcard, onSave }: EditFlashcardDialogProps) {
  // ... component implementation
}
```

### AFTER: `src/components/library/dialogs/EditFlashcardDialog.tsx`

```typescript
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FlashcardForm } from "@/components/shared/forms";
import type { FlashcardDto } from "@/types";

interface EditFlashcardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flashcard: FlashcardDto | null;
  onSave: (id: string, data: { front: string; back: string }) => Promise<void>;
}

export function EditFlashcardDialog({ isOpen, onClose, flashcard, onSave }: EditFlashcardDialogProps) {
  // ... component implementation
}
```

**Changes:**

- ✅ Absolute path for UI components
- ✅ Absolute path for shared form component
- ✅ Clear indication of component dependencies

---

## Example 4: Barrel Export

### NEW: `src/components/library/index.ts`

```typescript
/**
 * Library Feature - Public Exports
 *
 * Main components for the flashcard library view including
 * list display, search, and management features.
 */

// Main view container
export { LibraryView } from "./LibraryView";

// Toolbar components
export { LibraryToolbar } from "./LibraryToolbar";
export { SearchInput } from "./SearchInput";
export { AddManualButton } from "./AddManualButton";

// List components
export { FlashcardList } from "./FlashcardList";
export { FlashcardItem } from "./FlashcardItem";

// State components
export { EmptyState } from "./EmptyState";

// Dialogs are exported from ./dialogs/index.ts
// Import with: import { CreateManualDialog } from '@/components/library/dialogs';
```

**Usage:**

```typescript
// Instead of multiple imports:
import { LibraryView } from "@/components/library/LibraryView";
import { LibraryToolbar } from "@/components/library/LibraryToolbar";
import { FlashcardList } from "@/components/library/FlashcardList";

// You can use barrel export:
import { LibraryView, LibraryToolbar, FlashcardList } from "@/components/library";
```

---

## Example 5: Shared Component

### BEFORE: `src/components/FlashcardForm.tsx`

```typescript
import { useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

interface FlashcardFormProps {
  initialFront?: string;
  initialBack?: string;
  onSubmit: (data: { front: string; back: string }) => void;
  onCancel: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function FlashcardForm({
  initialFront = "",
  initialBack = "",
  onSubmit,
  onCancel,
  submitLabel = "Save",
  isSubmitting = false,
}: FlashcardFormProps) {
  // ... component implementation
}
```

### AFTER: `src/components/shared/forms/FlashcardForm.tsx`

```typescript
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FlashcardFormProps {
  initialFront?: string;
  initialBack?: string;
  onSubmit: (data: { front: string; back: string }) => void;
  onCancel: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function FlashcardForm({
  initialFront = "",
  initialBack = "",
  onSubmit,
  onCancel,
  submitLabel = "Save",
  isSubmitting = false,
}: FlashcardFormProps) {
  // ... component implementation
}
```

**Changes:**

- ✅ Moved to `shared/forms/` indicating reusability
- ✅ Absolute imports for UI components

---

## Example 6: Test File

### BEFORE: `src/test/components/FlashcardItem.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlashcardItem } from "@/components/FlashcardItem";
import type { FlashcardDto } from "@/types";

describe("FlashcardItem", () => {
  const mockFlashcard: FlashcardDto = {
    id: "1",
    front: "Test Front",
    back: "Test Back",
    created_at: "2024-01-01T00:00:00Z",
  };

  it("should render flashcard content", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <FlashcardItem
        flashcard={mockFlashcard}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("Test Front")).toBeInTheDocument();
    expect(screen.getByText("Test Back")).toBeInTheDocument();
  });
});
```

### AFTER: `src/test/components/library/FlashcardItem.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlashcardItem } from "@/components/library";
import type { FlashcardDto } from "@/types";

describe("FlashcardItem", () => {
  const mockFlashcard: FlashcardDto = {
    id: "1",
    front: "Test Front",
    back: "Test Back",
    created_at: "2024-01-01T00:00:00Z",
  };

  it("should render flashcard content", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <FlashcardItem
        flashcard={mockFlashcard}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("Test Front")).toBeInTheDocument();
    expect(screen.getByText("Test Back")).toBeInTheDocument();
  });
});
```

**Changes:**

- ✅ Test file mirrors component structure
- ✅ Import uses barrel export from feature

---

## Example 7: Layout Component

### BEFORE: `src/layouts/Layout.astro`

```astro
---
import Navbar from "../components/Navbar.astro";
import { ViewTransitions } from "astro:transitions";
import "@/styles/globals.css";

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title>{title}</title>
    <ViewTransitions />
  </head>
  <body>
    <Navbar />
    <slot />
  </body>
</html>
```

### AFTER: `src/layouts/Layout.astro`

```astro
---
import Navbar from "@/components/layout/Navbar.astro";
import { ViewTransitions } from "astro:transitions";
import "@/styles/globals.css";

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title>{title}</title>
    <ViewTransitions />
  </head>
  <body>
    <Navbar />
    <slot />
  </body>
</html>
```

**Changes:**

- ✅ Absolute import with clear `layout` designation
- ✅ Easier to understand Navbar is a layout component

---

## Example 8: Generation Container

### BEFORE: `src/components/GenerationContainer.tsx`

```typescript
import { useEffect } from "react";
import { useGenerationStore } from "@/lib/store/generation-store";
import { generateFlashcards, saveFlashcards, ApiError } from "@/lib/api";
import { GenerationInput } from "./GenerationInput";
import { GenerationLoader } from "./GenerationLoader";
import { ReviewView } from "./ReviewView";
import { SourceTextDisplay } from "./SourceTextDisplay";
import { toast } from "sonner";
import type { CreateFlashcardsCommand } from "@/types";

export function GenerationContainer() {
  const { step, sourceText, generationId, candidates, error, setStep, setGenerationResult, setError, reset } =
    useGenerationStore();

  // ... implementation
}
```

### AFTER: `src/components/generation/GenerationContainer.tsx`

```typescript
import { useEffect } from "react";
import { useGenerationStore } from "@/lib/store/generation-store";
import { generateFlashcards, saveFlashcards, ApiError } from "@/lib/api";
import { toast } from "sonner";
import type { CreateFlashcardsCommand } from "@/types";

// Feature-specific components (relative imports)
import { GenerationInput } from "./GenerationInput";
import { GenerationLoader } from "./GenerationLoader";
import { ReviewView } from "./ReviewView";
import { SourceTextDisplay } from "./SourceTextDisplay";

/**
 * Main state orchestrator for the flashcard generation flow.
 * Manages transitions between input, generating, and review steps.
 */
export function GenerationContainer() {
  const { step, sourceText, generationId, candidates, error, setStep, setGenerationResult, setError, reset } =
    useGenerationStore();

  // ... implementation
}
```

**Changes:**

- ✅ Grouped feature-specific imports
- ✅ Added JSDoc comment for clarity
- ✅ Clear separation of external vs internal dependencies

---

## Example 9: Import Organization Pattern

### Recommended Import Order

```typescript
// 1. React and external libraries
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// 2. Types
import type { FlashcardDto, PaginatedFlashcardsDto } from "@/types";

// 3. Hooks and stores
import { useFlashcardLibrary } from "@/lib/hooks/useFlashcardLibrary";

// 4. Services and utilities
import { generateFlashcards } from "@/lib/api";
import { validateFlashcard } from "@/lib/validation";

// 5. Feature-specific components (relative if in same feature)
import { LibraryToolbar } from "./LibraryToolbar";
import { FlashcardList } from "./FlashcardList";

// 6. Shared components (absolute)
import { LoadingDisplay } from "@/components/shared";
import { PaginationControls } from "@/components/shared";

// 7. UI primitives (absolute)
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 8. Styles (if any)
import "./custom-styles.css";
```

---

## Example 10: Component with Multiple Dialogs

### BEFORE: Messy Dialog Imports

```typescript
import { LibraryView } from "./LibraryView";
import { CreateManualDialog } from "./CreateManualDialog";
import { EditFlashcardDialog } from "./EditFlashcardDialog";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { InfoDialog } from "./InfoDialog";
```

### AFTER: Grouped Dialog Imports

```typescript
import { LibraryView } from "./LibraryView";

// All dialogs imported together from dialogs barrel
import { CreateManualDialog, EditFlashcardDialog, DeleteAlertDialog, ConfirmDialog, InfoDialog } from "./dialogs";
```

**Benefits:**

- ✅ Cleaner import section
- ✅ Clear that these are all dialogs
- ✅ Easier to manage

---

## Example 11: Future Study Feature (Preview)

When adding the study feature, follow the established pattern:

### NEW: `src/components/study/StudySession.tsx`

```typescript
import { useState, useEffect } from "react";
import { useStudySession } from "@/lib/hooks/useStudySession";
import type { FlashcardDto } from "@/types";

// Feature-specific components
import { StudyCard } from "./StudyCard";
import { StudyControls } from "./StudyControls";
import { StudyProgress } from "./StudyProgress";

// Shared components
import { LoadingDisplay } from "@/components/shared";

// UI components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Main study session container.
 * Manages flashcard presentation and spaced repetition logic.
 */
export function StudySession() {
  // ... implementation
}
```

### NEW: `src/components/study/index.ts`

```typescript
/**
 * Study Feature - Public Exports
 *
 * Components for the spaced repetition study mode.
 */

export { StudySession } from "./StudySession";
export { StudyCard } from "./StudyCard";
export { StudyControls } from "./StudyControls";
export { StudyProgress } from "./StudyProgress";
```

### NEW: `src/pages/study.astro`

```astro
---
import Layout from "@/layouts/Layout.astro";
import { StudySession } from "@/components/study";

const { user } = Astro.locals;

if (!user) {
  return Astro.redirect("/login");
}

export const prerender = false;
---

<Layout title="Study Session">
  <StudySession client:load />
</Layout>
```

**Pattern Benefits:**

- ✅ Follows established feature-first structure
- ✅ Clear imports and exports
- ✅ Easy to understand and maintain

---

## Summary of Patterns

### Component Organization

```
feature/
├── FeatureContainer.tsx       (Orchestrator - uses hooks/stores)
├── FeatureToolbar.tsx         (Sub-components)
├── FeatureList.tsx
├── FeatureItem.tsx
├── dialogs/                   (Related sub-components)
│   ├── CreateDialog.tsx
│   └── EditDialog.tsx
└── index.ts                   (Public exports)
```

### Import Patterns

```typescript
// External → Types → Hooks → Feature → Shared → UI

import { useState } from "react"; // External
import type { FlashcardDto } from "@/types"; // Types
import { useFeature } from "@/lib/hooks"; // Hooks
import { FeatureItem } from "./FeatureItem"; // Feature (relative)
import { SharedForm } from "@/components/shared"; // Shared (absolute)
import { Button } from "@/components/ui/button"; // UI (absolute)
```

### Testing Patterns

```typescript
// Test file mirrors source file location
// src/components/library/FlashcardItem.tsx
// src/test/components/library/FlashcardItem.test.tsx

import { FlashcardItem } from "@/components/library";
```

---

**These patterns ensure consistency across the entire codebase! 🎯**

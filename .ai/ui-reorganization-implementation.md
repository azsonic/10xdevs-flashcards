# UI Reorganization - Implementation Guide

## Quick Start

This guide provides step-by-step commands to reorganize the UI structure.

---

## Prerequisites

```bash
# 1. Ensure you're on main branch and up to date
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b refactor/ui-reorganization

# 3. Ensure all tests pass before starting
npm test

# 4. Ensure build works
npm run build
```

---

## Phase 1: Create New Directory Structure

```powershell
# Create feature directories
New-Item -ItemType Directory -Path "src/components/generation"
New-Item -ItemType Directory -Path "src/components/library"
New-Item -ItemType Directory -Path "src/components/library/dialogs"
New-Item -ItemType Directory -Path "src/components/shared"
New-Item -ItemType Directory -Path "src/components/shared/forms"
New-Item -ItemType Directory -Path "src/components/layout"
```

Or on Unix/Mac:

```bash
mkdir -p src/components/generation
mkdir -p src/components/library/dialogs
mkdir -p src/components/shared/forms
mkdir -p src/components/layout
```

---

## Phase 2: Move Components (Use git mv to preserve history)

### 2.1 Move Generation Components

```powershell
# Windows PowerShell
git mv src/components/GenerationContainer.tsx src/components/generation/
git mv src/components/GenerationInput.tsx src/components/generation/
git mv src/components/GenerationLoader.tsx src/components/generation/
git mv src/components/ReviewView.tsx src/components/generation/
git mv src/components/SourceTextDisplay.tsx src/components/generation/
git mv src/components/BulkSaveBar.tsx src/components/generation/
git mv src/components/CandidateCard.tsx src/components/generation/
git mv src/components/CandidateList.tsx src/components/generation/
```

Or Unix/Mac:

```bash
git mv src/components/{GenerationContainer,GenerationInput,GenerationLoader,ReviewView,SourceTextDisplay,BulkSaveBar,CandidateCard,CandidateList}.tsx src/components/generation/
```

### 2.2 Move Library Components

```powershell
# Windows PowerShell
git mv src/components/LibraryView.tsx src/components/library/
git mv src/components/LibraryToolbar.tsx src/components/library/
git mv src/components/SearchInput.tsx src/components/library/
git mv src/components/AddManualButton.tsx src/components/library/
git mv src/components/FlashcardList.tsx src/components/library/
git mv src/components/FlashcardItem.tsx src/components/library/
git mv src/components/EmptyState.tsx src/components/library/

# Move dialogs
git mv src/components/CreateManualDialog.tsx src/components/library/dialogs/
git mv src/components/EditFlashcardDialog.tsx src/components/library/dialogs/
git mv src/components/DeleteAlertDialog.tsx src/components/library/dialogs/
```

Or Unix/Mac:

```bash
git mv src/components/{LibraryView,LibraryToolbar,SearchInput,AddManualButton,FlashcardList,FlashcardItem,EmptyState}.tsx src/components/library/
git mv src/components/{CreateManualDialog,EditFlashcardDialog,DeleteAlertDialog}.tsx src/components/library/dialogs/
```

### 2.3 Move Shared Components

```powershell
# Windows PowerShell
git mv src/components/FlashcardForm.tsx src/components/shared/forms/
git mv src/components/LoadingDisplay.tsx src/components/shared/
git mv src/components/PaginationControls.tsx src/components/shared/
```

Or Unix/Mac:

```bash
git mv src/components/FlashcardForm.tsx src/components/shared/forms/
git mv src/components/{LoadingDisplay,PaginationControls}.tsx src/components/shared/
```

### 2.4 Move Layout Components

```powershell
# Windows PowerShell
git mv src/components/Navbar.astro src/components/layout/
git mv src/components/Welcome.astro src/components/layout/
```

Or Unix/Mac:

```bash
git mv src/components/{Navbar,Welcome}.astro src/components/layout/
```

---

## Phase 3: Create Barrel Exports

### 3.1 Auth Feature

Create `src/components/auth/index.ts`:

```typescript
export { LoginForm } from "./LoginForm";
export { RegisterForm } from "./RegisterForm";
export { ForgotPasswordForm } from "./ForgotPasswordForm";
```

### 3.2 Generation Feature

Create `src/components/generation/index.ts`:

```typescript
export { GenerationContainer } from "./GenerationContainer";
export { GenerationInput } from "./GenerationInput";
export { GenerationLoader } from "./GenerationLoader";
export { ReviewView } from "./ReviewView";
export { SourceTextDisplay } from "./SourceTextDisplay";
export { BulkSaveBar } from "./BulkSaveBar";
export { CandidateCard } from "./CandidateCard";
export { CandidateList } from "./CandidateList";
```

### 3.3 Library Feature

Create `src/components/library/index.ts`:

```typescript
export { LibraryView } from "./LibraryView";
export { LibraryToolbar } from "./LibraryToolbar";
export { SearchInput } from "./SearchInput";
export { AddManualButton } from "./AddManualButton";
export { FlashcardList } from "./FlashcardList";
export { FlashcardItem } from "./FlashcardItem";
export { EmptyState } from "./EmptyState";
```

Create `src/components/library/dialogs/index.ts`:

```typescript
export { CreateManualDialog } from "./CreateManualDialog";
export { EditFlashcardDialog } from "./EditFlashcardDialog";
export { DeleteAlertDialog } from "./DeleteAlertDialog";
```

### 3.4 Shared Components

Create `src/components/shared/index.ts`:

```typescript
export { LoadingDisplay } from "./LoadingDisplay";
export { PaginationControls } from "./PaginationControls";
```

Create `src/components/shared/forms/index.ts`:

```typescript
export { FlashcardForm } from "./FlashcardForm";
```

### 3.5 Layout Components

Create `src/components/layout/index.ts`:

```typescript
// Note: Astro components can't be re-exported easily
// Import directly from files or use this for documentation
```

---

## Phase 4: Update Import Paths

### 4.1 Update Pages

**File: `src/pages/library.astro`**

```diff
- import { LibraryView } from "../components/LibraryView";
+ import { LibraryView } from "@/components/library";
```

**File: `src/pages/generate.astro`**

```diff
- import { GenerationContainer } from "@/components/GenerationContainer";
+ import { GenerationContainer } from "@/components/generation";
```

**File: `src/pages/index.astro`** (if it exists)

```diff
- import Welcome from "../components/Welcome.astro";
+ import Welcome from "@/components/layout/Welcome.astro";
```

**File: `src/layouts/Layout.astro`**

```diff
- import Navbar from "../components/Navbar.astro";
+ import Navbar from "@/components/layout/Navbar.astro";
```

### 4.2 Update LibraryView Component

**File: `src/components/library/LibraryView.tsx`**

```diff
- import { useFlashcardLibrary } from "../lib/hooks/useFlashcardLibrary";
+ import { useFlashcardLibrary } from "@/lib/hooks/useFlashcardLibrary";
  import { LibraryToolbar } from "./LibraryToolbar";
  import { FlashcardList } from "./FlashcardList";
  import { EmptyState } from "./EmptyState";
  import { PaginationControls } from "./PaginationControls";
- import { EditFlashcardDialog } from "./EditFlashcardDialog";
- import { CreateManualDialog } from "./CreateManualDialog";
- import { DeleteAlertDialog } from "./DeleteAlertDialog";
+ import {
+   EditFlashcardDialog,
+   CreateManualDialog,
+   DeleteAlertDialog
+ } from "./dialogs";
- import { LoadingDisplay } from "./LoadingDisplay";
+ import { LoadingDisplay } from "@/components/shared";
+ import { PaginationControls } from "@/components/shared";
- import { Button } from "./ui/button";
- import { Alert, AlertDescription } from "./ui/alert";
+ import { Button } from "@/components/ui/button";
+ import { Alert, AlertDescription } from "@/components/ui/alert";
```

### 4.3 Update GenerationContainer Component

**File: `src/components/generation/GenerationContainer.tsx`**

```diff
  import { useEffect } from "react";
  import { useGenerationStore } from "@/lib/store/generation-store";
  import { generateFlashcards, saveFlashcards, ApiError } from "@/lib/api";
  import { GenerationInput } from "./GenerationInput";
  import { GenerationLoader } from "./GenerationLoader";
  import { ReviewView } from "./ReviewView";
  import { SourceTextDisplay } from "./SourceTextDisplay";
  import { toast } from "sonner";
  import type { CreateFlashcardsCommand } from "@/types";
```

### 4.4 Update Dialog Components

**Files: `src/components/library/dialogs/*.tsx`**

Update imports in:

- `CreateManualDialog.tsx`
- `EditFlashcardDialog.tsx`
- `DeleteAlertDialog.tsx`

```diff
- import { FlashcardForm } from "./FlashcardForm";
+ import { FlashcardForm } from "@/components/shared/forms";
- import { Dialog, DialogContent, ... } from "./ui/dialog";
+ import { Dialog, DialogContent, ... } from "@/components/ui/dialog";
```

### 4.5 Update Other Library Components

Update imports in files under `src/components/library/`:

- `LibraryToolbar.tsx`
- `FlashcardList.tsx`
- `FlashcardItem.tsx`
- etc.

Change relative UI imports to use path alias:

```diff
- import { Button } from "./ui/button";
+ import { Button } from "@/components/ui/button";
- import { Card } from "./ui/card";
+ import { Card } from "@/components/ui/card";
```

### 4.6 Update Generation Components

Similarly update imports in `src/components/generation/`:

- `GenerationInput.tsx`
- `ReviewView.tsx`
- `CandidateCard.tsx`
- etc.

---

## Phase 5: Update Test Files

### 5.1 Create Test Directory Structure

```powershell
# Windows
New-Item -ItemType Directory -Path "src/test/components/generation"
New-Item -ItemType Directory -Path "src/test/components/library"
New-Item -ItemType Directory -Path "src/test/components/library/dialogs"
New-Item -ItemType Directory -Path "src/test/components/shared"
```

Or Unix/Mac:

```bash
mkdir -p src/test/components/{generation,library/dialogs,shared}
```

### 5.2 Move Test Files

```powershell
# Windows PowerShell
git mv src/test/components/CandidateCard.test.tsx src/test/components/generation/
git mv src/test/components/FlashcardItem.test.tsx src/test/components/library/

# Move other test files accordingly
```

### 5.3 Update Test Imports

**Example: `src/test/components/generation/CandidateCard.test.tsx`**

```diff
- import { CandidateCard } from '@/components/CandidateCard';
+ import { CandidateCard } from '@/components/generation';
```

---

## Phase 6: Validation

### 6.1 Run Type Checker

```bash
npm run type-check
# or
npx tsc --noEmit
```

Fix any TypeScript errors related to import paths.

### 6.2 Run Linter

```bash
npm run lint
```

Fix any linting issues.

### 6.3 Run Tests

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

### 6.4 Build the Application

```bash
npm run build
```

Ensure the build completes successfully.

### 6.5 Manual Testing

```bash
# Start dev server
npm run dev
```

Test the following flows:

- [ ] Login/Registration
- [ ] Generate flashcards flow
- [ ] Library view and search
- [ ] Create manual flashcard
- [ ] Edit flashcard
- [ ] Delete flashcard
- [ ] Pagination

---

## Phase 7: Commit and Push

### 7.1 Review Changes

```bash
git status
git diff
```

### 7.2 Commit

```bash
# Stage all changes
git add .

# Commit with conventional commit message
git commit -m "refactor: reorganize UI components by feature

- Move components into feature-based directories (generation, library, shared, layout)
- Add barrel exports for cleaner imports
- Update all import paths to use new structure
- Reorganize test files to mirror component structure
- Improve component discoverability and maintainability

BREAKING CHANGE: Component import paths have changed. Internal refactor only, no API changes."
```

### 7.3 Push

```bash
git push origin refactor/ui-reorganization
```

### 7.4 Create Pull Request

Create a PR with:

- **Title**: `refactor: reorganize UI components by feature`
- **Description**: Link to `.ai/ui-reorganization-proposal.md`
- **Checklist**: Include the validation checklist
- **Screenshots**: (if applicable)

---

## Rollback Procedure

If something goes wrong:

```bash
# Discard all changes and return to main
git reset --hard origin/main
git clean -fd
```

Or to specific commit:

```bash
# Find the commit before reorganization
git log --oneline

# Reset to that commit
git reset --hard <commit-hash>
```

---

## Post-Migration Tasks

### Update Documentation

1. Update `.ai/` documentation files if they reference specific file paths
2. Update `README.md` if it mentions component structure
3. Update any architectural decision records (ADRs)

### Team Communication

1. Announce the change to the team
2. Share the `.ai/ui-reorganization-proposal.md` document
3. Update team wiki/documentation
4. Consider a team walkthrough of the new structure

### Create Follow-up Issues

- [ ] Optional component renaming (see proposal)
- [ ] Lib folder reorganization (separate effort)
- [ ] Add Storybook for component documentation (future)

---

## Troubleshooting

### Common Issues

#### Issue: Import path not found

**Solution**: Check if you're using the correct path alias (`@/`) and if the file exists in the new location.

```typescript
// Wrong
import { LibraryView } from "../components/LibraryView";

// Correct
import { LibraryView } from "@/components/library";
```

#### Issue: Circular dependency

**Solution**: Check barrel exports (`index.ts` files) and ensure no circular imports.

#### Issue: Tests failing

**Solution**:

1. Check test import paths
2. Ensure test files are in the correct directory
3. Check for hardcoded paths in test utilities

#### Issue: Build fails with module not found

**Solution**:

1. Clear build cache: `rm -rf dist .astro`
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Check `tsconfig.json` paths configuration

---

## Script Alternative (Advanced)

If you prefer automation, here's a Node.js script to help:

```javascript
// scripts/reorganize-ui.js
const fs = require("fs-extra");
const path = require("path");

const moves = [
  // Generation
  ["GenerationContainer.tsx", "generation/"],
  ["GenerationInput.tsx", "generation/"],
  // ... etc
];

async function reorganize() {
  const componentsDir = path.join(__dirname, "../src/components");

  for (const [file, dest] of moves) {
    const src = path.join(componentsDir, file);
    const dst = path.join(componentsDir, dest, file);

    await fs.ensureDir(path.dirname(dst));
    await fs.move(src, dst);
    console.log(`Moved ${file} to ${dest}`);
  }
}

reorganize().catch(console.error);
```

**Usage:**

```bash
node scripts/reorganize-ui.js
```

---

## Checklist Summary

```
Pre-Migration:
☐ Review proposal
☐ Approve structure
☐ Create feature branch
☐ Run tests (all pass)

Migration:
☐ Create directory structure
☐ Move generation components (8 files)
☐ Move library components (11 files)
☐ Move shared components (3 files)
☐ Move layout components (2 files)
☐ Create barrel exports (5 index.ts files)
☐ Update page imports (4 files)
☐ Update component imports (all moved files)
☐ Update test files (mirror structure)

Validation:
☐ Type check passes
☐ Linter passes
☐ Unit tests pass
☐ E2E tests pass
☐ Build succeeds
☐ Manual testing complete

Finalization:
☐ Commit changes
☐ Push to remote
☐ Create PR
☐ Code review
☐ Merge to main
☐ Update documentation
```

---

**Estimated Time**: 2-4 hours depending on test count and manual testing thoroughness.

**Good luck with the migration! 🚀**

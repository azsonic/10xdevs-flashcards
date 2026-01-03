# UI Reorganization - ASCII Diagrams

Quick visual reference for the reorganization structure.

---

## Current Structure (Flat)

```
src/components/
│
├── auth/
│   ├── ForgotPasswordForm.tsx
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
│
├── ui/
│   ├── alert-dialog.tsx
│   ├── alert.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── collapsible.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── sonner.tsx
│   └── textarea.tsx
│
└── [24 files mixed together] ⚠️
    ├── AddManualButton.tsx
    ├── BulkSaveBar.tsx
    ├── CandidateCard.tsx
    ├── CandidateList.tsx
    ├── CreateManualDialog.tsx
    ├── DeleteAlertDialog.tsx
    ├── EditFlashcardDialog.tsx
    ├── EmptyState.tsx
    ├── FlashcardForm.tsx
    ├── FlashcardItem.tsx
    ├── FlashcardList.tsx
    ├── GenerationContainer.tsx
    ├── GenerationInput.tsx
    ├── GenerationLoader.tsx
    ├── LibraryToolbar.tsx
    ├── LibraryView.tsx
    ├── LoadingDisplay.tsx
    ├── Navbar.astro
    ├── PaginationControls.tsx
    ├── ReviewView.tsx
    ├── SearchInput.tsx
    ├── SourceTextDisplay.tsx
    └── Welcome.astro
```

---

## Proposed Structure (Feature-Based)

```
src/components/
│
├── 🔐 auth/
│   ├── ForgotPasswordForm.tsx
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── index.ts
│
├── ⚡ generation/
│   ├── GenerationContainer.tsx
│   ├── GenerationInput.tsx
│   ├── GenerationLoader.tsx
│   ├── ReviewView.tsx
│   ├── SourceTextDisplay.tsx
│   ├── BulkSaveBar.tsx
│   ├── CandidateCard.tsx
│   ├── CandidateList.tsx
│   └── index.ts
│
├── 📚 library/
│   ├── LibraryView.tsx
│   ├── LibraryToolbar.tsx
│   ├── SearchInput.tsx
│   ├── AddManualButton.tsx
│   ├── FlashcardList.tsx
│   ├── FlashcardItem.tsx
│   ├── EmptyState.tsx
│   ├── dialogs/
│   │   ├── CreateManualDialog.tsx
│   │   ├── EditFlashcardDialog.tsx
│   │   ├── DeleteAlertDialog.tsx
│   │   └── index.ts
│   └── index.ts
│
├── 🔄 shared/
│   ├── forms/
│   │   ├── FlashcardForm.tsx
│   │   └── index.ts
│   ├── LoadingDisplay.tsx
│   ├── PaginationControls.tsx
│   └── index.ts
│
├── 🏗️ layout/
│   ├── Navbar.astro
│   ├── Welcome.astro
│   └── index.ts
│
└── 🎨 ui/
    ├── alert-dialog.tsx
    ├── alert.tsx
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── collapsible.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── label.tsx
    ├── sonner.tsx
    └── textarea.tsx
```

---

## Component Flow: Generation Feature

```
┌─────────────────────────────────────────────────────┐
│                  /generate Page                      │
│                  (generate.astro)                    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│           GenerationContainer.tsx                    │
│         (State Orchestrator)                         │
└─┬───────────────┬─────────────┬────────────────────┘
  │               │             │
  │ step="input"  │ "generating"│ "review"
  │               │             │
  ▼               ▼             ▼
┌─────────┐  ┌──────────┐  ┌──────────┐
│Generation│  │Generation│  │ReviewView│
│Input     │  │Loader    │  │          │
└─────────┘  └──────────┘  └────┬─────┘
                                 │
                    ┌────────────┴─────────────┐
                    │                          │
                    ▼                          ▼
            ┌─────────────┐          ┌─────────────┐
            │CandidateList│          │BulkSaveBar  │
            └──────┬──────┘          └─────────────┘
                   │
                   ▼
            ┌─────────────┐
            │CandidateCard│
            │  (multiple) │
            └─────────────┘
```

---

## Component Flow: Library Feature

```
┌─────────────────────────────────────────────────────┐
│                  /library Page                       │
│                  (library.astro)                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              LibraryView.tsx                         │
│            (State Orchestrator)                      │
└─┬────────────┬────────────┬────────────────────────┘
  │            │            │
  ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌─────────┐
│Library │  │Flashcard│ │Pagination│
│Toolbar │  │List     │ │Controls  │
└───┬────┘  └────┬───┘ └─────────┘
    │            │
    │            ▼
    │       ┌────────────┐
    │       │FlashcardItem│
    │       │  (multiple) │
    │       └─────┬──────┘
    │             │
    ▼             ▼
┌─────────┐   ┌──────────────────┐
│Search   │   │Edit / Delete btns│
│Input    │   └────┬─────────┬───┘
└─────────┘        │         │
    │              │         │
    ▼              ▼         ▼
┌─────────┐   ┌────────┐ ┌────────┐
│Create   │   │Edit    │ │Delete  │
│Manual   │   │Flashcard│ │Alert   │
│Dialog   │   │Dialog  │ │Dialog  │
└─────────┘   └────────┘ └────────┘
    │              │
    └──────┬───────┘
           ▼
    ┌─────────────┐
    │FlashcardForm│
    │  (shared)   │
    └─────────────┘
```

---

## Import Dependency Graph

```
Pages Layer
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│library.astro│  │generate.astro│ │login.astro  │
└──────┬──────┘  └──────┬───────┘ └──────┬──────┘
       │                │                │
       │                │                │
Feature Layer (Orchestrators)
       │                │                │
       ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│LibraryView  │  │Generation   │  │LoginForm    │
│             │  │Container    │  │             │
└──────┬──────┘  └──────┬───────┘ └─────────────┘
       │                │
       │                │
Feature Components Layer
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│Library       │  │Generation    │
│Components    │  │Components    │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │                 │
Shared Layer            │
       │                 │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │Shared Components│
       │- FlashcardForm  │
       │- LoadingDisplay │
       │- Pagination     │
       └────────┬────────┘
                │
UI Primitives Layer
                │
                ▼
       ┌─────────────────┐
       │UI Components    │
       │- Button         │
       │- Dialog         │
       │- Card, etc.     │
       └─────────────────┘
```

---

## File Move Map

```
Generation Feature Migration
═══════════════════════════════════════════════════════

src/components/                    src/components/generation/
├── GenerationContainer.tsx   →   ├── GenerationContainer.tsx
├── GenerationInput.tsx       →   ├── GenerationInput.tsx
├── GenerationLoader.tsx      →   ├── GenerationLoader.tsx
├── ReviewView.tsx            →   ├── ReviewView.tsx
├── SourceTextDisplay.tsx     →   ├── SourceTextDisplay.tsx
├── BulkSaveBar.tsx          →   ├── BulkSaveBar.tsx
├── CandidateCard.tsx        →   ├── CandidateCard.tsx
├── CandidateList.tsx        →   ├── CandidateList.tsx
                                  └── index.ts (NEW)


Library Feature Migration
═══════════════════════════════════════════════════════

src/components/                    src/components/library/
├── LibraryView.tsx          →   ├── LibraryView.tsx
├── LibraryToolbar.tsx       →   ├── LibraryToolbar.tsx
├── SearchInput.tsx          →   ├── SearchInput.tsx
├── AddManualButton.tsx      →   ├── AddManualButton.tsx
├── FlashcardList.tsx        →   ├── FlashcardList.tsx
├── FlashcardItem.tsx        →   ├── FlashcardItem.tsx
├── EmptyState.tsx           →   ├── EmptyState.tsx
├── CreateManualDialog.tsx   →   ├── dialogs/
├── EditFlashcardDialog.tsx  →   │   ├── CreateManualDialog.tsx
├── DeleteAlertDialog.tsx    →   │   ├── EditFlashcardDialog.tsx
                                  │   ├── DeleteAlertDialog.tsx
                                  │   └── index.ts (NEW)
                                  └── index.ts (NEW)


Shared Components Migration
═══════════════════════════════════════════════════════

src/components/                    src/components/shared/
├── FlashcardForm.tsx        →   ├── forms/
├── LoadingDisplay.tsx       →   │   ├── FlashcardForm.tsx
├── PaginationControls.tsx   →   │   └── index.ts (NEW)
                                  ├── LoadingDisplay.tsx
                                  ├── PaginationControls.tsx
                                  └── index.ts (NEW)


Layout Components Migration
═══════════════════════════════════════════════════════

src/components/                    src/components/layout/
├── Navbar.astro             →   ├── Navbar.astro
├── Welcome.astro            →   ├── Welcome.astro
                                  └── index.ts (NEW)
```

---

## Directory Size Visualization

```
BEFORE: Flat Structure
═══════════════════════════════════════════════════════
components/
├── auth/ (3)        ███
├── ui/ (11)         ███████████
└── root (24)        ████████████████████████  ← PROBLEM!

Total: 38 files, max depth: 2


AFTER: Feature Structure
═══════════════════════════════════════════════════════
components/
├── auth/ (3)        ███
├── generation/ (8)  ████████
├── library/ (11)    ███████████
│   └── dialogs/ (3) ███
├── shared/ (3)      ███
│   └── forms/ (1)   █
├── layout/ (2)      ██
└── ui/ (11)         ███████████

Total: 38 files, max depth: 3  ← MORE ORGANIZED!
```

---

## Test Structure Mirror

```
Source Structure              Test Structure
═══════════════════════════   ═══════════════════════════
src/components/               src/test/components/
│                             │
├── generation/               ├── generation/
│   ├── CandidateCard.tsx     │   ├── CandidateCard.test.tsx
│   ├── GenerationInput.tsx   │   ├── GenerationInput.test.tsx
│   └── ReviewView.tsx        │   └── ReviewView.test.tsx
│                             │
├── library/                  ├── library/
│   ├── FlashcardItem.tsx     │   ├── FlashcardItem.test.tsx
│   ├── LibraryToolbar.tsx    │   ├── LibraryToolbar.test.tsx
│   └── dialogs/              │   └── dialogs/
│       └── Delete...tsx      │       └── Delete...test.tsx
│                             │
└── shared/                   └── shared/
    ├── FlashcardForm.tsx         ├── FlashcardForm.test.tsx
    └── Pagination...tsx          └── Pagination...test.tsx
```

---

## Scalability Projection

```
Current (Flat) - Adding Study Feature
═══════════════════════════════════════════════════════
components/
├── auth/ (3)
├── ui/ (11)
└── root (30)  ████████████████████████████████  ← WORSE!
    ├── 24 existing files
    └── 6 new study files

Developer Experience: 😰 Hard to navigate!


Proposed (Feature) - Adding Study Feature
═══════════════════════════════════════════════════════
components/
├── auth/ (3)        ███
├── generation/ (8)  ████████
├── library/ (11)    ███████████
├── study/ (6)       ██████  ← NEW, clearly separated!
├── shared/ (3)      ███
├── layout/ (2)      ██
└── ui/ (11)         ███████████

Developer Experience: 😊 Easy to navigate!
```

---

## Component Relationship: Library Dialogs

```
LibraryView.tsx
│
├─ opens ──→ CreateManualDialog
│            │
│            └─ uses ──→ FlashcardForm (shared)
│                        │
│                        └─ uses ──→ Input, Textarea (ui)
│
├─ opens ──→ EditFlashcardDialog
│            │
│            └─ uses ──→ FlashcardForm (shared)
│
└─ opens ──→ DeleteAlertDialog
             │
             └─ uses ──→ AlertDialog (ui)


All dialogs grouped in:
src/components/library/dialogs/
├── CreateManualDialog.tsx
├── EditFlashcardDialog.tsx
├── DeleteAlertDialog.tsx
└── index.ts
```

---

## Import Organization Pattern

```typescript
┌─────────────────────────────────────────────────┐
│ Recommended Import Order                        │
├─────────────────────────────────────────────────┤
│                                                 │
│ 1. External Libraries                           │
│    import { useState } from "react";            │
│    import { toast } from "sonner";              │
│                                                 │
│ 2. Types                                        │
│    import type { FlashcardDto } from "@/types"; │
│                                                 │
│ 3. Hooks & Stores                               │
│    import { useHook } from "@/lib/hooks";       │
│                                                 │
│ 4. Feature Components (relative)                │
│    import { Component } from "./Component";     │
│                                                 │
│ 5. Shared Components (absolute)                 │
│    import { Shared } from "@/components/shared";│
│                                                 │
│ 6. UI Primitives (absolute)                     │
│    import { Button } from "@/components/ui";    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Decision Tree: Where Does Component Go?

```
                    New Component?
                          │
                          ▼
        ┌─────────────────────────────────┐
        │ Is it specific to one feature?  │
        └──┬───────────────────────────┬──┘
           │ YES                   NO  │
           ▼                           ▼
    ┌────────────────┐    ┌───────────────────────┐
    │ Which feature? │    │ Is it reusable across │
    └───┬────────────┘    │ multiple features?    │
        │                 └──┬─────────────────┬──┘
        │                    │ YES         NO  │
        ▼                    ▼                 ▼
┌─────────────────┐  ┌──────────────┐  ┌────────────┐
│ Put in feature/ │  │Put in shared/│  │Is it layout│
│                 │  │              │  │or UI?      │
│ - generation/   │  │ - forms/     │  └──┬──────┬──┘
│ - library/      │  │ - utilities/ │     │      │
│ - study/        │  │              │     │      │
│ - auth/         │  └──────────────┘     ▼      ▼
└─────────────────┘              ┌────────┐ ┌───────┐
                                 │layout/ │ │ ui/   │
                                 └────────┘ └───────┘
```

---

## Migration Risk Assessment

```
┌──────────────────────────────────────────────────┐
│ Risk Level by Activity                           │
├──────────────────────────────────────────────────┤
│                                                  │
│ LOW RISK                         ████ 80%        │
│ ├─ File moves (git mv)                          │
│ ├─ Barrel exports                               │
│ └─ Import updates (TypeScript catches errors)   │
│                                                  │
│ MEDIUM RISK                      ██ 15%          │
│ ├─ Test file updates                            │
│ └─ Build configuration                          │
│                                                  │
│ HIGH RISK                        █ 5%            │
│ └─ Complex circular dependencies                │
│                                                  │
└──────────────────────────────────────────────────┘

Mitigation:
✓ Feature branch
✓ Comprehensive testing
✓ TypeScript validation
✓ Rollback plan
```

---

## Timeline Visualization

```
Implementation Timeline (3-4 hours)
═══════════════════════════════════════════════════════

Hour 1: Setup & Move
├─ 0:00 - 0:15  Create directories
├─ 0:15 - 0:45  Move components (git mv)
└─ 0:45 - 1:00  Create barrel exports

Hour 2: Update Imports (Components)
├─ 1:00 - 1:30  Update feature components
└─ 1:30 - 2:00  Update shared/layout components

Hour 3: Update Imports (Pages & Tests)
├─ 2:00 - 2:30  Update page imports
└─ 2:30 - 3:00  Update test imports

Hour 4: Validation & Finalization
├─ 3:00 - 3:15  Type check & lint
├─ 3:15 - 3:35  Run tests
├─ 3:35 - 3:50  Manual testing
└─ 3:50 - 4:00  Commit & push

═══════════════════════════════════════════════════════
Total: 3-4 hours (with buffer for issues)
```

---

## Success Metrics Dashboard

```
┌─────────────────────────────────────────────────┐
│ Before → After Metrics                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Files in Root Directory                         │
│   Before: 24  ████████████████████████          │
│   After:   0  (empty)                    -100%  │
│                                                 │
│ Average Files per Directory                     │
│   Before: 12.7  █████████████                   │
│   After:   5.4  █████                    -57%   │
│                                                 │
│ Component Discovery Time                        │
│   Before: 30s  ██████████████████               │
│   After:  10s  ██████                    -67%   │
│                                                 │
│ Feature Clarity                                 │
│   Before: Low   ███                             │
│   After:  High  ████████████████████    +100%   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

**Quick Reference Complete! Use these diagrams during implementation. 📊**

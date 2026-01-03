import { useFlashcardLibrary } from "@/lib/hooks/useFlashcardLibrary";
import { LibraryToolbar } from "./LibraryToolbar";
import { FlashcardList } from "./FlashcardList";
import { EmptyState } from "./EmptyState";
import { EditFlashcardDialog, CreateManualDialog, DeleteAlertDialog } from "./dialogs";
import { LoadingDisplay } from "@/components/shared";
import { PaginationControls } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Main client-side view component for the flashcard library.
 * Orchestrates all child components and manages state through the custom hook.
 */
export function LibraryView() {
  const {
    flashcards,
    pagination,
    searchQuery,
    isLoading,
    loadingType,
    error,
    editDialog,
    createDialog,
    deleteDialog,
    isDeleting,
    handlePageChange,
    handleSearch,
    openEditDialog,
    closeEditDialog,
    handleEditSubmit,
    openCreateDialog,
    closeCreateDialog,
    handleCreateSubmit,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteConfirm,
    fetchFlashcards,
  } = useFlashcardLibrary();

  const hasFlashcards = flashcards.length > 0;
  const showEmptyState = !isLoading && !hasFlashcards;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Flashcard Library</h1>
        <p className="text-muted-foreground">Manage and organize your flashcards</p>
      </div>

      {/* Error Banner */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => fetchFlashcards()} className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <LibraryToolbar
        onSearch={handleSearch}
        onCreateManual={openCreateDialog}
        searchQuery={searchQuery}
        isLoading={isLoading}
      />

      {/* Loading State */}
      {isLoading && <LoadingDisplay loadingType={loadingType} />}

      {/* Empty State */}
      {showEmptyState && <EmptyState hasSearchQuery={searchQuery.length > 0} onClearSearch={() => handleSearch("")} />}

      {/* Flashcard List */}
      {!isLoading && hasFlashcards && (
        <>
          <FlashcardList flashcards={flashcards} onEdit={openEditDialog} onDelete={openDeleteDialog} />

          {/* Pagination */}
          <PaginationControls
            currentPage={pagination.page}
            totalPages={pagination.total_pages}
            totalItems={pagination.total_items}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            disabled={isLoading}
          />
        </>
      )}

      {/* Dialogs */}
      <EditFlashcardDialog
        isOpen={editDialog.isOpen}
        onClose={closeEditDialog}
        flashcard={editDialog.data}
        onSave={handleEditSubmit}
      />

      <CreateManualDialog isOpen={createDialog.isOpen} onClose={closeCreateDialog} onCreate={handleCreateSubmit} />

      <DeleteAlertDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        flashcard={deleteDialog.data}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}

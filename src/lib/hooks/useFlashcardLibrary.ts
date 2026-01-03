import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { FlashcardDto, UpdateFlashcardCommand, FlashcardToCreate, PaginationDto } from "../../types";
import type { DialogState, FlashcardListParams, LoadingType } from "../types/library.types";
import * as flashcardApi from "../api/flashcard.api";

/**
 * Custom hook for managing the complete state of the flashcard library.
 * Handles data fetching, pagination, search, and CRUD operations.
 */
export function useFlashcardLibrary() {
  // Data state
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>([]);
  const [pagination, setPagination] = useState<PaginationDto>({
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 0,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<LoadingType>(null);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [editDialog, setEditDialog] = useState<DialogState<FlashcardDto>>({
    isOpen: false,
    data: null,
  });
  const [createDialog, setCreateDialog] = useState<DialogState<void>>({
    isOpen: false,
    data: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<DialogState<FlashcardDto>>({
    isOpen: false,
    data: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Fetches flashcards from the API with current or provided parameters.
   */
  const fetchFlashcards = useCallback(
    async (params?: Partial<FlashcardListParams>, type: LoadingType = "initial") => {
      setIsLoading(true);
      setLoadingType(type);
      setError(null);

      const queryParams: FlashcardListParams = {
        page: params?.page ?? pagination.page,
        limit: params?.limit ?? pagination.limit,
        search: params?.search !== undefined ? params.search : searchQuery,
      };

      try {
        const result = await flashcardApi.fetchFlashcards(queryParams);
        setFlashcards(result.data);
        setPagination(result.pagination);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load flashcards";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
        setLoadingType(null);
      }
    },
    [pagination.page, pagination.limit, searchQuery]
  );

  /**
   * Handles page change and refetches data.
   */
  const handlePageChange = useCallback(
    (page: number) => {
      setPagination((prev) => ({ ...prev, page }));
      fetchFlashcards({ page }, "pagination");
    },
    [fetchFlashcards]
  );

  /**
   * Handles search query submission.
   */
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchFlashcards({ page: 1, search: query }, "search");
    },
    [fetchFlashcards]
  );

  /**
   * Opens the edit dialog with flashcard data.
   */
  const openEditDialog = useCallback((flashcard: FlashcardDto) => {
    setEditDialog({ isOpen: true, data: flashcard });
  }, []);

  /**
   * Closes the edit dialog.
   */
  const closeEditDialog = useCallback(() => {
    setEditDialog({ isOpen: false, data: null });
  }, []);

  /**
   * Handles flashcard edit submission.
   */
  const handleEditSubmit = useCallback(
    async (id: number, updates: UpdateFlashcardCommand) => {
      try {
        const updatedFlashcard = await flashcardApi.updateFlashcard(id, updates);

        // Update local state
        setFlashcards((prev) => prev.map((fc) => (fc.id === id ? updatedFlashcard : fc)));

        closeEditDialog();
        toast.success("Flashcard updated successfully");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update flashcard";
        toast.error(errorMessage);
        throw err;
      }
    },
    [closeEditDialog]
  );

  /**
   * Opens the create dialog.
   */
  const openCreateDialog = useCallback(() => {
    setCreateDialog({ isOpen: true, data: null });
  }, []);

  /**
   * Closes the create dialog.
   */
  const closeCreateDialog = useCallback(() => {
    setCreateDialog({ isOpen: false, data: null });
  }, []);

  /**
   * Handles flashcard creation.
   */
  const handleCreateSubmit = useCallback(
    async (flashcard: FlashcardToCreate) => {
      try {
        await flashcardApi.createFlashcard(flashcard);

        // Refresh the list to show the new flashcard
        await fetchFlashcards();

        closeCreateDialog();
        toast.success("Flashcard created successfully");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create flashcard";
        toast.error(errorMessage);
        throw err;
      }
    },
    [fetchFlashcards, closeCreateDialog]
  );

  /**
   * Opens the delete confirmation dialog.
   */
  const openDeleteDialog = useCallback((flashcard: FlashcardDto) => {
    setDeleteDialog({ isOpen: true, data: flashcard });
  }, []);

  /**
   * Closes the delete dialog.
   */
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ isOpen: false, data: null });
  }, []);

  /**
   * Handles flashcard deletion.
   */
  const handleDeleteConfirm = useCallback(
    async (id: number) => {
      setIsDeleting(true);
      try {
        await flashcardApi.deleteFlashcard(id);

        // Remove from local state
        setFlashcards((prev) => prev.filter((fc) => fc.id !== id));

        // Update pagination counts
        setPagination((prev) => {
          const newTotalItems = prev.total_items - 1;
          const newTotalPages = Math.ceil(newTotalItems / prev.limit);

          return {
            ...prev,
            total_items: newTotalItems,
            total_pages: newTotalPages,
          };
        });

        // If we deleted the last item on a page (and not on page 1), go to previous page
        if (flashcards.length === 1 && pagination.page > 1) {
          handlePageChange(pagination.page - 1);
        }

        closeDeleteDialog();
        toast.success("Flashcard deleted successfully");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete flashcard";
        toast.error(errorMessage);
      } finally {
        setIsDeleting(false);
      }
    },
    [flashcards.length, pagination.page, closeDeleteDialog, handlePageChange]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchFlashcards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // State
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

    // Actions
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
  };
}

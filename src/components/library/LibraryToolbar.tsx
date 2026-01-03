import { SearchInput } from "./SearchInput";
import { AddManualButton } from "./AddManualButton";

interface LibraryToolbarProps {
  onSearch: (query: string) => void;
  onCreateManual: () => void;
  searchQuery: string;
  isLoading: boolean;
}

/**
 * Toolbar component containing search and manual creation controls.
 * Positioned at the top of the library view.
 */
export function LibraryToolbar({ onSearch, onCreateManual, searchQuery, isLoading }: LibraryToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <SearchInput value={searchQuery} onChange={onSearch} onSubmit={onSearch} disabled={isLoading} />
      <AddManualButton onClick={onCreateManual} disabled={isLoading} />
    </div>
  );
}

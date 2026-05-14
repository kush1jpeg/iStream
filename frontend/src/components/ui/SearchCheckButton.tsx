import { Search } from "lucide-react";
import { useState } from "react";
import { SearchOverlay } from "./searchOverlay";

export const SearchButton = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <button
        className="
        relative
        w-12 h-12
        flex items-center justify-center
        rounded-xl
        border border-purple-500/40
        text-purple-400
        hover:text-purple-200
        hover:border-purple-400
        transition-colors
        group
      "
        onClick={() => setSearchOpen(true)}
      >
        <Search className="w-5 h-5 z-10" />
      </button>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
};



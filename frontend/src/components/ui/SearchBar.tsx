import { Search } from "lucide-react";


type Props = {
  setQuery: (value: string) => void;
  query: string
}

export default function DropsWithSearch({ setQuery, query }: Props) {

  return (
    <section className="space-y-6">
      {/* Header + Search */}
      <div className="flex items-center justify-between ">

        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drops..."
            className="
              w-full pl-10 pr-4 py-2 rounded-xl
              bg-zinc-900 border border-zinc-800
              text-white placeholder:text-zinc-500
              focus:outline-none focus:ring-2 focus:ring-primary/60
              transition
            "
          />
        </div>
      </div>

    </section>
  );
}


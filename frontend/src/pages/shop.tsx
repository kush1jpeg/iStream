import Carousel from "@/components/ui/carousel";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/sidebar";
import ProductCard from "@/components/ui/ProductCard";
import SearchBar from "@/components/ui/SearchBar";
import { useState } from "react";
import { FilterShop } from "@/components/ui/filter";


const followedUsers = [
  { id: "1", name: "Alice", avatarUrl: "https://i.pinimg.com/736x/2f/59/16/2f5916f5dd6f4d529506298ea82050d5.jpg", isStreaming: true },
  { id: "2", name: "Bob", avatarUrl: "https://i.pinimg.com/736x/2f/59/16/2f5916f5dd6f4d529506298ea82050d5.jpg", isStreaming: false },
];

const allDrops = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 10,
  title: `Drop #${i + 1}`,
  price: Number((Math.random() * 10 + 2).toFixed(2)),
  img: `https://picsum.photos/400/300?${i + 10}`,
  tag: ["avatar", "badge", "overlay"][i % 3],
}));

export default function ShopLanding() {

  const [query, setQuery] = useState("");
  // const [allDrops, setDrops] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="bg-background crt-container film-grain text-zinc-100">
      <Navigation />
      <Sidebar followedUsers={followedUsers} />

      {/* HERO */}

      <section className="relative overflow-hidden border-border border-zinc-800 ">
        <div className="max-w-7xl mx-auto px-6 py-4 grid md:grid-cols-2 gap-10 items-center">

          <div className="space-y-6 z-50">
            <h1 className="text-5xl font-bold leading-tight">
              Digital Drops.<br />Forged Fresh.
            </h1>

            <p className="text-zinc-400 max-w-md">
              Limited creator assets. Avatars, overlays, badges. Buy once. Flex forever.
            </p>

          </div>

          {/* HERO CAROUSEL */}
          <Carousel slides={allDrops} />

        </div>
      </section>

      <div className="max-w-7xl mx-auto p-6 space-y-12 ">


        <section className="space-y-6">
          <div className="flex items-center justify-between mr-10">
            <h2 className="text-3xl font-semibold">All Drops</h2>
            <div className="w-full max-w-md">
              <SearchBar query={query} setQuery={setQuery} />
            </div>
          </div>
          <FilterShop />

          <div className="grid md:grid-cols-4 gap-6">
            {allDrops.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}


import Carousel from "@/components/ui/carousel";
import ProductCard from "@/components/ui/ProductCard";
import SearchBar from "@/components/ui/SearchBar";
import { useEffect, useState } from "react";
import { FilterShop } from "@/components/ui/filter";
import { api } from "@/App";
import { IShopItem } from "@istream/shared";
import { Footer } from "@/components/Footer";


export default function ShopLanding() {
  const [query, setQuery] = useState("");
  const [drops, setDrops] = useState<IShopItem[]>([]);
  const [carousel, setCarousel] = useState<IShopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [allDrops, setAllDrops] = useState<IShopItem[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("shop/getAll");

        const items = data.data;
        console.log(items)
        setAllDrops(items);
        setDrops(items);
        setCarousel(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        if (!trimmed && !filter) {
          setDrops(allDrops);
          return;
        }

        if (!trimmed && filter) {
          setDrops(allDrops.filter(item => item.type === filter));
          return;
        }

        if (trimmed.length < 2) {
          // query exists but too short — apply filter locally if any
          const filtered = filter
            ? allDrops.filter(item => item.type === filter)
            : allDrops;
          setDrops(filtered);
          return;
        }

        // query >= 2 chars — hit search API
        const { data } = await api.get("/shop/search", {
          params: {
            q: trimmed,
            ...(filter && { type: filter }),
          },
        });
        setDrops(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, filter, allDrops]);


  const isSearching = query.trim().length >= 2;

  return (
    <div className="bg-background crt-container film-grain text-zinc-100">
      <section className="relative overflow-hidden border-border border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 z-50">
            <h1 className="text-5xl font-bold leading-tight">
              Digital Drops.<br />Forged Fresh.
            </h1>

            <p className="text-zinc-400 max-w-md">
              Limited creator assets. Avatars, overlays, badges. Buy once. Flex forever.
            </p>
          </div>

          <Carousel slides={carousel} />
        </div>
      </section>

      <div className="max-w-7xl mx-auto p-6 space-y-12">
        <section className="space-y-6">
          <div className="flex items-center justify-between mr-10">
            <h2 className="text-3xl font-semibold">
              {isSearching ? "Search Results" : "All Drops"}
            </h2>
            <div className="w-full max-w-md">
              <SearchBar query={query} setQuery={setQuery} />
            </div>
          </div>
          <FilterShop filter={filter} setFilter={setFilter} />
          <div className="grid md:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-4 flex justify-center py-12">
                <span className="font-mono text-vhs-purple animate-pulse text-xs uppercase tracking-widest">
                  searching...
                </span>
              </div>
            ) : drops.length === 0 ? (
              <div className="col-span-4 text-center py-12">
                <p className="font-mono text-xs text-muted-foreground opacity-50 uppercase tracking-widest">
                  {'>'} no items found
                </p>
              </div>
            ) : (
              drops.map((item) => (
                <ProductCard key={item._id} item={item} />
              ))
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

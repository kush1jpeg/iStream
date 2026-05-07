import Carousel from "@/components/ui/carousel";
import ProductCard from "@/components/ui/ProductCard";
import SearchBar from "@/components/ui/SearchBar";
import { useEffect, useState } from "react";
import { FilterShop } from "@/components/ui/filter";
import { api } from "@/App";
import { ShopItem } from "@/types/types";
import { Footer } from "@/components/Footer";


export default function ShopLanding() {

  const [query, setQuery] = useState("");
  const [drops, setDrops] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchShopItems = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/shop/`);
        setDrops(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShopItems();
  }, []);


  useEffect(() => {

    if (query.trim().length < 2) {
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/shop/search`, {
          params: {
            user: query,
            ...(filter && { type: filter }),
          },
          withCredentials: true,
        });
        setDrops(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, filter]);

  if (loading) return (
    <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center">
      <span className="font-mono text-vhs-purple animate-pulse">loading shop...</span>
    </div>
  );

  return (
    <div className="bg-background crt-container film-grain text-zinc-100">

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
          <Carousel slides={drops} />

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
          <FilterShop filter={filter} setFilter={setFilter} />

          <div className="grid md:grid-cols-4 gap-6">
            {drops.map((item) => (
              <ProductCard item={item} />
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}


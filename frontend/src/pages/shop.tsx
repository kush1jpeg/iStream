import { motion } from "framer-motion";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Filter } from "lucide-react";
import Carousel from "@/components/ui/carousel";



const allDrops = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 10,
  title: `Drop #${i + 1}`,
  price: Number((Math.random() * 10 + 2).toFixed(2)),
  img: `https://picsum.photos/400/300?${i + 10}`,
  tag: ["avatar", "badge", "overlay"][i % 3],
}));

export default function ShopLanding() {
  const [filter, setFilter] = useState<string | null>(null);


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* HERO */}

      <section className="relative overflow-hidden border-b border-zinc-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-10 items-center">

          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              Digital Drops.<br />Forged Fresh.
            </h1>

            <p className="text-zinc-400 max-w-md">
              Limited creator assets. Avatars, overlays, badges. Buy once. Flex forever.
            </p>

            <Button size="lg">Explore Drops</Button>
          </div>

          {/* HERO CAROUSEL */}
          <Carousel slides={allDrops} />

        </div>
      </section>

      <div className="max-w-7xl mx-auto p-6 space-y-12">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
          </DrawerTrigger>

          <DrawerContent className="bg-zinc-950 border-zinc-800">
            <DrawerHeader>
              <DrawerTitle>Filter Drops</DrawerTitle>
            </DrawerHeader>

            <div className="p-6 flex gap-4">
              {["avatar", "badge", "overlay"].map((t) => (
                <Button
                  key={t}
                  variant={filter === t ? "default" : "outline"}
                  onClick={() => setFilter(t)}
                >
                  {t}
                </Button>
              ))}

              <Button variant="ghost" onClick={() => setFilter(null)}>
                Reset
              </Button>
            </div>
          </DrawerContent>
        </Drawer>

        {/* NEWEST */}

        <section className="space-y-4">
          <h2 className="text-3xl font-semibold">Newest Drops</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {allDrops.map((item) => (
              <motion.div key={item.id} whileHover={{ scale: 1.04 }}>
                <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                  <img src={item.img} className="h-48 w-full object-cover" />
                  <CardContent className="p-4">
                    <div className="font-medium">{item.title}</div>
                    <div className="flex justify-between mt-2">
                      <span>${item.price}</span>
                      <Button size="sm">Buy</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ALL DROPS */}

        <section className="space-y-6">

          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-semibold">All Drops</h3>

            {/* FILTER DRAWER */}


          </div>


        </section>
      </div>
    </div>
  );
}


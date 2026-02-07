import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Filter } from "lucide-react";
import { useState } from "react";



export const FilterShop = () => {
  const [filter, setFilter] = useState("");

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="
        border-border
        text-foreground
        hover:bg-primary/10
        hover:text-primary
      "
        >
          <Filter className="w-4 h-4 mr-2" /> Filters
        </Button>
      </DrawerTrigger>

      <DrawerContent
        className="
      bg-background
      border-border
      text-foreground
    "
      >
        <DrawerHeader className="border-b border-border">
          <DrawerTitle className="text-primary">
            Filter Drops
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-6 flex gap-4 flex-wrap">
          {["avatar", "badge", "overlay"].map((t) => (
            <Button
              key={t}
              onClick={() => setFilter(t)}
              variant="outline"
              className={`
            capitalize
            transition-all duration-200

            ${filter === t
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                  : "border-border text-muted-foreground hover:bg-primary/20 hover:text-primary"
                }
          `}
            >
              {t}
            </Button>
          ))}

          <Button
            variant="ghost"
            onClick={() => setFilter(null)}
            className="
          text-muted-foreground
          hover:text-primary
          hover:bg-primary/10
        "
          >
            Reset
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

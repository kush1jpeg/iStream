import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Card } from "./card";
import { ShopItem } from "@/types/types";

type ProductCardProps = {
  item: ShopItem;
};


export default function ProductCard({ item }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative w-64 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">

        {/* IMAGE WRAPPER */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={item.imageURL}
            alt={item.name}
            className={`h-full w-full object-cover transition-transform duration-500 ease-out ${isHovered ? "scale-125 brightness-75" : ""
              }`}
          />

          {/* Title overlay */}
          <div className="absolute flex flex-col bottom-2 left-2 text-white font-semibold text-l px-2 py-2 rounded">
            <span className="font-normal text-xl">{item.name}</span>
            <span className={`transition-opacity duration-300 ${isHovered ? "opacity-0" : "opacity-100"}`}>
              ${item.price}
            </span>
          </div>

          <button
            /* onClick={} */
            className={`
      absolute bottom-2 ml-1 m-[-1]
      text-white px-3 py-2 rounded-full flex items-center gap-2 shadow-lg font-semibold text-sm
      transform transition-all duration-300 ease-out
      ${isHovered ? "translate-y-0 opacity-100 bg-primary" : "translate-y-full opacity-0"}
    `}
          >
            <ShoppingCart size={16} />
            Buy ${item.price}
          </button>
        </div>


      </Card>
    </div>
  );
}


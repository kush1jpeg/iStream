import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Card } from "./card";
import { ShopItem } from "@/types/types";
import { handlePayment } from "../rzp/handlePayment";

type ProductCardProps = {
  item: ShopItem;
};


export default function ProductCard({ item }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div
      className="relative w-64 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {loading && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">

            {/* spinning ring */}

            {/* text */}
            <div className="font-mono text-purple-400 tracking-widest animate-pulse">
              PROCESSING PAYMENT...
            </div>
          </div>
        </div>
      )}

      <Card className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">

        {/* IMAGE WRAPPER */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={item.imageURL}
            alt={item.name}
            className={`h-full w-full object-contain transition-transform duration-500 ease-out ${isHovered ? "scale-125 brightness-75" : ""
              }`}
          />

          {/* Title overlay */}
          <div
            className={`absolute flex flex-col bottom-2 left-2 text-white font-extrabold text-xl px-1 py-1 rounded ${!isHovered ? "bg-purple-500" : ""
              }`}
          >   <span className={`transition-opacity duration-300 ${isHovered ? "opacity-0" : "opacity-100"}`}>
              ₹{item.price}
            </span>
          </div>

          <button
            onClick={() => {
              handlePayment(item._id, "shop", setLoading)
              setLoading(true);
            }}
            className={`
      absolute bottom-2 ml-1 m-[-1]
      text-white px-3 py-2 rounded-full flex items-center gap-2 shadow-lg font-semibold text-sm
      transform transition-all duration-300 ease-out
      ${isHovered ? "translate-y-0 opacity-100 bg-primary" : "translate-y-full opacity-0"}
    `}
          >
            <ShoppingCart size={18} />
            Buy ₹{item.price}
          </button>
        </div>


      </Card>
    </div>
  );
}


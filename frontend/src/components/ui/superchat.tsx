import { FC } from "react";

interface SupportOption {
  id: string;
  label: string;
  price: number;
}

interface SuperChatSelectorProps {
  options?: SupportOption[];
  onSelect: (option: SupportOption) => void;
}

export const SuperChatSelector: FC<SuperChatSelectorProps> = ({
  options = [
    { id: "1", label: "Coffee", price: 3 },
    { id: "2", label: "Snack", price: 5 },
    { id: "3", label: "Supporter", price: 10 },
  ],
  onSelect,
}) => {
  return (
    <div className="flex gap-2 mt-3">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt)}
          className="flex-1 bg-purple-600 hover:bg-purple-500 text-gray-100 px-3 py-1 rounded font-mono text-sm transition-colors"
        >
          {opt.label} - ${opt.price}
        </button>
      ))}
    </div>
  );
};


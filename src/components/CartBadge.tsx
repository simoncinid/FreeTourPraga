"use client";

import { ShoppingCart } from "lucide-react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cartCount } from "@/lib/cart";

export function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function sync() {
      setCount(cartCount());
    }
    sync();
    window.addEventListener("ftp-cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ftp-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <Link
      href="/carrello"
      className="relative inline-flex items-center"
      aria-label="Apri carrello"
    >
      <ShoppingCart size={28} className="h-7 w-7 object-contain" aria-hidden />
      {count > 0 ? (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

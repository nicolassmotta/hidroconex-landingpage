import { useEffect, useState } from "react";
import {
  getStoredProducts,
  PRODUCTS_STORAGE_KEY,
  PRODUCTS_UPDATED_EVENT,
  type StoredProduct,
} from "@/lib/localData";

export function useStoredProducts(): StoredProduct[] {
  const [products, setProducts] = useState<StoredProduct[]>(() => getStoredProducts());

  useEffect(() => {
    const refreshProducts = () => setProducts(getStoredProducts());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === PRODUCTS_STORAGE_KEY) refreshProducts();
    };

    window.addEventListener(PRODUCTS_UPDATED_EVENT, refreshProducts);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, refreshProducts);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return products;
}

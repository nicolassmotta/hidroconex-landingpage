import { useEffect, useState } from "react";
import {
  getQuoteRequests,
  QUOTE_REQUESTS_STORAGE_KEY,
  QUOTE_REQUESTS_UPDATED_EVENT,
  type QuoteRequest,
} from "@/lib/localData";

export function useQuoteRequests(): QuoteRequest[] {
  const [requests, setRequests] = useState<QuoteRequest[]>(() => getQuoteRequests());

  useEffect(() => {
    const refreshRequests = () => setRequests(getQuoteRequests());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === QUOTE_REQUESTS_STORAGE_KEY) refreshRequests();
    };

    window.addEventListener(QUOTE_REQUESTS_UPDATED_EVENT, refreshRequests);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(QUOTE_REQUESTS_UPDATED_EVENT, refreshRequests);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return requests;
}

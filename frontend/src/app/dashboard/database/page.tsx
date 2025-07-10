/** @format */

"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Input } from "@/components/ui/input";
import CVERecordMiniTemplate from "@/templates/tableCVETemplate";
import LoadingSpinner from "@/components/Loading";

export const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
};

export default function DatabaseSearchPage() {
  const {
    data: randomVulns,
    error,
    isValidating,
    mutate,
  } = useSWR<any[]>("/api/db/random", fetcher);

  const [searchId, setSearchId] = useState<string>("");
  const [results, setResults] = useState<any>([]);

  // Load random on mount
  useEffect(() => {
    mutate();
  }, [mutate]);

  // Real-time search for prefix while typing (debounced)
  useEffect(() => {
    if (!searchId) {
      setResults(
        randomVulns?.map((result: any) => {
          // Find the container within the result that contains "cna_title"
          const containerWithCnaTitle = result.find(
            (container: any) => container.cna_title
          );
          return containerWithCnaTitle || result[0];
        })
      );

      return;
    }
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/db/search?prefix=${encodeURIComponent(searchId)}`
        );
        if (res.ok) {
          const data: any = await res.json();
          setResults(
            data?.map((result: any) => {
              // Find the container within the result that contains "cna_title"
              const containerWithCnaTitle = result.find(
                (container: any) => container.cna_title
              );
              return containerWithCnaTitle || result[0];
            })
          );
        }
      } catch (err) {
        console.error("Fetch error", err);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchId, randomVulns]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Buscar vulnerabilidad por ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
      </div>

      {results?.length > 0 && (
        <>
          <h2 className="text-xl font-semibold">Results</h2>
          <CVERecordMiniTemplate records={results} />
        </>
      )}

      {results?.length <= 0 && isValidating && (
        <section className="flex flex-col items-center justify-center h-96">
          <LoadingSpinner className="items-center justify-content" />
        </section>
      )}
      {error && <p>Error al cargar los datos: {error.message}</p>}
    </div>
  );
}

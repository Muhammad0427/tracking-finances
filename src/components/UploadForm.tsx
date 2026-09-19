"use client";

import { useRef, useState, useTransition } from "react";
import { uploadStatement, type UploadResult } from "@/app/actions";

export default function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await uploadStatement(formData);
      setResult(res);
      if (res.success) {
        formRef.current?.reset();
        setFileName(null);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <label
        htmlFor="file"
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-hairline bg-surface px-6 py-10 text-center transition-colors hover:border-[#2a78d6]/50"
      >
        <span className="text-sm font-medium">
          {fileName ?? "Click to choose a CSV statement"}
        </span>
        <span className="mt-1 text-xs text-text-muted">
          Exported from your bank as CSV, with date, description, and amount columns
        </span>
        <input
          id="file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          required
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-[#2a78d6] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c5cab] disabled:opacity-60"
      >
        {isPending ? "Importing…" : "Import statement"}
      </button>

      {result && (
        <div
          className={`rounded-md border p-3 text-sm ${
            result.success
              ? "border-[#0ca30c]/30 bg-[#0ca30c]/10 text-[#006300]"
              : "border-[#d03b3b]/30 bg-[#d03b3b]/10 text-[#d03b3b]"
          }`}
        >
          {result.message}
        </div>
      )}
    </form>
  );
}

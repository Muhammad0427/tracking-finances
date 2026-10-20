import { createWorker } from "tesseract.js";
import engLangData from "@tesseract.js-data/eng";
import type { ParseResult } from "./parseStatement";
import { parseTransactionLines } from "./parseStatementText";

// OCR on a photo is the least reliable import path: phone photos add glare,
// skew, and compression artifacts on top of everything a PDF's text layer
// already avoids. Treat this as a last resort — a CSV or PDF export is much
// more likely to come out right.
//
// The English language data is bundled via @tesseract.js-data/eng and read
// from the local filesystem (langPath) rather than tesseract.js's default
// behavior of fetching it from a CDN on first use — that fetch is slow (or
// outright unreachable on some networks) and, worse, a failure there can
// surface as an unhandled rejection instead of a normal error. cacheMethod
// "none" skips writing a cache copy, since serverless filesystems are often
// read-only outside of /tmp.

export async function parseStatementImage(buffer: Buffer): Promise<ParseResult> {
  let text: string;
  const worker = await createWorker("eng", 1, {
    langPath: engLangData.langPath,
    gzip: engLangData.gzip,
    cacheMethod: "none",
  });
  try {
    const result = await worker.recognize(buffer);
    text = result.data.text;
  } catch (err) {
    return {
      transactions: [],
      skippedRows: 0,
      errors: [`Could not read this image: ${err instanceof Error ? err.message : String(err)}`],
    };
  } finally {
    await worker.terminate();
  }

  const { transactions, skippedRows } = parseTransactionLines(text);

  const errors: string[] = [];
  if (transactions.length === 0) {
    errors.push(
      "Couldn't find any transaction lines in this image. A clearer, well-lit, straight-on photo (or a cropped " +
        "screenshot) works best — or try a CSV/PDF export from your bank instead."
    );
  }

  return { transactions, skippedRows, errors };
}

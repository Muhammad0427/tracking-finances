import { PDFParse } from "pdf-parse";
import type { ParseResult } from "./parseStatement";
import { parseTransactionLines } from "./parseStatementText";

// PDF bank/card statements have no structured columns by the time text is
// extracted — this is a best-effort line-by-line heuristic, not a guarantee.
// Scanned/image-only PDFs (no text layer) will not parse well this way —
// use the photo upload path for those, or CSV when your bank offers it.

export async function parseStatementPdf(buffer: Buffer): Promise<ParseResult> {
  const parser = new PDFParse({ data: buffer });
  let text: string;
  try {
    const result = await parser.getText();
    text = result.text;
  } catch (err) {
    return {
      transactions: [],
      skippedRows: 0,
      errors: [`Could not read this PDF: ${err instanceof Error ? err.message : String(err)}`],
    };
  } finally {
    await parser.destroy();
  }

  const { transactions, skippedRows } = parseTransactionLines(text);

  const errors: string[] = [];
  if (transactions.length === 0) {
    errors.push(
      "Couldn't find any transaction lines in this PDF. It may be a scanned image without a text layer " +
        "(try uploading it as a photo instead), or use a layout this parser doesn't recognize — a CSV export from your bank is more reliable."
    );
  }

  return { transactions, skippedRows, errors };
}

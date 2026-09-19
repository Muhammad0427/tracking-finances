import UploadForm from "@/components/UploadForm";
import StatementRow from "@/components/StatementRow";
import { listStatements } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const statements = await listStatements();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Upload a statement</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Export a CSV from your bank or credit card, and transactions will be automatically
          categorized&nbsp;&mdash;&nbsp;including a dedicated category for Zakat &amp; Sadaqa giving.
        </p>
      </div>

      <UploadForm />

      <section>
        <h2 className="text-sm font-medium text-text-secondary">Uploaded statements</h2>
        {statements.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No statements uploaded yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border-hairline rounded-lg border border-border-hairline bg-surface">
            {statements.map((s) => (
              <StatementRow key={s.id} statement={s} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

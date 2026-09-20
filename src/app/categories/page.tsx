import { listCategories } from "@/lib/queries";
import CategoryList from "@/components/CategoryList";
import AddCategoryForm from "@/components/AddCategoryForm";
import RecategorizeButton from "@/components/RecategorizeButton";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Categories</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Transactions are auto-categorized on import. Adjust colors, types, or add your own —
          Zakat &amp; Sadaqa is included by default so giving is tracked separately from other spending.
        </p>
      </div>

      <CategoryList categories={categories} />

      <section>
        <h2 className="text-sm font-medium text-text-secondary">Add a category</h2>
        <div className="mt-2">
          <AddCategoryForm />
        </div>
      </section>

      <RecategorizeButton />
    </div>
  );
}

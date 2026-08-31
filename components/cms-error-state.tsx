import { FiAlertCircle } from "react-icons/fi";

export function CmsErrorState() {
  return (
    <section className="mx-auto my-16 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center sm:p-8">
      <FiAlertCircle aria-hidden="true" className="mx-auto mb-4 text-3xl text-amber-700" />
      <h2 className="text-xl font-bold text-slate-950">The catalog is temporarily unavailable</h2>
      <p className="mt-2 leading-7 text-slate-600">We could not reach our product catalog. Please try again in a few minutes.</p>
    </section>
  );
}

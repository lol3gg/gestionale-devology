export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-brand-elevated" />
      <div className="h-4 w-72 animate-pulse rounded bg-brand-elevated" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-brand-lg bg-brand-elevated" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-brand-lg bg-brand-elevated" />
    </div>
  );
}

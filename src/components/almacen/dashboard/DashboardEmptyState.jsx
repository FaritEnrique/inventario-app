const DashboardEmptyState = ({ title = "Sin información", description }) => {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
      <p className="font-bold text-slate-800">{title}</p>
      {description ? (
        <p className="mt-1 leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
};

export default DashboardEmptyState;

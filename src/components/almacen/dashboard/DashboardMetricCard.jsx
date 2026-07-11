import { Link } from "react-router-dom";

const toneClasses = {
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  slate: "bg-slate-50 text-slate-700 ring-slate-100",
};

const DashboardMetricCard = ({
  title,
  value,
  description,
  icon: Icon,
  tone = "indigo",
  to,
}) => {
  const iconNode = Icon ? <Icon className="h-5 w-5" /> : null;

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <p className="min-h-[2.25rem] text-xs font-black uppercase leading-tight tracking-wide text-slate-500">
          {title}
        </p>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${
            toneClasses[tone] || toneClasses.indigo
          }`}
        >
          {iconNode}
        </div>
      </div>

      <div className="flex flex-1 items-center">
        <p className="w-full text-center text-4xl font-black text-slate-950">
          {value}
        </p>
      </div>

      <p className="min-h-[3.25rem] text-sm leading-relaxed text-slate-600">
        {description}
      </p>
    </>
  );

  const className =
    "flex min-h-[214px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md";

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
};

export default DashboardMetricCard;

import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCcw } from "lucide-react";

const DashboardDetalleHeader = ({
  badge,
  title,
  description,
  icon: Icon,
  loading = false,
  onRefresh,
  children,
}) => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-indigo-50" />
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-700">
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {badge}
          </div>
          <h1 className="mt-3 text-3xl font-black text-slate-950">{title}</h1>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/modulo-almacen"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>

          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Actualizar
            </button>
          ) : null}

          {children}
        </div>
      </div>
    </section>
  );
};

export default DashboardDetalleHeader;

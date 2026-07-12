import {
  ArrowLeftRight,
  ClipboardCheck,
  FileInput,
  FileOutput,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const procesos = [
  {
    to: "/modulo-almacen/transferencias",
    title: "Notas de Transferencia de Inventarios",
    description:
      "Solicitud formal entre almacenes, con reserva automática, Nota de Salida en el origen y Nota de Ingreso en el destino.",
    icon: ArrowLeftRight,
  },
  {
    to: "/modulo-almacen/ajustes-inventario",
    title: "Ajustes de Inventario",
    description:
      "Regularización documentada de existencias que todavía permanecen bajo custodia del almacén.",
    icon: ClipboardCheck,
  },
  {
    to: "/modulo-almacen/prestamos",
    title: "Préstamos y devoluciones",
    description:
      "Seguimiento de salidas temporales, devoluciones por Nota de Ingreso y actas de regularización.",
    icon: PackageCheck,
  },
  {
    to: "/modulo-almacen/notas-ingreso",
    title: "Notas de Ingreso",
    description:
      "Recepciones por abastecimiento, devolución de préstamo o transferencia entre almacenes.",
    icon: FileInput,
  },
  {
    to: "/modulo-almacen/notas-salida",
    title: "Notas de Salida",
    description:
      "Entregas definitivas, salidas temporales y despachos derivados de transferencias.",
    icon: FileOutput,
  },
];

const InventarioOperacionesPage = () => (
  <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
    <header>
      <h1 className="text-3xl font-semibold text-slate-900">
        Mapa de operaciones de inventario
      </h1>
      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600">
        Cada operación se inicia desde su documento o bandeja correspondiente.
        No se introducen identificadores técnicos ni se ejecutan movimientos
        directos de stock desde esta página.
      </p>
    </header>

    <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <div>
          <h2 className="font-semibold text-blue-950">
            Reservas y liberaciones automáticas
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-blue-900">
            La reserva se genera junto con la Nota de Pedido o al aprobar una
            Nota de Transferencia. Se consume con la salida y se libera
            automáticamente por vencimiento, rechazo o cancelación. No es una
            operación manual del usuario.
          </p>
        </div>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-2">
      {procesos.map((proceso) => {
        const ProcessIcon = proceso.icon;

        return (
          <Link
            key={proceso.to}
            to={proceso.to}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <span className="rounded-xl bg-indigo-50 p-3 text-indigo-700 transition group-hover:bg-indigo-100">
                <ProcessIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900 group-hover:text-indigo-800">
                  {proceso.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {proceso.description}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </section>
  </div>
);

export default InventarioOperacionesPage;

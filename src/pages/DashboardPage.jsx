import { Link } from "react-router-dom";
import { MdInventory } from "react-icons/md";
import {
  FaBoxes,
  FaClipboardList,
  FaExchangeAlt,
  FaFileInvoiceDollar,
  FaFileImport,
  FaKey,
  FaOpencart,
  FaRegAddressCard,
  FaShoppingCart,
  FaSitemap,
  FaUserCog,
} from "react-icons/fa";
import {
  canAccessAreasManagementEffective,
  canAccessCotizacionesEffective,
  canAccessProveedorManagementEffective,
  canManageCatalogMasterEffective,
  canAccessUserManagementEffective,
  canApprovePedidoInternoEffective,
  canCreatePedidoInternoEffective,
  canOperateInventoryEffective,
  canViewOrdenCompraApprovalTrayEffective,
  canViewOrdenesCompraEffective,
  canViewPedidosInternosModuleEffective,
  canViewRequerimientosModuleEffective,
  canViewWarehouseTrayEffective,
  getAvailableApprovalTraysEffective,
  getCotizacionesHomePathEffective,
  getPedidosInternosHomePathEffective,
} from "../accessRules";
import { useAuth } from "../context/authContext";

const cardClasses =
  "transform rounded-lg border-2 border-indigo-500 bg-white p-6 shadow transition-transform duration-300 hover:scale-105 hover:shadow-xl";

const baseCards = [
  {
    title: "Requerimientos",
    description:
      "Entrar al listado general de requerimientos y desde ahi acceder a bandejas o crear nuevos requerimientos.",
    icon: <FaShoppingCart />,
    path: "/requerimientos",
    visible: ({ user }) => canViewRequerimientosModuleEffective(user),
  },
  {
    title: "Notas de Pedido",
    description:
      "Entrar a la vista de notas de pedido compatible con el contexto activo.",
    icon: <FaClipboardList />,
    path: ({ user }) => getPedidosInternosHomePathEffective(user),
    visible: ({ user }) => canViewPedidosInternosModuleEffective(user),
  },
  {
    title: "Nueva Nota de Pedido",
    description:
      "Registrar una nota de pedido desde el contexto operativo seleccionado.",
    icon: <FaOpencart />,
    path: "/notas-pedido/nueva",
    visible: ({ user }) => canCreatePedidoInternoEffective(user),
  },
  {
    title: "Bandeja de Aprobacion NP",
    description:
      "Revisar solo notas de pedido que este contexto puede aprobar.",
    icon: <FaClipboardList />,
    path: "/notas-pedido/aprobaciones",
    visible: ({ user }) => canApprovePedidoInternoEffective(user),
  },
  {
    title: "Bandeja de Almacen",
    description:
      "Atender notas de pedido y generar salidas solo desde contexto operativo de inventario.",
    icon: <FaBoxes />,
    path: "/notas-pedido/almacen",
    visible: ({ user }) => canViewWarehouseTrayEffective(user),
  },
  {
    title: "Cotizaciones",
    description:
      "Entrar a la bandeja o vista logistica habilitada por el contexto activo.",
    icon: <FaFileInvoiceDollar />,
    path: ({ user }) => getCotizacionesHomePathEffective(user),
    visible: ({ user }) => canAccessCotizacionesEffective(user),
  },
  {
    title: "Ordenes de Compra",
    description:
      "Consultar ordenes y acciones de compra solo cuando el contexto lo habilita.",
    icon: <FaFileInvoiceDollar />,
    path: "/ordenes-compra",
    visible: ({ user }) => canViewOrdenesCompraEffective(user),
  },
  {
    title: "Bandeja OC",
    description:
      "Revisar solo las ordenes de compra que este contexto puede aprobar.",
    icon: <FaFileInvoiceDollar />,
    path: "/ordenes-compra?view=aprobacion",
    visible: ({ user }) => canViewOrdenCompraApprovalTrayEffective(user),
  },
  {
    title: "Stock de Inventario",
    description:
      "Consultar stock actual, reservado y disponible solo desde un contexto compatible.",
    icon: <FaBoxes />,
    path: "/inventario-stock",
    visible: ({ user }) => canOperateInventoryEffective(user),
  },
  {
    title: "Movimientos de Inventario",
    description:
      "Auditar entradas, salidas, ajustes y transferencias desde inventario.",
    icon: <FaExchangeAlt />,
    path: "/inventario-movimientos",
    visible: ({ user }) => canOperateInventoryEffective(user),
  },
  {
    title: "Kardex",
    description:
      "Revisar el kardex auditable por producto, almacen y periodo desde inventario.",
    icon: <FaClipboardList />,
    path: "/inventario-kardex",
    visible: ({ user }) => canOperateInventoryEffective(user),
  },
  {
    title: "Notas de Ingreso",
    description:
      "Consultar ingresos y recepciones documentales solo desde inventario.",
    icon: <FaFileImport />,
    path: "/inventario-notas-ingreso",
    visible: ({ user }) => canOperateInventoryEffective(user),
  },
  {
    title: "Notas de Salida",
    description:
      "Consultar salidas documentales e internas solo desde inventario.",
    icon: <FaExchangeAlt />,
    path: "/inventario-notas-salida",
    visible: ({ user }) => canOperateInventoryEffective(user),
  },
  {
    title: "Reservas de Stock",
    description:
      "Seguir reservas, liberaciones y despachos solo desde inventario.",
    icon: <FaBoxes />,
    path: "/inventario-reservas",
    visible: ({ user }) => canOperateInventoryEffective(user),
  },
  {
    title: "Recepciones / Nota de Ingreso",
    description:
      "Registrar recepciones e ingresos solo cuando el contexto opera inventario.",
    icon: <FaFileImport />,
    path: "/inventario-recepciones",
    visible: ({ user }) => canOperateInventoryEffective(user),
  },
  {
    title: "Operaciones de Inventario",
    description:
      "Carga inicial, ajustes, movimientos manuales y reservas desde inventario.",
    icon: <MdInventory />,
    path: "/inventario-operaciones",
    visible: ({ user }) => canOperateInventoryEffective(user),
  },
  {
    title: "Gestion de Productos",
    description:
      "Administrar catalogos maestros de productos desde la jefatura de almacen o los overrides autorizados.",
    icon: <MdInventory />,
    path: "/gestion-productos",
    visible: ({ user }) => canManageCatalogMasterEffective(user),
  },
  {
    title: "Gestion de Marcas",
    description:
      "Administrar marcas del catalogo maestro desde almacen o los overrides autorizados.",
    icon: <MdInventory />,
    path: "/gestion-marcas",
    visible: ({ user }) => canManageCatalogMasterEffective(user),
  },
  {
    title: "Gestion de Areas",
    description:
      "Administrar areas o unidades solo desde un contexto administrativo.",
    icon: <FaSitemap />,
    path: "/gestion-areas",
    visible: ({ user }) => canAccessAreasManagementEffective(user),
  },
  {
    title: "Gestion de Proveedores",
    description:
      "Administrar proveedores y consultas relacionadas desde contexto administrativo.",
    icon: <FaRegAddressCard />,
    path: "/gestion-proveedores",
    visible: ({ user }) => canAccessProveedorManagementEffective(user),
  },
  {
    title: "Configuracion de Empresa",
    description:
      "Actualizar identidad institucional, logo y pie documental para la emision formal de solicitudes.",
    icon: <FaRegAddressCard />,
    path: "/configuracion-empresa",
    visible: ({ user }) => canAccessUserManagementEffective(user),
  },
  {
    title: "Gestion de Usuarios",
    description:
      "Administrar usuarios, rangos y asignaciones operativas del sistema.",
    icon: <FaUserCog />,
    path: "/gestion-usuarios",
    visible: ({ user }) => canAccessUserManagementEffective(user),
  },
];

const DashboardPage = () => {
  const { user, loading, activeContext } = useAuth();

  if (loading || !user || !activeContext) {
    return <div>Cargando contenido del panel de control...</div>;
  }

  const availableApprovalTrays = getAvailableApprovalTraysEffective(user);
  const filteredCards = baseCards.filter((card) =>
    typeof card.visible === "function" ? card.visible({ user }) : true
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-xl border border-indigo-100 bg-white p-5 shadow">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                Resumen de sesion
              </p>
              <h1 className="mt-1 text-3xl font-bold text-indigo-700">
                Bienvenido, {user.nombre}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Este panel refleja solo los modulos y accesos compatibles con
                el contexto operativo activo.
              </p>
            </div>
            <Link
              to="/cambiar-contrasena"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <FaKey />
              Cambiar contrasena
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Cargo
              </span>
              <span className="mt-1 block text-sm font-medium text-gray-800">
                {user.cargo || "No definido"}
              </span>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Contexto activo
              </span>
              <span className="mt-1 block text-sm font-medium text-gray-800">
                {activeContext.displayName || "No definido"}
              </span>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Investidura operativa
              </span>
              <span className="mt-1 block text-sm font-medium text-gray-800">
                {activeContext.role || "Sin rol operativo"}
              </span>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Unidad operativa
              </span>
              <span className="mt-1 block text-sm font-medium text-gray-800">
                {activeContext.areaNombre || "Sin area operativa"}
              </span>
            </div>
          </div>

          {availableApprovalTrays.length > 0 && (
            <div className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
              Este contexto habilita {availableApprovalTrays.length} bandeja
              {availableApprovalTrays.length > 1 ? "s" : ""} de aprobacion.
            </div>
          )}
        </div>

        <h2 className="mb-4 text-3xl font-bold text-indigo-700">
          Panel de Control
        </h2>
        <p className="mb-6 text-lg text-gray-700">
          Accede solo a las vistas y modulos compatibles con el contexto activo
          seleccionado.
        </p>

        {filteredCards.length === 0 ? (
          <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-indigo-700">
              No hay accesos directos para este contexto
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Cambia de contexto si necesitas operar con otra investidura o
              espera la habilitacion de modulos para esta sesion.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCards.map((card) => {
              const resolvedPath =
                typeof card.path === "function" ? card.path({ user }) : card.path;

              return (
                <Link
                  key={`${card.title}-${resolvedPath}`}
                  to={resolvedPath}
                  className={cardClasses}
                >
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-600 bg-indigo-100 text-3xl text-indigo-600">
                    {card.icon}
                  </div>
                  <h2 className="text-center text-lg font-semibold text-gray-800">
                    {card.title}
                  </h2>
                  <p className="text-center text-sm text-gray-600">
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

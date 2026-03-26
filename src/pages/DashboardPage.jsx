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
  canAccessCotizacionesEffective,
  canCreatePedidoInternoEffective,
  canApprovePedidoInternoEffective,
  canOperateInventoryEffective,
  canViewOrdenesCompraEffective,
  canViewOrdenCompraApprovalTrayEffective,
  canViewWarehouseTrayEffective,
} from "../accessRules";
import { useAuth } from "../context/authContext";
import { getAvailableApprovalTraysEffective } from "../accessRules";
import { getActiveRoles } from "../utils/userRoles";
import { canAccessUserManagementEffective } from "../accessRules";

const cardClasses =
  "transform rounded-lg border-2 border-indigo-500 bg-white p-6 shadow transition-transform duration-300 hover:scale-105 hover:shadow-xl";

const baseCards = [
  { title: "Gestion de Productos", description: "Crear, ver, actualizar y dar de baja productos.", icon: <MdInventory />, path: "/gestion-productos", visible: () => true },
  { title: "Gestion de Areas", description: "Administrar las areas o unidades de la organizacion.", icon: <FaSitemap />, path: "/gestion-areas", visible: () => true },
  { title: "Gestion de Usuarios", description: "Administrar usuarios y accesos del sistema.", icon: <FaUserCog />, path: "/gestion-usuarios", visible: ({ user }) => canAccessUserManagementEffective(user) },
  { title: "Requerimientos", description: "Consultar, filtrar y seguir requerimientos de compra.", icon: <FaShoppingCart />, path: "/requerimientos", visible: () => true },
  { title: "Nuevo Requerimiento", description: "Registrar una solicitud formal de adquisicion.", icon: <FaOpencart />, path: "/requerimientos/nuevo", visible: () => true },
  { title: "Gestion de Proveedores", description: "Administrar proveedores y consultar SUNAT.", icon: <FaRegAddressCard />, path: "/gestion-proveedores", visible: () => true },
  { title: "Cotizaciones", description: "Emitir solicitudes, registrar ofertas y comparar proveedores.", icon: <FaFileInvoiceDollar />, path: "/cotizaciones", visible: ({ user }) => canAccessCotizacionesEffective(user) },
  { title: "Ordenes de Compra", description: "Consultar ordenes emitidas, detalle documental y acciones de cierre.", icon: <FaFileInvoiceDollar />, path: "/ordenes-compra", visible: ({ user }) => canViewOrdenesCompraEffective(user) },
  { title: "Bandeja OC", description: "Revisar solo las ordenes de compra que hoy puedes aprobar realmente.", icon: <FaFileInvoiceDollar />, path: "/ordenes-compra?view=aprobacion", visible: ({ user }) => canViewOrdenCompraApprovalTrayEffective(user) },
  { title: "Stock de Inventario", description: "Consultar stock actual, reservado y disponible por producto.", icon: <FaBoxes />, path: "/inventario-stock", visible: () => true },
  { title: "Notas de Pedido", description: "Consultar el historial y detalle de notas de pedido internas.", icon: <FaClipboardList />, path: "/notas-pedido", visible: () => true },
  { title: "Nueva Nota de Pedido", description: "Registrar una nota de pedido sobre stock disponible.", icon: <FaOpencart />, path: "/notas-pedido/nueva", visible: ({ user }) => canCreatePedidoInternoEffective(user) },
  { title: "Bandeja de Aprobacion NP", description: "Revisar y aprobar notas de pedido pendientes.", icon: <FaClipboardList />, path: "/notas-pedido/aprobaciones", visible: ({ user }) => canApprovePedidoInternoEffective(user) },
  { title: "Bandeja de Almacen", description: "Atender notas de pedido aprobadas y generar salidas.", icon: <FaBoxes />, path: "/notas-pedido/almacen", visible: ({ user }) => canViewWarehouseTrayEffective(user) },
  { title: "Movimientos de Inventario", description: "Auditar entradas, salidas, ajustes y transferencias.", icon: <FaExchangeAlt />, path: "/inventario-movimientos", visible: () => true },
  { title: "Kardex", description: "Revisar el kardex auditable por producto, almacen y periodo.", icon: <FaClipboardList />, path: "/inventario-kardex", visible: () => true },
  { title: "Notas de Ingreso", description: "Consultar documentalmente ingresos, recepciones y su trazabilidad.", icon: <FaFileImport />, path: "/inventario-notas-ingreso", visible: () => true },
  { title: "Notas de Salida", description: "Consultar documentalmente entregas internas y salidas de almacen.", icon: <FaExchangeAlt />, path: "/inventario-notas-salida", visible: () => true },
  { title: "Reservas de Stock", description: "Seguir reservas operativas, su estado y su despacho o liberacion.", icon: <FaBoxes />, path: "/inventario-reservas", visible: () => true },
  { title: "Recepciones / Nota de Ingreso", description: "Registrar ingresos simples y recepciones contra OC.", icon: <FaFileImport />, path: "/inventario-recepciones", visible: ({ user }) => canOperateInventoryEffective(user) },
  { title: "Operaciones de Inventario", description: "Carga inicial, ajustes, movimientos manuales y reservas.", icon: <MdInventory />, path: "/inventario-operaciones", visible: ({ user }) => canOperateInventoryEffective(user) },
];

const DashboardPage = () => {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <div>Cargando contenido del panel de control...</div>;
  }

  const activeRoles = getActiveRoles(user);
  const dynamicTrays = getAvailableApprovalTraysEffective(user).map((tray) => ({
    title: tray.label,
    description: tray.description,
    icon: <FaClipboardList />,
    path: tray.path,
    visible: () => true,
  }));

  const filteredCards = [...baseCards, ...dynamicTrays].filter((card) =>
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
                Revisa tus accesos y entra directo a las operaciones que usas
                mas seguido.
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
                Roles activos
              </span>
              <span className="mt-1 block text-sm font-medium text-gray-800">
                {activeRoles.length > 0
                  ? activeRoles.join(", ")
                  : "No definido"}
              </span>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Area
              </span>
              <span className="mt-1 block text-sm font-medium text-gray-800">
                {user.areaNombre || "Sin area asignada"}
              </span>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Correo
              </span>
              <span className="mt-1 block break-all text-sm font-medium text-gray-800">
                {user.email || "Sin correo"}
              </span>
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-3xl font-bold text-indigo-700">Panel de Control</h2>
        <p className="mb-6 text-lg text-gray-700">Accede a los modulos operativos consolidados del sistema.</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => (
            <Link key={`${card.title}-${card.path}`} to={card.path} className={cardClasses}>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-600 bg-indigo-100 text-3xl text-indigo-600">
                {card.icon}
              </div>
              <h2 className="text-center text-lg font-semibold text-gray-800">{card.title}</h2>
              <p className="text-center text-sm text-gray-600">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;




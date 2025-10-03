import { MdInventory, MdCategory, MdPeople } from "react-icons/md";
import {
  FaRegistered,
  FaSitemap,
  FaShoppingCart,
  FaUserCog,
  FaMedal,
  FaRegAddressCard,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";

const cardClasses =
  "border-2 border-indigo-500 bg-white rounded-lg p-6 shadow transition-transform duration-300 transform hover:scale-105 hover:shadow-xl";

const dashboardCards = [
  {
    title: "Gestión de Productos",
    description:
      "Crear, ver, actualizar y borrar los productos del inventario.",
    icon: <MdInventory />,
    path: "/gestion-productos",
    allowedAreas: ["03-ADMI-Iquitos", "01-CONT"],
  },
  {
    title: "Productos",
    description: "Ver y administrar los productos del inventario.",
    icon: <MdInventory />,
    path: "/productos",
    allowedAreas: ["all"],
  },
  {
    title: "Áreas",
    description: "Gestionar las áreas o unidades de la organización.",
    icon: <FaSitemap />,
    path: "/gestion-areas",
    allowedAreas: ["03-ADMI-Iquitos"],
  },
  {
    title: "Requerimientos",
    description: "Crear, ver y gestionar requerimientos de las áreas.",
    icon: <FaShoppingCart />,
    path: "/requerimientos",
    allowedAreas: ["all"],
  },
  {
    title: "Usuarios",
    description: "Gestionar usuarios del sistema.",
    icon: <FaUserCog />,
    path: "/gestion-usuarios",
    allowedAreas: ["03-ADMI-Iquitos"],
  },
  {
    title: "Movimientos",
    description: "Registrar entradas y salidas de stock.",
    icon: <MdPeople />,
    path: "/movimientos",
    allowedAreas: ["all"],
  },
  {
    title: "Reportes",
    description: "Visualizar reportes y estadísticas del sistema.",
    icon: <FaSitemap />,
    path: "/reportes",
    allowedAreas: ["all"],
  },
  {
    title: "Rangos",
    description: "Creación, actualizar, borrar y listar rangos de usuarios.",
    icon: <FaMedal />,
    path: "/gestion-rangos",
    allowedAreas: ["all"],
  },
  {
    title: "Gestión de Proveedores",
    description: "Administrar proveedores del sistema.",
    icon: <FaRegAddressCard />,
    path: "/gestion-proveedores",
    allowedAreas: ["all"],
  },
];

const DashboardPage = () => {
  const { user, loading } = useAuth();

  // Añadimos una comprobación de seguridad para evitar el error.
  // Es mejor usar 'user.rangoNombre' directamente
  if (loading || !user) {
    return <div>Cargando contenido del panel de control...</div>;
  }

  // ✅ CORRECCIÓN: Accedemos a las propiedades directamente del objeto 'user'
  const isAdministrator = user.rangoNombre === "Administrador";
  const userArea = user.areaNombre;

  const filteredCards = isAdministrator
    ? dashboardCards
    : dashboardCards.filter(
        (card) =>
          card.allowedAreas.includes("all") ||
          card.allowedAreas.includes(userArea)
      );

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-4 text-3xl font-bold text-indigo-700">
          Panel de Control
        </h1>
        <p className="mb-6 text-lg text-gray-700">
          ¡Bienvenido al sistema de InventarioApp! Aquí podrás gestionar
          productos, categorías, movimientos y más.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => (
            <Link key={card.title} to={card.path} className={cardClasses}>
              <div className="flex items-center justify-center mx-auto mb-3 text-3xl text-indigo-600 bg-indigo-100 border-2 border-blue-600 rounded-full w-14 h-14">
                {card.icon}
              </div>
              <h2 className="text-lg font-semibold text-center text-gray-800">
                {card.title}
              </h2>
              <p className="text-sm text-center text-gray-600">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

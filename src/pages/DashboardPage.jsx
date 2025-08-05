// src/pages/DashboardPage.jsx
import { MdInventory, MdCategory, MdPeople } from 'react-icons/md';
import { FaRegistered, FaSitemap, FaShoppingCart, FaUserCog } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const cardClasses =
  'border-2 border-indigo-500 bg-white rounded-lg p-6 shadow transition-transform duration-300 transform hover:scale-105 hover:shadow-xl';

const dashboardCards = [
  {
    title: 'Gestión de Productos',
    description: 'Crear, ver, actualizar y borrar los productos del inventario.',
    icon: <MdInventory />,
    path: '/gestion-productos',
    allowedAreas: ['03-ADMI-Iquitos', '01-CONT'],
  },
  {
    title: 'Productos',
    description: 'Ver y administrar los productos del inventario.',
    icon: <MdInventory />,
    path: '/productos',
    allowedAreas: ['all'],
  },
  {
    title: 'Gestión de Tipos de Producto',
    description: 'Organiza, crea y administra las categorías y clasificaciones de tus productos.',
    icon: <MdCategory />,
    path: '/gestion-tipo-producto',
    allowedAreas: ['03-ADMI-Iquitos', '01-CONT'],
  },
  {
    title: 'Marcas',
    description: 'Gestionar marcas asociadas a productos.',
    icon: <FaRegistered />,
    path: '/gestion-marcas',
    allowedAreas: ['03-ADMI-Iquitos', '01-CONT'],
  },
  {
    title: 'Áreas',
    description: 'Gestionar las áreas o unidades de la organización.',
    icon: <FaSitemap />,
    path: '/gestion-areas',
    allowedAreas: ['03-ADMI-Iquitos'],
  },
  {
    title: 'Pedidos',
    description: 'Ver y gestionar pedidos realizados por las áreas.',
    icon: <FaShoppingCart />,
    path: '/pedidos',
    allowedAreas: ['all'],
  },
  {
    title: 'Usuarios',
    description: 'Gestionar usuarios del sistema.',
    icon: <FaUserCog />,
    path: '/gestion-usuarios',
    allowedAreas: ['03-ADMI-Iquitos'],
  },
  {
    title: 'Movimientos',
    description: 'Registrar entradas y salidas de stock.',
    icon: <MdPeople />,
    path: '/movimientos',
    allowedAreas: ['all'],
  },
  {
    title: 'Reportes',
    description: 'Visualizar reportes y estadísticas del sistema.',
    icon: <FaSitemap />,
    path: '/reportes',
    allowedAreas: ['all'],
  },
];

const DashboardPage = () => {
  const { user } = useAuth();

  if (!user || !user.area) {
    return <div>Cargando contenido del panel de control...</div>;
  }

  const userArea = user.area.codigo;

  const filteredCards = dashboardCards.filter(card =>
    card.allowedAreas.includes('all') || card.allowedAreas.includes(userArea)
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-700 mb-4">Panel de Control</h1>

        <p className="text-gray-700 text-lg mb-6">
          ¡Bienvenido al sistema de InventarioApp! Aquí podrás gestionar productos, categorías, movimientos y más.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <Link key={card.title} to={card.path} className={cardClasses}>
              <div className="w-14 h-14 border-2 border-blue-600 flex items-center justify-center mb-3 text-indigo-600 text-3xl rounded-full bg-indigo-100 mx-auto">
                {card.icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-800 text-center">{card.title}</h2>
              <p className="text-sm text-gray-600 text-center">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
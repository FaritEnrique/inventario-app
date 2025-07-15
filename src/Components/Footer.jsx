// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-8">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} InventarioApp — Todos los derechos reservados.
      </div>
    </footer>
  );
}
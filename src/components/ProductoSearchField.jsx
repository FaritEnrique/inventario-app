import { useEffect, useId, useState } from "react";
import productosApi from "../api/productosApi";

const ProductoSearchField = ({
  label = "Producto",
  selectedProduct = null,
  onSelect = () => {},
  placeholder = "Buscar por nombre o codigo",
}) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchInputId = useId();

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setResults([]);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await productosApi.getTodos(query, 1, 10);
        setResults(Array.isArray(response?.productos) ? response.productos : []);
      } catch (error) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  return (
    <div>
      <label htmlFor={searchInputId} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={searchInputId}
        type="text"
        value={search}
        name="producto-search-field-input-42" onChange={(event) => setSearch(event.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2"
        placeholder={placeholder}
      />

      {selectedProduct && (
        <div className="mt-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm">
          Seleccionado: <strong>{selectedProduct.nombre}</strong> ({selectedProduct.codigo})
        </div>
      )}

      {loading && (
        <p className="mt-2 text-sm text-gray-500">Buscando productos...</p>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-2 max-h-56 overflow-y-auto rounded border border-gray-200 bg-white">
          {results.map((producto) => (
            <button
              key={producto.id}
              type="button"
              onClick={() => {
                onSelect(producto);
                setSearch("");
                setResults([]);
              }}
              className="flex w-full items-center justify-between border-b border-gray-200 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50"
            >
              <span>
                <span className="block font-medium text-gray-900">
                  {producto.nombre}
                </span>
                <span className="block text-xs text-gray-500">
                  {producto.codigo}
                </span>
              </span>
              <span className="text-xs font-medium text-indigo-600">
                Seleccionar
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductoSearchField;

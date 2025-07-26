// src/pages/MarcasPage.jsx
import React, { useEffect } from 'react';
import useMarcas from '../hooks/useMarcas';

const MarcasPage = () => {
  const { marcas, cargando, fetchMarcas } = useMarcas();

  useEffect(() => {
    fetchMarcas();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Marcas</h1>
      {cargando ? (
        <p>Cargando marcas...</p>
      ) : (
        <ul className="space-y-2">
          {marcas.map((m) => (
            <li key={m.id} className="border p-2 rounded">
              <strong>{m.nombre}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MarcasPage;
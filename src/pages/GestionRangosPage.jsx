import React, { useState, useEffect } from 'react';
import useRangos from '../hooks/useRangos';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmDeleteToast from '../components/ConfirmDeleteToast'; // Tu componente existente

const GestionRangosPage = () => {
    const { rangos, loading, error, crearRango, actualizarRango, eliminarRango } = useRangos();
    const [nombreRango, setNombreRango] = useState('');
    const [rangoAEditar, setRangoAEditar] = useState(null);
    
    const handleSaveRango = async (e) => {
        e.preventDefault();
        try {
            if (rangoAEditar) {
                await actualizarRango(rangoAEditar.id, nombreRango);
                toast.success('Rango actualizado con éxito.');
                setRangoAEditar(null);
            } else {
                await crearRango(nombreRango);
                toast.success('Rango creado con éxito.');
            }
            setNombreRango('');
        } catch (err) {
            toast.error(err.message || 'Error al guardar el rango.');
        }
    };

    const handleDeleteClick = (id) => {
        const rango = rangos.find(r => r.id === id);
        toast(<ConfirmDeleteToast
            message={`¿Estás seguro de que quieres eliminar el rango "${rango.nombre}"?`}
            onConfirm={() => handleConfirmDelete(id)}
        />, {
            closeButton: false,
            autoClose: false
        });
    };

    const handleConfirmDelete = async (id) => {
        try {
            await eliminarRango(id);
            toast.success('Rango eliminado con éxito.');
        } catch (err) {
            toast.error(err.message || 'Error al eliminar el rango.');
        }
    };

    if (loading) return <div className="text-center mt-8 text-xl">Cargando rangos...</div>;
    if (error) return <div className="text-center mt-8 text-xl text-red-500">Error: {error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-6 text-gray-800">Gestión de Rangos</h1>
            
            {/* Formulario de Creación/Edición */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">
                    {rangoAEditar ? 'Editar Rango' : 'Crear Nuevo Rango'}
                </h2>
                <form onSubmit={handleSaveRango}>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nombre del Rango"
                            value={nombreRango}
                            onChange={(e) => setNombreRango(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
                        >
                            {rangoAEditar ? 'Guardar Cambios' : 'Crear Rango'}
                        </button>
                        {rangoAEditar && (
                            <button
                                type="button"
                                className="px-6 py-3 bg-gray-400 text-gray-800 font-semibold rounded-md hover:bg-gray-500 transition-colors"
                                onClick={() => {
                                    setRangoAEditar(null);
                                    setNombreRango('');
                                }}
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>
            
            {/* Lista de Rangos */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Lista de Rangos</h2>
                <ul className="divide-y divide-gray-200">
                    {rangos.map((rango) => (
                        <li key={rango.id} className="py-4 flex justify-between items-center">
                            <span className="text-lg text-gray-800 font-medium">{rango.nombre}</span>
                            <div className="flex gap-2">
                                <button
                                    className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                                    onClick={() => {
                                        setRangoAEditar(rango);
                                        setNombreRango(rango.nombre);
                                    }}
                                >
                                    Editar
                                </button>
                                <button
                                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                    onClick={() => handleDeleteClick(rango.id)}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default GestionRangosPage;
//src/hooks/useRangos.js
import { useState, useEffect } from 'react';
import rangoApi from '../api/rangoApi';

const useRangos = () => {
    const [rangos, setRangos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRangos = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await rangoApi.getTodos();
            setRangos(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRangos();
    }, []);

    const crearRango = async (nombre) => {
        setLoading(true);
        try {
            const nuevoRango = await rangoApi.crear({ nombre });
            setRangos((prevRangos) => [...prevRangos, nuevoRango]);
            return nuevoRango;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const actualizarRango = async (id, nombre) => {
        setLoading(true);
        try {
            const rangoActualizado = await rangoApi.actualizar(id, { nombre });
            setRangos((prevRangos) =>
                prevRangos.map((rango) =>
                    rango.id === parseInt(id) ? rangoActualizado : rango
                )
            );
            return rangoActualizado;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const eliminarRango = async (id) => {
        setLoading(true);
        try {
            await rangoApi.eliminar(id);
            setRangos((prevRangos) => prevRangos.filter((rango) => rango.id !== parseInt(id)));
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        rangos,
        loading,
        error,
        fetchRangos,
        crearRango,
        actualizarRango,
        eliminarRango,
    };
};

export default useRangos;
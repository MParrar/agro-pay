import { useNavigate } from 'react-router-dom';
import { useCatalog } from '../lib/useCatalog.js';
import WorkerSearch from '../components/WorkerSearch.jsx';

export default function WorkersPage() {
  const { workers, loading, error } = useCatalog();
  const navigate = useNavigate();

  if (loading) return <p className="py-10 text-center text-gray-500">Cargando…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Trabajadores</h1>
        <p className="text-sm text-gray-500">Seleccione un trabajador para ver y corregir sus registros.</p>
      </div>
      {error && <p className="alert-error">{error}</p>}
      <div className="card">
        <WorkerSearch workers={workers} onSelect={(w) => navigate(`/trabajadores/${w.id}`)} />
      </div>
    </div>
  );
}

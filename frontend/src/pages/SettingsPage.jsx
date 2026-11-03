import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import CrudSection from '../components/CrudSection.jsx';
import { formatNumber, formatRate } from '../lib/format.js';

const TABS = [
  { id: 'workers', label: 'Trabajadores' },
  { id: 'fruits', label: 'Frutas' },
  { id: 'gardens', label: 'Huertos' },
  { id: 'groups', label: 'Grupos' },
];

function WorkersSection() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    api.get('/groups').then(({ data }) => setGroups(data)).catch(() => {});
  }, []);

  return (
    <>
      {groups.length === 0 && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          Primero cree al menos un grupo en la pestaña “Grupos”.
        </p>
      )}
      <CrudSection
        title="Trabajador"
        newLabel="Nuevo trabajador"
        endpoint="/workers"
        emptyMessage="No hay trabajadores registrados."
        fields={[
          { name: 'name', label: 'Nombre', type: 'text', required: true },
          { name: 'rut', label: 'RUT', type: 'text', placeholder: '12.345.678-9' },
          {
            name: 'groupId',
            label: 'Grupo',
            type: 'select',
            required: true,
            options: groups.map((g) => ({ value: String(g.id), label: g.name })),
          },
        ]}
        toPayload={(f) => ({ name: f.name, rut: f.rut, groupId: Number(f.groupId) })}
        toForm={(w) => ({ name: w.name, rut: w.rut ?? '', groupId: String(w.groupId) })}
        renderItem={(w) => (
          <>
            <p className="truncate font-semibold">{w.name}</p>
            <p className="text-xs text-gray-500">
              {w.group?.name}
              {w.rut ? ` · RUT ${w.rut}` : ''}
            </p>
          </>
        )}
      />
    </>
  );
}

function FruitsSection() {
  return (
    <CrudSection
      title="Fruta"
      newLabel="Nueva fruta"
      endpoint="/fruit-types"
      emptyMessage="No hay frutas en el catálogo."
      fields={[
        { name: 'name', label: 'Nombre', type: 'text', required: true },
        { name: 'pricePerKg', label: 'Precio por kilo ($)', type: 'number', required: true },
        { name: 'discountPerBox', label: 'Descuento por caja (kg)', type: 'number', required: true },
      ]}
      toPayload={(f) => ({
        name: f.name,
        pricePerKg: Number(f.pricePerKg) || 0,
        discountPerBox: Number(f.discountPerBox) || 0,
      })}
      toForm={(f) => ({
        name: f.name,
        pricePerKg: String(f.pricePerKg),
        discountPerBox: String(f.discountPerBox),
      })}
      renderItem={(f) => (
        <>
          <p className="truncate font-semibold">{f.name}</p>
          <p className="text-xs text-gray-500">
            {formatRate(f.pricePerKg)}/kg · −{formatNumber(f.discountPerBox)} kg/caja
          </p>
        </>
      )}
    />
  );
}

function NameOnlySection({ title, newLabel, endpoint, emptyMessage }) {
  return (
    <CrudSection
      title={title}
      newLabel={newLabel}
      endpoint={endpoint}
      emptyMessage={emptyMessage}
      fields={[{ name: 'name', label: 'Nombre', type: 'text', required: true }]}
      toPayload={(f) => ({ name: f.name })}
      toForm={(item) => ({ name: item.name })}
      renderItem={(item) => <p className="truncate font-semibold">{item.name}</p>}
    />
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState('workers');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Ajustes</h1>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="inline-flex gap-1 rounded-lg bg-gray-200 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'workers' && <WorkersSection />}
      {tab === 'fruits' && <FruitsSection />}
      {tab === 'gardens' && (
        <NameOnlySection key="gardens" title="Huerto" newLabel="Nuevo huerto" endpoint="/gardens" emptyMessage="No hay huertos registrados." />
      )}
      {tab === 'groups' && (
        <NameOnlySection key="groups" title="Grupo" newLabel="Nuevo grupo" endpoint="/groups" emptyMessage="No hay grupos registrados." />
      )}
    </div>
  );
}

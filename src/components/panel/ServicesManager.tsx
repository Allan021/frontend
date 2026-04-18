import { useState, useEffect } from 'react';
import { useAuth, API } from './PanelApp';

interface Service {
  id: string;
  name: string;
  price: number;
  active: boolean;
  sort_order: number;
}

export default function ServicesManager() {
  const { token } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '' });
  const [newForm, setNewForm] = useState({ name: '', price: '' });
  const [showAdd, setShowAdd] = useState(false);

  function fetchServices() {
    setLoading(true);
    fetch(`${API}/api/services/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setServices(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchServices(); }, []);

  async function handleToggle(id: string, active: boolean) {
    await fetch(`${API}/api/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !active }),
    });
    fetchServices();
  }

  async function handleSaveEdit(id: string) {
    await fetch(`${API}/api/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editForm.name, price: parseFloat(editForm.price) }),
    });
    setEditingId(null);
    fetchServices();
  }

  async function handleAdd() {
    if (!newForm.name || !newForm.price) return;
    await fetch(`${API}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newForm.name, price: parseFloat(newForm.price), sort_order: services.length + 1 }),
    });
    setNewForm({ name: '', price: '' });
    setShowAdd(false);
    fetchServices();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este servicio?')) return;
    await fetch(`${API}/api/services/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchServices();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-white">Servicios y Precios</h1>
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-gold text-black font-bold text-sm rounded-lg hover:bg-gold-light transition">
          + Nuevo servicio
        </button>
      </div>

      {/* Add new */}
      {showAdd && (
        <div className="bg-dark-card border border-gold/30 rounded-xl p-5 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 mb-1">Nombre</label>
            <input value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})}
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-white text-sm focus:border-gold focus:outline-none"
              placeholder="Nombre del servicio" />
          </div>
          <div className="w-32">
            <label className="block text-xs text-gray-500 mb-1">Precio (LPS)</label>
            <input type="number" value={newForm.price} onChange={e => setNewForm({...newForm, price: e.target.value})}
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-white text-sm focus:border-gold focus:outline-none"
              placeholder="0" />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-green-500/20 text-green-400 font-bold text-sm rounded-lg hover:bg-green-500/30 transition">
            Guardar
          </button>
          <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-500 text-sm hover:text-white transition">
            Cancelar
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-12">Cargando...</div>
      ) : (
        <div className="space-y-2">
          {services.map(s => (
            <div key={s.id} className={`bg-dark-card border rounded-xl p-4 flex items-center gap-4 transition ${s.active ? 'border-dark-border' : 'border-dark-border opacity-50'}`}>
              {editingId === s.id ? (
                <>
                  <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="flex-1 px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-white text-sm focus:border-gold focus:outline-none" />
                  <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})}
                    className="w-28 px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-white text-sm focus:border-gold focus:outline-none" />
                  <button onClick={() => handleSaveEdit(s.id)} className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg">Guardar</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-gray-500 text-xs">Cancelar</button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-bold text-white">{s.name}</p>
                  </div>
                  <p className="text-gold font-black text-xl">L. {Number(s.price).toFixed(0)}</p>

                  {/* Active toggle */}
                  <button onClick={() => handleToggle(s.id, s.active)}
                    className={`relative w-12 h-6 rounded-full transition ${s.active ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${s.active ? 'left-6' : 'left-0.5'}`} />
                  </button>

                  <button onClick={() => { setEditingId(s.id); setEditForm({ name: s.name, price: String(s.price) }); }}
                    className="px-3 py-1.5 bg-dark-surface text-gray-400 text-xs rounded-lg hover:text-white transition">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(s.id)}
                    className="px-3 py-1.5 text-red-400/50 text-xs hover:text-red-400 transition">
                    Eliminar
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

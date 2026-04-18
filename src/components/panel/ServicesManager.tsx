import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';

interface Service {
  id: string;
  name: string;
  price: number;
  active: boolean;
  sort_order: number;
}

export default function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '' });
  const [newForm, setNewForm] = useState({ name: '', price: '' });
  const [showAdd, setShowAdd] = useState(false);

  function fetchServices() {
    setLoading(true);
    adminApi.get('/services/all')
      .then(res => setServices(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchServices(); }, []);

  async function handleToggle(id: string, active: boolean) {
    await adminApi.patch(`/services/${id}`, { active: !active });
    fetchServices();
  }

  async function handleSaveEdit(id: string) {
    await adminApi.patch(`/services/${id}`, { name: editForm.name, price: parseFloat(editForm.price) });
    setEditingId(null);
    fetchServices();
  }

  async function handleAdd() {
    if (!newForm.name || !newForm.price) return;
    await adminApi.post('/services', { name: newForm.name, price: parseFloat(newForm.price), sort_order: services.length + 1 });
    setNewForm({ name: '', price: '' });
    setShowAdd(false);
    fetchServices();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este servicio?')) return;
    await adminApi.delete(`/services/${id}`);
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
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.id} className={`bg-dark-card border rounded-xl p-4 transition ${s.active ? 'border-dark-border' : 'border-dark-border opacity-50'}`}>
              {editingId === s.id ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="flex-1 px-3 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white text-sm focus:border-gold focus:outline-none" 
                      placeholder="Nombre del servicio" />
                    <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})}
                      className="w-full sm:w-28 px-3 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white text-sm focus:border-gold focus:outline-none"
                      placeholder="Precio" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(s.id)} className="flex-1 sm:flex-none px-4 py-2 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/30 transition">Guardar</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 sm:flex-none px-4 py-2 text-gray-500 text-xs hover:text-white transition">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Row 1 on mobile: Name + Price */}
                  <div className="flex items-center justify-between sm:flex-1 gap-3">
                    <p className="font-bold text-white text-sm sm:text-base">{s.name}</p>
                    <p className="text-gold font-black text-lg sm:text-xl whitespace-nowrap">L. {Number(s.price).toFixed(0)}</p>
                  </div>

                  {/* Row 2 on mobile: Controls */}
                  <div className="flex items-center gap-2 sm:gap-3 border-t border-dark-border sm:border-none pt-3 sm:pt-0">
                    {/* Active toggle */}
                    <button onClick={() => handleToggle(s.id, s.active)}
                      className={`relative w-11 h-6 rounded-full transition shrink-0 ${s.active ? 'bg-green-500' : 'bg-gray-600'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${s.active ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider hidden sm:inline">
                      {s.active ? 'Activo' : 'Inactivo'}
                    </span>

                    <div className="flex-1" />

                    <button onClick={() => { setEditingId(s.id); setEditForm({ name: s.name, price: String(s.price) }); }}
                      className="px-3 py-1.5 bg-dark-surface text-gray-400 text-xs rounded-lg hover:text-white hover:bg-gold/10 transition font-bold">
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleDelete(s.id)}
                      className="px-3 py-1.5 text-red-400/50 text-xs hover:text-red-400 hover:bg-red-500/10 rounded-lg transition font-bold">
                      🗑 Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

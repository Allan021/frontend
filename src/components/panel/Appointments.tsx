import { useState, useEffect } from 'react';
import { useAuth, API } from './PanelApp';

interface Appointment {
  id: string;
  client_name: string;
  client_contact: string;
  contact_type: string;
  appointment_date: string;
  appointment_time: string;
  payment_method: string;
  cash_surcharge: number;
  transfer_image_url: string | null;
  payment_status: string;
  status: string;
  created_at: string;
  services: { name: string; price: number }[] | null;
}

export default function Appointments() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [imageModal, setImageModal] = useState<string | null>(null);

  function fetchAppointments() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDate) params.set('date', filterDate);
    if (filterStatus) params.set('status', filterStatus);

    fetch(`${API}/api/appointments?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAppointments(); }, [filterDate, filterStatus]);

  async function updateStatus(id: string, field: 'status' | 'payment_status', value: string) {
    await fetch(`${API}/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [field]: value }),
    });
    fetchAppointments();
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  const paymentColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    denied: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Citas</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-white text-sm focus:border-gold focus:outline-none" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-white text-sm focus:border-gold focus:outline-none">
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmada</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
        <button onClick={() => { setFilterDate(''); setFilterStatus(''); }}
          className="px-3 py-2 text-gray-500 hover:text-white text-sm transition">Limpiar filtros</button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Cargando...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No hay citas</div>
      ) : (
        <div className="space-y-3">
          {appointments.map(apt => (
            <div key={apt.id} className="bg-dark-card border border-dark-border rounded-xl p-5">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-white text-lg">{apt.client_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[apt.status] || ''}`}>
                      {apt.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div><span className="text-gray-500">Servicios:</span> <span className="text-white">{apt.services?.map(s => s.name).join(', ')}</span></div>
                    <div><span className="text-gray-500">Fecha:</span> <span className="text-white">{apt.appointment_date}</span></div>
                    <div><span className="text-gray-500">Hora:</span> <span className="text-white">{apt.appointment_time?.slice(0,5)}</span></div>
                    <div><span className="text-gray-500">Contacto:</span> <span className="text-white">{apt.client_contact}</span></div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="text-gray-500">Pago: <span className={`font-bold ${apt.payment_method === 'cash' ? 'text-green-400' : 'text-blue-400'}`}>
                      {apt.payment_method === 'cash' ? `Efectivo (+L.${apt.cash_surcharge})` : 'Transferencia'}
                    </span></span>
                    <span className="text-gray-500">Precio: <span className="text-gold font-bold">L. {Number(apt.services?.reduce((sum, s) => sum + Number(s.price), 0) || 0).toFixed(0)}</span></span>
                  </div>
                </div>

                {/* Transfer image + payment status */}
                {apt.payment_method === 'transfer' && (
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${paymentColors[apt.payment_status] || ''}`}>
                      Pago: {apt.payment_status === 'pending' ? 'EN REVISIÓN' : apt.payment_status === 'approved' ? 'APROBADO' : 'DENEGADO'}
                    </span>
                    {apt.transfer_image_url && (
                      <button onClick={() => setImageModal(apt.transfer_image_url)}
                        className="px-3 py-1 bg-dark-surface border border-dark-border rounded-lg text-xs text-gray-400 hover:text-white transition">
                        Ver comprobante
                      </button>
                    )}
                    {apt.payment_status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(apt.id, 'payment_status', 'approved')}
                          className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/30 transition">
                          Aprobar
                        </button>
                        <button onClick={() => updateStatus(apt.id, 'payment_status', 'denied')}
                          className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30 transition">
                          Denegar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status actions */}
              <div className="mt-3 pt-3 border-t border-dark-border flex flex-wrap gap-2">
                {apt.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(apt.id, 'status', 'confirmed')}
                      className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500/30 transition">
                      Confirmar
                    </button>
                    <button onClick={() => updateStatus(apt.id, 'status', 'cancelled')}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30 transition">
                      Cancelar
                    </button>
                  </>
                )}
                {apt.status === 'confirmed' && (
                  <button onClick={() => updateStatus(apt.id, 'status', 'completed')}
                    className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/30 transition">
                    Marcar completada
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image modal */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setImageModal(null)}>
          <div className="max-w-lg max-h-[80vh] overflow-auto">
            <img src={imageModal} alt="Comprobante" className="rounded-xl max-w-full" />
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { adminApi, API_URL } from '../../lib/api';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

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

const ITEMS_PER_PAGE = 8;

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const calendarRef = useRef<HTMLDivElement>(null);

  function fetchAppointments() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDate) params.set('date', filterDate);
    if (filterStatus) params.set('status', filterStatus);

    adminApi.get(`/appointments?${params}`)
      .then(res => { setAppointments(Array.isArray(res.data) ? res.data : []); setCurrentPage(1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAppointments(); }, [filterDate, filterStatus]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setShowCalendar(false);
    }
    if (showCalendar) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCalendar]);

  async function updateStatus(id: string, field: 'status' | 'payment_status', value: string) {
    await adminApi.patch(`/appointments/${id}`, { [field]: value });
    fetchAppointments();
  }

  // ─── Pagination ──────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(appointments.length / ITEMS_PER_PAGE));
  const paginatedAppointments = appointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ─── Export to Excel ─────────────────────────────────────────────────
  const exportToExcel = () => {
    const rows = appointments.map(apt => ({
      Nombre: apt.client_name,
      Contacto: apt.client_contact,
      Servicios: apt.services?.map(s => s.name).join(', ') || '',
      Fecha: apt.appointment_date,
      Hora: apt.appointment_time?.slice(0, 5),
      'Método de Pago': apt.payment_method === 'cash' ? 'Efectivo' : 'Transferencia',
      'Recargo Efectivo': apt.cash_surcharge || 0,
      'Total (LPS)': apt.services?.reduce((sum, s) => sum + Number(s.price), 0) || 0,
      Estado: apt.status,
      'Estado Pago': apt.payment_status,
      'Creado': apt.created_at,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Citas');
    XLSX.writeFile(wb, `Citas_Ricky_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20',
    confirmed: 'bg-blue-500/20 text-blue-400 border border-blue-500/20',
    completed: 'bg-green-500/20 text-green-400 border border-green-500/20',
    cancelled: 'bg-red-500/20 text-red-400 border border-red-500/20',
  };
  const statusLabels: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' };
  const paymentColors: Record<string, string> = { pending: 'bg-yellow-500/20 text-yellow-400', approved: 'bg-green-500/20 text-green-400', denied: 'bg-red-500/20 text-red-400' };

  const parseContact = (contact: string) => {
    const parts = contact.split('|').map(s => s.trim());
    const phone = parts.find(p => p.startsWith('+') || /^\d/.test(p)) || '';
    const email = parts.find(p => p.includes('@')) || '';
    return { phone, email };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-white">Citas</h1>
        <button onClick={exportToExcel} disabled={appointments.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition text-xs font-black uppercase tracking-wider disabled:opacity-30">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative" ref={calendarRef}>
          <button type="button" onClick={() => setShowCalendar(!showCalendar)}
            className="w-full sm:w-auto px-4 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-sm text-left flex items-center gap-2 hover:border-gold/30 transition">
            <svg className="w-4 h-4 text-gold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={filterDate ? 'text-white font-bold' : 'text-gray-500'}>
              {filterDate ? format(new Date(filterDate + 'T00:00:00'), 'dd MMM yyyy', { locale: es }) : 'Filtrar por fecha'}
            </span>
            {filterDate && (
              <span onClick={(e) => { e.stopPropagation(); setFilterDate(''); }}
                className="ml-auto text-gray-500 hover:text-red-400 transition text-xs">✕</span>
            )}
          </button>
          {showCalendar && (
            <div className="absolute z-50 top-full mt-2 left-0 p-4 bg-dark-card border border-gold/20 rounded-2xl shadow-2xl">
              <style>{`.rdp{--rdp-cell-size:38px;--rdp-accent-color:#d4a017;margin:0}.rdp-day_selected{background-color:var(--rdp-accent-color)!important;color:black!important;font-weight:900!important;border-radius:10px}.rdp-day:hover:not(.rdp-day_selected){background-color:rgba(212,160,23,.1)!important;border-radius:10px}.rdp-button:hover:not([disabled]):not(.rdp-day_selected){background-color:rgba(212,160,23,.1)!important}.rdp-head_cell{color:#d4a017;font-weight:900;font-size:.65rem;text-transform:uppercase}.rdp-nav_button{color:#d4a017}.rdp-caption_label{color:white;font-weight:900;text-transform:uppercase;font-size:.85rem}`}</style>
              <DayPicker mode="single" selected={filterDate ? new Date(filterDate + 'T00:00:00') : undefined}
                onSelect={(date) => { if (date) setFilterDate(format(date, 'yyyy-MM-dd')); setShowCalendar(false); }}
                locale={es} className="bg-transparent" />
            </div>
          )}
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-white text-sm focus:border-gold focus:outline-none appearance-none cursor-pointer">
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmada</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
        {(filterDate || filterStatus) && (
          <button onClick={() => { setFilterDate(''); setFilterStatus(''); }}
            className="px-4 py-2.5 text-gray-500 hover:text-white text-sm transition font-bold">✕ Limpiar</button>
        )}
        {/* Results count */}
        <div className="sm:ml-auto flex items-center text-xs text-gray-600 font-bold">
          {appointments.length} cita{appointments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Appointment List */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Cargando...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No hay citas</div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedAppointments.map(apt => {
              const { phone, email } = parseContact(apt.client_contact);
              const totalPrice = Number(apt.services?.reduce((sum, s) => sum + Number(s.price), 0) || 0);
              return (
                <div key={apt.id} className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-black text-white text-lg leading-tight truncate">{apt.client_name}</h3>
                      <p className="text-gray-500 text-xs mt-0.5 font-bold">{apt.services?.map(s => s.name).join(', ') || 'Sin servicio'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ${statusColors[apt.status] || ''}`}>
                      {statusLabels[apt.status] || apt.status}
                    </span>
                  </div>
                  {/* Info Grid */}
                  <div className="px-5 pb-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div>
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Fecha</p>
                      <p className="text-sm text-white font-bold">{apt.appointment_date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Hora</p>
                      <p className="text-sm text-white font-bold">{apt.appointment_time?.slice(0, 5)}</p>
                    </div>
                    {phone && (
                      <div>
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">WhatsApp</p>
                        <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-emerald-400 font-bold hover:underline break-all">{phone}</a>
                      </div>
                    )}
                    {email && (
                      <div>
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Email</p>
                        <a href={`mailto:${email}`} className="text-sm text-blue-400 font-bold hover:underline break-all">{email}</a>
                      </div>
                    )}
                  </div>
                  {/* Payment Row */}
                  <div className="px-5 py-3 border-t border-dark-border flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Pago:</span>
                      <span className={`text-xs font-bold ${apt.payment_method === 'cash' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {apt.payment_method === 'cash' ? `Efectivo (+L.${apt.cash_surcharge})` : 'Transferencia'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Total:</span>
                      <span className="text-gold font-black text-base">L. {totalPrice.toFixed(0)}</span>
                    </div>
                    {apt.payment_method === 'transfer' && (
                      <div className="flex items-center gap-2 ml-auto">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${paymentColors[apt.payment_status] || ''}`}>
                          {apt.payment_status === 'pending' ? 'En Revisión' : apt.payment_status === 'approved' ? 'Aprobado' : 'Denegado'}
                        </span>
                        {apt.transfer_image_url && (
                          <button onClick={() => setImageModal(apt.transfer_image_url)}
                            className="px-2.5 py-1 bg-dark-surface border border-dark-border rounded-lg text-[10px] text-gray-400 hover:text-white hover:border-gold/30 transition font-bold">
                            📄 Ver
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  {(apt.status === 'pending' || apt.status === 'confirmed' || (apt.payment_method === 'transfer' && apt.payment_status === 'pending')) && (
                    <div className="px-5 py-3 border-t border-dark-border flex flex-wrap gap-2">
                      {apt.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(apt.id, 'status', 'confirmed')}
                            className="flex-1 sm:flex-none px-4 py-2 bg-blue-500/20 text-blue-400 text-xs font-black rounded-xl hover:bg-blue-500/30 transition uppercase tracking-wide">✓ Confirmar</button>
                          <button onClick={() => updateStatus(apt.id, 'status', 'cancelled')}
                            className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 text-red-400 text-xs font-black rounded-xl hover:bg-red-500/20 transition uppercase tracking-wide">✕ Cancelar</button>
                        </>
                      )}
                      {apt.status === 'confirmed' && (
                        <button onClick={() => updateStatus(apt.id, 'status', 'completed')}
                          className="flex-1 sm:flex-none px-4 py-2 bg-green-500/20 text-green-400 text-xs font-black rounded-xl hover:bg-green-500/30 transition uppercase tracking-wide">✓ Completada</button>
                      )}
                      {apt.payment_method === 'transfer' && apt.payment_status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(apt.id, 'payment_status', 'approved')}
                            className="flex-1 sm:flex-none px-4 py-2 bg-green-500/20 text-green-400 text-xs font-black rounded-xl hover:bg-green-500/30 transition uppercase tracking-wide">💰 Aprobar</button>
                          <button onClick={() => updateStatus(apt.id, 'payment_status', 'denied')}
                            className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 text-red-400 text-xs font-black rounded-xl hover:bg-red-500/20 transition uppercase tracking-wide">✕ Denegar</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Pagination ─────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-2 bg-dark-surface border border-dark-border rounded-xl text-sm text-gray-400 hover:text-white hover:border-gold/30 transition disabled:opacity-30 font-bold">
                ← Ant
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <span key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="text-gray-600 px-1">…</span>
                    )}
                    <button onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-xl text-sm font-black transition ${
                        currentPage === page
                          ? 'bg-gold text-black shadow-barber-gold'
                          : 'bg-dark-surface border border-dark-border text-gray-400 hover:text-white hover:border-gold/30'
                      }`}>
                      {page}
                    </button>
                  </span>
                ))
              }
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-3 py-2 bg-dark-surface border border-dark-border rounded-xl text-sm text-gray-400 hover:text-white hover:border-gold/30 transition disabled:opacity-30 font-bold">
                Sig →
              </button>
            </div>
          )}
        </>
      )}

      {/* Image modal */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setImageModal(null)}>
          <div className="max-w-lg max-h-[80vh] overflow-auto rounded-2xl border border-dark-border">
            <img src={imageModal} alt="Comprobante" className="rounded-2xl max-w-full" />
          </div>
        </div>
      )}
    </div>
  );
}

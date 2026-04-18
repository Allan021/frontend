import { useState, useEffect } from 'react';
import { adminApi, publicApi } from '../../lib/api';

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Appointment {
  id: string;
  client_name: string;
  appointment_date: string;
  appointment_time: string;
  services: any;
  payment_method?: string;
}

export default function RegisterService() {
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [form, setForm] = useState({
    appointment_id: '',
    service_id: '',
    tip_amount: '',
    payment_method: 'cash',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    publicApi.get('/services')
      .then(res => setServices(res.data))
      .catch(() => {});

    const today = new Date().toISOString().split('T')[0];
    adminApi.get(`/appointments?date=${today}&status=confirmed`)
      .then(res => setAppointments(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [success]);

  const selectedService = services.find(s => s.id === form.service_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await adminApi.post('/completed', {
        appointment_id: form.appointment_id || null,
        service_id: form.service_id,
        tip_amount: parseFloat(form.tip_amount) || 0,
        payment_method: form.payment_method,
        notes: form.notes,
      });
      setSuccess(true);
      setForm({ appointment_id: '', service_id: '', tip_amount: '', payment_method: 'cash', notes: '' });
    } catch {
      alert('Error al registrar servicio');
    } finally {
      setLoading(false);
    }
  }

  const handleAppointmentChange = (appointmentId: string) => {
    if (!appointmentId) {
      setForm({ ...form, appointment_id: '' });
      return;
    }
    
    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) {
      // Find the primary service name
      let primaryServiceName = '';
      if (Array.isArray(apt.services) && apt.services.length > 0) {
        primaryServiceName = apt.services[0].name;
      } else if (apt.services && typeof apt.services === 'object' && apt.services.name) {
        primaryServiceName = apt.services.name;
      }

      const matchingService = services.find(s => s.name === primaryServiceName);
      
      setForm({
        ...form,
        appointment_id: appointmentId,
        service_id: matchingService ? matchingService.id : form.service_id,
        payment_method: apt.payment_method || form.payment_method
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-black text-white">Registrar Servicio</h1>

      {success && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Servicio registrado exitosamente
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-5">
        {/* Link to appointment (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Vincular a cita <span className="text-gray-600">(opcional)</span>
          </label>
          <select value={form.appointment_id} onChange={e => handleAppointmentChange(e.target.value)}
            className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white focus:border-gold focus:outline-none">
            <option value="">Sin cita vinculada</option>
            {appointments.map(apt => {
              const serviceNames = Array.isArray(apt.services) 
                ? apt.services.map((s: any) => s.name).join(', ') 
                : (apt.services?.name || 'Varios');
              return (
                <option key={apt.id} value={apt.id}>
                  {apt.client_name} — {apt.appointment_time?.slice(0,5)} — {serviceNames}
                </option>
              );
            })}
          </select>
        </div>

        {/* Service selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Servicio realizado *</label>
          <div className="grid grid-cols-2 gap-2">
            {services.map(s => (
              <button key={s.id} type="button"
                onClick={() => setForm({...form, service_id: s.id})}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  form.service_id === s.id
                    ? 'border-gold bg-gold/10'
                    : 'border-dark-border bg-dark-surface hover:border-gray-600'
                }`}>
                <p className={`font-bold text-sm ${form.service_id === s.id ? 'text-gold' : 'text-white'}`}>{s.name}</p>
                <p className={`text-xs ${form.service_id === s.id ? 'text-gold/70' : 'text-gray-500'}`}>L. {s.price.toFixed(0)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Propina recibida</label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500">L.</span>
            <input type="number" step="0.01" min="0" value={form.tip_amount}
              onChange={e => setForm({...form, tip_amount: e.target.value})}
              className="w-full pl-10 pr-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white focus:border-gold focus:outline-none"
              placeholder="0" />
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Método de pago</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setForm({...form, payment_method: 'cash'})}
              className={`p-3 rounded-lg border-2 text-center transition ${
                form.payment_method === 'cash' ? 'border-gold bg-gold/10 text-gold' : 'border-dark-border text-gray-400'
              }`}>
              Efectivo
            </button>
            <button type="button" onClick={() => setForm({...form, payment_method: 'transfer'})}
              className={`p-3 rounded-lg border-2 text-center transition ${
                form.payment_method === 'transfer' ? 'border-gold bg-gold/10 text-gold' : 'border-dark-border text-gray-400'
              }`}>
              Transferencia
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Notas</label>
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
            className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white focus:border-gold focus:outline-none resize-none"
            rows={2} placeholder="Notas opcionales..." />
        </div>

        {/* Summary */}
        {selectedService && (
          <div className="bg-dark-surface rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="text-white font-bold">{selectedService.name}</p>
              <p className="text-gray-500 text-sm">
                + Propina: L. {parseFloat(form.tip_amount || '0').toFixed(0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gold text-2xl font-black">L. {selectedService.price.toFixed(0)}</p>
              <p className="text-gray-500 text-xs">
                Total: L. {(selectedService.price + parseFloat(form.tip_amount || '0')).toFixed(0)}
              </p>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading || !form.service_id}
          className="w-full py-3 bg-gold text-black font-bold rounded-lg hover:bg-gold-light disabled:opacity-50 transition">
          {loading ? 'Registrando...' : 'Registrar Servicio'}
        </button>
      </form>
    </div>
  );
}

import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';
import {
  User, MessageSquare, Scissors, Calendar as CalendarIcon, Clock,
  CreditCard, Banknote, Image as ImageIcon, CheckCircle2, ChevronRight,
  AlertCircle, Copy, Store
} from 'lucide-react';
import {
  fetchPublicSettings, fetchPublicServices, submitAppointment, fetchBookedSlots,
  queryKeys
} from '../../lib/api';

const TIME_SLOTS = [
  '09:00', '09:45', '10:30', '11:15', '12:00', '12:45',
  '13:30', '14:15', '15:00', '15:45', '16:30', '17:15', '18:00', '18:45'
];

export default function BookingForm() {
  const [form, setForm] = useState({
    client_name: '', client_phone: '', client_email: '',
    service_ids: [] as string[], appointment_date: '', appointment_time: '', payment_method: 'transfer',
  });
  const [transferImage, setTransferImage] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [copied, setCopied] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // ─── React Query ────────────────────────────────────────────────────────────
  const { data: settings } = useQuery({
    queryKey: queryKeys.publicSettings,
    queryFn: fetchPublicSettings,
    staleTime: 1000 * 30,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: queryKeys.services,
    queryFn: fetchPublicServices,
    staleTime: 1000 * 60 * 5,
  });

  const { data: bookedSlots = [] } = useQuery({
    queryKey: queryKeys.bookedSlots,
    queryFn: fetchBookedSlots,
    refetchInterval: 1000 * 60, // Refresh every minute
  });

  const mutation = useMutation({
    mutationFn: submitAppointment,
    onSuccess: () => setSuccess(true),
  });

  const safeBookedSlots = Array.isArray(bookedSlots) ? bookedSlots : [];
  const safeServices = Array.isArray(services) ? services : [];

  const cashSurcharge = settings?.cash_surcharge ?? 10;
  const selectedServices = safeServices.filter(s => form.service_ids.includes(s.id));
  const servicesPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalPrice = selectedServices.length > 0
    ? servicesPrice + (form.payment_method === 'cash' ? cashSurcharge : 0)
    : 0;

  // Fully booked dates logic
  const slotsByDate = safeBookedSlots.reduce((acc, slot) => {
    if (slot && slot.appointment_date) {
      acc[slot.appointment_date] = (acc[slot.appointment_date] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const fullyBookedDates = Object.entries(slotsByDate)
    .filter(([_, count]) => count >= TIME_SLOTS.length)
    .map(([date]) => new Date(date + 'T00:00:00'));

  const bookedTimesForDate = safeBookedSlots
    .filter(s => s && s.appointment_date === form.appointment_date && s.appointment_time)
    .map(s => s.appointment_time.substring(0, 5));

  const toggleService = (id: string) => {
    setForm(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(id)
        ? prev.service_ids.filter(s => s !== id)
        : [...prev.service_ids, id]
    }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText('747074371');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setForm({ ...form, appointment_date: format(date, 'yyyy-MM-dd') });
      setShowCalendar(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.service_ids.length === 0) return;
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'service_ids') formData.append(k, JSON.stringify(v));
      else formData.append(k, String(v));
    });
    if (transferImage) formData.append('transfer_image', transferImage);
    mutation.mutate(formData);
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.08 } }
  };
  const itemVariants = { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } };

  if (success) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12 px-4">
        <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-barber-neon">
          <CheckCircle2 className="w-12 h-12 text-gold" />
        </div>
        <h3 className="text-3xl font-black text-white mb-3 tracking-tight">¡Cita Agendada!</h3>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
          Tu espacio ha sido reservado. {form.client_email ? 'Revisa tu bandeja de entrada para ver tu confirmación.' : 'Confirma tu cita enviando un mensaje al barbero.'}
        </p>
        <button
          onClick={() => {
            const text = `¡Hola! Acabo de agendar una cita.\n\n*Nombre:* ${form.client_name}\n*Fecha:* ${form.appointment_date} a las ${form.appointment_time}\n*Total:* L. ${totalPrice.toFixed(0)}\n\nPor favor confírmame la cita. ¡Gracias!`;
            window.open(`https://wa.me/50487952631?text=${encodeURIComponent(text)}`, "_blank");
          }}
          className="w-full max-w-xs mx-auto py-4 rounded-xl flex items-center justify-center gap-2 transition mb-4 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:scale-[1.02]"
          style={{ backgroundColor: '#25D366', color: 'white' }}
        >
          <span className="font-black uppercase tracking-widest">Enviar WhatsApp</span>
          <MessageSquare className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setSuccess(false); setForm({ client_name: '', client_phone: '', client_email: '', service_ids: [], appointment_date: '', appointment_time: '', payment_method: 'transfer' }); setTransferImage(null); }}
          className="btn-gold-shimmer w-full max-w-xs mx-auto py-4 rounded-xl flex items-center justify-center gap-2"
        >
          <span className="font-black uppercase tracking-widest text-black">Aceptar y Cerrar</span>
          <CheckCircle2 className="w-5 h-5 text-black" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form variants={containerVariants} initial="hidden" animate="visible" onSubmit={handleSubmit} className="space-y-6">

      {/* ── Open/Closed status badge ─────────────────────────────────────── */}
      {settings && (
        <motion.div variants={itemVariants}>
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${settings.is_open
              ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/8 border-red-500/20 text-red-400'
            }`}>
            <Store className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-black text-sm uppercase tracking-widest">
                {settings.is_open ? '✦ Estamos Abiertos' : '✦ Estamos Cerrados'}
              </p>
              <p className="text-[10px] opacity-60 font-bold">
                {settings.is_open ? 'Agenda tu cita ahora mismo' : 'Puedes reservar para otro día'}
              </p>
            </div>
            <div className={`ml-auto w-2.5 h-2.5 rounded-full animate-pulse ${settings.is_open ? 'bg-emerald-400' : 'bg-red-500'}`} />
          </div>
        </motion.div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mutation.error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {(mutation.error as any)?.response?.data?.error || 'Error al agendar la cita'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nombre ───────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="text-xs font-black text-gold tracking-widest uppercase flex items-center gap-2 ml-1">
          <User className="w-3.5 h-3.5" /> Nombre Completo
        </label>
        <input type="text" required value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}
          className="w-full px-5 py-4 bg-dark-card border border-dark-border rounded-2xl text-white focus:border-gold/50 focus:ring-4 focus:ring-gold/5 outline-none transition-all placeholder:text-gray-600"
          placeholder="Ej. Juan Pérez" />
      </motion.div>

      {/* ── Contactos ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-black text-gold tracking-widest uppercase flex items-center gap-2 ml-1">
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp *
          </label>
          <input
            type="tel"
            required
            value={form.client_phone}
            onChange={e => {
              let val = e.target.value.replace(/\D/g, '');
              if (val.startsWith('504')) val = val.substring(3);
              val = val.substring(0, 8);
              let formatted = val.length > 4 ? `${val.substring(0, 4)}-${val.substring(4)}` : val;
              setForm({ ...form, client_phone: formatted ? `+504 ${formatted}` : '' });
            }}
            className="w-full px-5 py-4 bg-dark-card border border-dark-border rounded-2xl text-white focus:border-gold/50 focus:ring-4 focus:ring-gold/5 outline-none transition-all placeholder:text-gray-600 font-bold tracking-widest"
            placeholder="+504 0000-0000" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-gold tracking-widest uppercase flex items-center gap-2 ml-1">
            <MessageSquare className="w-3.5 h-3.5" /> Email (Opcional)
          </label>
          <input
            type="email"
            value={form.client_email}
            onChange={e => setForm({ ...form, client_email: e.target.value })}
            className="w-full px-5 py-4 bg-dark-card border border-dark-border rounded-2xl text-white focus:border-gold/50 focus:ring-4 focus:ring-gold/5 outline-none transition-all placeholder:text-gray-600"
            placeholder="tu@correo.com" />
        </div>
      </motion.div>

      {/* ── Servicio ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-3">
        <label className="text-xs font-black text-gold tracking-widest uppercase flex items-center gap-2 ml-1">
          <Scissors className="w-3.5 h-3.5" /> Servicios Premium
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {loadingServices ? (
            <div className="text-gray-500 text-sm p-4 col-span-2 text-center">Cargando servicios...</div>
          ) : safeServices.filter(s => s.active).sort((a, b) => a.sort_order - b.sort_order).map(s => (
            <label key={s.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.service_ids.includes(s.id) ? 'border-gold bg-gold/10 shadow-barber-neon' : 'border-dark-border bg-dark-card hover:border-gold/30'}`}>
              <input type="checkbox" className="hidden" checked={form.service_ids.includes(s.id)} onChange={() => toggleService(s.id)} />
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${form.service_ids.includes(s.id) ? 'border-gold bg-gold text-black' : 'border-gray-600'}`}>
                {form.service_ids.includes(s.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white">{s.name}</p>
              </div>
              <p className="text-gold font-bold text-sm">L. {s.price}</p>
            </label>
          ))}
        </div>
      </motion.div>

      {/* ── Fecha & Hora ─────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 relative" ref={calendarRef}>
          <label className="text-xs font-black text-gold tracking-widest uppercase flex items-center gap-2 ml-1">
            <CalendarIcon className="w-3.5 h-3.5" /> Fecha
          </label>
          <button type="button" onClick={() => setShowCalendar(!showCalendar)}
            className="w-full px-5 py-4 bg-dark-card border border-dark-border rounded-2xl text-left text-white outline-none flex items-center justify-between group transition-all">
            <span className={form.appointment_date ? 'text-white' : 'text-gray-600'}>
              {form.appointment_date ? format(new Date(form.appointment_date + 'T00:00:00'), 'dd/MM/yyyy') : 'Seleccionar...'}
            </span>
            <CalendarIcon className={`w-5 h-5 transition-colors ${form.appointment_date ? 'text-gold' : 'text-gray-600 group-hover:text-gold'}`} />
          </button>
          <AnimatePresence>
            {showCalendar && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 p-4 bg-dark-card border border-gold/20 rounded-3xl shadow-barber-lg backdrop-blur-xl">
                <style>{`.rdp{--rdp-cell-size:40px;--rdp-accent-color:#d4a017;margin:0}.rdp-day_selected{background-color:var(--rdp-accent-color)!important;color:black!important;font-weight:900!important;border-radius:12px}.rdp-day:hover:not(.rdp-day_selected){background-color:rgba(212,160,23,.1)!important;color:white;border-radius:12px}.rdp-button:hover:not([disabled]):not(.rdp-day_selected){background-color:rgba(212,160,23,.1)!important}.rdp-head_cell{color:#d4a017;font-weight:900;font-size:.7rem;text-transform:uppercase}.rdp-nav_button{color:#d4a017}.rdp-caption_label{color:white;font-weight:900;text-transform:uppercase}`}</style>
                <DayPicker mode="single" selected={form.appointment_date ? new Date(form.appointment_date + 'T00:00:00') : undefined}
                  onSelect={handleDateSelect} locale={es} disabled={[{ before: new Date() }, ...fullyBookedDates]} className="bg-transparent" />
                <button type="button" onClick={() => setShowCalendar(false)} className="w-full mt-2 py-2 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest">CERRAR</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-gold tracking-widest uppercase flex items-center gap-2 ml-1">
            <Clock className="w-3.5 h-3.5" /> Hora
          </label>
          <select required value={form.appointment_time} onChange={e => setForm({ ...form, appointment_time: e.target.value })}
            className="w-full px-5 py-4 bg-dark-card border border-dark-border rounded-2xl text-white outline-none appearance-none cursor-pointer">
            <option value="" disabled>Seleccionar...</option>
            {TIME_SLOTS.map(t => {
              const isTaken = bookedTimesForDate.includes(t);
              return (
                <option key={t} value={t} disabled={isTaken}>
                  {t} {isTaken ? '(Ocupado)' : ''}
                </option>
              );
            })}
          </select>
        </div>
      </motion.div>

      {/* ── Método de pago ───────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-3">
        <label className="text-xs font-black text-gold tracking-widest uppercase flex items-center gap-2 ml-1">
          <CreditCard className="w-3.5 h-3.5" /> Método de Pago
        </label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'transfer', label: 'Transfer', Icon: CreditCard },
            { key: 'cash', label: `Efectivo (+L.${cashSurcharge})`, Icon: Banknote },
          ].map(({ key, label, Icon }) => (
            <motion.button key={key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button"
              onClick={() => setForm({ ...form, payment_method: key })}
              className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all duration-300 ${form.payment_method === key ? 'border-gold bg-gold/10 text-gold shadow-barber-neon' : 'border-dark-border bg-dark-card text-gray-500 opacity-60'}`}>
              <Icon className="w-6 h-6" />
              <span className="font-black text-[10px] tracking-widest uppercase">{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── BAC Info Card ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {form.payment_method === 'transfer' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-barber-lg bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#081020]">
              {/* BAC Red top accent */}
              <div className="h-1.5 w-full bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

              <div className="p-5">
                {/* Bank logo + title */}
                <div className="flex items-center gap-3 mb-5">
                  <img src="/BAC.png" alt="BAC Credomatic" className="h-8 object-contain" loading="lazy" />
                  <div>
                    <p className="text-white font-black text-sm leading-tight">BAC Credomatic</p>
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Honduras</p>
                  </div>
                </div>

                {/* Account chip-style */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 flex items-center justify-between cursor-pointer group" onClick={copyToClipboard}>
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Número de Cuenta</p>
                    <p className="text-2xl font-black text-white tracking-[0.15em] font-mono">747074371</p>
                  </div>
                  <div className={`p-2.5 rounded-xl transition-all duration-300 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500 group-hover:bg-gold/10 group-hover:text-gold'}`}>
                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">Titular</p>
                    <p className="text-sm font-bold text-gray-200">Josué David Nuñez Peña</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">Tipo</p>
                    <p className="text-sm font-bold text-gray-200">Cuenta de Ahorro</p>
                  </div>
                </div>

                <p className="mt-4 text-[9px] text-gray-600 font-bold italic flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" /> Sube el comprobante después de transferir
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Comprobante Upload ───────────────────────────────────────────── */}
      <AnimatePresence>
        {form.payment_method === 'transfer' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-2">
            <label className="text-xs font-black text-gray-400 tracking-widest uppercase flex items-center gap-2 ml-1">
              <ImageIcon className="w-3.5 h-3.5" /> Comprobante (Opcional)
            </label>
            <input type="file" accept="image/*" onChange={e => setTransferImage(e.target.files?.[0] || null)} className="hidden" id="transfer-file" />
            <label htmlFor="transfer-file" className="flex items-center justify-center p-2 border-2 border-dashed border-dark-border rounded-2xl bg-dark-card/50 hover:bg-dark-card hover:border-gold/30 cursor-pointer transition-all overflow-hidden h-40">
              {transferImage ? (
                <div className="relative w-full h-full rounded-xl overflow-hidden group">
                  <img src={URL.createObjectURL(transferImage)} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-gold drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] mb-2" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 group-hover:border-gold/50 transition-colors">
                      Cambiar Imagen
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-40 py-8">
                  <ImageIcon className="w-10 h-10 mb-1" />
                  <p className="text-xs font-black uppercase tracking-widest">Subir Captura</p>
                </div>
              )}
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Price Summary ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedServices.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card-gold rounded-2xl p-6 shadow-barber space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Servicios ({selectedServices.length})</span>
              <span className="text-sm font-black text-white truncate max-w-[60%] text-right">{selectedServices.map(s => s.name).join(', ')}</span>
            </div>
            {form.payment_method === 'cash' && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-bold uppercase tracking-widest">Recargo Efectivo</span>
                <span className="text-gold font-black">+ L. {cashSurcharge}</span>
              </div>
            )}
            <div className="border-t border-gold/10 pt-3 flex justify-between items-center">
              <span className="text-sm font-black text-gold uppercase tracking-[0.2em]">Total</span>
              <span className="text-3xl font-black text-white">L. {totalPrice.toFixed(0)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        type="submit" disabled={mutation.isPending || form.service_ids.length === 0}
        className="btn-gold-shimmer w-full py-5 rounded-2xl text-xl font-black shadow-barber-gold disabled:opacity-50 flex items-center justify-center gap-3 uppercase">
        {mutation.isPending ? (
          <><div className="w-5 h-5 border-4 border-black/30 border-t-black rounded-full animate-spin" /><span>AGENDANDO...</span></>
        ) : (<>RESERVAR AHORA <ChevronRight className="w-6 h-6" /></>)}
      </motion.button>
    </motion.form>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DayPicker, type DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchDashboardStats, queryKeys } from '../../lib/api';
import { CalendarIcon, ChevronDown, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchRange, setSearchRange] = useState<{ from?: string; to?: string }>({});
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyRange = () => {
    if (dateRange?.from && dateRange?.to) {
      setSearchRange({
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
      });
      setShowCalendar(false);
    }
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.dashboard(searchRange.from, searchRange.to),
    queryFn: () => fetchDashboardStats(searchRange.from, searchRange.to),
  });

  if (isLoading || !stats) {
    return <DashboardSkeleton />;
  }

  const goalProgress = stats.dailyGoal > 0 ? Math.min((stats.today.earnings / stats.dailyGoal) * 100, 100) : 0;

  const exportDashboard = () => {
    const wb = XLSX.utils.book_new();
    // Sheet 1: Today
    const todayData = [
      { Métrica: 'Cortes Hoy', Valor: stats.today.cuts },
      { Métrica: 'Ganancias', Valor: `L. ${stats.today.earnings.toFixed(0)}` },
      { Métrica: 'Propinas', Valor: `L. ${stats.today.tips.toFixed(0)}` },
      { Métrica: 'Citas Pendientes', Valor: stats.pendingAppointments },
      { Métrica: 'Meta Diaria', Valor: `L. ${stats.dailyGoal.toFixed(0)}` },
      { Métrica: 'Progreso', Valor: `${goalProgress.toFixed(0)}%` },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(todayData), 'Resumen Hoy');
    // Sheet 2: 7-day chart
    const chartSheet = stats.chartData.map(d => ({
      Fecha: d.date,
      Cortes: d.cuts,
      Ganancias: d.earnings,
      Propinas: d.tips,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(chartSheet), 'Últimos 7 Días');
    // Sheet 3: Range (if available)
    if (searchRange.from && searchRange.to) {
      const rangeData = [
        { Métrica: 'Cortes', Valor: stats.range.cuts },
        { Métrica: 'Ganancias', Valor: `L. ${stats.range.earnings.toFixed(0)}` },
        { Métrica: 'Propinas', Valor: `L. ${stats.range.tips.toFixed(0)}` },
        { Métrica: 'Desde', Valor: searchRange.from },
        { Métrica: 'Hasta', Valor: searchRange.to },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rangeData), 'Por Rango');
    }
    XLSX.writeFile(wb, `Dashboard_Ricky_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm font-bold mt-0.5">
            {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={exportDashboard}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition text-xs font-black uppercase tracking-wider">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gold/10 border border-gold/20 rounded-xl">
            <span className="text-gold text-sm font-black">💈 THE RICKY</span>
          </div>
        </div>
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cortes Hoy" value={stats.today.cuts} color="blue" emoji="✂️" />
        <StatCard label="Ganancias" value={`L. ${stats.today.earnings.toFixed(0)}`} color="gold" emoji="💰" />
        <StatCard label="Propinas" value={`L. ${stats.today.tips.toFixed(0)}`} color="pink" emoji="💕" />
        <StatCard label="Citas Pendientes" value={stats.pendingAppointments} color="orange" emoji="📅" />
      </div>

      {/* Daily Goal */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-black text-white text-sm uppercase tracking-widest">Meta Diaria</h3>
            <p className="text-gray-600 text-xs font-bold mt-0.5">Progreso de hoy</p>
          </div>
          <div className="text-right">
            <span className="text-gold font-black text-lg">L. {stats.today.earnings.toFixed(0)}</span>
            <span className="text-gray-600 font-bold text-sm"> / L. {stats.dailyGoal.toFixed(0)}</span>
          </div>
        </div>
        <div className="w-full bg-dark-surface rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-dark to-gold rounded-full transition-all duration-700"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-gray-600 text-xs font-bold">{goalProgress.toFixed(0)}% completado</p>
          {goalProgress >= 100 && <p className="text-gold text-xs font-black">🎉 ¡META ALCANZADA!</p>}
        </div>
      </div>

      {/* Range Filter */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
        <h3 className="font-black text-white text-sm uppercase tracking-widest mb-4">Ganancias por Rango</h3>
        <div className="flex flex-wrap gap-3 items-end mb-5 relative" ref={calendarRef}>
          <div className="w-full sm:w-auto relative">
            <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <CalendarIcon className="w-3 h-3" /> Selecciona el rango
            </label>
            <button type="button" onClick={() => setShowCalendar(!showCalendar)}
              className="w-full sm:w-64 px-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-left text-sm text-white flex items-center justify-between hover:border-gold/50 transition-all outline-none">
              <span className={dateRange?.from ? 'text-white' : 'text-gray-500'}>
                {dateRange?.from ? (
                  dateRange.to ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` : `${format(dateRange.from, 'dd/MM/yyyy')} - ...`
                ) : (
                  'dd/mm/aaaa - dd/mm/aaaa'
                )}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showCalendar && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute z-50 top-full left-0 mt-2 p-4 bg-dark-card border border-gold/20 rounded-3xl shadow-barber-lg backdrop-blur-xl">
                  <style>{`.rdp{--rdp-cell-size:40px;--rdp-accent-color:#d4a017;margin:0}.rdp-day_selected{background-color:var(--rdp-accent-color)!important;color:black!important;font-weight:900!important;border-radius:12px}.rdp-day:hover:not(.rdp-day_selected){background-color:rgba(212,160,23,.1)!important;color:white;border-radius:12px}.rdp-day_range_middle{background-color:rgba(212,160,23,.15)!important;color:white!important;border-radius:0}.rdp-day_range_start{border-top-right-radius:0;border-bottom-right-radius:0}.rdp-day_range_end{border-top-left-radius:0;border-bottom-left-radius:0}.rdp-button:hover:not([disabled]):not(.rdp-day_selected){background-color:rgba(212,160,23,.1)!important}.rdp-head_cell{color:#d4a017;font-weight:900;font-size:.7rem;text-transform:uppercase}.rdp-nav_button{color:#d4a017}.rdp-caption_label{color:white;font-weight:900;text-transform:uppercase}`}</style>
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    locale={es}
                    className="bg-transparent"
                  />
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                    <button type="button" onClick={() => setShowCalendar(false)} className="flex-1 py-2 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest bg-dark-surface rounded-xl hover:bg-dark-border transition">Cancelar</button>
                    <button type="button" onClick={handleApplyRange} disabled={!dateRange?.from || !dateRange?.to} className="flex-1 py-2 text-[10px] font-black text-black uppercase tracking-widest bg-gold rounded-xl hover:bg-gold-light disabled:opacity-50 transition">Aplicar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {searchRange.from && searchRange.to && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Cortes', value: stats.range.cuts, color: 'text-white' },
              { label: 'Ganancias', value: `L. ${stats.range.earnings.toFixed(0)}`, color: 'text-gold' },
              { label: 'Propinas', value: `L. ${stats.range.tips.toFixed(0)}`, color: 'text-accent-pink' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-dark-surface rounded-xl p-4 text-center border border-dark-border">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">{label}</p>
                <p className={`text-xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
        <h3 className="font-black text-white text-sm uppercase tracking-widest mb-5">Últimos 7 días</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
              <XAxis dataKey="date" stroke="#444" tick={{ fontSize: 11, fill: '#666', fontWeight: 700 }}
                tickFormatter={v => { const d = new Date(v + 'T12:00:00'); return d.toLocaleDateString('es', { weekday: 'short' }).toUpperCase(); }} />
              <YAxis stroke="#444" tick={{ fontSize: 11, fill: '#666', fontWeight: 700 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }}
                labelFormatter={v => new Date(v + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
              <Bar dataKey="earnings" name="Ganancias" fill="#d4a017" radius={[6, 6, 0, 0]} maxBarSize={40} />
              <Bar dataKey="tips" name="Propinas" fill="#e91e8c" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-dark-surface rounded-lg mb-2" />
          <div className="h-4 w-32 bg-dark-surface rounded-lg" />
        </div>
        <div className="hidden sm:block h-10 w-32 bg-dark-surface rounded-xl" />
      </div>

      {/* 4 Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-dark-card border border-dark-border rounded-2xl p-5 h-32 flex flex-col justify-between">
            <div className="h-8 w-8 bg-dark-surface rounded-lg" />
            <div>
              <div className="h-3 w-16 bg-dark-surface rounded-lg mb-2" />
              <div className="h-6 w-24 bg-dark-surface rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Daily Goal Skeleton */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="h-4 w-24 bg-dark-surface rounded-lg mb-1" />
            <div className="h-3 w-16 bg-dark-surface rounded-lg" />
          </div>
          <div className="h-6 w-32 bg-dark-surface rounded-lg" />
        </div>
        <div className="w-full h-3 bg-dark-surface rounded-full" />
      </div>

      {/* Range Filter Skeleton */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
        <div className="h-4 w-40 bg-dark-surface rounded-lg mb-5" />
        <div className="flex flex-wrap gap-3">
          <div className="h-10 w-[280px] bg-dark-surface rounded-xl" />
          <div className="h-10 w-[120px] bg-dark-surface rounded-xl" />
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
        <div className="h-4 w-32 bg-dark-surface rounded-lg mb-5" />
        <div className="h-72 w-full bg-dark-surface rounded-xl" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color, emoji }: { label: string; value: string | number; color: string; emoji: string }) {
  const colors: Record<string, string> = {
    gold: 'from-gold/10 to-gold/5 border-gold/20 text-gold',
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400',
    pink: 'from-pink-500/10 to-pink-500/5 border-pink-500/20 text-pink-400',
    orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-400',
  };

  return (
    <div className={`bg-gradient-to-br rounded-2xl p-5 border ${colors[color] || colors.gold}`}>
      <div className="text-2xl mb-3">{emoji}</div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

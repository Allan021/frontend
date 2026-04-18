import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';

interface SettingsData {
  is_open: boolean;
  daily_goal: number;
  cash_surcharge: number;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dailyGoal, setDailyGoal] = useState('');
  const [cashSurcharge, setCashSurcharge] = useState('');

  function fetchSettings() {
    setLoading(true);
    adminApi.get('/settings')
      .then(res => {
        setSettings(res.data);
        setDailyGoal(String(res.data.daily_goal || 0));
        setCashSurcharge(String(res.data.cash_surcharge || 10));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchSettings(); }, []);

  async function toggleOpen() {
    if (!settings) return;
    await adminApi.patch('/settings', { is_open: !settings.is_open });
    fetchSettings();
  }

  async function saveSettings() {
    setSaving(true);
    setSaved(false);
    await adminApi.patch('/settings', {
      daily_goal: parseFloat(dailyGoal) || 0,
      cash_surcharge: parseFloat(cashSurcharge) || 10,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchSettings();
  }

  if (loading || !settings) {
    return <div className="text-center text-gray-500 py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-black text-white">Configuración</h1>

      {/* Open/Closed Toggle */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-lg">Estado del negocio</h3>
            <p className="text-gray-500 text-sm">Los clientes verán este estado en la landing</p>
          </div>
          <button onClick={toggleOpen}
            className={`relative w-[68px] h-9 rounded-full transition-colors duration-300 shrink-0 ${settings.is_open ? 'bg-green-500' : 'bg-gray-600'}`}>
            <span className={`absolute top-[3px] left-[3px] w-[30px] h-[30px] bg-white rounded-full shadow-lg transition-transform duration-300 ${settings.is_open ? 'translate-x-[32px]' : 'translate-x-0'}`} />
          </button>
        </div>
        <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
          settings.is_open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full ${settings.is_open ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {settings.is_open ? 'ABIERTO' : 'CERRADO'}
        </div>
      </div>

      {/* Daily Goal */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-white text-lg">Configuración general</h3>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Meta diaria (LPS)</label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500">L.</span>
            <input type="number" value={dailyGoal} onChange={e => setDailyGoal(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white focus:border-gold focus:outline-none"
              placeholder="5000" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Recargo por efectivo (LPS)</label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500">L.</span>
            <input type="number" value={cashSurcharge} onChange={e => setCashSurcharge(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white focus:border-gold focus:outline-none"
              placeholder="10" />
          </div>
          <p className="text-gray-600 text-xs mt-1">Se suma al precio cuando el cliente paga en efectivo</p>
        </div>

        <button onClick={saveSettings} disabled={saving}
          className="px-6 py-3 bg-gold text-black font-bold rounded-lg hover:bg-gold-light disabled:opacity-50 transition">
          {saving ? 'Guardando...' : saved ? 'Guardado!' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

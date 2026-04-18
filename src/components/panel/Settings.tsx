import { useState, useEffect } from 'react';
import { useAuth, API } from './PanelApp';

interface SettingsData {
  is_open: boolean;
  daily_goal: number;
  cash_surcharge: number;
}

export default function Settings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dailyGoal, setDailyGoal] = useState('');
  const [cashSurcharge, setCashSurcharge] = useState('');

  function fetchSettings() {
    setLoading(true);
    fetch(`${API}/api/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setSettings(data);
        setDailyGoal(String(data.daily_goal || 0));
        setCashSurcharge(String(data.cash_surcharge || 10));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchSettings(); }, []);

  async function toggleOpen() {
    if (!settings) return;
    await fetch(`${API}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_open: !settings.is_open }),
    });
    fetchSettings();
  }

  async function saveSettings() {
    setSaving(true);
    setSaved(false);
    await fetch(`${API}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        daily_goal: parseFloat(dailyGoal) || 0,
        cash_surcharge: parseFloat(cashSurcharge) || 10,
      }),
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">Estado del negocio</h3>
            <p className="text-gray-500 text-sm">Los clientes verán este estado en la landing</p>
          </div>
          <button onClick={toggleOpen}
            className={`relative w-20 h-10 rounded-full transition-colors ${settings.is_open ? 'bg-green-500' : 'bg-red-500'}`}>
            <span className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-transform shadow-lg ${settings.is_open ? 'left-11' : 'left-1'}`} />
          </button>
        </div>
        <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
          settings.is_open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          <span className={`w-3 h-3 rounded-full ${settings.is_open ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
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

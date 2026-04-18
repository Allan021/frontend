import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryKeys, fetchPublicServices } from '../../lib/api';

const queryClient = new QueryClient();

function ServicesGridCore() {
  const { data: services, isLoading } = useQuery({
    queryKey: queryKeys.services,
    queryFn: fetchPublicServices,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card-gold rounded-2xl p-6 text-center shadow-barber animate-pulse">
            <div className="h-3 bg-white/5 rounded-full mb-3 w-3/4 mx-auto"></div>
            <div className="h-8 bg-gold/10 rounded-full w-1/2 mx-auto"></div>
          </div>
        ))}
      </>
    );
  }

  if (!services || services.length === 0) return null;

  return (
    <>
      {services
        .filter(s => s.active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((s, i) => (
        <div key={s.id}
             className="service-card glass-card-gold rounded-2xl p-6 text-center shadow-barber group hover:border-gold/30 hover:shadow-barber-gold transition-all duration-500 cursor-default"
             style={{ animation: `fadeUp 0.6s ease-out ${i * 80}ms both` }}>
          <p className="font-black text-white text-[10px] tracking-widest uppercase mb-3">{s.name}</p>
          <p className="text-3xl font-black text-gradient-gold italic">L. {Math.round(s.price)}</p>
          <div className="mt-3 w-8 h-0.5 bg-gold/30 rounded-full mx-auto group-hover:w-16 transition-all duration-500"></div>
        </div>
      ))}
    </>
  );
}

export default function ServicesGrid() {
  return (
    <QueryClientProvider client={queryClient}>
      <ServicesGridCore />
    </QueryClientProvider>
  );
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookingForm from './BookingForm';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 30, refetchOnWindowFocus: false },
  },
});

export default function BookingFormWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <BookingForm />
    </QueryClientProvider>
  );
}

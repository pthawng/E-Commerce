import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { ConfigProvider, App as AntApp } from 'antd';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6D28D9',
          fontFamily: '"Inter", sans-serif',
          colorBgBase: '#ffffff',
          colorTextBase: '#1F2937',
          borderRadius: 8,
          wireframe: false,
        },
        components: {
          Button: {
            fontFamily: '"Inter", sans-serif',
            controlHeight: 40,
            borderRadius: 8,
            primaryShadow: '0 4px 14px 0 rgba(109, 40, 217, 0.3)',
          },
          Typography: {
            fontFamilyCode: '"Playfair Display", serif',
          },
          Card: {
            boxShadowTertiary: '0 10px 40px -10px rgba(109, 40, 217, 0.15)',
          },
          Input: {
            colorBorder: '#D4AF3750',
            hoverBorderColor: '#D4AF37',
            activeBorderColor: '#6D28D9',
          }
        },
      }}
    >
      <AntApp>
        <QueryClientProvider client={queryClient}>
          {children}
          {/* React Query Devtools - chỉ hiển thị trong development */}
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}


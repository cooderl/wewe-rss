import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useNavigate } from 'react-router-dom';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <NextUIProvider navigate={navigate}>
      <NextThemesProvider attribute="class" enableSystem>
        {children}
      </NextThemesProvider>
    </NextUIProvider>
  );
}

export default ThemeProvider;

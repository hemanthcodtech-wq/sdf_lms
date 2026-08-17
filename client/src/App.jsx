import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-bg-cream flex flex-col">
        <AppRoutes />
      </div>
    </LanguageProvider>
  );
}

export default App;

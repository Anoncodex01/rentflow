import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  title: string;
  alertCount?: number;
}

export function Layout({ children, title, alertCount }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="lg:ml-64">
        <Header 
          title={title} 
          alertCount={alertCount} 
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

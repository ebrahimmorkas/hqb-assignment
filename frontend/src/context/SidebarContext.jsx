import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext(null);

// Lives above <Routes> (see App.jsx) so open/closed state survives page
// navigation - AdminLayout used to hold this as local state, which reset to
// its default on every route change since each page remounts it.
export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(true); // open by default

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within a SidebarProvider');
  return ctx;
}

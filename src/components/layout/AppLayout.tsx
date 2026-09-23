import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
export default function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="workspace">
        <Header onMenu={() => setOpen((v) => !v)} />
        <main>
          <Outlet />
        </main>
        <footer className="app-footer">
          Sport Max
          <span>Inventarios & Recursos Humanos</span>
        </footer>
      </div>
    </div>
  );
}

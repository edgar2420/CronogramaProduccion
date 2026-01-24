import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";

const link = "px-3 py-2 rounded-lg hover:bg-gray-100";
const active = "text-indigo-700 font-semibold";

const Navbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="mx-auto max-w-7xl px-4 py-3">
      <div className="mx-auto max-w-7xl w-full px-4 py-3 flex items-center gap-4">
        <img src="/logo-abd.png" alt="Laboratorios ABD" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} className="h-8" />
        <div className="font-bold">Panel Administrador</div>
        <nav className="ml-auto flex items-center gap-2">
          <NavLink to="/" className={({isActive})=>`${link} ${isActive?active:""}`}>Dashboard</NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin/staff" className={({isActive})=>`${link} ${isActive?active:""}`}>Personal</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};
export default Navbar;

import { Link } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import Logo from './Logo.tsx';
export interface NavBarProps {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function NavBar({isAuthenticated, setIsAuthenticated}: NavBarProps) {
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const handleLogout= async () => {
    if (isAuthenticated) {
      try {
        const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/logout`, {
          method: 'POST',
          credentials: 'include'
        });
        if(response.ok){
          setIsAuthenticated(false);
        }
      }
      catch (err) {
        console.log(err);
      }
    }
  }
  useEffect(() => {
    const menu: HTMLDivElement | null = mobileMenuRef.current;
    if (!menu){
      return;
    }
    menu.classList.toggle('hidden', !isOpen);
  }, [isOpen]);
  return (
    <nav className="bg-slate-900 p-4">
      <div className="hidden md:flex container mx-auto  max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <div>
          {!isAuthenticated &&
            <>
              <Link to="/login" className="text-slate-300 hover:text-white px-3 py-2 ml-5 rounded-md text-sm font-bold transition-colors">Login</Link>
              <Link to="/register" className="bg-purple-900 hover:bg-amber-400 text-slate-300 hover:text-white px-3 py-2 ml-5 rounded-md text-sm font-bold transition-colors">Register</Link>
            </>
          }
          {isAuthenticated &&
            <>
              <Link to={"/inventory"} className="text-slate-300 hover:text-white px-3 py-2 ml-5 rounded-md text-sm font-bold transition-colors">Inventory</Link>
              <Link to="/logout" onClick={handleLogout} className="text-slate-300 hover:text-white px-3 py-2 ml-5 rounded-md text-sm font-bold transition-colors">Logout</Link>
            </>
          }
        </div>
      </div>
      <div className="md:hidden flex items-center justify-between container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="md:hidden flex items-center">
          <button id="mobile-menu-btn"
                  className="outline-none text-gray-400 hover:text-white transition-colors duration-200" onClick={() => setIsOpen(!isOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <Logo />
      </div>
      <div id="mobile-menu"
           className="hidden md:hidden bg-slate-800 px-4 pt-2 pb-4 mt-4 space-y-1 border-t border-slate-700" ref={mobileMenuRef}>
        {!isAuthenticated &&
          <div className="flex flex-col">
            <Link to="/login" className="text-slate-300 hover:text-white px-3 py-2 ml-5 rounded-md text-sm font-bold transition-colors">Login</Link>
            <Link to="/register" className="bg-purple-900 hover:bg-amber-400 text-slate-300 hover:text-white px-3 py-2 ml-5 rounded-md text-sm font-bold transition-colors">Register</Link>
          </div>
        }
        {isAuthenticated &&
          <div className="flex flex-col">
            <Link to={"/inventory"} className="text-slate-300 hover:text-white px-3 py-2 ml-5 rounded-md text-sm font-bold transition-colors">Inventory</Link>
            <Link to="/logout" onClick={handleLogout} className="text-slate-300 hover:text-white px-3 py-2 ml-5 rounded-md text-sm font-bold transition-colors">Logout</Link>
          </div>
        }
      </div>
    </nav>
  );
}
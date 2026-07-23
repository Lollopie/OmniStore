import { Link } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import Logo from './Logo.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';
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
    <nav className="flex justify-center py-2 px-4 bg-base-100 border-accent border lg:rounded-2xl">
      <div className="max-w-5xl hidden md:flex navbar">
        <div className="flex-1">
            <Logo />
        </div>
        <div className="flex-none">
          {!isAuthenticated &&
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary mx-5">Register</Link>
            </>
          }
          {isAuthenticated &&
            <>
              <Link to={"/inventory"} className="btn btn-ghost">Inventory</Link>
              <Link to="/logout" onClick={handleLogout} className="btn btn-ghost mx-5">Logout</Link>
            </>
          }
          <ThemeToggle />
        </div>
      </div>
      <div className="md:hidden flex flex-col mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-row items-center justify-between container">
          <div className="md:hidden flex items-center">
            <button id="mobile-menu-btn"
                    className="outline-none text-base-400 hover:text-base-300 transition-colors duration-200" onClick={() => setIsOpen(!isOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <Logo />
        </div>
        <div id="mobile-menu"
             className="hidden md:hidden bg-base-100 px-4 pt-2 pb-4 mt-4 space-y-1 border-t border-base-200" ref={mobileMenuRef}>
          {!isAuthenticated &&
            <div className="flex flex-col">
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-accent">Register</Link>
            </div>
          }
          {isAuthenticated &&
            <div className="flex flex-col">
              <Link to={"/inventory"} className="btn btn-ghost">Inventory</Link>
              <Link to="/logout" onClick={handleLogout} className="btn btn-ghost">Logout</Link>
            </div>
          }
        </div>
      </div>

    </nav>
  );
}
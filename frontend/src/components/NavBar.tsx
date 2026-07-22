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
    <nav className="flex justify-center py-2 px-4 bg-base-100">
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
          <label className="swap swap-rotate">
            <input type="checkbox" className="theme-controller" value="omnistore-dark" />

            <svg
              className="swap-off h-10 w-10 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24">
              <path
                d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
            </svg>

            <svg
              className="swap-on h-10 w-10 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24">
              <path
                d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
          </label>
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
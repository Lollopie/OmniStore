import { api } from '../api/client.ts';
import { Link, useLocation } from 'react-router';
import React, { useEffect, useRef } from 'react';
import Logo from './Logo.tsx';
import { useAuth } from '../features/auth/authContext/';
import Button from './Button.tsx';
// export interface NavBarProps {
// }

const PrimaryLinks = [
  { name: 'Organization', href: '/organizations' },
  { name: 'Warehouses', href: '/warehouses' },
  { name: 'Inventory', href: '/inventory' },
  { name: 'Settings', href: '/settings' },
];

// '/settings' must not match '/organizations/settings', but should match '/settings/account'
const isActive = (href: string, pathname: string) => pathname === href || pathname.startsWith(`${href}/`);

const activeLinkClass = 'btn btn-ghost font-bold text-primary font-semibold';
const inactiveLinkClass = 'btn btn-ghost';

const activeLinkClassMobile = 'btn btn-ghost  btn-lg w-full text-center font-bold text-primary font-semibold';
const inactiveLinkClassMobile = 'btn btn-ghost btn-lg w-full text-center';

export default function NavBar() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { pathname } = useLocation();
  const handleLogout = async () => {
    console.log(isAuthenticated);
    if (isAuthenticated) {
      try {
        await api.post('/logout');
        logout();
      } catch (err) {
        console.log(err);
      }
    }
  };
  useEffect(() => {
    const dialog: HTMLDialogElement | null = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);
  return (
    <header className="navbar lg:max-w-5xl mx-auto rounded-2xl bg-base-100 border-accent border lg:rounded-2xl px-5
                        flex-row-reverse md:flex-row justify-between">
      <Logo />
      <nav>
        <ul className="hidden md:flex py-2 gap-5">
          {!isAuthenticated &&
            <>
              <li><Link to="/login" className="btn btn-ghost">Login</Link></li>
              <li><Link to="/register" className="btn btn-primary mr-5">Register</Link></li>
            </>
          }
          {isAuthenticated &&
            <>
              {PrimaryLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.href}
                        className={isActive(link.href, pathname) ? activeLinkClass : inactiveLinkClass}
                        aria-current={isActive(link.href, pathname) ? 'page' : undefined}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li><Link to="/logout" onClick={handleLogout} className="btn btn-ghost mr-5">Logout</Link></li>
            </>
          }
        </ul>
        <dialog
          ref={dialogRef}
          onClose={() => setIsOpen(false)}
          className="modal bg-base-900/50 backdrop-blur-lg p-6 rounded-2xl w-full m-auto">
          <div className="modal-box">
            <div className="flex justify-between items-center mb-8">
              <Logo />
              <Button variant="ghost" className="btn-circle" onClick={() => setIsOpen(false)}>
                <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <ul className="flex flex-col gap-4 text-lg font-medium my-auto">
              {!isAuthenticated ? (
                <>
                  <li><Link to="/login" onClick={() => setIsOpen(false)}
                            className="btn btn-outline btn-lg w-full">Login</Link></li>
                  <li><Link to="/register" onClick={() => setIsOpen(false)}
                            className="btn btn-primary btn-lg w-full">Register</Link></li>
                </>
              ) : (
                <>
                  {PrimaryLinks.map((link) => (
                    <li key={link.name}>
                      <Link to={link.href}
                            onClick={() => setIsOpen(false)}
                            className={isActive(link.href, pathname) ? activeLinkClassMobile : inactiveLinkClassMobile}
                            aria-current={isActive(link.href, pathname) ? 'page' : undefined}>{
                        link.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Button onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                      setIsOpen(false);
                    }} variant="danger" className="w-full">
                      Logout
                    </Button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </dialog>
        <div className="md:hidden">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Open navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor">
              <use href="/icons.svg#hamburger-menu-icon" />
            </svg>
          </Button>
        </div>
      </nav>
    </header>
  );
}
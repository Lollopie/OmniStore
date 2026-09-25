import { Link } from 'react-router';
import React, { useEffect, useRef } from 'react';
import Logo from '../../../components/Logo.tsx';
import Button from '../../../components/Button.tsx';

const PrimaryLinks = [
  { name: 'Home', href: '/' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Features', href: '/features' },
  { name: 'Contact', href: '/contact' },
];

const activeLinkClass = 'btn btn-ghost font-bold text-primary font-semibold';
const inactiveLinkClass = 'btn btn-ghost';

const activeLinkClassMobile = 'btn btn-ghost  btn-lg w-full text-center font-bold text-primary font-semibold';
const inactiveLinkClassMobile = 'btn btn-ghost btn-lg w-full text-center';

export function HomeNavBar() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const currentSite = window.location.pathname;
  const [isOpen, setIsOpen] = React.useState(false);
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
      <nav className="w-full">
        <div className="w-full flex justify-between flex-row-reverse md:flex-row items-center gap-5">
          <Logo />
          <ul className="hidden md:flex py-2 gap-5">
            {PrimaryLinks.map((link) => (
              <li>
                <Link to={link.href}
                      className={link.href === currentSite ? activeLinkClass : inactiveLinkClass}
                      aria-current={link.href === currentSite ? 'page' : undefined}>{
                  link.name}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="hidden md:flex py-2 gap-5">
            <li><Link to="/login"
                      className={'/login' === currentSite ? activeLinkClass : inactiveLinkClass}
                      aria-current={currentSite === '/login' ? 'page' : undefined}>Login</Link></li>
            <li><Link to="/register"
                      className="btn btn-primary"
                      aria-current={currentSite === '/register' ? 'page' : undefined}>Register</Link></li>
          </ul>
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
        </div>

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
              {PrimaryLinks.map((link) => (
                <li>
                  <Link to={link.href}
                        onClick={() => setIsOpen(false)}
                        className={link.href === currentSite ? activeLinkClassMobile : inactiveLinkClassMobile}
                        aria-current={link.href === currentSite ? 'page' : undefined}>{
                    link.name}
                  </Link>
                </li>
              ))}
              <li><Link to="/login" onClick={() => setIsOpen(false)}
                        className="btn btn-ghost btn-lg w-full text-center">Login</Link></li>
              <li><Link to="/register" onClick={() => setIsOpen(false)}
                        className="btn btn-primary btn-lg w-full text-center">Register</Link></li>
            </ul>
          </div>
        </dialog>
      </nav>
    </header>
  );
}
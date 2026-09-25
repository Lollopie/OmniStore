import { Link } from 'react-router';
import Logo from '../../../components/Logo.tsx';

const PrimaryLinks = [
  { name: 'Home', href: '/' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Features', href: '/features' },
  { name: 'Contact', href: '/contact' },
];

export function HomepageFooter() {
  const currentSite = window.location.pathname;
  return (
    <div className="w-full bg-base-100">
      <section className="w-full bg-base-100">
        <div className="mx-auto max-w-7xl p-10 flex flex-row justify-between">
          <section className="flex flex-col gap-5 items-start">
            <Logo />
            <p className="text-base-content/50 text-sm text-wrap max-w-xs">
              OmniStore is a platform that allows you to manage your warehouses and inventories online.
            </p>
            <section className="flex gap-5 items-start">
              <a href="https://github.com/Lollopie/OmniStore" target="_blank" rel="noopener noreferrer"
                 className="btn btn-circle bg-base-200 border-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="15"
                  className="size-10 text-base-content"
                >
                  <use href="/icons.svg#github.icon" />
                </svg>
              </a>
              <a href="https://www.linkedin.com/in/florian-piel-629097404/" target="_blank" rel="noopener noreferrer"
                 className="btn btn-circle bg-base-200 border-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="25"
                  className="size-10 text-base-content"
                >
                  <use href="/icons.svg#linkedIn.icon" />
                </svg>
              </a>
            </section>
          </section>
          <section className="flex flex-col items-start gap-5">
            <h2 className="text-base-content/50 text-sm">Explore</h2>
            {PrimaryLinks.filter((link) => link.href !== currentSite).map((link) => (
              <Link to={link.href}
                    className="text-lg text-base-content/80 transform transition duration-200 hover:text-accent">{link.name}</Link>
            ))}
          </section>
          <section className="flex flex-col gap-5 items-start">
            <h2 className="text-base-content/50 text-sm">Get Started</h2>
            <Link to="/register"
                  className="text-lg text-base-content/80 transform transition duration-200 hover:text-accent">Register</Link>
            <Link to="/login"
                  className="text-lg text-base-content/80 transform transition duration-200 hover:text-accent">Login</Link>
          </section>
          <section className="flex flex-col gap-5 items-start">
            <h2 className="text-base-content/50 text-sm">Contact</h2>
            <div className="flex flex-row gap-2 items-center">
              <svg xmlns="http://www.w3.org/2000/svg"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="40"
                   className="text-accent size-5 inline">
                <use href="/icons.svg#email.icon" />
              </svg>
              <a href="mailto:contact@florian-piel.space"
                 className="transition transform duration-500 hover:text-blue-600 text-sm text-base-content/80">
                contact@florian-piel.space
              </a>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <svg xmlns="http://www.w3.org/2000/svg"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="40"
                   className="text-accent size-5 inline">
                <use href="/icons.svg#phone.icon" />
              </svg>
              <p className="text-sm text-base-content/80">
                +1 (555) 123-4567
              </p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <svg xmlns="http://www.w3.org/2000/svg"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="40"
                   className="text-accent size-5 inline">
                <use href="/icons.svg#location.icon" />
              </svg>
              <p className="text-sm text-base-content/80">
                123 Main Street, Suite 100
              </p>
            </div>
          </section>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-10">
        <div className="divider" />
        <div
          className="pb-10 flex flex-col gap-2 lg:flex-row justify-between items-center">
          <p className="text-base-content/50">
            &copy; {new Date().getFullYear()} OmniStore. All rights reserved.
          </p>
          <section className="flex flex-row gap-2 items-center">
            <Link to="/tos" className="btn btn-ghost text-sm text-base-content/50">Terms of Service</Link>
            <Link to="/pricavy" className="btn btn-ghost text-sm text-base-content/50">Privacy Policy</Link>
          </section>
        </div>
      </section>
    </div>
  );
}
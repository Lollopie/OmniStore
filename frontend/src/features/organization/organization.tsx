import { NavLink, Outlet } from "react-router";
import { readStoredValue } from '../../hooks/readStoredValue.ts';

const MENU_ITEMS = [
  { path: "", label: "Members", roles: ["owner", "admin", "member"] },
  { path: "invites", label: "Invites", roles: ["owner", "admin"] },
  { path: "settings", label: "Settings", roles: ["owner", "admin"] },
];

export const OrganizationManager = () => {
  const orgRole = readStoredValue<string>('orgRole') ?? '';
  return (
    <section className="mx-auto max-w-5xl flex gap-6 items-start">
      <section className="flex-1 bg-base-100 rounded-box">
        <nav>
          <ul className="menu w-full">
            {MENU_ITEMS.filter((item) => item.roles.includes(orgRole)).map((item) => (
              <li key={item.path} className="mb-1">
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `btn w-full justify-start ${
                      isActive
                        ? "bg-base-200"
                        : "btn-ghost"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </section>
      <aside className="flex-4">
        <Outlet />
      </aside>
    </section>
  );
};

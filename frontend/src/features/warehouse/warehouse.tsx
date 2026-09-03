import { NavLink, Outlet } from "react-router";

const MENU_ITEMS = [
  { path: "users", label: "Users" },
  { path: "invites", label: "Invites" },
];

export const WarehouseManager = () => {
  return (
    <section className="mx-auto max-w-5xl flex gap-6 items-start">
      <section className="flex-1 bg-base-100 rounded-box">
        <nav>
          <ul className="menu w-full">
            {MENU_ITEMS.map((item) => (
              <li key={item.path} className="mb-1">
                <NavLink
                  to={item.path}
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
import { NavLink, Outlet } from "react-router";
import MainPage from '../../components/MainPage.tsx';

const SETTINGS_NAV = [
  { path: "account", label: "Account" },
  { path: "warehouses", label: "Warehouses" },
  { path: "preferences", label: "Preferences" },
];

export const SettingsLayout = () => {
  return (
    <MainPage>
      <div className="h-full w-full max-w-5xl flex gap-6">
        <div className="w-56 shrink-0">
          <div className="bg-base-100 rounded-box">
            <ul className="menu w-full p-2">
              {SETTINGS_NAV.map((item) => (
                <li key={item.path} className="mb-1">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-full flex-1">
          <div className="h-full card bg-base-100 w-full shadow-sm p-6">
            <Outlet />
          </div>
        </div>

      </div>
    </MainPage>
  );
};
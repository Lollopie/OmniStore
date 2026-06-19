import { Routes, Route } from 'react-router-dom';
import Register from './components/Register';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/register" element={<Register />} />

      {/*/!* Redirect root path to login or register *!/*/}
      {/*<Route path="/" element={<Navigate to="/login" replace />} />*/}

      {/*/!* Example Multi-Tenant B2B Route *!/*/}
      {/*<Route path="/dashboard" element={<Dashboard />} />*/}

      {/* Catch-all 404 Page */}
      <Route path="*" element={<div className="p-10">404 - Page Not Found</div>} />
    </Routes>
  );
}
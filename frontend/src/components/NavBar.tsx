import { Link } from 'react-router-dom';
export default function NavBar() {
  return (
    <nav className="bg-slate-600 p-4">
      <div className="container mx-auto flex justify-between">
        <div className="bg-linear-to-r from-green-400 via-violet-300 to-rose-300 bg-clip-text text-transparent text-lg font-bold">OmniStore</div>
        <div>
          <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-bold">Home</Link>
          <Link to="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-bold">Login</Link>
          <Link to="/register" className="bg-purple-900 hover:bg-amber-400 text-gray-300 hover:text-white px-3 py-2 ml-5 rounded-md text-sm font-bold">Register</Link>
        </div>
      </div>
    </nav>
  );
}
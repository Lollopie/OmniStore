import { Link } from 'react-router-dom';
export interface NavBarProps {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function NavBar({isAuthenticated, setIsAuthenticated}: NavBarProps) {
  const handleLogout= async () => {
    if (isAuthenticated) {
      try {
        const response = await fetch(`${process.env.NESTJS_HOST_URL}/logout`, {
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
  return (
    <nav className="bg-slate-600 p-4">
      <div className="container mx-auto flex justify-between">
        <Link to="/" className="bg-linear-to-r from-green-400 via-violet-300 to-rose-300 bg-clip-text text-transparent text-lg font-bold">OmniStore</Link>
        <div>
          {!isAuthenticated && <><Link to="/login"
                                      className="text-gray-300 hover:text-white px-3 py-2 ml-5 rounded-md text-sm font-bold">Login</Link><Link
            to="/register"
            className="bg-purple-900 hover:bg-amber-400 text-gray-300 hover:text-white px-3 py-2 ml-5 rounded-md text-sm font-bold">Register</Link></>}
          {isAuthenticated && <Link to="/logout" onClick={handleLogout} className="text-gray-300 hover:text-white px-3 py-2 ml-5 rounded-md text-sm font-bold">Logout</Link>}
        </div>
      </div>
    </nav>
  );
}
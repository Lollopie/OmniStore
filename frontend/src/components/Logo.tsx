import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="bg-linear-to-r from-green-400 via-violet-300 to-rose-300 bg-clip-text text-transparent text-lg font-bold">OmniStore</Link>
  );
}
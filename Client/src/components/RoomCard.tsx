import { Link } from "react-router-dom";
import { Users } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface RoomCardProps {
  id: number;
  name: string;
  users: number;
  index?: number;
}

const RoomCard = ({ id, name, users, index = 0 }: RoomCardProps) => {
  const { theme } = useTheme();
  
  return (
    <div
      className={`shadow-xl rounded-2xl p-7 flex flex-col gap-4 border transition-transform duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-1 animate-fade-in group cursor-pointer ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-indigo-800 via-blue-900 to-indigo-900 border-indigo-700/30'
          : 'bg-gradient-to-br from-indigo-100 via-blue-50 to-indigo-100 border-indigo-300/50'
      }`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition ${
          theme === 'dark'
            ? 'bg-indigo-700/30 text-indigo-200 group-hover:bg-indigo-600/40'
            : 'bg-indigo-600/30 text-indigo-700 group-hover:bg-indigo-500/40'
        }`}>
          <Users className="w-6 h-6" />
        </span>
        <div className={`font-bold text-xl drop-shadow-sm flex-1 truncate ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>{name}</div>
      </div>
      <div className={`flex items-center gap-2 text-sm ${
        theme === 'dark' ? 'text-indigo-100' : 'text-indigo-700'
      }`}>
        <Users className="w-4 h-4 opacity-70" />
        <span>{users} member{users !== 1 ? 's' : ''}</span>
      </div>
      <Link
        to={`/room/${id}`}
        className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center font-semibold shadow transition-all duration-200 hover:scale-105 focus:outline-none"
      >
        Enter Room
      </Link>
    </div>
  );
};

export default RoomCard;
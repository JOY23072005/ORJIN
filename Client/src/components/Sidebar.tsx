import { Link } from "react-router-dom";
import { X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const mockUsers = [
  { id: 1, name: 'Alice', avatar: 'https://i.pravatar.cc/40?img=1', online: true },
  { id: 2, name: 'Bob', avatar: 'https://i.pravatar.cc/40?img=2', online: true },
  { id: 3, name: 'Charlie', avatar: 'https://i.pravatar.cc/40?img=3', online: false },
];

const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const { theme } = useTheme();
  
  return (
    <aside className={`w-72 h-full p-6 flex flex-col gap-6 shadow-2xl rounded-r-2xl relative text-sm transition-colors duration-500 overflow-y-auto ${
      theme === 'dark'
        ? 'bg-gradient-to-b from-indigo-900 via-blue-900 to-indigo-800 text-white'
        : 'bg-gradient-to-b from-indigo-100 via-blue-50 to-indigo-100 text-gray-900'
    }`}>
      
      {/* Close Button */}
      {onClose && (
        <button
          className={`absolute top-4 right-4 z-50 p-2 rounded-full shadow-lg transition ${
            theme === 'dark'
              ? 'bg-indigo-800 hover:bg-indigo-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-8">
        <button className="btn btn-primary w-full">+ Create Room</button>
        <button className="btn btn-secondary w-full">Join Room</button>
      </div>

      {/* Rooms List */}
      <nav className="mt-4">
        <h3 className={`font-semibold mb-2 tracking-wide ${
          theme === 'dark' ? 'text-indigo-100' : 'text-indigo-700'
        }`}>Your Rooms</h3>
        <ul className="space-y-2">
          {[1, 2, 3].map(id => (
            <li key={id}>
              <Link
                to={`/room/${id}`}
                className={`block px-3 py-2 rounded-lg transition duration-200 ${
                  theme === 'dark'
                    ? 'bg-white/5 hover:bg-indigo-700/30'
                    : 'bg-white/50 hover:bg-indigo-200/50'
                }`}
              >
                Room {id}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Online Users */}
      <div className="mt-6">
        <h3 className={`font-semibold mb-2 tracking-wide ${
          theme === 'dark' ? 'text-indigo-100' : 'text-indigo-700'
        }`}>Online Users</h3>
        <ul className="space-y-3">
          {mockUsers.map(user => (
            <li key={user.id} className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={`w-8 h-8 rounded-full border-2 ${
                    theme === 'dark' ? 'border-indigo-700' : 'border-indigo-300'
                  }`}
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                    theme === 'dark' ? 'border-indigo-900' : 'border-white'
                  } ${
                    user.online ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
              </div>
              <span className={`font-medium truncate ${
                theme === 'dark' ? 'text-indigo-100' : 'text-indigo-700'
              }`}>{user.name}</span>
              {user.id === 1 && (
                <span className="ml-auto px-2 py-0.5 text-xs rounded bg-primary-700 text-white">
                  Owner
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
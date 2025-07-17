import { useUser } from '../context/UserContext';

const mockUsers = [
  { id: 1, name: 'Alice', avatar: 'https://i.pravatar.cc/40?img=1', online: true },
  { id: 2, name: 'Bob', avatar: 'https://i.pravatar.cc/40?img=2', online: true },
  { id: 3, name: 'Charlie', avatar: 'https://i.pravatar.cc/40?img=3', online: false },
];

const Header = () => {
  const { logout } = useUser();
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gray-950/80 backdrop-blur shadow-lg rounded-b-2xl">
      <h2 className="text-xl font-bold text-white">Dashboard</h2>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {mockUsers.map(user => (
            <div key={user.id} className="relative">
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border-2 border-gray-700" />
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-950 ${user.online ? 'bg-green-500' : 'bg-gray-500'}`}></span>
            </div>
          ))}
        </div>
        <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Logout</button>
      </div>
    </header>
  );
};
export default Header;
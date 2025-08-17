import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar';
import RoomCard from '@components/RoomCard';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '@context/RoomContext';
import { useTheme } from '@context/ThemeContext';
import { useFileTree } from '@context/FileTreeContext';
import { useUser } from '@context/UserContext';
import { useSocket } from '@context/SocketProvider';
import { toast } from 'react-toastify';
import { ToastPrompt } from '@components/auth/ToastPrompt';
import { update } from 'lodash';

interface RoomMember {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface Room {
  id: string;
  name: string;
  createdBy: string;
  members: RoomMember[];
}

const DashboardHeader: React.FC<{
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onSidebarToggle: () => void;
  showSidebarToggle: boolean;
}> = ({ onCreateRoom, onJoinRoom, onSidebarToggle, showSidebarToggle }) => {
  const { theme } = useTheme();
  const {setFileTree} = useFileTree();
  useEffect(()=>{
    setFileTree([]);
  },[])
  return (
    <div className="grid grid-cols-1 max-sm:space-y-5 sm:grid-cols-2 items-center justify-between gap-4 px-4 pt-6 md:px-8 animate-fade-in w-full">
      <div className="flex items-center gap-2 ">
        {showSidebarToggle && (
          <button
            className={`inline-flex items-center justify-center p-2 rounded-lg shadow-lg focus:outline-none transition ${
              theme === 'dark' 
                ? 'bg-indigo-900 text-white hover:bg-indigo-700' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
            onClick={onSidebarToggle}
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <h1 className={`text-2xl sm:text-4xl font-bold tracking-tight drop-shadow ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Welcome to Your Dashboard
        </h1>
      </div>
      <div className="flex gap-2">
        <button
          className="bg-indigo-600 px-5 py-2 rounded-lg text-white font-semibold shadow hover:scale-105 hover:shadow-xl transition-all duration-200"
          onClick={onCreateRoom}
        >
          + Create Room
        </button>
        <button
          className="bg-purple-600 px-5 py-2 rounded-lg text-white font-semibold shadow hover:scale-105 hover:shadow-xl transition-all duration-200"
          onClick={onJoinRoom}
        >
          Join Room
        </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { joinRoom,joinedRooms,setJoinedRooms,leaveRoom } = useRoom();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGuest,setIsGuest] = useState<boolean>(false);
  const { user } = useUser();
  const socket = useSocket();
  const [loading, setLoading] = useState(false);
  const [name,setName] = useState<string>('');

  useEffect(()=>{
    setIsGuest(Boolean(localStorage.getItem('isGuestUser')));
  },[isGuest]);

  const handleRoomUpdate = useCallback(({ rooms }: { rooms: Room[] }) => {
    setJoinedRooms(rooms);
  }, []);

  const handleRoomLeave = (roomId:string)=>{
    leaveRoom(roomId);
    getRooms();
    toast.success("Room deleted successfully!");
  }

  // Fetch rooms function
  const getRooms = useCallback(async () => {
    if (!user?.email || !socket) return;
    
    try {
      setLoading(true);
      socket.emit('rooms:get', { email: user?.email });
    } catch (err) {
      toast.error("Error while loading rooms");
      console.error('Room fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.email, socket]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('rooms:fetched', handleRoomUpdate);
    socket.on('room:deleted',handleRoomLeave);
    socket.on('room:error', (err: { message: string }) => {
      toast.error(err.message);
    });

    return () => {
      socket.off('rooms:fetched', handleRoomUpdate);
      socket.off('room:deleted',handleRoomLeave);
      socket.off('room:error');
    };
  }, [socket, handleRoomUpdate]);

  // Initial fetch
  useEffect(() => {
    if (user?.email && user?.email !== 'Guest') {
      getRooms();
    }
  }, [user?.email, getRooms]);

  const showPrompt = (msg:string) => {
    return new Promise((resolve) => {
      const toastId = toast(
        <ToastPrompt
          message={msg}
          onSubmit={(value) => {
            toast.dismiss(toastId);
            resolve(value); // Resolve the promise with the new name
          }}
          onCancel={() => {
            toast.dismiss(toastId);
            resolve(null); // Resolve with null if canceled
          }}
        />,
        {
          position: 'top-center',
          autoClose: false,
          closeOnClick: false,
        }
      );
    });
  }

  const handleCreateRoom = useCallback(async() => {
    if(user?.email==='Guest'){
      toast.error('Guest users can only join room please click "Join Room" for joining "dummyroom"');
      return;
    }
    else{
      const newName = await showPrompt('Enter Room Name');
      if(newName)
        socket.emit('room:create',{email:user?.email,name:newName});
      else 
        socket.emit('room:create',{email:user?.email});
    }
  },[socket,user?.email]);

  const handleJoin = async ({roomId}:{roomId:string})=>{
    if(user){
      const newRoom:Room = {
        id:roomId,
        name:name,
        createdBy: user.email,
        members:[{
          userId:user.email,
          role:'owner'
        }]
      }
      joinRoom(newRoom);
      navigate(`/room/${roomId}`);
    }
  }

  useEffect(()=>{
    socket.on('room:created',handleJoin);
    return ()=>{socket.off('room:created',handleJoin)}
  },[socket])

  const handleJoinRoom = async () => {
    if(isGuest){
      navigate(`/room/ORJINDummyRoom`);
    }
    else{
      const roomId = await showPrompt("Enter RoomId");
      if(roomId){
        navigate(`/room/${roomId}`);
      }else{
        toast.error("Please enter a valid RoomId");
      }
    }
  };

  return (<>
    {loading ? <div className={`min-h-screen h-full w-full overflow-hidden flex flex-col font-sans transition-all duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-[#6a8dff]/60 via-[#b67cff]/60 to-[#f7f8fa]/60'
        : 'bg-gradient-to-br from-[#6a8dff]/20 via-[#b67cff]/20 to-[#f7f8fa]/20'
    }`}><h1>Loading</h1></div>:<div className={`min-h-screen h-full w-full overflow-hidden flex flex-col font-sans transition-all duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-[#6a8dff]/60 via-[#b67cff]/60 to-[#f7f8fa]/60'
        : 'bg-gradient-to-br from-[#6a8dff]/20 via-[#b67cff]/20 to-[#f7f8fa]/20'
    }`}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-40 top-0 left-0 h-full w-72 transform transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0 scale-100 opacity-100' : '-translate-x-full scale-95 opacity-0'
        } ${
          theme === 'dark' 
            ? 'bg-white/10 backdrop-blur-lg border-r border-white/20' 
            : 'bg-white/80 backdrop-blur-lg border-r border-gray-200'
        } shadow-2xl rounded-r-2xl`}
        aria-label="Sidebar"
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      <main className="flex-1 flex flex-col w-full h-full">
        <DashboardHeader
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onSidebarToggle={() => setSidebarOpen((open) => !open)}
          showSidebarToggle={true}
        />
        <div className="flex-1 flex flex-col justify-center w-full h-full px-6 sm:px-10 lg:px-16 pb-8">
        <section className="flex flex-wrap gap-10 items-start justify-start sm:justify-center w-full h-full mt-10">
        {joinedRooms.length==0?<div
                className={`backdrop-blur-lg max-w-[98%] border shadow-xl rounded-2xl p-8 flex flex-col gap-4 transition-transform duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-1 animate-fade-in group cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/60 border-gray-200'
                }`}
              >
                <p>No Rooms Joined</p>
              </div> :joinedRooms.map((room:Room, idx) => (
              <div
                key={idx}
                className={`backdrop-blur-lg max-w-[98%] border shadow-xl rounded-2xl p-8 flex flex-col gap-4 transition-transform duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-1 animate-fade-in group cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/60 border-gray-200'
                }`}
              >
                <RoomCard {...room} index={idx} />
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>}
    </>
  );
};

export default Dashboard;
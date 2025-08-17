import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../context/UserContext.tsx';
import { useRoom } from '../../context/RoomContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '@context/SocketProvider';
import { toast } from 'react-toastify';
import FileEditor from '../../components/FileEditor';
import CanvasBoard from '../../components/CanvasBoard';
import Preview from '@components/Preview.tsx';

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

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useUser();
  const { joinRoom, joinedRooms } = useRoom();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<'files' | 'canvas' | 'preview'>('files');
  const [roomData, setRoomData] = useState<Room | null>(null);
  const socket = useSocket();

  const hasJoinedRef = useRef(false);

  const handleInvite = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      toast.success(`RoomId : ${roomId} copied to clipboard!`);
    }
  };

  const handleError = ({message}:{message:string})=>{
    toast.error(message);
  }

  useEffect(()=>{
    if(!user) return;
    socket.emit("room:join", { roomId: roomId,isAnonymous:user.isAnonymous, email: user.email });
    return () => {
      socket.emit("room:leave", { roomId });
    };
  },[roomId,user])

  useEffect(() => {
    if(!user) return;
    if (!roomId || hasJoinedRef.current) return;
    if (roomId === "ORJINDummyRoom") {
      if (!joinedRooms.find(room => room.id === "ORJINDummyRoom")){ 
        const dummyRoom: Room = {
        id: "ORJINDummyRoom",
        name: "ORJINDummyRoom",
        members: [],
        createdBy: "ORJIN"
        };
        setRoomData(dummyRoom);
        joinRoom(dummyRoom);
      }
      hasJoinedRef.current = true;
    }

    const handleRoomJoined = ({ roomData, member }: { roomData: Room, member: RoomMember }) => {
      // console.log("here is member & roomData: ",member);
      toast.success(`${member.userId} Successfully Joined room`);
      if(user.isAnonymous) return;//if guest return
      setRoomData(roomData);
      if (!joinedRooms.find(room => room.id === roomData.id)) joinRoom(roomData);
      hasJoinedRef.current = true;
    };

    const handleRoomError = (payload: { message: string }) => {
      toast.error(payload.message);
      navigate('/');
    };

    socket.on("room:joined", handleRoomJoined);
    socket.on("room:error", handleRoomError);
    socket.on("file:error",handleError);
    return () => {
      socket.off("room:joined", handleRoomJoined);
      socket.off("room:error", handleRoomError);
      socket.off("file:error",handleError);
    };
  }, [roomId, socket, user?.email, joinRoom]);

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${
      theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Main content */}
      <main className="flex-grow w-full">
        <div className="grid grid-cols-1 max-lg:grid-rows-6 gap-0 lg:grid-cols-5 w-full">
          <aside className={`w-full lg:pt-50 max-lg:h-20 ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'
          } flex max-lg:w-full lg:col-span-1 max-lg:justify-around lg:flex-col items-center lg:space-y-4`}>
            <button onClick={() => setActiveTab('files')} className={`w-[100px] btn transition-colors rounded-lg px-5 py-2 cursor-pointer ${activeTab === 'files' ? 'active btn-primary' : 'btn-secondary'}`}>Files</button>
            <button onClick={() => setActiveTab('canvas')} className={`w-[100px] btn transition-colors rounded-lg px-5 py-2 cursor-pointer ${activeTab === 'canvas' ? 'active btn-primary' : 'btn-secondary'}`}>Canvas</button>
            <button onClick={() => setActiveTab('preview')} className={`w-[100px] btn transition-colors rounded-lg px-5 py-2 cursor-pointer ${activeTab === 'preview' ? 'active btn-primary' : 'btn-secondary'}`}>Preview</button>
          </aside>
          <section className="w-full h-full max-lg:row-span-5 lg:col-span-4 flex-1 flex flex-col">
            <header className={`flex justify-between items-center p-4 ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
            } shadow`}>
              <h1 className="text-xl font-bold text-primary-500">Room: {roomData?.name}</h1>
              <div className="flex gap-2">
                {roomData?.members.find(member => member.userId === user?.email)?.role === "owner" && (
                  <button onClick={handleInvite} className="btn btn-primary">Invite</button>
                )}
              </div>
            </header>
            <div className="flex-1 overflow-hidden w-full">
              {activeTab === 'files' && <FileEditor />}
              {activeTab === 'canvas' && <CanvasBoard />}
              {activeTab === 'preview' && <Preview/>}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Room;

import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useRoom } from '../../context/RoomContext';
import React from 'react';
import FileEditor from '../../components/FileEditor';
import CanvasBoard from '../../components/CanvasBoard';
import LivePreview from '../../components/LivePreview';
import { useSocket } from '@context/SocketProvider';

// const FileEditor = () => <div>File Editor Placeholder</div>;
// const CanvasBoard = () => <div>Canvas Board Placeholder</div>;
// const LivePreview = () => <div>Live Preview Placeholder</div>;

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { logout } = useUser();
  const { joinRoom } = useRoom();
  const [activeTab, setActiveTab] = useState<'files' | 'canvas' | 'preview'>('files');
  const socket = useSocket();
  const hasJoinedRef = useRef(false);

  React.useEffect(() => {
    if (!roomId || hasJoinedRef.current) return;

    socket.emit("room:join", roomId);
    joinRoom(roomId);
    hasJoinedRef.current = true;
  }, [roomId, socket, joinRoom]);


  return (
    <div className="grid grid-cols-1 max-lg:grid-rows-6 gap-0 lg:grid-cols-5 w-full">
      <aside className="w-full lg:pt-50 max-lg:h-20 bg-gray-900 flex max-lg:w-full lg:col-span-1 max-lg:justify-around lg:flex-col items-center lg:space-y-4 ">
        <button onClick={() => setActiveTab('files')} className={`w-[100px] btn transition-colors rounded-lg px-5 py-2 cursor-pointer  ${activeTab === 'files' ? 'active btn-primary' : 'btn-secondary'}`}>Files</button>
        <button onClick={() => setActiveTab('canvas')} className={`w-[100px] btn transition-colors rounded-lg px-5 py-2 cursor-pointer  ${activeTab === 'canvas' ? 'active btn-primary' : 'btn-secondary'}`}>Canvas</button>
        <button onClick={() => setActiveTab('preview')} className={`w-[100px] btn transition-colors rounded-lg px-5 py-2 cursor-pointer  ${activeTab === 'preview' ? 'active btn-primary' : 'btn-secondary'}`}>Preview</button>
      </aside>
      <main className="w-full h-full max-lg:row-span-5 lg:col-span-4 flex-1 flex flex-col">
        <header className="flex justify-between items-center p-4 bg-gray-900 shadow">
          <h1 className="text-xl font-bold text-primary-500">Room: {roomId}</h1>
          <button onClick={logout} className="btn btn-logout text-gray-300">Logout</button>
        </header>
        <section className="flex-1 overflow-hidden w-full">
          {activeTab === 'files' && <FileEditor />}
          {activeTab === 'canvas' && <CanvasBoard />}
          {activeTab === 'preview' && <LivePreview html = {"<html><body><h1 id='heading'>Hello World</h1></body></html>"}  css={"*{background-color:black;color:white;}"} js={"document.getElementById('heading').style.border='1px solid red;'"} />}
        </section>
      </main>
    </div>
  );
};

export default Room;
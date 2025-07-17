// SocketWrapper.tsx
import { useParams } from 'react-router-dom';
import { SocketProvider } from '../context/SocketProvider.tsx';
import Room from '../pages/Room/Room.tsx';

const SocketWrapper = () => {
  const { roomId } = useParams();

  if (!roomId) return <div>Invalid Room ID</div>;

  return (
    <SocketProvider roomId={roomId}>
      <Room />
    </SocketProvider>
  );
};

export default SocketWrapper;

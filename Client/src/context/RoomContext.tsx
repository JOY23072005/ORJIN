import { createContext, useContext, useState } from 'react';
import type {ReactNode} from "react";

interface RoomContextType {
  currentRoomId: string | null;
  setCurrentRoomId: (id: string) => void;
  joinedRooms: string[];
  joinRoom: (id: string) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);

  const joinRoom = (id: string) => {
    if (!joinedRooms.includes(id)) {
      setJoinedRooms([...joinedRooms, id]);
    }
    setCurrentRoomId(id);
  };

  return (
    <RoomContext.Provider value={{ currentRoomId, setCurrentRoomId, joinedRooms, joinRoom }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};
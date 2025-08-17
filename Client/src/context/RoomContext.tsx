import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from "react";

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

interface RoomContextType {
  currentRoomId: string | null;
  joinedRooms: Room[];
  joinRoom: (room: Room) => void;
  setJoinedRooms:(rooms:Room[])=>void;
  leaveRoom: (roomId: string) => void;
  getRoomById: (roomId: string) => Room | undefined;
  getUserRole: (roomId: string, userId: string) => RoomMember['role'] | null;
  updateRoom: (updatedRoom: Room) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([]);

  const joinRoom = useCallback((room: Room) => {
    setJoinedRooms(prevRooms => {
      const exists = prevRooms.some(r => r.id === room.id);
      return exists ? prevRooms : [...prevRooms, room];
    });
    setCurrentRoomId(room.id);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    setJoinedRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
    if (currentRoomId === roomId) {
      setCurrentRoomId(null);
    }
  }, [currentRoomId]);

  const getRoomById = useCallback((roomId: string) => {
    return joinedRooms.find(room => room.id === roomId);
  }, [joinedRooms]);

  const getUserRole = useCallback((roomId: string, userId: string) => {
    const room = getRoomById(roomId);
    console.log("getRole called",joinedRooms);
    return room?.members.find(member => member.userId === userId)?.role || null;
  }, [getRoomById]);

  const updateRoom = useCallback((updatedRoom: Room) => {
    setJoinedRooms(prevRooms =>
      prevRooms.map(room => room.id === updatedRoom.id ? updatedRoom : room)
    );
  }, []);

  return (
    <RoomContext.Provider value={{
      currentRoomId,
      joinedRooms,
      setJoinedRooms,
      joinRoom,
      leaveRoom,
      getRoomById,
      getUserRole,
      updateRoom
    }}>
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
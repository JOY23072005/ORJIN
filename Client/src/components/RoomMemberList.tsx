import React from "react";
import { useRoom } from "../context/RoomContext";
import { useTheme } from "../context/ThemeContext";
import * as monaco from 'monaco-editor';
import { useParams } from "react-router-dom";

interface RemoteCursor {
  id: string;
  name: string;
  color: string;
  position: monaco.Position | null;
}

interface RoomMembersListProps {
  cursors: RemoteCursor[];
}

const RoomMembersList: React.FC<RoomMembersListProps> = ({ cursors }) => {
  const { roomId } = useParams();
  const { getRoomById } = useRoom();
  const { theme } = useTheme();

  if (!roomId) {
    return <p className="text-gray-500 italic">No room joined</p>;
  }

  const room = getRoomById(roomId);
  if (!room) {
    return <p className="text-gray-500 italic">Room not found</p>;
  }

  // Active user IDs from cursors
  const activeIds = new Set(cursors.map(c => c.name));

  return (
    <div className="p-3 border rounded-lg bg-white dark:bg-secondary-800 shadow">
      <h2
        className={`text-lg font-semibold mb-2 ${
          theme === "dark" ? "text-primary-400" : "text-primary-600"
        }`}
      >
        Room Members
      </h2>
      <ul className="space-y-1">
        {room.members.map(member => {
          const cursorData = cursors.find(c => c.name=== member.userId);
          const isActive = activeIds.has(member.userId);
          return (
            <li
              key={member.userId}
              className={`flex items-center gap-2 p-1 rounded ${
                isActive ? "" : "opacity-50"
              }`}
            >
              {/* Cursor color indicator */}
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: cursorData?.color || "#ccc",
                }}
              ></span>

              {/* Name */}
              <span
                className={`font-medium ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
                title={member.userId}
              >
                {cursorData?.name || `User-${member.userId.slice(0, 4)}...`}
              </span>

              {/* Role */}
              <span className="text-xs text-gray-500">
                ({member.role})
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RoomMembersList;

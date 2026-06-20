import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      socket?.disconnect();
      setSocket(null);
      return;
    }

    const s = io('/', {
      auth: { token: localStorage.getItem('accessToken') },
      transports: ['websocket', 'polling'],
    });

    s.on('notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    setSocket(s);
    return () => s.disconnect();
  }, [user]);

  const joinConversation = useCallback((id) => {
    socket?.emit('join_conversation', id);
  }, [socket]);

  const leaveConversation = useCallback((id) => {
    socket?.emit('leave_conversation', id);
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, notifications, joinConversation, leaveConversation }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

let socketInstance = null;

export const useSocket = () => {
  const { token, user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (!token || !user) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      return;
    }

    if (socketInstance?.connected) return;

    socketInstance = io('/', {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => console.log('🔌 Socket connected'));
    socketInstance.on('disconnect', () => console.log('🔌 Socket disconnected'));
    socketInstance.on('connect_error', (err) => console.log('Socket error:', err.message));

    return () => {
      // Don't disconnect on unmount of individual components
      // Socket lives for the session
    };
  }, [token, user]);

  return socketInstance;
};

export const getSocket = () => socketInstance;

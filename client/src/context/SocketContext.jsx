import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { accessToken } = useAuth();
  const [signalingSocket, setSignalingSocket] = useState(null);
  const [vitalsSocket, setVitalsSocket] = useState(null);

  useEffect(() => {
    if (!accessToken) {
      if (signalingSocket) signalingSocket.disconnect();
      if (vitalsSocket) vitalsSocket.disconnect();
      return;
    }

    // Connect to WebRTC Signaling Service (port 5002)
    const sSocket = io('http://localhost:5002', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling']
    });

    sSocket.on('connect', () => {
      console.log('[CLIENT] Connected to Signaling Socket');
    });

    sSocket.on('connect_error', (err) => {
      console.warn('[CLIENT] Signaling socket error:', err.message);
    });

    setSignalingSocket(sSocket);

    // Connect to Vitals Telemetry Service (port 5004)
    const vSocket = io('http://localhost:5004', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling']
    });

    vSocket.on('connect', () => {
      console.log('[CLIENT] Connected to Vitals Socket');
    });

    setVitalsSocket(vSocket);

    return () => {
      sSocket.disconnect();
      vSocket.disconnect();
    };
  }, [accessToken]);

  return (
    <SocketContext.Provider value={{ signalingSocket, vitalsSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

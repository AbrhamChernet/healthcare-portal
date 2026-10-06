import { verifyRoomAuthorization } from '../middleware/socketAuth.js';
import Appointment from '../models/Appointment.js';

export const registerSignalingHandlers = (io) => {
  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[SIGNALING] Socket connected: ${socket.id} (User: ${user.name} / ${user.role})`);

    // Join Consultation Room (with ACL & Waiting Room Logic)
    socket.on('join-room', async ({ roomId }, callback) => {
      try {
        const authCheck = await verifyRoomAuthorization(user.id, user.role, roomId);
        if (!authCheck.authorized) {
          if (callback) callback({ error: authCheck.error });
          return socket.emit('error-notification', { message: authCheck.error });
        }

        const { appointment, roleInCall } = authCheck;
        socket.join(roomId);
        socket.currentRoom = roomId;
        socket.roleInCall = roleInCall;

        console.log(`[SIGNALING] User ${user.name} joined room ${roomId} as ${roleInCall}`);

        // Patient Waiting Room Logic
        if (roleInCall === 'PATIENT') {
          if (appointment.status !== 'IN_CONSULTATION') {
            appointment.status = 'WAITING_ROOM';
            appointment.patientJoinedWaitingRoomAt = new Date();
            await appointment.save();

            // Notify Doctor that patient is waiting in the lobby
            io.to(roomId).emit('patient-in-waiting-room', {
              patientId: user.id,
              patientName: user.name,
              joinedAt: appointment.patientJoinedWaitingRoomAt
            });

            if (callback) {
              callback({
                status: 'WAITING_ROOM',
                message: 'You are in the waiting room. The doctor will admit you shortly.',
                appointment
              });
            }
            return;
          }
        }

        // Doctor joins or Patient already admitted
        if (roleInCall === 'DOCTOR') {
          // Check if patient is currently in waiting room
          const isPatientWaiting = appointment.status === 'WAITING_ROOM';
          if (callback) {
            callback({
              status: appointment.status,
              isPatientWaiting,
              patientName: appointment.patientName,
              appointment
            });
          }
          // Notify room that doctor is ready
          socket.to(roomId).emit('doctor-ready', { doctorName: user.name });
          return;
        }

        // Admitted Patient
        if (callback) {
          callback({
            status: appointment.status,
            appointment
          });
        }
      } catch (err) {
        console.error('[SIGNALING] join-room error:', err);
        if (callback) callback({ error: 'Server error joining room' });
      }
    });

    // Doctor Admits Patient from Waiting Room
    socket.on('admit-patient', async ({ roomId }, callback) => {
      try {
        if (socket.roleInCall !== 'DOCTOR' && socket.user.role !== 'ADMIN') {
          return socket.emit('error-notification', { message: 'Only doctor can admit patients.' });
        }

        const appointment = await Appointment.findOne({ roomId });
        if (!appointment) return;

        appointment.status = 'IN_CONSULTATION';
        appointment.doctorAdmittedPatientAt = new Date();
        await appointment.save();

        console.log(`[SIGNALING] Doctor admitted patient into consultation ${roomId}`);

        // Broadcast to patient in room
        io.to(roomId).emit('patient-admitted', {
          admittedAt: appointment.doctorAdmittedPatientAt,
          appointment
        });

        if (callback) callback({ success: true, appointment });
      } catch (err) {
        console.error('[SIGNALING] admit-patient error:', err);
        if (callback) callback({ error: err.message });
      }
    });

    // E2EE ECDH Public Key Exchange
    socket.on('ecdh-public-key', ({ roomId, publicKeyJwk }) => {
      // Forward the public key to the other participant in the room
      socket.to(roomId).emit('peer-ecdh-public-key', {
        fromUserId: socket.user.id,
        fromRole: socket.roleInCall,
        publicKeyJwk
      });
      console.log(`[SIGNALING] ECDH Public Key relayed for room ${roomId} from ${socket.user.name}`);
    });

    // WebRTC Offer
    socket.on('webrtc-offer', ({ roomId, offer }) => {
      socket.to(roomId).emit('webrtc-offer', {
        offer,
        fromUserId: socket.user.id
      });
    });

    // WebRTC Answer
    socket.on('webrtc-answer', ({ roomId, answer }) => {
      socket.to(roomId).emit('webrtc-answer', {
        answer,
        fromUserId: socket.user.id
      });
    });

    // WebRTC ICE Candidate
    socket.on('ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('ice-candidate', {
        candidate,
        fromUserId: socket.user.id
      });
    });

    // In-Call Encrypted Chat Message Relay (Backup for data-channel)
    socket.on('e2ee-message', ({ roomId, encryptedPayload, iv, authTag, timestamp }) => {
      socket.to(roomId).emit('e2ee-message', {
        senderId: socket.user.id,
        senderName: socket.user.name,
        encryptedPayload,
        iv,
        authTag,
        timestamp: timestamp || new Date().toISOString()
      });
    });

    // End Consultation
    socket.on('end-consultation', async ({ roomId }, callback) => {
      try {
        const appointment = await Appointment.findOne({ roomId });
        if (appointment) {
          appointment.status = 'COMPLETED';
          appointment.completedAt = new Date();
          await appointment.save();
        }

        io.to(roomId).emit('consultation-ended', { completedAt: new Date() });
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[SIGNALING] Socket disconnected: ${socket.id}`);
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('peer-disconnected', {
          userId: socket.user?.id,
          name: socket.user?.name,
          role: socket.roleInCall
        });
      }
    });
  });
};

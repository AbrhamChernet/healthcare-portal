import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff,
  MessageSquare, Activity, FilePlus, ShieldCheck, Users,
  Sparkles, Lock, Maximize2, Radio
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import KeyFingerprint from './KeyFingerprint';
import E2EEChat from './E2EEChat';
import InCallVitals from './InCallVitals';
import DeviceTestModal from '../PreCall/DeviceTestModal';
import WaitingRoom from './WaitingRoom';
import {
  generateECDHKeyPair,
  exportPublicKey,
  importPeerPublicKey,
  deriveSharedKey,
  computeSafetyFingerprint
} from '../../utils/crypto';

export default function VideoRoom({ roomId, onLeave, onOpenNewEHR }) {
  const { signalingSocket, vitalsSocket } = useSocket();
  const { user, authFetch } = useAuth();
  const { t, lang } = useLanguage();

  const [appointment, setAppointment] = useState(null);
  const [callStatus, setCallStatus] = useState('DEVICE_CHECK');
  const [isPatientWaiting, setIsPatientWaiting] = useState(false);

  // Audio / Video media state
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // E2EE crypto state
  const [ecdhKeyPair, setEcdhKeyPair] = useState(null);
  const [aesKey, setAesKey] = useState(null);
  const [safetyFingerprint, setSafetyFingerprint] = useState(null);

  // UI Drawers
  const [showChat, setShowChat] = useState(false);
  const [showVitalsOverlay, setShowVitalsOverlay] = useState(true);
  const [latestVital, setLatestVital] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const isDoctor = user?.role === 'DOCTOR' || user?.role === 'ADMIN';

  // Call timer
  useEffect(() => {
    let interval = null;
    if (callStatus === 'CONNECTED') {
      interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. Fetch Room / Appointment details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await authFetch(`/api/consultations/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setAppointment(data);
        }
      } catch (err) {
        console.error('Failed to load room details:', err);
      }
    };
    fetchRoom();
  }, [roomId]);

  // 2. Subscribe to patient vitals stream
  useEffect(() => {
    if (!vitalsSocket || !appointment) return;
    const targetPatientId = appointment.patientId;

    vitalsSocket.emit('subscribe-patient-vitals', { patientId: targetPatientId });

    const handleVitalUpdate = (data) => {
      setLatestVital(data);
    };

    vitalsSocket.on('live-vital-update', handleVitalUpdate);

    return () => {
      vitalsSocket.emit('unsubscribe-patient-vitals', { patientId: targetPatientId });
      vitalsSocket.off('live-vital-update', handleVitalUpdate);
    };
  }, [vitalsSocket, appointment]);

  // 3. Initiate WebRTC & Signaling once device check passes
  const handleProceedFromDeviceCheck = async () => {
    try {
      const keyPair = await generateECDHKeyPair();
      setEcdhKeyPair(keyPair);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      signalingSocket.emit('join-room', { roomId }, (response) => {
        if (response.error) {
          alert('Room Access Denied: ' + response.error);
          onLeave();
          return;
        }

        if (response.status === 'WAITING_ROOM') {
          setCallStatus('WAITING_ROOM');
        } else if (response.status === 'IN_CONSULTATION') {
          setCallStatus('CONNECTING');
          initiatePeerConnection(keyPair, stream);
        } else {
          if (response.isPatientWaiting) {
            setIsPatientWaiting(true);
          }
          setCallStatus('WAITING_ROOM');
        }
      });
    } catch (err) {
      console.error('Error starting media in room:', err);
    }
  };

  // 4. Peer Connection & Signaling Setup
  const initiatePeerConnection = async (keyPair, stream) => {
    try {
      let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
      try {
        const turnRes = await authFetch('/api/consultations/turn-credentials');
        if (turnRes.ok) {
          const creds = await turnRes.json();
          if (creds.iceServers) iceServers = creds.iceServers;
        }
      } catch (e) {
        console.warn('Using fallback STUN servers:', e);
      }

      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setCallStatus('CONNECTED');
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signalingSocket.emit('ice-candidate', { roomId, candidate: event.candidate });
        }
      };

      const myPublicKeyJwk = await exportPublicKey(keyPair.publicKey);
      signalingSocket.emit('ecdh-public-key', { roomId, publicKeyJwk: myPublicKeyJwk });

      if (isDoctor) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        signalingSocket.emit('webrtc-offer', { roomId, offer });
      }
    } catch (err) {
      console.error('Error initializing peer connection:', err);
    }
  };

  // 5. Signaling Socket Event Listeners
  useEffect(() => {
    if (!signalingSocket) return;

    signalingSocket.on('patient-in-waiting-room', ({ patientName }) => {
      setIsPatientWaiting(true);
    });

    signalingSocket.on('patient-admitted', () => {
      setCallStatus('CONNECTING');
      if (ecdhKeyPair && localStream) {
        initiatePeerConnection(ecdhKeyPair, localStream);
      }
    });

    signalingSocket.on('webrtc-offer', async ({ offer }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        signalingSocket.emit('webrtc-answer', { roomId, answer });
      }
    });

    signalingSocket.on('webrtc-answer', async ({ answer }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    signalingSocket.on('ice-candidate', async ({ candidate }) => {
      const pc = peerConnectionRef.current;
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error adding ICE candidate:', e);
        }
      }
    });

    signalingSocket.on('peer-ecdh-public-key', async ({ publicKeyJwk }) => {
      try {
        if (!ecdhKeyPair) return;
        const peerKey = await importPeerPublicKey(publicKeyJwk);
        const derivedKey = await deriveSharedKey(ecdhKeyPair.privateKey, peerKey);
        setAesKey(derivedKey);

        const myJwk = await exportPublicKey(ecdhKeyPair.publicKey);
        const fingerprint = await computeSafetyFingerprint(myJwk, publicKeyJwk);
        setSafetyFingerprint(fingerprint);
      } catch (err) {
        console.error('Error establishing E2EE key agreement:', err);
      }
    });

    signalingSocket.on('consultation-ended', () => {
      setCallStatus('ENDED');
    });

    return () => {
      signalingSocket.off('patient-in-waiting-room');
      signalingSocket.off('patient-admitted');
      signalingSocket.off('webrtc-offer');
      signalingSocket.off('webrtc-answer');
      signalingSocket.off('ice-candidate');
      signalingSocket.off('peer-ecdh-public-key');
      signalingSocket.off('consultation-ended');
    };
  }, [signalingSocket, ecdhKeyPair, localStream, isDoctor, roomId]);

  // Doctor Admits Patient
  const handleAdmitPatient = () => {
    signalingSocket.emit('admit-patient', { roomId }, (res) => {
      if (res?.success) {
        setIsPatientWaiting(false);
        setCallStatus('CONNECTING');
        if (ecdhKeyPair && localStream) {
          initiatePeerConnection(ecdhKeyPair, localStream);
        }
      }
    });
  };

  // Media Controls
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const pc = peerConnectionRef.current;
        if (pc) {
          const sender = pc.getSenders().find((s) => s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        }
        screenTrack.onended = () => {
          stopScreenSharing();
        };
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen share error:', err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = () => {
    if (localStream && peerConnectionRef.current) {
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find((s) => s.track.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    }
    setIsScreenSharing(false);
  };

  const handleEndCall = () => {
    signalingSocket.emit('end-consultation', { roomId });
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    setCallStatus('ENDED');
  };

  // Device check modal view
  if (callStatus === 'DEVICE_CHECK') {
    return (
      <DeviceTestModal
        isOpen={true}
        onClose={onLeave}
        onProceed={handleProceedFromDeviceCheck}
      />
    );
  }

  // Waiting room view
  if (callStatus === 'WAITING_ROOM') {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between text-white border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
            <h1 className="font-bold text-lg">{t('consultationRoomHeader')}</h1>
          </div>
          <button onClick={onLeave} className="text-slate-400 hover:text-white text-sm font-semibold">
            {t('exit')}
          </button>
        </div>

        <WaitingRoom
          isDoctor={isDoctor}
          patientName={appointment?.patientName}
          doctorName={appointment?.doctorName}
          isPatientWaiting={isPatientWaiting}
          onAdmitPatient={handleAdmitPatient}
        />

        <div className="text-center text-slate-500 text-xs">
          {t('protectedSessionFooter')} {roomId}
        </div>
      </div>
    );
  }

  if (callStatus === 'ENDED') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-orange-500/20 text-orange-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">{t('sessionFinishedTitle')}</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            {t('sessionDurationLabel')} <strong>{formatTimer(callDuration)}</strong>. {t('memoryPurgedNotice')}
          </p>
          <div className="space-y-2.5 pt-2">
            {isDoctor && (
              <button
                onClick={() => {
                  onLeave();
                  if (onOpenNewEHR) onOpenNewEHR(appointment);
                }}
                className="w-full py-3 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-orange-500/25"
              >
                {t('documentEhrBtn')}
              </button>
            )}
            <button
              onClick={onLeave}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition-all border border-slate-700"
            >
              {t('returnDashboard')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Video Room
  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden select-none">
      <div className="flex-1 flex flex-col">
        {/* Cinema-Grade Top Header Bar */}
        <div className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
            <div>
              <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                <span>{appointment?.doctorName} & {appointment?.patientName}</span>
                <span className="text-[10px] font-mono text-orange-400 bg-orange-950 px-2.5 py-0.5 rounded-full border border-orange-800">
                  {formatTimer(callDuration)}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowVitalsOverlay(!showVitalsOverlay)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showVitalsOverlay
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> {t('liveHudBtn')}
            </button>

            <button
              onClick={() => setShowChat(!showChat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showChat
                  ? 'bg-orange-950/80 text-orange-300 border border-orange-800 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> {t('chatBtn')}
            </button>

            {isDoctor && (
              <button
                onClick={() => onOpenNewEHR && onOpenNewEHR(appointment)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/25"
              >
                <FilePlus className="w-3.5 h-3.5" /> {t('documentEhrBtn')}
              </button>
            )}
          </div>
        </div>

        {/* E2EE Fingerprint Banner */}
        <div className="px-6 py-2 bg-slate-900/40 border-b border-slate-800/60 backdrop-blur-sm z-10">
          <KeyFingerprint fingerprint={safetyFingerprint} />
        </div>

        {/* Video Canvas Area */}
        <div className="flex-1 relative p-4 flex items-center justify-center overflow-hidden bg-radial from-slate-900 to-slate-950">
          {/* Main Remote Video */}
          <div className="w-full h-full relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteStream && (
              <div className="text-slate-400 text-center space-y-3 z-10 p-6">
                <div className="w-16 h-16 rounded-3xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto shadow-xl shadow-orange-500/10">
                  <Users className="w-8 h-8 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-white">{t('connectingPeer')}</p>
                <p className="text-xs text-slate-500">
                  {lang === 'am' ? 'የተጠበቀ የቪዲዮ መስመር በመመስረት ላይ...' : 'Securing private consultation channel...'}
                </p>
              </div>
            )}

            {/* Self-View PiP */}
            <div className="absolute top-4 right-4 w-52 aspect-video rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700/80 shadow-2xl z-20 transition-all hover:scale-105">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              <span className="absolute bottom-1.5 left-2 text-[10px] font-bold bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-lg text-slate-300">
                {lang === 'am' ? 'እርስዎ' : 'You'} ({user?.name?.split(' ')[0]})
              </span>
            </div>

            {/* Live In-Call Vitals Telemetry HUD Overlay */}
            {showVitalsOverlay && (
              <div className="absolute bottom-4 left-4 max-w-sm w-full z-20">
                <InCallVitals latestVital={latestVital} />
              </div>
            )}
          </div>
        </div>

        {/* Floating Glassmorphic Control Dock */}
        <div className="h-20 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 flex items-center justify-center gap-4 px-6 z-20">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-2xl transition-all shadow-md ${
              isMuted
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80'
            }`}
            title={isMuted ? (lang === 'am' ? 'ድምፅ ክፈት' : 'Unmute Mic') : (lang === 'am' ? 'ድምፅ ዝጋ' : 'Mute Mic')}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-2xl transition-all shadow-md ${
              isVideoOff
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80'
            }`}
            title={isVideoOff ? (lang === 'am' ? 'ካሜራ ክፈት' : 'Enable Camera') : (lang === 'am' ? 'ካሜራ ዝጋ' : 'Disable Camera')}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-2xl transition-all shadow-md ${
              isScreenSharing
                ? 'bg-orange-600 text-white shadow-orange-600/30'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80'
            }`}
            title={lang === 'am' ? 'ስክሪን አጋራ' : 'Toggle Screen Share'}
          >
            <ScreenShare className="w-5 h-5" />
          </button>

          <div className="h-8 w-px bg-slate-800 mx-1" />

          <button
            onClick={handleEndCall}
            className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-xl shadow-rose-600/30 flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" /> {t('endCallBtn')}
          </button>
        </div>
      </div>

      {/* In-Call E2EE Chat Drawer */}
      {showChat && (
        <E2EEChat
          socket={signalingSocket}
          roomId={roomId}
          currentUser={user}
          aesKey={aesKey}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoRoom from '../components/VideoCall/VideoRoom';
import NewEHRModal from '../components/EHR/NewEHRModal';
import { useAuth } from '../context/AuthContext';

export default function ConsultationRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ehrModalOpen, setEhrModalOpen] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);

  const handleLeave = () => {
    if (user?.role === 'DOCTOR') {
      navigate('/doctor');
    } else {
      navigate('/patient');
    }
  };

  const handleOpenEHR = (appointment) => {
    setActiveAppointment(appointment);
    setEhrModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <VideoRoom
        roomId={roomId}
        onLeave={handleLeave}
        onOpenNewEHR={handleOpenEHR}
      />

      {ehrModalOpen && (
        <NewEHRModal
          isOpen={ehrModalOpen}
          onClose={() => setEhrModalOpen(false)}
          defaultPatient={activeAppointment ? {
            patientId: activeAppointment.patientId,
            name: activeAppointment.patientName
          } : null}
          onRecordCreated={() => {
            alert('Clinical record securely logged to patient EHR.');
            setEhrModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

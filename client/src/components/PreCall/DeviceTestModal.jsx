import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Volume2, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function DeviceTestModal({ isOpen, onClose, onProceed }) {
  const { t, lang } = useLanguage();
  const [stream, setStream] = useState(null);
  const [micLevel, setMicLevel] = useState(0);
  const [speakerTested, setSpeakerTested] = useState(false);
  const [cameraOk, setCameraOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let localStream = null;

    const startMedia = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        setStream(localStream);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }
        setCameraOk(true);

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(localStream);
        source.connect(analyser);
        analyser.fftSize = 256;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(checkAudioLevel);
        };
        checkAudioLevel();
      } catch (err) {
        console.error('Device check error:', err);
        setErrorMsg(t('permissionNotice'));
      }
    };

    startMedia();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, lang]);

  const testSpeaker = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
      setSpeakerTested(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{t('deviceCheckTitle')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('deviceCheckSub')}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-amber-800 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Video Preview */}
        <div className="mt-5 relative bg-slate-950 rounded-2xl overflow-hidden aspect-video flex items-center justify-center shadow-inner border border-slate-800">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          {!cameraOk && !errorMsg && (
            <div className="text-slate-400 text-xs animate-pulse flex items-center gap-2">
              <Camera className="w-5 h-5" /> {t('startingCamera')}
            </div>
          )}
          {cameraOk && (
            <div className="absolute top-3 left-3 bg-orange-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('cameraActive')}
            </div>
          )}
        </div>

        {/* Audio Diagnostics */}
        <div className="mt-5 space-y-4">
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5 font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-orange-500" /> {t('micLevel')}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {micLevel > 15 ? t('micSpeaking') : t('micSilent')}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 rounded-full ${
                  micLevel > 60 ? 'bg-amber-500' : 'bg-orange-500'
                }`}
                style={{ width: `${micLevel}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
              <Volume2 className="w-4 h-4 text-orange-500" />
              <span>{t('speakerTest')}</span>
            </div>
            <button
              onClick={testSpeaker}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                speakerTested
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xs'
              }`}
            >
              {speakerTested ? t('chimeTested') : t('playChime')}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => {
              if (stream) stream.getTracks().forEach(t => t.stop());
              onProceed();
            }}
            className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-md shadow-orange-500/25 transition-all"
          >
            {t('proceedToRoom')}
          </button>
        </div>
      </div>
    </div>
  );
}

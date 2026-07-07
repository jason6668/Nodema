import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff } from 'lucide-react';

interface CameraStreamProps {
  isEnabled: boolean;
  isMuted: boolean;
  userName: string;
  avatarUrl: string;
}

export default function CameraStream({ isEnabled, isMuted, userName, avatarUrl }: CameraStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      if (!isEnabled) {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
        return;
      }

      try {
        setError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 320, facingMode: 'user' },
          audio: true,
        });
        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Apply mute settings to tracks
        mediaStream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted;
        });
      } catch (err) {
        console.warn('Media devices not accessible or permission denied:', err);
        setError('无法访问摄像头/麦克风 (使用头像占位)');
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isEnabled]);

  // Handle mute change dynamically
  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, stream]);

  return (
    <div className="relative w-full h-full rounded-full overflow-hidden bg-zinc-900 border-2 border-red-500/30 flex items-center justify-center group shadow-inner">
      {isEnabled && !error && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted // Always mute self to prevent feedback loops in preview
          className="w-full h-full object-cover scale-x-[-1]" // mirror effect
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-950">
          <div className="relative">
            <img
              src={avatarUrl}
              alt={userName}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/10 shadow-lg"
            />
            {isMuted && (
              <span className="absolute -bottom-1 -right-1 bg-red-500 p-1 rounded-full text-white shadow-md">
                <MicOff className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 mt-2 font-medium bg-black/40 px-1.5 py-0.5 rounded-full border border-white/5">
            {error ? '虚拟麦位' : '语音席'}
          </span>
        </div>
      )}

      {/* Mic/Camera Floating Badges inside grid cell */}
      <div className="absolute bottom-1 right-1 flex gap-1 scale-75 origin-bottom-right opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/60 px-1.5 py-0.5 rounded-full">
        {isMuted ? (
          <MicOff className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <Mic className="w-3.5 h-3.5 text-green-400" />
        )}
        {isEnabled ? (
          <Camera className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <CameraOff className="w-3.5 h-3.5 text-zinc-400" />
        )}
      </div>
    </div>
  );
}

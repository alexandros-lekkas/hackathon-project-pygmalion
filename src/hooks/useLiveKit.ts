'use client';

import { useEffect, useState } from 'react';
import { Room, RoomEvent, Track, RemoteParticipant, RemoteTrack } from 'livekit-client';
import { LiveKitRoom, useRoom, useTracks } from '@livekit/components-react';

export interface LiveKitConfig {
  url: string;
  token: string;
  roomName: string;
}

export interface VoiceAgentState {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  error: string | null;
  participants: RemoteParticipant[];
}

export const useLiveKit = (config: LiveKitConfig) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [state, setState] = useState<VoiceAgentState>({
    isConnected: false,
    isConnecting: false,
    isMuted: false,
    isSpeaking: false,
    error: null,
    participants: [],
  });

  const connect = async () => {
    if (state.isConnecting || state.isConnected) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoSimulcastLayers: [
            { resolution: { width: 640, height: 360 }, encoding: { maxBitrate: 200_000 } },
            { resolution: { width: 1280, height: 720 }, encoding: { maxBitrate: 500_000 } },
          ],
        },
      });

      // Set up event listeners
      newRoom.on(RoomEvent.Connected, () => {
        console.log('Connected to room');
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          isConnecting: false,
          error: null 
        }));
      });

      newRoom.on(RoomEvent.Disconnected, (reason) => {
        console.log('Disconnected from room:', reason);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false,
          participants: []
        }));
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected:', participant.identity);
        setState(prev => ({
          ...prev,
          participants: [...prev.participants, participant]
        }));
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('Participant disconnected:', participant.identity);
        setState(prev => ({
          ...prev,
          participants: prev.participants.filter(p => p.identity !== participant.identity)
        }));
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('Track subscribed:', track.kind, participant.identity);
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          audioElement.play();
        }
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('Track unsubscribed:', track.kind, participant.identity);
        track.detach();
      });

      newRoom.on(RoomEvent.TrackMuted, (publication, participant) => {
        console.log('Track muted:', publication.kind, participant.identity);
      });

      newRoom.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        console.log('Track unmuted:', publication.kind, participant.identity);
      });

      // Connect to the room
      await newRoom.connect(config.url, config.token);
      setRoom(newRoom);

    } catch (error) {
      console.error('Failed to connect to room:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      }));
    }
  };

  const disconnect = async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        participants: [] 
      }));
    }
  };

  const toggleMute = async () => {
    if (!room) return;

    try {
      if (state.isMuted) {
        await room.localParticipant.setMicrophoneEnabled(true);
        setState(prev => ({ ...prev, isMuted: false }));
      } else {
        await room.localParticipant.setMicrophoneEnabled(false);
        setState(prev => ({ ...prev, isMuted: true }));
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const startAudio = async () => {
    if (!room) return;

    try {
      await room.localParticipant.setMicrophoneEnabled(true);
      setState(prev => ({ ...prev, isMuted: false }));
    } catch (error) {
      console.error('Failed to start audio:', error);
    }
  };

  const stopAudio = async () => {
    if (!room) return;

    try {
      await room.localParticipant.setMicrophoneEnabled(false);
      setState(prev => ({ ...prev, isMuted: true }));
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  return {
    room,
    state,
    connect,
    disconnect,
    toggleMute,
    startAudio,
    stopAudio,
  };
};

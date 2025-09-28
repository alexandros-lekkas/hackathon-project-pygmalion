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
    if (state.isConnecting || state.isConnected) {
      console.log('⚠️ Already connecting or connected, skipping...');
      return;
    }

    console.log('🚀 Starting connection to LiveKit room...');
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
        console.log('🎉 Connected to room successfully');
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          isConnecting: false,
          error: null 
        }));
      });

      newRoom.on(RoomEvent.Disconnected, (reason) => {
        console.log('❌ Disconnected from room:', reason);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false,
          participants: []
        }));
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('👤 Participant connected:', participant.identity);
        setState(prev => ({
          ...prev,
          participants: [...prev.participants, participant]
        }));
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('👋 Participant disconnected:', participant.identity);
        setState(prev => ({
          ...prev,
          participants: prev.participants.filter(p => p.identity !== participant.identity)
        }));
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('🎵 Track subscribed:', track.kind, 'from', participant.identity);
        if (track.kind === Track.Kind.Audio) {
          console.log('🔊 Setting up audio playback for', participant.identity);
          const audioElement = track.attach();
          audioElement.play();
          console.log('✅ Audio playback started for', participant.identity);
        }
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('🔇 Track unsubscribed:', track.kind, 'from', participant.identity);
        track.detach();
      });

      newRoom.on(RoomEvent.TrackMuted, (publication, participant) => {
        console.log('🔇 Track muted:', publication.kind, 'from', participant.identity);
      });

      newRoom.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        console.log('🔊 Track unmuted:', publication.kind, 'from', participant.identity);
      });

      // Connect to the room
      console.log('🔗 Connecting to room:', config.url);
      await newRoom.connect(config.url, config.token);
      setRoom(newRoom);
      console.log('✅ Room connection initiated');

    } catch (error) {
      console.error('❌ Failed to connect to room:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      }));
    }
  };

  const disconnect = async () => {
    if (room) {
      console.log('🔌 Disconnecting from room...');
      await room.disconnect();
      setRoom(null);
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        participants: [] 
      }));
      console.log('✅ Disconnected from room');
    }
  };

  const toggleMute = async () => {
    if (!room) {
      console.log('⚠️ No room available for mute toggle');
      return;
    }

    try {
      if (state.isMuted) {
        console.log('🎤 Unmuting microphone...');
        await room.localParticipant.setMicrophoneEnabled(true);
        setState(prev => ({ ...prev, isMuted: false }));
        console.log('✅ Microphone unmuted');
      } else {
        console.log('🔇 Muting microphone...');
        await room.localParticipant.setMicrophoneEnabled(false);
        setState(prev => ({ ...prev, isMuted: true }));
        console.log('✅ Microphone muted');
      }
    } catch (error) {
      console.error('❌ Failed to toggle mute:', error);
    }
  };

  const startAudio = async () => {
    if (!room) {
      console.log('⚠️ No room available for audio start');
      return;
    }

    try {
      console.log('🎤 Starting audio...');
      await room.localParticipant.setMicrophoneEnabled(true);
      setState(prev => ({ ...prev, isMuted: false }));
      console.log('✅ Audio started');
    } catch (error) {
      console.error('❌ Failed to start audio:', error);
    }
  };

  const stopAudio = async () => {
    if (!room) {
      console.log('⚠️ No room available for audio stop');
      return;
    }

    try {
      console.log('🔇 Stopping audio...');
      await room.localParticipant.setMicrophoneEnabled(false);
      setState(prev => ({ ...prev, isMuted: true }));
      console.log('✅ Audio stopped');
    } catch (error) {
      console.error('❌ Failed to stop audio:', error);
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

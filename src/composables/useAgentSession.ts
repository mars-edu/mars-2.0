// src/composables/useAgentSession.ts
import { ref, computed, onUnmounted } from 'vue';
import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteAudioTrack,
  ConnectionState,
} from 'livekit-client';

export type AgentState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'disconnected';

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL;

export function useAgentSession() {
  const room = new Room();

  const agentState = ref<AgentState>('idle');
  const isMicMuted = ref(false);
  const frequencyBands = ref<number[]>(new Array(24).fill(0));
  const isConnected = computed(() => agentState.value !== 'idle' && agentState.value !== 'disconnected');

  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let animationId: number | null = null;
  let agentAudioTrack: RemoteAudioTrack | null = null;

  // ── Audio Visualizer ──────────────────────────────────────────────────────
  function startVisualizer(track: RemoteAudioTrack) {
    stopVisualizer();

    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const bands = 24;

    function tick() {
      if (!analyser) return;
      analyser.getByteFrequencyData(dataArray);

      const step = Math.floor(bufferLength / bands);
      frequencyBands.value = Array.from({ length: bands }, (_, i) => {
        const start = i * step;
        const slice = dataArray.slice(start, start + step);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        return avg / 255; // normalize 0-1
      });

      animationId = requestAnimationFrame(tick);
    }

    tick();
  }

  function stopVisualizer() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    analyser = null;
    frequencyBands.value = new Array(24).fill(0);
  }

  // ── Room Events ───────────────────────────────────────────────────────────
  room.on(RoomEvent.Connected, () => {
    agentState.value = 'listening';
  });

  room.on(RoomEvent.Disconnected, () => {
    agentState.value = 'disconnected';
    stopVisualizer();
  });

  room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
    if (state === ConnectionState.Connecting) {
      agentState.value = 'connecting';
    }
  });

  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
    if (track.kind === Track.Kind.Audio) {
      agentAudioTrack = track as RemoteAudioTrack;
      track.attach(); // plays audio through speakers
    }
  });

  room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
    if (track.kind === Track.Kind.Audio) {
      track.detach();
      agentAudioTrack = null;
      stopVisualizer();
    }
  });

  // Listen for agent state updates via participant attributes
  room.on(RoomEvent.ParticipantAttributesChanged, (changedAttributes: Record<string, string>, _participant) => {
    // LiveKit agents publish state via attributes
    if (changedAttributes['lk.agent.state']) {
      const state = changedAttributes['lk.agent.state'];
      if (state === 'listening') agentState.value = 'listening';
      else if (state === 'thinking') {
        agentState.value = 'thinking';
        stopVisualizer();
      }
      else if (state === 'speaking') {
        agentState.value = 'speaking';
        if (agentAudioTrack) startVisualizer(agentAudioTrack);
      }
    }
  });

  // ── Public API ────────────────────────────────────────────────────────────
  async function connect() {
    agentState.value = 'connecting';
    try {
      const res = await fetch(`${CONVEX_SITE_URL}/api/livekit/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Failed to get LiveKit token');

      const { serverUrl, participantToken } = await res.json();

      await room.connect(serverUrl, participantToken, {
        autoSubscribe: true,
      });

      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);
      isMicMuted.value = false;

    } catch (err) {
      console.error('[useAgentSession] connect error:', err);
      agentState.value = 'disconnected';
      throw err;
    }
  }

  async function disconnect() {
    stopVisualizer();
    await room.disconnect();
    agentState.value = 'idle';
  }

  async function toggleMic() {
    const newState = !isMicMuted.value;
    await room.localParticipant.setMicrophoneEnabled(!newState);
    isMicMuted.value = newState;
  }

  onUnmounted(() => {
    stopVisualizer();
    room.disconnect();
  });

  return {
    agentState,
    isMicMuted,
    frequencyBands,
    isConnected,
    connect,
    disconnect,
    toggleMic,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Medición sensor-asistida (paper §4.4). Enciende cámara + micrófono con las
 * APIs nativas del navegador y produce dos lecturas normalizadas en vivo:
 *   · brightness 0..1  — luminancia media del cuadro de video  → categoría Luz
 *   · loudness   0..1  — RMS del micrófono (p. ej. un Rode)     → categoría Sonido
 *
 * Todo el procesamiento es local: ningún cuadro ni muestra de audio sale del
 * navegador. Los umbrales viven en el módulo, no aquí, para poder calibrarlos.
 */

export interface AudioInput {
  deviceId: string;
  label: string;
}

export interface SensorReadings {
  /** luminancia media 0..1 (proxy relativo de lux) */
  brightness: number;
  /** sonoridad relativa 0..1 (RMS escalado, no es dB SPL calibrado) */
  loudness: number;
}

export type SensorStatus = "idle" | "starting" | "active" | "error";

export interface SensorState {
  status: SensorStatus;
  error: string | null;
  readings: SensorReadings;
  audioInputs: AudioInput[];
  audioDeviceId: string | null;
}

const SMOOTH = 0.82; // media móvil exponencial: suaviza el jitter del sensor
const UPDATE_MS = 60; // ~16 actualizaciones de estado por segundo
const LOUDNESS_GAIN = 3.2; // las salas silenciosas dan RMS diminuto; lo escalamos

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false, // queremos el nivel crudo, sin que el navegador lo "nivele"
};

function describeError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Permiso denegado. Habilita cámara y micrófono para este sitio y reintenta.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError")
    return "No se encontró una cámara o un micrófono conectados.";
  if (name === "NotReadableError" || name === "TrackStartError")
    return "La cámara o el micrófono están en uso por otra aplicación.";
  if (err instanceof Error && err.message) return err.message;
  return "No se pudo iniciar la medición.";
}

export function useSensors(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<SensorState>({
    status: "idle",
    error: null,
    readings: { brightness: 0, loudness: 0 },
    audioInputs: [],
    audioDeviceId: null,
  });

  const rafRef = useRef<number | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null); // stream combinado (video [+ audio inicial])
  const audioStreamRef = useRef<MediaStream | null>(null); // stream que alimenta el analizador
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const timeDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smoothRef = useRef<SensorReadings>({ brightness: 0, loudness: 0 });
  const lastUpdateRef = useRef(0);

  const cleanup = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;
    timeDataRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    videoStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioStreamRef.current && audioStreamRef.current !== videoStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    videoStreamRef.current = null;
    audioStreamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, [videoRef]);

  const loop = useCallback(() => {
    rafRef.current = requestAnimationFrame(loop);

    // --- brillo: cuadro de video reducido -> luminancia media -----------------
    let brightness = smoothRef.current.brightness;
    const video = videoRef.current;
    const cv = canvasRef.current;
    if (video && cv && video.readyState >= 2) {
      const cctx = cv.getContext("2d", { willReadFrequently: true });
      if (cctx) {
        cctx.drawImage(video, 0, 0, cv.width, cv.height);
        const { data } = cctx.getImageData(0, 0, cv.width, cv.height);
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const raw = sum / (data.length / 4) / 255;
        brightness = brightness * SMOOTH + raw * (1 - SMOOTH);
      }
    }

    // --- sonoridad: RMS del dominio temporal del micrófono --------------------
    let loudness = smoothRef.current.loudness;
    const analyser = analyserRef.current;
    const timeData = timeDataRef.current;
    if (analyser && timeData) {
      analyser.getByteTimeDomainData(timeData);
      let sumSq = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / timeData.length);
      const raw = Math.min(1, rms * LOUDNESS_GAIN);
      loudness = loudness * SMOOTH + raw * (1 - SMOOTH);
    }

    smoothRef.current = { brightness, loudness };

    const now = performance.now();
    if (now - lastUpdateRef.current >= UPDATE_MS) {
      lastUpdateRef.current = now;
      setState((s) => (s.status === "active" ? { ...s, readings: { brightness, loudness } } : s));
    }
  }, [videoRef]);

  const start = useCallback(async () => {
    setState((s) =>
      s.status === "starting" || s.status === "active" ? s : { ...s, status: "starting", error: null },
    );
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Este navegador no expone cámara/micrófono, o la página no está en https/localhost.",
        );
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: AUDIO_CONSTRAINTS,
      });
      videoStreamRef.current = stream;
      audioStreamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        await video.play().catch(() => {});
      }

      const Ctx: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      await ctx.resume().catch(() => {});
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.3;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      timeDataRef.current = new Uint8Array(analyser.fftSize);

      const cv = document.createElement("canvas");
      cv.width = 64;
      cv.height = 48;
      canvasRef.current = cv;

      // las etiquetas de dispositivo solo existen tras conceder permiso
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs: AudioInput[] = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Micrófono ${i + 1}` }));
      const currentId = stream.getAudioTracks()[0]?.getSettings().deviceId ?? inputs[0]?.deviceId ?? null;

      smoothRef.current = { brightness: 0, loudness: 0 };
      lastUpdateRef.current = 0;
      setState((s) => ({
        ...s,
        status: "active",
        error: null,
        audioInputs: inputs,
        audioDeviceId: currentId,
      }));
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      cleanup();
      setState((s) => ({ ...s, status: "error", error: describeError(err) }));
    }
  }, [videoRef, loop, cleanup]);

  const stop = useCallback(() => {
    cleanup();
    smoothRef.current = { brightness: 0, loudness: 0 };
    setState((s) => ({ ...s, status: "idle", readings: { brightness: 0, loudness: 0 } }));
  }, [cleanup]);

  /** Cambia la entrada de audio (p. ej. al Rode) sin cortar el video. */
  const setAudioDevice = useCallback(async (deviceId: string) => {
    const ctx = ctxRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId }, ...AUDIO_CONSTRAINTS },
      });
      sourceRef.current?.disconnect();
      const prev = audioStreamRef.current;
      if (prev && prev === videoStreamRef.current) {
        prev.getAudioTracks().forEach((t) => t.stop()); // libera solo el micrófono combinado
      } else {
        prev?.getTracks().forEach((t) => t.stop());
      }
      const source = ctx.createMediaStreamSource(newStream);
      source.connect(analyser);
      sourceRef.current = source;
      audioStreamRef.current = newStream;
      setState((s) => ({ ...s, audioDeviceId: deviceId }));
    } catch (err) {
      setState((s) => ({ ...s, error: describeError(err) }));
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  return { ...state, start, stop, setAudioDevice };
}

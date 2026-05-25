import { useState, useRef, useCallback, useEffect } from "react";
import { VoiceRecorder } from "@/lib/voice/recorder";
import { toast } from "sonner";

interface UseVoiceOptions {
  onTranscriptionComplete?: (text: string) => void;
}

export function useVoice({ onTranscriptionComplete }: UseVoiceOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const isHoldingRef = useRef(false);
  const startingRef = useRef<Promise<void> | null>(null);
  // Tracks when recording actually started (after getUserMedia resolves)
  // Used to enforce a minimum recording duration and avoid the Android Chrome
  // permission-dialog race: tapping "Allow" fires touchend on the button,
  // which calls stopRecording() milliseconds after start() resolves.
  const recordingStartedAtRef = useRef<number>(0);
  // Ref to track the current audioUrl for cleanup without useEffect dependency
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    recorderRef.current = new VoiceRecorder();
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []); // Only on mount — do NOT add audioUrl: would replace recorder mid-recording

  const startRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    console.log("[MIC] Botón presionado — solicitando micrófono...");
    setError(null);
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      setAudioUrl(null);
    }

    const promise = (async () => {
      await recorderRef.current!.start();
      recordingStartedAtRef.current = Date.now();
      setIsRecording(true);
      console.log("[MIC] Grabando ✅");
      toast.info("Grabando audio... Habla ahora 🎙️");
    })();

    startingRef.current = promise;

    try {
      await promise;
    } catch (err: any) {
      console.error("[useVoice] Error initiating recording:", err);
      const userMessage =
        err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
          ? "Permiso de microfono denegado. Habilita el microfono en tu navegador."
          : "No se pudo acceder al microfono.";
      setError(userMessage);
      toast.error(userMessage);
      setIsRecording(false);
    } finally {
      startingRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    // If start() is still pending (e.g. permission dialog open), wait for it first
    if (startingRef.current) {
      try {
        await startingRef.current;
      } catch {
        // start() failed — nothing to stop
        return;
      }
    }

    if (!recorderRef.current) return;

    setIsRecording(false);
    setIsTranscribing(true);

    try {
      // Minimum recording guard: Android Chrome fires touchend when the user
      // taps "Allow" on the permission dialog, calling stopRecording() right
      // after start() resolves. Enforce at least 500ms of actual recording.
      const MIN_RECORDING_MS = 500;
      const elapsed = Date.now() - recordingStartedAtRef.current;
      if (elapsed < MIN_RECORDING_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_RECORDING_MS - elapsed));
      }

      const audioBlob = await recorderRef.current.stop();

      const url = URL.createObjectURL(audioBlob);
      audioUrlRef.current = url;
      setAudioUrl(url);

      const formData = new FormData();
      const cleanMimeType = audioBlob.type.split(";")[0];
      const extension = cleanMimeType.includes("ogg") ? "ogg" : "webm";
      const cleanBlob = new Blob([audioBlob], { type: cleanMimeType });
      formData.append("audio", cleanBlob, `voice-record.${extension}`);

      const response = await fetch("/api/transcripcion", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Error al transcribir el audio.");
      }

      if (data.text && data.text.trim()) {
        toast.success("Audio transcribido con exito! 🥂");
        if (onTranscriptionComplete) {
          onTranscriptionComplete(data.text);
        }
      } else {
        toast.warning("No se detecto voz clara. Intenta de nuevo.");
      }
    } catch (err: any) {
      console.error("[useVoice] Error during transcription:", err);
      const userMessage =
        err.message === "EMPTY_AUDIO"
          ? "Grabacion muy corta. Manten presionado el microfono mientras hablas."
          : err.message || "Error al transcribir la voz.";
      setError(userMessage);
      toast.error(userMessage);
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscriptionComplete]);

  const handlePressStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      isHoldingRef.current = true;
      startRecording();
    },
    [startRecording],
  );

  const handlePressEnd = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (isHoldingRef.current) {
        isHoldingRef.current = false;
        stopRecording();
      }
    },
    [stopRecording],
  );

  const handlePressCancel = useCallback(() => {
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      stopRecording();
    }
  }, [stopRecording]);

  const pressProps = {
    onMouseDown: handlePressStart,
    onMouseUp: handlePressEnd,
    onMouseLeave: handlePressCancel,
    onTouchStart: handlePressStart,
    onTouchEnd: handlePressEnd,
    onTouchCancel: handlePressCancel,
  };

  return {
    isRecording,
    isTranscribing,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pressProps,
  };
}

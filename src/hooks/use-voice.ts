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
  // Tracks the in-progress start() promise to handle the race condition where
  // the user releases the button before getUserMedia resolves (e.g. permission dialog)
  const startingRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    recorderRef.current = new VoiceRecorder();
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    setError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    const promise = (async () => {
      await recorderRef.current!.start();
      setIsRecording(true);
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
  }, [audioUrl]);

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
      const audioBlob = await recorderRef.current.stop();

      const url = URL.createObjectURL(audioBlob);
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

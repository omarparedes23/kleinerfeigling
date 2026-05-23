import { useVoice } from "@/hooks/use-voice";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";

interface VoiceButtonProps {
  onTranscriptionComplete?: (text: string) => void;
  // Optional: override active states if controlled from outside
  className?: string;
}

export function VoiceButton({
  onTranscriptionComplete,
  className = "",
}: VoiceButtonProps) {
  // Use the useVoice custom hook
  const { isRecording, isTranscribing, pressProps } = useVoice({
    onTranscriptionComplete,
  });

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* ─── Pulsing Waveforms (Nightclub Neon Aesthetics) ─── */}
      {isRecording && (
        <>
          <div className="absolute h-18 w-18 rounded-full bg-rose-500/20 animate-ping duration-1000" />
          <div className="absolute h-22 w-22 rounded-full bg-rose-500/10 animate-pulse duration-700" />
          <div className="absolute h-26 w-26 rounded-full bg-rose-500/5 animate-ping duration-1500" />
          
          {/* Wave visual bars container */}
          <div className="absolute -top-6 flex gap-1 items-center h-4">
            <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-duration:300ms]" />
            <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-duration:450ms] [animation-delay:100ms]" />
            <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-duration:350ms] [animation-delay:200ms]" />
            <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-duration:500ms] [animation-delay:50ms]" />
          </div>
        </>
      )}

      {isTranscribing && (
        <div className="absolute h-16 w-16 rounded-full border border-t-purple-500 border-r-lime-400 border-b-rose-400 border-l-amber-400 animate-spin" />
      )}

      {/* ─── Main Interactive Glowing Button ─── */}
      <Button
        size="icon"
        {...pressProps}
        className={`relative z-10 h-14 w-14 rounded-full border-none shadow-xl cursor-pointer select-none transition-all duration-300 hover:scale-105 active:scale-95 ${
          isRecording
            ? "bg-rose-500 text-white shadow-rose-500/30"
            : isTranscribing
              ? "bg-neutral-900 text-purple-400 cursor-wait shadow-purple-500/20"
              : "bg-lime-400 text-neutral-950 hover:bg-lime-300 shadow-lime-400/20"
        }`}
        disabled={isTranscribing}
      >
        {isTranscribing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Mic className={`h-6 w-6 ${isRecording ? "animate-pulse" : ""}`} />
        )}
      </Button>

      {/* Floating Status Helper Text */}
      {isRecording && (
        <span className="absolute -bottom-6 whitespace-nowrap text-[10px] uppercase font-black tracking-widest text-rose-500 animate-pulse">
          Soltar para enviar
        </span>
      )}
    </div>
  );
}

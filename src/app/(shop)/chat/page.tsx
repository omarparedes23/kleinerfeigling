"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "ai/react";
import { ChatMessage } from "@/components/ai-bot/chat-message";
import { VoiceButton } from "@/components/ai-bot/voice-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Send, Sparkles, AlertCircle, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

const PROMPT_CHIPS = [
  { label: "Ver mi carrito 🛒", query: "¿Qué tengo en mi carrito? Muéstrame el resumen." },
  { label: "Sugerir un coctel 🥂", query: "Recomiéndame una receta de coctel con Kleiner Feigling" },
  { label: "Precios de Green Lemon 🍋", query: "Muéstrame el precio y stock de Green Lemon" },
  { label: "Envío a Miraflores 🚚", query: "¿Cuánto cuesta el delivery a Miraflores?" },
];

export default function ChatPage() {
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("kleiner-voice-enabled") === "true";
  });
  const lastReadMessageIdRef = useRef<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Vercel AI SDK hook connected to our /api/chat route
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
    error,
    reload,
  } = useChat({
    api: "/api/chat",
    onError: (err) => {
      console.error("[useChat.onError]", err);
      toast.error("Hubo un error de conexión con el asistente virtual.");
    },
  });

  // Auto-scroll hook
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Strips markdown, emojis, and normalizes currency before sending to TTS
  const cleanTextForSpeech = (text: string): string => {
    if (!text) return "";
    
    // 1. Normalizar moneda peruana antes de cualquier otra transformación
    //    "S/ 23.90" → "23 soles con 90 céntimos"  |  "S/ 5.00" → "5 soles"
    let clean = text
      .replace(/S\/\s*(\d+)[.,]([1-9]\d*)/g, "$1 soles con $2 céntimos")
      .replace(/S\/\s*(\d+)[.,]0+/g, "$1 soles")
      .replace(/S\/\s*(\d+)/g, "$1 soles");

    // 2. Remove markdown formatting (asterisks, hashtags, underscores, brackets, backticks)
    clean = clean
      .replace(/[*#_`~]/g, "") // Remove standard markdown indicators
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Replace markdown links with their text
      .replace(/\[([^\]]+)\]/g, "$1"); // Replace standalone brackets with their text

    // 3. Remove emojis (which standard TTS voices pronounce awkwardly like "cara sonriente", "copa de vino")
    clean = clean.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");

    // 3. Clean up double spaces or trailing punctuation
    clean = clean.replace(/\s+/g, " ").trim();

    return clean;
  };

  // Cancels any currently playing TTS audio
  const cancelCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
  };

  // Speaks text via backend TTS (/api/tts → OpenAI nova voice)
  // forceEnabled bypasses the isVoiceEnabled check (used when toggling on)
  const speakText = async (text: string, forceEnabled = false) => {
    if (!isVoiceEnabled && !forceEnabled) {
      console.log("[TTS] skipped — voz desactivada");
      return;
    }

    cancelCurrentAudio();

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    console.log(`[TTS] fetch /api/tts — ${clean.length} chars`);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => "");
        console.error(`[TTS] error ${res.status}:`, err);
        toast.error(`🔴 Voz: error ${res.status}. Revisa la API key de ElevenLabs en Vercel.`, { duration: 5000 });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play().catch((e) => {
        console.error("[TTS] audio.play() falló:", e);
        toast.error("🔴 El navegador bloqueó el audio. Interactúa con la página primero.", { duration: 5000 });
        URL.revokeObjectURL(url);
      });
    } catch (e: any) {
      console.error("[TTS] excepción:", e);
      toast.error(`🔴 TTS falló: ${e?.message ?? "error desconocido"}`, { duration: 5000 });
    }
  };

  // Cancel audio on unmount
  useEffect(() => {
    return () => cancelCurrentAudio();
  }, []);

  // Check search params to auto-enable voice mode
  useEffect(() => {
    const isVoice = searchParams.get("voice") === "true";
    if (isVoice) {
      setIsVoiceEnabled(true);
      setTimeout(() => {
        toast.info("🎙️ ¡Modo de voz activado! El bot te hablará de vuelta y puedes hablarle pulsando el micrófono.", {
          duration: 5000,
        });
      }, 800);
    }
  }, [searchParams]);

  // Listen for completed bot messages and read them out loud
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.id !== lastReadMessageIdRef.current) {
        lastReadMessageIdRef.current = lastMessage.id;
        speakText(lastMessage.content);
      }
    }
  }, [messages, isLoading, isVoiceEnabled]);

  // Handle voice output toggle (Mute / Unmute)
  const toggleVoice = () => {
    const nextState = !isVoiceEnabled;
    setIsVoiceEnabled(nextState);
    localStorage.setItem("kleiner-voice-enabled", String(nextState));

    if (!nextState) {
      cancelCurrentAudio();
      toast.info("🔇 Lectura de voz desactivada.");
      return;
    }

    toast.success("🔊 Lectura de voz activada.");
    // Preview last bot message using backend TTS (forceEnabled=true — state hasn't updated yet)
    const lastMessage = messages.filter(m => m.role === "assistant").at(-1);
    if (lastMessage) {
      speakText(lastMessage.content, true);
    }
  };

  // Handle prompt chip click
  const handleChipClick = (queryText: string) => {
    append({
      role: "user",
      content: queryText,
    });
  };

  // Handle voice recording transcription auto-submission
  const handleVoiceTranscription = (text: string) => {
    if (text && text.trim()) {
      append({
        role: "user",
        content: text,
      });
    }
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-black text-white relative overflow-hidden font-sans">
      {/* ─── Pulsing Nightclub Visual Accents ─── */}
      <div className="absolute top-0 left-1/4 -z-10 h-72 w-72 rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* Header del chat */}
      <div className="border-b border-neutral-900/60 bg-black/60 backdrop-blur-md px-6 py-5 md:py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="relative flex h-13 w-13 items-center justify-center rounded-full border border-purple-500/30 bg-purple-950/20 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <Bot className="h-6.5 w-6.5" />
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-amber-400 border-2 border-black animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base md:text-lg tracking-wide font-sans">KLEINER BOT</span>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] md:text-xs font-black uppercase text-amber-400">
                AI Agent
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-400">Asistente Virtual de Ventas 🥂</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Voice Output Toggle Button (Mute/Unmute) */}
          <Button
            size="icon"
            variant="outline"
            onClick={toggleVoice}
            className={`h-11 w-11 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center ${
              isVoiceEnabled
                ? "bg-amber-500/10 border-amber-400/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                : "bg-neutral-950/40 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
            }`}
            title={isVoiceEnabled ? "Silenciar asistente de voz" : "Activar asistente de voz"}
          >
            {isVoiceEnabled ? <Volume2 className="h-5.5 w-5.5" /> : <VolumeX className="h-5.5 w-5.5" />}
          </Button>

          <div className="text-xs md:text-sm font-semibold text-neutral-400 hidden sm:block">
            Lima, PE | Delivery Express 🚚
          </div>
        </div>
      </div>

      {/* Mensajes scrolling area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scrollbar-thin scrollbar-thumb-neutral-900 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="mx-auto max-w-2xl py-16 flex h-full flex-col justify-center items-center text-center space-y-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/20 bg-amber-950/10 text-amber-400 shadow-[0_0_30px_rgba(163,230,53,0.2)] animate-bounce [animation-duration:3s]">
              <Bot className="h-10 w-10" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black tracking-wide font-sans">
                ¡Hola! Soy <span className="text-amber-400">Kleiner Bot</span> 🥂
              </h2>
              <p className="text-sm sm:text-base text-neutral-400 max-w-md mx-auto leading-relaxed">
                Tu asistente de fiesta de Kleiner Feigling. Pídeme cócteles, precios de licores, o añádelos a tu carrito usando tu voz o texto.
              </p>
            </div>

            {/* Prompt Chips */}
            <div className="w-full space-y-4">
              <p className="text-xs uppercase font-black tracking-widest text-neutral-500">
                Sugerencias rápidas
              </p>
              <div className="flex flex-wrap justify-center gap-3 max-w-xl mx-auto">
                {PROMPT_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip.query)}
                    className="rounded-full border border-neutral-900 bg-neutral-950/50 px-5 py-2.5 text-xs sm:text-sm font-bold text-neutral-300 transition-all hover:border-amber-400/40 hover:bg-amber-950/15 hover:text-amber-400 cursor-pointer hover:scale-[1.03]"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        
        {/* Loading placeholder when assistant is thinking */}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex w-full gap-3 flex-row">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-purple-500/20 bg-purple-950/10 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col gap-2 max-w-[85%]">
              <div className="rounded-2xl px-4 py-3 bg-neutral-950/40 border border-neutral-900 rounded-tl-none flex gap-1 items-center h-9">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {/* Error Retry Card */}
        {error && (
          <Card className="max-w-md mx-auto border-red-500/20 bg-red-950/10">
            <CardContent className="p-4 flex items-center justify-between gap-3 text-xs text-red-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                <span>Error en la conexión. Intenta reenviar el mensaje.</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => reload()}
                className="h-8 border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-950/30 hover:text-red-300 font-bold"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" /> Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input + Voice Button area */}
      <div className="border-t border-neutral-900/60 bg-black/80 backdrop-blur-md p-6 md:p-8">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl flex items-center gap-4">
          {/* Integrated Voice Button wrapper */}
          <div className="shrink-0">
            <VoiceButton onTranscriptionComplete={handleVoiceTranscription} />
          </div>

          <div className="relative flex-1 flex items-center bg-neutral-950/60 border border-neutral-900 focus-within:border-amber-500/40 rounded-full pl-6 pr-2.5 h-16 transition-all shadow-inner">
            <Input
              placeholder={isLoading ? "Kleiner Bot está respondiendo..." : "Escribe tu pedido... Ej: Recomiéndame un coctel"}
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none text-white placeholder-neutral-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-full text-base font-sans"
            />
            
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-12 w-12 rounded-full bg-amber-400 text-neutral-950 hover:bg-amber-300 border-none transition-all shadow-lg hover:shadow-amber-400/20 disabled:bg-neutral-900 disabled:text-neutral-600 disabled:shadow-none cursor-pointer"
            >
              <Send className="h-5.5 w-5.5" />
            </Button>
          </div>
        </form>
        <p className="text-center text-[10px] md:text-xs uppercase tracking-wider font-extrabold text-neutral-500 mt-3.5">
          Pulsa el micrófono para hablar • Kleiner Bot se encargará del resto 🥂
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "ai/react";
import { ChatMessage } from "@/components/ai-bot/chat-message";
import { VoiceButton } from "@/components/ai-bot/voice-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Send, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PROMPT_CHIPS = [
  { label: "Sugerir un coctel 🥂", query: "Recomiéndame una receta de coctel con Kleiner Feigling" },
  { label: "Precios de Green Lemon 🍋", query: "Muéstrame el precio y stock de Green Lemon" },
  { label: "Envío a Miraflores 🚚", query: "¿Cuánto cuesta el delivery a Miraflores?" },
  { label: "Sabor Coco Biscuit 🍪", query: "Háblame del sabor Coco Biscuit y sus ingredientes" },
];

export default function ChatPage() {
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
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

  // Check for search params to trigger voice mode toast
  useEffect(() => {
    const isVoice = searchParams.get("voice") === "true";
    if (isVoice) {
      setTimeout(() => {
        toast.info("🎙️ ¡Modo de voz activado! Mantén presionado el micrófono para hablar.", {
          duration: 5000,
        });
      }, 800);
    }
  }, [searchParams]);

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
      <div className="absolute bottom-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-lime-500/5 blur-[120px] pointer-events-none" />

      {/* Header del chat */}
      <div className="border-b border-neutral-900/60 bg-black/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-purple-500/30 bg-purple-950/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Bot className="h-5 w-5" />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-lime-400 border border-black animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-wide font-sans">KLEINER BOT</span>
              <span className="rounded-full bg-lime-500/10 border border-lime-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-lime-400">
                AI Agent
              </span>
            </div>
            <p className="text-[10px] text-neutral-500">Asistente Virtual de Ventas 🥂</p>
          </div>
        </div>
        <div className="text-xs text-neutral-500 hidden sm:block">
          Lima, PE | Delivery Express 🚚
        </div>
      </div>

      {/* Mensajes scrolling area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scrollbar-thin scrollbar-thumb-neutral-900 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="mx-auto max-w-xl py-12 flex h-full flex-col justify-center items-center text-center space-y-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-lime-400/20 bg-lime-950/10 text-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.15)] animate-bounce [animation-duration:3s]">
              <Bot className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-wide font-sans">
                ¡Hola! Soy <span className="text-lime-400">Kleiner Bot</span> 🥂
              </h2>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Tu asistente de feesta de Kleiner Feigling. Pídeme cócteles, precios de licores, o añádelos a tu carrito usando tu voz o texto.
              </p>
            </div>

            {/* Prompt Chips */}
            <div className="w-full space-y-2.5">
              <p className="text-[10px] uppercase font-black tracking-widest text-neutral-500">
                Sugerencias rápidas
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                {PROMPT_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip.query)}
                    className="rounded-full border border-neutral-900 bg-neutral-950/50 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 transition-all hover:border-lime-400/40 hover:bg-lime-950/15 hover:text-lime-400 cursor-pointer"
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
      <div className="border-t border-neutral-900/60 bg-black/80 backdrop-blur-md p-4 md:px-8">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl flex items-center gap-3">
          {/* Integrated Voice Button wrapper */}
          <div className="shrink-0">
            <VoiceButton onTranscriptionComplete={handleVoiceTranscription} />
          </div>

          <div className="relative flex-1 flex items-center bg-neutral-950/60 border border-neutral-900 focus-within:border-lime-500/40 rounded-full pl-4 pr-1.5 h-14 transition-all shadow-inner">
            <Input
              placeholder={isLoading ? "Kleiner Bot está respondiendo..." : "Escribe tu pedido... Ej: Recomiéndame un coctel"}
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none text-white placeholder-neutral-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-full text-sm font-sans"
            />
            
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 rounded-full bg-lime-400 text-neutral-950 hover:bg-lime-300 border-none transition-all shadow-lg hover:shadow-lime-400/20 disabled:bg-neutral-900 disabled:text-neutral-600 disabled:shadow-none cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </div>
        </form>
        <p className="text-center text-[9px] uppercase tracking-wider font-bold text-neutral-600 mt-2.5">
          Pulsa el micrófono para hablar • Kleiner Bot se encargará del resto 🥂
        </p>
      </div>
    </div>
  );
}

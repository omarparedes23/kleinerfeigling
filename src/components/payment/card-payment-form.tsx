"use client";

import { useState } from "react";
import { CardElement } from "@stripe/react-stripe-js";

import type { StripeCardElementChangeEvent } from "@stripe/stripe-js";

interface CardPaymentFormProps {
  onChange?: (event: StripeCardElementChangeEvent) => void;
  error?: string | null;
}

export function CardPaymentForm({ onChange, error }: CardPaymentFormProps) {
  const [focused, setFocused] = useState(false);

  // Premium nightclub design style configuration for Stripe iframe
  const cardElementOptions = {
    style: {
      base: {
        color: "#ffffff",
        fontFamily: "Outfit, Inter, system-ui, sans-serif",
        fontSmoothing: "antialiased",
        fontSize: "14px",
        "::placeholder": {
          color: "#737373", // neutral-500
        },
        iconColor: "#a3a3a3", // neutral-400
      },
      invalid: {
        color: "#f87171", // red-400
        iconColor: "#f87171",
      },
    },
    hidePostalCode: true,
  };

  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[9px] uppercase font-black tracking-wider text-neutral-400 block">
        Detalles de Tarjeta (Visa / Mastercard)
      </label>
      <div
        className={`w-full rounded-xl border bg-black/60 backdrop-blur-md px-3.5 py-4 transition-all duration-300 ${
          focused
            ? "border-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.15)] ring-1 ring-lime-400/35"
            : "border-neutral-800"
        } ${error ? "border-red-500 ring-1 ring-red-500/20" : ""}`}
      >
        <CardElement
          options={cardElementOptions}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={onChange}
        />
      </div>
      {error && (
        <span className="text-[11px] font-semibold text-red-400 block animate-in fade-in duration-200">
          ⚠️ {error}
        </span>
      )}
    </div>
  );
}

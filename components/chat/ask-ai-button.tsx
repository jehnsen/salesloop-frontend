"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useChat } from "./chat-provider";

/** Opens the assistant, optionally with a product in context and/or a first question. */
export function AskAIButton({
  productSlug,
  prompt,
  children = "Ask AI",
  icon = true,
  ...props
}: Omit<ButtonProps, "onClick"> & { productSlug?: string; prompt?: string; icon?: boolean }) {
  const { openChat } = useChat();
  return (
    <Button onClick={() => openChat({ productSlug, prompt })} {...props}>
      {icon && <Sparkles aria-hidden />}
      {children}
    </Button>
  );
}

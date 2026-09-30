"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { submitContactMessage } from "@/services/leads";
import { isValidEmail, isValidPHMobile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";

export function ContactForm() {
  const [values, setValues] = React.useState({ name: "", mobile: "", email: "", message: "" });
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof values, string>>>({});
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent">("idle");

  const set = (key: keyof typeof values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (values.name.trim().length < 2) next.name = "Please enter your name.";
    if (!isValidPHMobile(values.mobile)) next.mobile = "Enter a PH mobile number, e.g. 0917 123 4567.";
    if (values.email && !isValidEmail(values.email)) next.email = "Please enter a valid email.";
    if (values.message.trim().length < 5) next.message = "Please write a short message.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setStatus("sending");
    try {
      await submitContactMessage({ ...values, email: values.email || undefined });
      setStatus("sent");
      toast.success("Message sent! The seller will get back to you soon.");
    } catch {
      setStatus("idle");
      toast.error("Couldn't send your message. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-8 text-center shadow-soft" role="status">
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <p className="text-lg font-semibold">Thanks, {values.name.split(" ")[0]}!</p>
        <p className="text-sm text-muted-foreground">Your message was sent. Expect a reply within store hours.</p>
        <Button
          variant="outline"
          onClick={() => {
            setValues({ name: "", mobile: "", email: "", message: "" });
            setStatus("idle");
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="c-name" label="Name" error={errors.name}>
          {(p) => <Input {...p} value={values.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />}
        </FormField>
        <FormField id="c-mobile" label="Mobile number" error={errors.mobile}>
          {(p) => <Input {...p} value={values.mobile} onChange={(e) => set("mobile", e.target.value)} inputMode="tel" autoComplete="tel" />}
        </FormField>
      </div>
      <FormField id="c-email" label="Email" optional error={errors.email}>
        {(p) => <Input {...p} type="email" value={values.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />}
      </FormField>
      <FormField id="c-message" label="Message" error={errors.message}>
        {(p) => <Textarea {...p} value={values.message} onChange={(e) => set("message", e.target.value)} rows={5} maxLength={1000} />}
      </FormField>
      <Button type="submit" size="lg" loading={status === "sending"} className="sm:justify-self-start">
        Send message
      </Button>
    </form>
  );
}

import { type FormEvent, useEffect, useRef } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine, fromPromise } from "xstate";

import { createDomainEvent } from "@/domain/core/events/types";
import { createDualEventBus } from "@/domain/core/events/event-bus";

interface ContactContext {
  name: string;
  email: string;
  company: string;
  message: string;
  website: string;
  feedbackMessage: string;
  feedbackType: "ok" | "error" | null;
  formStarted: boolean;
}

type ContactEvent =
  | { type: "SET_NAME"; value: string }
  | { type: "SET_EMAIL"; value: string }
  | { type: "SET_COMPANY"; value: string }
  | { type: "SET_MESSAGE"; value: string }
  | { type: "SET_WEBSITE"; value: string }
  | { type: "START" }
  | { type: "SUBMIT" }
  | { type: "RESET" };

interface SubmitResponse {
  ok: boolean;
  message: string;
}

function track(eventName: string, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const detail = {
    event: eventName,
    source: "landing_contact_form",
    ...payload,
  };

  window.dispatchEvent(new CustomEvent("js_tracking", { detail }));

  const bus = createDualEventBus(window);
  bus.publish(createDomainEvent("landing.contact-form", eventName, detail));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const contactFormMachine = createMachine(
  {
    types: {} as {
      context: ContactContext;
      events: ContactEvent;
      output: SubmitResponse;
    },
    id: "contact_form_machine",
    initial: "idle",
    context: {
      name: "",
      email: "",
      company: "",
      message: "",
      website: "",
      feedbackMessage: "",
      feedbackType: null,
      formStarted: false,
    },
    on: {
      SET_NAME: {
        actions: assign(({ event }) => (event.type === "SET_NAME" ? { name: event.value } : {})),
      },
      SET_EMAIL: {
        actions: assign(({ event }) => (event.type === "SET_EMAIL" ? { email: event.value } : {})),
      },
      SET_COMPANY: {
        actions: assign(({ event }) =>
          event.type === "SET_COMPANY" ? { company: event.value } : {},
        ),
      },
      SET_MESSAGE: {
        actions: assign(({ event }) =>
          event.type === "SET_MESSAGE" ? { message: event.value } : {},
        ),
      },
      SET_WEBSITE: {
        actions: assign(({ event }) =>
          event.type === "SET_WEBSITE" ? { website: event.value } : {},
        ),
      },
      START: {
        guard: ({ context }) => !context.formStarted,
        actions: [
          assign(() => ({ formStarted: true })),
          () => track("lead_form_start", { form_id: "contact_form" }),
        ],
      },
      RESET: {
        actions: assign(() => ({
          feedbackMessage: "",
          feedbackType: null,
        })),
        target: ".idle",
      },
    },
    states: {
      idle: {
        on: {
          SUBMIT: [
            {
              guard: "isValidSubmission",
              target: "submitting",
            },
            {
              actions: assign(() => ({
                feedbackType: "error",
                feedbackMessage:
                  "Completa nombre, correo válido y mensaje para continuar.",
              })),
              target: "failure",
            },
          ],
        },
      },
      submitting: {
        entry: () =>
          track("lead_form_submit_attempt", {
            form_id: "contact_form",
          }),
        invoke: {
          src: "submit",
          input: ({ context }) => context,
          onDone: [
            {
              guard: ({ event }) => event.output.ok,
              actions: [
                assign(() => ({
                  name: "",
                  email: "",
                  company: "",
                  message: "",
                  feedbackType: "ok",
                  feedbackMessage:
                    "Listo. Recibimos tu solicitud y te contactaremos en menos de 24 horas habiles.",
                })),
                () => track("lead_submitted", { form_id: "contact_form" }),
              ],
              target: "success",
            },
            {
              actions: [
                assign(({ event }) => ({
                  feedbackType: "error",
                  feedbackMessage: event.output.message,
                })),
                ({ event }) =>
                  track("lead_submit_error", {
                    form_id: "contact_form",
                    reason: event.output.message,
                  }),
              ],
              target: "failure",
            },
          ],
          onError: {
            actions: assign(() => ({
              feedbackType: "error",
              feedbackMessage:
                "Hubo un error al enviar el formulario. Intenta de nuevo en unos minutos o escribenos por WhatsApp.",
            })),
            target: "failure",
          },
        },
      },
      success: {
        on: {
          SUBMIT: {
            target: "submitting",
          },
        },
      },
      failure: {
        on: {
          SUBMIT: {
            target: "submitting",
            guard: "isValidSubmission",
          },
        },
      },
    },
  },
  {
    guards: {
      isValidSubmission: ({ context }) =>
        Boolean(
          context.name.trim() &&
            context.message.trim() &&
            isValidEmail(context.email.trim()) &&
            !context.website.trim(),
        ),
    },
    actors: {
      submit: fromPromise(async ({ input }: { input: ContactContext }) => {
        const tracker =
          typeof window !== "undefined"
            ? ((window as Window & { __jsTrack?: Record<string, unknown> }).__jsTrack as
                | {
                    getLeadPayloadMeta?: () => Record<string, unknown>;
                  }
                | undefined)
            : undefined;

        const trackingMeta = tracker?.getLeadPayloadMeta?.() || {};

        const response = await fetch("/api/public/leads/intake", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: input.name.trim(),
            companyName: input.company.trim() || "Prospecto web",
            email: input.email.trim(),
            serviceInterest: "Contacto general",
            notes: input.message.trim(),
            source: "landing_contact_form",
            website: input.website.trim(),
            utm: (trackingMeta.utm as Record<string, unknown> | undefined) || {},
            landingPath:
              typeof trackingMeta.landingPath === "string" ? trackingMeta.landingPath : "",
            referrer: typeof trackingMeta.referrer === "string" ? trackingMeta.referrer : "",
            correlationId:
              typeof trackingMeta.correlationId === "string"
                ? trackingMeta.correlationId
                : undefined,
          }),
        });

        if (response.ok) {
          return {
            ok: true,
            message: "Solicitud enviada correctamente.",
          };
        }

        return {
          ok: false,
          message:
            "No pudimos enviar tu solicitud en este momento. Intenta de nuevo en unos minutos.",
        };
      }),
    },
  },
);

export default function ContactForm() {
  const [state, send] = useMachine(contactFormMachine);
  const hasTrackedThankYouRef = useRef(false);

  const isLoading = state.matches("submitting");
  const isSuccess = state.matches("success");

  useEffect(() => {
    if (!isSuccess || typeof window === "undefined") {
      hasTrackedThankYouRef.current = false;
      return;
    }

    if (hasTrackedThankYouRef.current) {
      return;
    }

    hasTrackedThankYouRef.current = true;
    track("lead_thankyou_view", {
      form_id: "contact_form",
      funnel_step: "thank_you_modal",
    });
  }, [isSuccess]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send({ type: "SUBMIT" });
  };

  return (
    <div className="relative">
      <form
        id="contactForm"
        className="space-y-6 bg-white/5 p-8 md:p-10 rounded-3xl border border-white/10 backdrop-blur-sm shadow-2xl relative"
        onFocus={() => send({ type: "START" })}
        onSubmit={handleSubmit}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none" />

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          value={state.context.website}
          onChange={(event) =>
            send({
              type: "SET_WEBSITE",
              value: event.target.value,
            })
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-xs font-bold text-brand-gold uppercase tracking-wider ml-2"
            >
              Nombre
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Tu Nombre"
              value={state.context.name}
              onChange={(event) => send({ type: "SET_NAME", value: event.target.value })}
              className="w-full bg-brand-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 focus:outline-none transition-all placeholder:text-white/20"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-bold text-brand-gold uppercase tracking-wider ml-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="correo@empresa.com"
              value={state.context.email}
              onChange={(event) => send({ type: "SET_EMAIL", value: event.target.value })}
              className="w-full bg-brand-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 focus:outline-none transition-all placeholder:text-white/20"
            />
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <label
            htmlFor="company"
            className="text-xs font-bold text-brand-gold uppercase tracking-wider ml-2"
          >
            Empresa
          </label>
          <input
            type="text"
            id="company"
            name="company"
            placeholder="Nombre de tu organización"
            value={state.context.company}
            onChange={(event) => send({ type: "SET_COMPANY", value: event.target.value })}
            className="w-full bg-brand-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 focus:outline-none transition-all placeholder:text-white/20"
          />
        </div>

        <div className="space-y-2 relative z-10">
          <label
            htmlFor="message"
            className="text-xs font-bold text-brand-gold uppercase tracking-wider ml-2"
          >
            Mensaje
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            required
            placeholder="¿Qué proceso te gustaría automatizar?"
            value={state.context.message}
            onChange={(event) => send({ type: "SET_MESSAGE", value: event.target.value })}
            className="w-full bg-brand-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 focus:outline-none transition-all resize-none placeholder:text-white/20"
          />
        </div>

        <button
          type="submit"
          id="submitButton"
          data-track="lead_submit_click"
          data-track-label="Contact Form Submit"
          data-track-location="contact_form"
          disabled={isLoading}
          className="relative z-10 w-full bg-gold-gradient text-black font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Enviando..." : "Solicitar Diagnóstico Gratuito"}
        </button>
        <p className="relative z-10 text-xs text-brand-off-white/60">
          Respuesta en menos de 24 horas habiles. No compartimos tus datos con terceros.
        </p>

        {state.context.feedbackMessage ? (
          <p
            id="formFeedback"
            className={`relative z-10 text-sm rounded-xl px-4 py-3 ${
              state.context.feedbackType === "ok"
                ? "bg-emerald-500/15 text-emerald-200 border border-emerald-300/20"
                : "bg-red-500/15 text-red-200 border border-red-300/20"
            }`}
            aria-live="polite"
          >
            {state.context.feedbackMessage}
          </p>
        ) : null}
      </form>

      {isSuccess ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-brand-black/84 backdrop-blur-sm p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-thankyou-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-brand-gold/35 bg-brand-charcoal/96 p-6 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-gold/82">
              Solicitud registrada
            </p>
            <h3
              id="contact-thankyou-title"
              className="mt-3 text-3xl font-bold leading-tight text-white"
            >
              Gracias por tu interes.
            </h3>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-brand-off-white/80">
              Tu informacion fue enviada correctamente. Te contactaremos para revisar viabilidad,
              alcance y proximo paso.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href="https://wa.me/573186110790"
                target="_blank"
                rel="noopener noreferrer"
                data-track="whatsapp_purchase_intent_click"
                data-track-label="WhatsApp Contact Form Thank You"
                data-track-location="contact_form_modal"
                className="inline-flex items-center justify-center rounded-full bg-gold-gradient px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-black"
              >
                Hablar por WhatsApp
              </a>
              <a
                href="/cotizador"
                data-track="thankyou_cotizador_click"
                data-track-label="Contact Form Modal Cotizador"
                data-track-location="contact_form_modal"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-center text-sm font-bold text-white hover:border-brand-gold/60 hover:text-brand-gold transition-colors"
              >
                Ir al cotizador
              </a>
            </div>

            <button
              type="button"
              onClick={() => send({ type: "RESET" })}
              data-track="thankyou_close_click"
              data-track-label="Close Thank You Modal"
              data-track-location="contact_form_modal"
              className="mt-5 w-full rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-brand-off-white/85 hover:border-white/35 transition-colors"
            >
              Volver al formulario
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

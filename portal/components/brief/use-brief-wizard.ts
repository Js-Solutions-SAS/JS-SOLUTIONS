"use client";

import { useState } from "react";

type BriefStatus = "idle" | "loading" | "success" | "error";

type BriefFormData = {
  objectives: string[];
  urgency: "baja" | "media" | "alta";
  currentStack: string;
  designAssets: "none" | "ideas" | "figma";
  integrations: string[];
  additionalNotes: string;
};

function buildClientRequestIds(token: string) {
  const seed = `${token}:${Date.now()}`;

  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    const uuid = crypto.randomUUID();
    return {
      correlationId: `brief-${uuid}`,
      idempotencyKey: `submit-brief:${token}:${uuid}`,
    };
  }

  return {
    correlationId: `brief-${seed}`,
    idempotencyKey: `submit-brief:${seed}`,
  };
}

export function useBriefWizard(token: string) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<BriefFormData>({
    objectives: [],
    urgency: "media",
    currentStack: "",
    designAssets: "none",
    integrations: [],
    additionalNotes: "",
  });

  const [status, setStatus] = useState<BriefStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleToggleObjective = (id: string) => {
    setFormData((previous) => ({
      ...previous,
      objectives: previous.objectives.includes(id)
        ? previous.objectives.filter((objective) => objective !== id)
        : [...previous.objectives, id],
    }));
  };

  const handleToggleIntegration = (id: string) => {
    setFormData((previous) => ({
      ...previous,
      integrations: previous.integrations.includes(id)
        ? previous.integrations.filter((integration) => integration !== id)
        : [...previous.integrations, id],
    }));
  };

  const submitBrief = async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const requestIds = buildClientRequestIds(token);
      const response = await fetch("/api/submit-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          technicalBrief: formData,
          ...requestIds,
        }),
      });

      const result = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Error al enviar el brief",
        );
      }

      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al conectar con el servidor.",
      );
    }
  };

  return {
    step,
    setStep,
    formData,
    setFormData,
    status,
    errorMessage,
    handleToggleObjective,
    handleToggleIntegration,
    submitBrief,
  };
}

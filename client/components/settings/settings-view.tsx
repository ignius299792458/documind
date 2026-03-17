"use client";

import { useState } from "react";
import {
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  Layers,
  Filter,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { configureModelParams } from "@/lib/api";
import type { ModelParamsRequest } from "@/lib/types";

const DEFAULTS: ModelParamsRequest = {
  ollama_creativity_temperature: 0.5,
  retrieval_top_k: 10,
  rerank_top_n: 3,
  confidence_threshold: 0.015,
};

interface ParamConfig {
  key: keyof ModelParamsRequest;
  label: string;
  description: string;
  icon: React.ElementType;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

const PARAMS: ParamConfig[] = [
  {
    key: "ollama_creativity_temperature",
    label: "Creativity Temperature",
    description:
      "Controls randomness of model output. Lower values produce more deterministic responses, higher values increase creativity.",
    icon: Thermometer,
    min: 0,
    max: 1,
    step: 0.05,
    format: (v) => v.toFixed(2),
  },
  {
    key: "retrieval_top_k",
    label: "Retrieval Top-K",
    description:
      "Number of document chunks fetched from the vector store before re-ranking. Higher values cast a wider net.",
    icon: Layers,
    min: 5,
    max: 20,
    step: 1,
    format: (v) => String(v),
  },
  {
    key: "rerank_top_n",
    label: "Rerank Top-N",
    description:
      "Number of chunks kept after re-ranking. Lower values give more focused context to the model.",
    icon: Filter,
    min: 1,
    max: 10,
    step: 1,
    format: (v) => String(v),
  },
  {
    key: "confidence_threshold",
    label: "Confidence Threshold",
    description:
      "Minimum relevance score for a chunk to be included. Chunks below this score are discarded.",
    icon: Target,
    min: 0,
    max: 1,
    step: 0.005,
    format: (v) => v.toFixed(3),
  },
];

export function SettingsView() {
  const [params, setParams] = useState<ModelParamsRequest>({ ...DEFAULTS });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const updateParam = (key: keyof ModelParamsRequest, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setStatus("idle");
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const res = await configureModelParams(params);
      if (res.is_plugged) {
        setStatus("success");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setParams({ ...DEFAULTS });
    setStatus("idle");
  };

  const hasChanges = JSON.stringify(params) !== JSON.stringify(DEFAULTS);

  return (
    <div className="flex flex-1 overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent">
              <Settings className="size-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Model Parameters
              </h1>
              <p className="text-sm text-muted-foreground">
                Tune retrieval and generation behaviour
              </p>
            </div>
          </div>

          {/* Parameter Cards */}
          <div className="space-y-4">
            {PARAMS.map((cfg) => {
              const Icon = cfg.icon;
              const val = params[cfg.key];
              return (
                <div
                  key={cfg.key}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon className="size-4 text-muted-foreground" />
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          {cfg.label}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {cfg.description}
                        </p>
                      </div>
                    </div>
                    <span className="ml-4 shrink-0 rounded-md bg-accent px-2.5 py-1 text-sm font-mono font-medium text-foreground">
                      {cfg.format(val)}
                    </span>
                  </div>
                  <Slider
                    value={[val]}
                    onValueChange={(v) => {
                      const num = Array.isArray(v) ? v[0] : v;
                      updateParam(cfg.key, num);
                    }}
                    min={cfg.min}
                    max={cfg.max}
                    step={cfg.step}
                  />
                  <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground/60">
                    <span>{cfg.format(cfg.min)}</span>
                    <span>{cfg.format(cfg.max)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status */}
          {status === "success" && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
              <p className="text-sm text-emerald-500">
                Parameters saved successfully
              </p>
            </div>
          )}
          {status === "error" && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
              <AlertCircle className="size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{errorMsg}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges || saving}
            >
              Reset to Defaults
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Parameters"
              )}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { upsertCpfAccountSettings } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_CPF_ACCOUNT_SETTINGS } from "@/lib/types";
import type { CpfAccountSettings } from "@/lib/types";
import { toast } from "sonner";

type FormState = {
  currentAge: string;
  monthlySalary: string;
  oaInterestRate: string;
  saInterestRate: string;
  maInterestRate: string;
  frsMetForMaOverflow: boolean;
  mortgageMonthlyDeduction: string;
  mortgagePayoffAge: string;
  earlyRetirementAge: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function formatNullableInteger(value: number | null): string {
  return value === null ? "" : String(value);
}

function buildPayload(source: CpfAccountSettings | null) {
  return {
    current_age: source?.current_age ?? DEFAULT_CPF_ACCOUNT_SETTINGS.current_age,
    monthly_salary:
      source?.monthly_salary ?? DEFAULT_CPF_ACCOUNT_SETTINGS.monthly_salary,
    oa_interest_rate:
      source?.oa_interest_rate ?? DEFAULT_CPF_ACCOUNT_SETTINGS.oa_interest_rate,
    sa_interest_rate:
      source?.sa_interest_rate ?? DEFAULT_CPF_ACCOUNT_SETTINGS.sa_interest_rate,
    ma_interest_rate:
      source?.ma_interest_rate ?? DEFAULT_CPF_ACCOUNT_SETTINGS.ma_interest_rate,
    frs_met_for_ma_overflow:
      source?.frs_met_for_ma_overflow ??
      DEFAULT_CPF_ACCOUNT_SETTINGS.frs_met_for_ma_overflow,
    mortgage_monthly_deduction:
      source?.mortgage_monthly_deduction ??
      DEFAULT_CPF_ACCOUNT_SETTINGS.mortgage_monthly_deduction,
    mortgage_payoff_age:
      source?.mortgage_payoff_age ?? DEFAULT_CPF_ACCOUNT_SETTINGS.mortgage_payoff_age,
    early_retirement_age:
      source?.early_retirement_age ??
      DEFAULT_CPF_ACCOUNT_SETTINGS.early_retirement_age,
  };
}

function buildFormState(payload: ReturnType<typeof buildPayload>): FormState {
  return {
    currentAge: String(payload.current_age),
    monthlySalary:
      payload.monthly_salary > 0 ? String(payload.monthly_salary) : "",
    oaInterestRate: String(payload.oa_interest_rate),
    saInterestRate: String(payload.sa_interest_rate),
    maInterestRate: String(payload.ma_interest_rate),
    frsMetForMaOverflow: payload.frs_met_for_ma_overflow,
    mortgageMonthlyDeduction:
      payload.mortgage_monthly_deduction > 0
        ? String(payload.mortgage_monthly_deduction)
        : "",
    mortgagePayoffAge: formatNullableInteger(payload.mortgage_payoff_age),
    earlyRetirementAge: String(payload.early_retirement_age),
  };
}

function parseFormState(formState: FormState) {
  return {
    current_age:
      parseInt(formState.currentAge, 10) || DEFAULT_CPF_ACCOUNT_SETTINGS.current_age,
    monthly_salary: parseFloat(formState.monthlySalary) || 0,
    oa_interest_rate:
      parseFloat(formState.oaInterestRate) ||
      DEFAULT_CPF_ACCOUNT_SETTINGS.oa_interest_rate,
    sa_interest_rate:
      parseFloat(formState.saInterestRate) ||
      DEFAULT_CPF_ACCOUNT_SETTINGS.sa_interest_rate,
    ma_interest_rate:
      parseFloat(formState.maInterestRate) ||
      DEFAULT_CPF_ACCOUNT_SETTINGS.ma_interest_rate,
    frs_met_for_ma_overflow: formState.frsMetForMaOverflow,
    mortgage_monthly_deduction:
      parseFloat(formState.mortgageMonthlyDeduction) || 0,
    mortgage_payoff_age: formState.mortgagePayoffAge
      ? parseInt(formState.mortgagePayoffAge, 10)
      : null,
    early_retirement_age:
      parseInt(formState.earlyRetirementAge, 10) ||
      DEFAULT_CPF_ACCOUNT_SETTINGS.early_retirement_age,
  };
}

function serializePayload(payload: ReturnType<typeof parseFormState>) {
  return JSON.stringify(payload);
}

export function CpfSettingsForm({
  accountId,
  settings,
}: {
  accountId: string;
  settings: CpfAccountSettings | null;
}) {
  const incomingPayload = useMemo(() => buildPayload(settings), [settings]);
  const incomingSerialized = useMemo(
    () => JSON.stringify(incomingPayload),
    [incomingPayload]
  );

  const [formState, setFormState] = useState<FormState>(() =>
    buildFormState(incomingPayload)
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [activeField, setActiveField] = useState<string | null>(null);

  const lastCommittedPayloadRef = useRef(incomingSerialized);
  const lastSeenServerPayloadRef = useRef(incomingSerialized);

  useEffect(() => {
    if (incomingSerialized === lastSeenServerPayloadRef.current) {
      return;
    }

    lastSeenServerPayloadRef.current = incomingSerialized;

    if (activeField !== null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFormState(buildFormState(incomingPayload));
      lastCommittedPayloadRef.current = incomingSerialized;
      setSaveState("idle");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeField, incomingPayload, incomingSerialized]);

  const parsedPayload = useMemo(() => parseFormState(formState), [formState]);
  const serializedPayload = useMemo(
    () => serializePayload(parsedPayload),
    [parsedPayload]
  );

  useEffect(() => {
    if (serializedPayload === lastCommittedPayloadRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        await upsertCpfAccountSettings(accountId, parsedPayload);
        lastCommittedPayloadRef.current = serializedPayload;
        setSaveState("saved");
      } catch (error) {
        console.error(error);
        setSaveState("error");
        toast.error(
          error instanceof Error ? error.message : "Failed to save CPF settings"
        );
      }
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [accountId, parsedPayload, serializedPayload]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setSaveState("saving");
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <section className="space-y-6 rounded-[1.75rem] border border-emerald-200/70 bg-[linear-gradient(135deg,rgba(255,248,235,0.96),rgba(232,250,246,0.98)_42%,rgba(235,244,255,0.95))] p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700/80">
            CPF Planner
          </p>
          <div>
            <h3 className="text-xl font-semibold text-slate-950">
              Keep the core assumptions visible
            </h3>
            <p className="text-sm text-slate-600">
              Salary, interest, mortgage deductions, and retirement timing now save
              automatically as you update them.
            </p>
          </div>
        </div>

        <div
          aria-live="polite"
          className="self-start rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur"
        >
          {saveState === "saving"
            ? "Saving..."
            : saveState === "saved"
              ? "Saved"
              : saveState === "error"
                ? "Unable to save"
                : "Autosaves changes"}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-5 rounded-[1.5rem] border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Contribution Assumptions
            </p>
            <p className="text-sm text-slate-500">
              Updates here persist to the CPF account after a short pause.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="current_age"
              label="Current Age"
              value={formState.currentAge}
              onChange={(value) => updateField("currentAge", value)}
              onFocus={() => setActiveField("currentAge")}
              onBlur={() => setActiveField(null)}
              min="18"
              max="100"
              required
            />
            <Field
              id="monthly_salary"
              label="Monthly Salary"
              value={formState.monthlySalary}
              onChange={(value) => updateField("monthlySalary", value)}
              onFocus={() => setActiveField("monthlySalary")}
              onBlur={() => setActiveField(null)}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
            <Field
              id="early_retirement_age"
              label="Early Retirement Age"
              value={formState.earlyRetirementAge}
              onChange={(value) => updateField("earlyRetirementAge", value)}
              onFocus={() => setActiveField("earlyRetirementAge")}
              onBlur={() => setActiveField(null)}
              min="18"
              max="100"
              required
            />
            <Field
              id="mortgage_payoff_age"
              label="Mortgage Payoff Age"
              value={formState.mortgagePayoffAge}
              onChange={(value) => updateField("mortgagePayoffAge", value)}
              onFocus={() => setActiveField("mortgagePayoffAge")}
              onBlur={() => setActiveField(null)}
              min="18"
              max="100"
              placeholder="Optional"
            />
            <Field
              id="mortgage_monthly_deduction"
              label="Monthly OA Mortgage Deduction"
              value={formState.mortgageMonthlyDeduction}
              onChange={(value) => updateField("mortgageMonthlyDeduction", value)}
              onFocus={() => setActiveField("mortgageMonthlyDeduction")}
              onBlur={() => setActiveField(null)}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
            <ToggleField
              id="frs_met_for_ma_overflow"
              label="FRS already met for MA overflow"
              description="From age 55, excess MA goes to RA until FRS is met, then to OA."
              checked={formState.frsMetForMaOverflow}
              onChange={(checked) => updateField("frsMetForMaOverflow", checked)}
            />
          </div>
        </div>

        <div className="space-y-5 rounded-[1.5rem] border border-slate-800/80 bg-slate-950 p-4 text-white shadow-sm">
          <div>
            <p className="text-sm font-semibold text-white">
              Interest Assumptions
            </p>
            <p className="text-sm text-white/65">
              Base annual rates used in the projection engine.
            </p>
          </div>

          <div className="grid gap-4">
            <RateField
              id="oa_interest_rate"
              label="OA Interest Rate (%)"
              value={formState.oaInterestRate}
              onChange={(value) => updateField("oaInterestRate", value)}
              onFocus={() => setActiveField("oaInterestRate")}
              onBlur={() => setActiveField(null)}
              tone="from-amber-300/25 to-orange-500/10"
            />
            <RateField
              id="sa_interest_rate"
              label="SA Interest Rate (%)"
              value={formState.saInterestRate}
              onChange={(value) => updateField("saInterestRate", value)}
              onFocus={() => setActiveField("saInterestRate")}
              onBlur={() => setActiveField(null)}
              tone="from-emerald-300/25 to-teal-500/10"
            />
            <RateField
              id="ma_interest_rate"
              label="MA Interest Rate (%)"
              value={formState.maInterestRate}
              onChange={(value) => updateField("maInterestRate", value)}
              onFocus={() => setActiveField("maInterestRate")}
              onBlur={() => setActiveField(null)}
              tone="from-sky-300/25 to-cyan-500/10"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
            Projection horizon now lives in the CPF projection section so this panel stays
            focused on persistent account assumptions.
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  min,
  max,
  step,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  min?: string;
  max?: string;
  step?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-slate-700">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
        className="border-slate-200 bg-white/90 shadow-sm"
      />
    </div>
  );
}

function RateField({
  id,
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  tone,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-linear-to-r ${tone} p-3`}>
      <Label htmlFor={id} className="text-white/80">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        required
        className="mt-2 border-white/10 bg-white/10 text-white placeholder:text-white/40"
      />
    </div>
  );
}

function ToggleField({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm sm:col-span-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
      />
      <div>
        <Label htmlFor={id} className="cursor-pointer text-slate-900">
          {label}
        </Label>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

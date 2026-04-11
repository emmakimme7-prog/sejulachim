"use client";

import { useState } from "react";
import { ChevronDown, DollarSign, Heart, House, Newspaper, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldHint, SelectInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { MAIN_INTERESTS, SUB_INTERESTS, type MainInterest } from "@/lib/content/sub-interests";
import { cn } from "@/lib/utils";

const deliveryTimes = ["07:00", "08:00", "09:00"] as const;
const INTEREST_ICON_COMPONENTS = {
  건강: Heart,
  돈: DollarSign,
  실생활: House,
  뉴스: Newspaper,
  관계: Users
} as const;

export function AccountInterestsForm({
  initialInterests,
  initialSubInterests,
  initialDeliveryTime,
  mainInterests = [...MAIN_INTERESTS],
  subInterestOptions = SUB_INTERESTS,
  interestLabels = Object.fromEntries(MAIN_INTERESTS.map((interest) => [interest, interest])) as Record<string, string>,
  submitUrl = "/api/account/preferences",
  submitLabel = "관심주제 저장하기",
  successMessage = "관심주제와 발송 시간이 저장되었습니다."
}: {
  initialInterests: string[];
  initialSubInterests: Record<string, string>;
  initialDeliveryTime: string;
  mainInterests?: string[];
  subInterestOptions?: Record<string, string[]>;
  interestLabels?: Record<string, string>;
  submitUrl?: string;
  submitLabel?: string;
  successMessage?: string;
}) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialInterests);
  const [subInterests, setSubInterests] = useState<Record<string, string>>(initialSubInterests);
  const [deliveryTime, setDeliveryTime] = useState<(typeof deliveryTimes)[number]>(
    deliveryTimes.includes(initialDeliveryTime as (typeof deliveryTimes)[number]) ? (initialDeliveryTime as (typeof deliveryTimes)[number]) : "08:00"
  );
  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  function toggleInterest(interest: string) {
    setStatus("");

    setSelectedInterests((current) => {
      if (current.includes(interest)) {
        setSubInterests((prev) => {
          const next = { ...prev };
          delete next[interest];
          return next;
        });
        return current.filter((item) => item !== interest);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, interest];
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    try {
      const response = await fetch(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          interests: selectedInterests,
          subInterests,
          deliveryTime
        })
      });

      const payload = (await response.json()) as { error?: string; ok?: boolean };
      if (!response.ok || !payload.ok) {
        setStatus(payload.error ?? "설정을 저장하지 못했습니다.");
        return;
      }

      setStatus(successMessage);
    } catch {
      setStatus("네트워크 문제로 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-2xl font-bold tracking-[-0.03em] text-navy-900 md:text-[36px]">딱 3가지를 골라주세요.</h3>
          <p className="mt-3 text-base leading-7 text-navy-700">신청 페이지와 같은 방식으로 지금 받고 있는 주제를 다시 고를 수 있습니다.</p>
        </div>
        <p className="inline-block rounded-full bg-navy-50 px-4 py-2 text-sm font-semibold text-navy-500">선택 수 {selectedInterests.length}/3</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {mainInterests.map((interest) => {
          const active = selectedInterests.includes(interest);
          const Icon = INTEREST_ICON_COMPONENTS[interest as MainInterest] ?? Newspaper;

          return (
            <div
              key={interest}
              className={cn(
                "w-full rounded-[28px] border px-6 py-6 text-left transition duration-150",
                active
                  ? "border-orange-500 bg-orange-50/60 text-navy-900 shadow-[inset_0_0_0_1px_rgba(229,124,35,0.08)]"
                  : "border-navy-100 bg-white text-navy-800 hover:border-navy-300 hover:bg-navy-50"
              )}
            >
              <button
                type="button"
                onClick={() => toggleInterest(interest)}
                className="flex w-full items-center justify-between gap-4 text-left focus:outline-none"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-orange-500 shadow-sm">
                    <Icon className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span className="block text-[34px] font-extrabold tracking-[-0.04em]">{interestLabels[interest]}</span>
                </div>
                <ChevronDown
                  className={cn("h-6 w-6 shrink-0 text-orange-500 transition-transform", active ? "rotate-180" : "rotate-0")}
                  aria-hidden="true"
                />
              </button>

              {active ? (
                <div className="mt-5 border-t border-orange-100 pt-5">
                  <span className="mb-3 block text-sm font-semibold text-navy-700">{interestLabels[interest]} 세부 관심</span>
                  <div className="relative">
                    <SelectInput
                      value={subInterests[interest] ?? ""}
                      onChange={(event) =>
                        setSubInterests((prev) => ({
                          ...prev,
                          [interest]: event.target.value
                        }))
                      }
                      className="min-h-12 rounded-2xl bg-white pr-14 appearance-none"
                    >
                      <option value="">선택 안 함</option>
                      {(subInterestOptions[interest] ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </SelectInput>
                    <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-500" aria-hidden="true" />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <FieldHint>관심사는 중복 없이 3개를 골라주세요.</FieldHint>

      <div className="grid gap-3">
        <span className="block text-sm font-semibold text-orange-500">소식 받아보실 시간</span>
        <div className="grid w-full gap-3 sm:grid-cols-3">
          {deliveryTimes.map((time) => {
            const active = deliveryTime === time;
            return (
              <button
                key={time}
                type="button"
                onClick={() => setDeliveryTime(time)}
                className={cn(
                  "min-h-14 rounded-3xl border px-5 py-4 text-left text-lg font-bold transition",
                  active
                    ? "border-orange-500 bg-orange-50 text-navy-900 shadow-[inset_0_0_0_1px_rgba(229,124,35,0.08)]"
                    : "border-navy-100 bg-white text-navy-800 hover:border-navy-300 hover:bg-navy-50"
                )}
              >
                오전 {time}
              </button>
            );
          })}
        </div>
      </div>

      {status ? (
        <Notice tone={status.includes("저장") && !status.includes("못") ? "success" : "error"}>{status}</Notice>
      ) : null}

      <Button type="submit" size="lg" fullWidth disabled={submitting || selectedInterests.length !== 3}>
        {submitting ? "저장 중입니다..." : submitLabel}
      </Button>
    </form>
  );
}

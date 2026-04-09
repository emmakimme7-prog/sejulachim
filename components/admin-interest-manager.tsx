"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

type CategoryRow = {
  key: string;
  label: string;
  subInterests: string[];
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .slice(0, 40);
}

export function AdminInterestManager({
  initialCategories
}: {
  initialCategories: CategoryRow[];
}) {
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);
  const [status, setStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  function updateCategory(index: number, next: Partial<CategoryRow>) {
    setCategories((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const updated = { ...item, ...next };
        if (next.label && (!item.key || item.key.startsWith("custom-"))) {
          updated.key = `custom-${slugify(next.label) || index + 1}`;
        }
        return updated;
      })
    );
  }

  function moveCategory(index: number, direction: -1 | 1) {
    setCategories((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function addCategory() {
    if (categories.length >= 7) return;
    setCategories((current) => [
      ...current,
      {
        key: `custom-${Date.now()}`,
        label: "",
        subInterests: [""]
      }
    ]);
  }

  function removeCategory(index: number) {
    setCategories((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateSubInterest(categoryIndex: number, subIndex: number, value: string) {
    setCategories((current) =>
      current.map((item, itemIndex) =>
        itemIndex === categoryIndex
          ? {
              ...item,
              subInterests: item.subInterests.map((subItem, subItemIndex) => (subItemIndex === subIndex ? value : subItem))
            }
          : item
      )
    );
  }

  function addSubInterest(categoryIndex: number) {
    setCategories((current) =>
      current.map((item, itemIndex) =>
        itemIndex === categoryIndex && item.subInterests.length < 5
          ? { ...item, subInterests: [...item.subInterests, ""] }
          : item
      )
    );
  }

  function removeSubInterest(categoryIndex: number, subIndex: number) {
    setCategories((current) =>
      current.map((item, itemIndex) =>
        itemIndex === categoryIndex
          ? { ...item, subInterests: item.subInterests.filter((_, index) => index !== subIndex) }
          : item
      )
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const normalizedCategories = categories
      .map((item, index) => ({
        key: item.key || `custom-${slugify(item.label) || index + 1}`,
        label: item.label.trim(),
        subInterests: item.subInterests.map((sub) => sub.trim()).filter(Boolean).slice(0, 5),
        order: index
      }))
      .filter((item) => item.label);

    if (normalizedCategories.length === 0) {
      setStatus("대분류를 하나 이상 설정해주세요.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/interests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          categories: normalizedCategories
        })
      });
      const payload = (await response.json()) as { error?: string; ok?: boolean };
      if (!response.ok || !payload.ok) {
        setStatus(payload.error ?? "관심사 설정을 저장하지 못했습니다.");
        return;
      }
      setStatus("관심사 설정이 저장되었습니다.");
    } catch {
      setStatus("관심사 설정을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm leading-7 text-navy-600">대분류는 최대 7개, 세부 관심사는 각 대분류당 최대 5개까지 설정할 수 있습니다.</p>
        <Button type="button" size="sm" onClick={addCategory} disabled={categories.length >= 7}>
          <Plus className="mr-1 h-4 w-4" />
          대분류 추가
        </Button>
      </div>

      <div className="space-y-4">
        {categories.map((category, categoryIndex) => (
          <div key={`${category.key}-${categoryIndex}`} className="rounded-[24px] border border-navy-100 bg-navy-50/40 p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="space-y-3">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-navy-700">대분류 이름</span>
                  <TextInput
                    value={category.label}
                    onChange={(event) => updateCategory(categoryIndex, { label: event.target.value })}
                    placeholder="예: 건강"
                  />
                </label>
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-navy-700">세부 관심사</span>
                  <div className="flex flex-wrap gap-3">
                    {category.subInterests.map((subInterest, subIndex) => (
                      <div key={`${category.key}-${subIndex}`} className="flex items-center gap-2">
                        <TextInput
                          value={subInterest}
                          onChange={(event) => updateSubInterest(categoryIndex, subIndex, event.target.value)}
                          placeholder={`세부 관심사 ${subIndex + 1}`}
                          className="min-h-12 min-w-[180px] rounded-2xl"
                        />
                        <button
                          type="button"
                          onClick={() => removeSubInterest(categoryIndex, subIndex)}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-600"
                          aria-label="세부 관심사 삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addSubInterest(categoryIndex)}
                    disabled={category.subInterests.length >= 5}
                    className="rounded-full border border-navy-200 bg-white px-4 py-2 text-sm font-semibold text-navy-700"
                  >
                    세부 관심사 추가
                  </button>
                </div>
              </div>
              <div className="flex gap-2 lg:flex-col">
                <button type="button" onClick={() => moveCategory(categoryIndex, -1)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-navy-200 bg-white text-navy-700" aria-label="위로 이동">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => moveCategory(categoryIndex, 1)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-navy-200 bg-white text-navy-700" aria-label="아래로 이동">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => removeCategory(categoryIndex)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-600" aria-label="대분류 삭제">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {status ? <Notice tone={status.includes("못") ? "error" : "success"}>{status}</Notice> : null}

      <Button type="submit" size="lg" disabled={saving}>
        {saving ? "저장 중입니다..." : "관심사 저장"}
      </Button>
    </form>
  );
}

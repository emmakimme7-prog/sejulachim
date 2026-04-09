"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, TextInput } from "@/components/ui/field";

export function ResetPasswordRequestForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail);

  return (
    <form method="post" action="/api/auth/password/reset/request" className="mt-8 grid gap-4">
      <Field>
        <FieldLabel>이메일 입력</FieldLabel>
        <TextInput
          required
          type="text"
          inputMode="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Button type="submit" size="lg" fullWidth>비밀번호 재설정</Button>
    </form>
  );
}

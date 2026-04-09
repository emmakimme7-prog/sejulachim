import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[32px] border border-navy-100/90 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-8 md:p-10", className)}>{children}</div>;
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold tracking-[0.18em] text-orange-500">{children}</p>;
}

export function PageIntro({
  eyebrow,
  title,
  description,
  className
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h1 className="mt-3 text-4xl font-extrabold leading-[1.28] tracking-[-0.04em] text-navy-900 md:text-5xl">
        {title}
      </h1>
      {description ? <p className="mt-4 text-lg leading-8 text-navy-700">{description}</p> : null}
    </div>
  );
}

export function SoftCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-[28px] border border-navy-100 bg-white p-6 shadow-calm", className)}>{children}</div>;
}

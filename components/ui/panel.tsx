import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6 md:p-8", className)}>{children}</div>;
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold tracking-[0.18em] text-orange-500 uppercase">{children}</p>;
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
      <h1 className="mt-3 text-3xl font-extrabold leading-[1.25] tracking-[-0.03em] text-gray-900 md:text-[40px]">
        {title}
      </h1>
      {description ? <p className="mt-4 text-lg leading-8 text-gray-600">{description}</p> : null}
    </div>
  );
}

export function SoftCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("bg-white p-[18px]", className)}
      style={{
        borderRadius: 18,
        border: "1.5px solid #F2E6D7",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      {children}
    </div>
  );
}

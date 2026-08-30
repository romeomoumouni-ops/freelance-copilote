import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Supprime le padding par défaut (p-5 sm:p-6) */
  flush?: boolean;
  hover?: boolean;
};

export default function Card({ children, className, flush, hover, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-line bg-white shadow-card",
        !flush && "p-5 sm:p-6",
        hover && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

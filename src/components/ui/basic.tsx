import * as React from "react";
import { cn } from "../../lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "solid", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-all duration-150",
        "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick",
        variant === "solid" &&
          "bg-ink text-paper hover:bg-[#2c2823] shadow-[0_2px_8px_rgba(28,26,23,0.18)]",
        variant === "outline" &&
          "border border-line bg-transparent text-ink hover:bg-paper2",
        variant === "ghost" && "bg-transparent text-ink hover:bg-paper2",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-line bg-paper2 px-3.5 text-sm text-ink",
        "placeholder:text-inksoft focus:outline-none focus:ring-2 focus:ring-brick focus:bg-paper",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

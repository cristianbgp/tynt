import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 border-l border-border px-4 font-mono text-[13px] outline-none transition-colors focus-visible:bg-foreground focus-visible:text-background disabled:cursor-wait disabled:text-muted-foreground",
  {
    variants: {
      variant: {
        default: "enabled:hover:bg-foreground enabled:hover:text-background",
        active: "bg-foreground text-background enabled:hover:bg-[#555555]",
        control: "size-10 border border-foreground p-0 enabled:hover:bg-[#555555] enabled:hover:text-background data-[pressed=true]:bg-foreground data-[pressed=true]:text-background data-[pressed=true]:hover:bg-foreground data-[pressed=true]:hover:text-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Button({
  className,
  variant,
  type = "button",
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant }), className)}
      data-cuelume-hover="tick"
      data-cuelume-press=""
      data-cuelume-release=""
      {...props}
    />
  );
}

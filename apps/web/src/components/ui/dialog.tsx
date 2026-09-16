import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />;
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />;
}

function DialogContent({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-80 bg-[rgb(0_0_0/58%)]" />
      <DialogPrimitive.Content
        className={cn(
          "dialog-content fixed top-1/2 left-1/2 z-81 w-[min(520px,calc(100vw-28px))] -translate-x-1/2 -translate-y-1/2 border border-foreground bg-background text-foreground max-[560px]:inset-x-0 max-[560px]:top-auto max-[560px]:bottom-0 max-[560px]:max-h-[calc(100dvh-16px)] max-[560px]:w-full max-[560px]:translate-x-0 max-[560px]:translate-y-0 max-[560px]:overflow-y-auto max-[560px]:overscroll-contain max-[560px]:border-x-0 max-[560px]:border-b-0 max-[560px]:pb-[env(safe-area-inset-bottom)]",
          className,
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}

const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;
const DialogClose = DialogPrimitive.Close;

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger };

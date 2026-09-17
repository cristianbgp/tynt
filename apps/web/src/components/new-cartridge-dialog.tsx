import { Close } from "pixelarticons/react";
import type { CartridgeTemplate } from "@/cartridges/templates";
import { CARTRIDGE_TEMPLATES } from "@/cartridges/templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewCartridgeDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  onSelect(template: CartridgeTemplate): void;
}

export function NewCartridgeDialog({ open, onOpenChange, onSelect }: NewCartridgeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(680px,calc(100vw-28px))]"
        aria-describedby="new-cartridge-description"
      >
        <div className="flex min-h-[64px] items-stretch justify-between border-b border-border">
          <div className="grid content-center gap-[4px] px-[16px] py-[10px]">
            <DialogTitle className="m-0 text-[16px]">New cartridge</DialogTitle>
            <DialogDescription
              className="m-0 text-[11px] text-muted-foreground"
              id="new-cartridge-description"
            >
              Choose a small starting point for your game.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button className="w-[48px] p-0" aria-label="Close new cartridge">
              <Close width={24} height={24} aria-hidden="true" />
            </Button>
          </DialogClose>
        </div>
        <p className="m-0 border-b border-border px-[16px] py-[12px] text-[11px] text-muted-foreground">
          Choosing a template replaces the current editor draft. Save or export it first if you want
          to keep a separate copy.
        </p>
        <div className="grid grid-cols-2 max-[560px]:grid-cols-1">
          {CARTRIDGE_TEMPLATES.map((template) => (
            <Button
              className="min-h-[88px] items-start justify-start border-b border-l-0 p-[16px] text-left last:col-span-full last:border-r-0 last:border-b-0 odd:border-r max-[560px]:col-span-1 max-[560px]:border-r-0"
              key={template.id}
              aria-label={`Start with ${template.name}`}
              onClick={() => onSelect(template)}
            >
              <span className="grid gap-[6px]">
                <strong className="text-[13px] font-semibold">{template.name}</strong>
                <span className="text-[10px] leading-normal text-muted-foreground">
                  {template.description}
                </span>
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

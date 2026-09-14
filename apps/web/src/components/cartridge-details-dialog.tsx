import { useEffect, useState, type FormEvent } from "react";
import { validateDraft, type Draft } from "@tynt/core";
import { play } from "cuelume";
import { Close } from "pixelarticons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface CartridgeDetailsDialogProps {
  open: boolean;
  draft: Draft;
  onOpenChange(open: boolean): void;
  onSave(draft: Draft): void;
}

export function CartridgeDetailsDialog({ open, draft, onOpenChange, onSave }: CartridgeDetailsDialogProps) {
  const [fields, setFields] = useState(draft);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setFields(draft);
    setError("");
  }, [draft, open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const valid = validateDraft(fields);
      onSave(valid);
      onOpenChange(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      play("error");
    }
  };

  const update = (key: "title" | "author" | "description" | "controls", value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="cartridge-details-description">
        <div className="dialog-heading flex min-h-[64px] items-stretch justify-between border-b border-border">
          <div className="grid content-center gap-[4px] px-[16px] py-[10px]">
            <DialogTitle className="m-0 text-[16px]">Cartridge details</DialogTitle>
            <DialogDescription className="m-0 text-[11px] text-muted-foreground" id="cartridge-details-description">tynt cartridge · format v1 · all fields required to export</DialogDescription>
          </div>
          <DialogClose asChild>
            <Button className="dialog-close w-[48px] p-0" aria-label="Close details">
              <Close width={24} height={24} aria-hidden="true" />
            </Button>
          </DialogClose>
        </div>
        <form className="details-form grid gap-[16px] p-[18px]" onSubmit={submit}>
          <label className="grid gap-[7px] text-[11px]">
            <span>Title</span>
            <input className="w-full border border-border bg-background px-[12px] py-[10px] font-[inherit] text-foreground outline-none focus:border-foreground focus:shadow-[inset_0_0_0_1px_var(--foreground)]" autoFocus value={fields.title} onChange={(event) => update("title", event.target.value)} />
          </label>
          <label className="grid gap-[7px] text-[11px]">
            <span>Author</span>
            <input className="w-full border border-border bg-background px-[12px] py-[10px] font-[inherit] text-foreground outline-none focus:border-foreground focus:shadow-[inset_0_0_0_1px_var(--foreground)]" value={fields.author ?? ""} onChange={(event) => update("author", event.target.value)} placeholder="Your name" />
          </label>
          <label className="grid gap-[7px] text-[11px]">
            <span>Description</span>
            <textarea className="min-h-[88px] w-full resize-y border border-border bg-background px-[12px] py-[10px] font-[inherit] text-foreground outline-none focus:border-foreground focus:shadow-[inset_0_0_0_1px_var(--foreground)]" value={fields.description ?? ""} onChange={(event) => update("description", event.target.value)} placeholder="What is this cartridge?" />
          </label>
          <label className="grid gap-[7px] text-[11px]">
            <span>Controls</span>
            <input className="w-full border border-border bg-background px-[12px] py-[10px] font-[inherit] text-foreground outline-none focus:border-foreground focus:shadow-[inset_0_0_0_1px_var(--foreground)]" value={fields.controls ?? ""} onChange={(event) => update("controls", event.target.value)} placeholder="Arrows move · A jumps" />
          </label>
          {error ? <p className="form-error m-0 text-[11px] text-[var(--error)]" role="alert">{error}</p> : null}
          <div className="dialog-actions -mx-[18px] -mb-[18px] mt-[2px] flex justify-end border-t border-border">
            <DialogClose asChild><Button>Cancel</Button></DialogClose>
            <Button type="submit" variant="active">Save details</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

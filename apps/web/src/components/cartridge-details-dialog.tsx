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
        <div className="dialog-heading">
          <div>
            <DialogTitle>Cartridge details</DialogTitle>
            <DialogDescription id="cartridge-details-description">tynt cartridge · format v1 · all fields required to export</DialogDescription>
          </div>
          <DialogClose asChild>
            <Button className="dialog-close" aria-label="Close details">
              <Close width={24} height={24} aria-hidden="true" />
            </Button>
          </DialogClose>
        </div>
        <form className="details-form" onSubmit={submit}>
          <label>
            <span>Title</span>
            <input autoFocus value={fields.title} onChange={(event) => update("title", event.target.value)} />
          </label>
          <label>
            <span>Author</span>
            <input value={fields.author ?? ""} onChange={(event) => update("author", event.target.value)} placeholder="Your name" />
          </label>
          <label>
            <span>Description</span>
            <textarea value={fields.description ?? ""} onChange={(event) => update("description", event.target.value)} placeholder="What is this cartridge?" />
          </label>
          <label>
            <span>Controls</span>
            <input value={fields.controls ?? ""} onChange={(event) => update("controls", event.target.value)} placeholder="Arrows move · A jumps" />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="dialog-actions">
            <DialogClose asChild><Button>Cancel</Button></DialogClose>
            <Button type="submit" variant="active">Save details</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

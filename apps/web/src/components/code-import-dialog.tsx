import { Download } from "pixelarticons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CodeImportDialogProps {
  description: string;
  error: string;
  importLabel: string;
  inputLabel: string;
  open: boolean;
  title: string;
  triggerClassName?: string;
  triggerLabel: string;
  value: string;
  onImport(): void;
  onOpenChange(open: boolean): void;
  onValueChange(value: string): void;
}

export function CodeImportDialog({
  description,
  error,
  importLabel,
  inputLabel,
  open,
  title,
  triggerClassName,
  triggerLabel,
  value,
  onImport,
  onOpenChange,
  onValueChange,
}: CodeImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className={triggerClassName} aria-label={title}>
          <Download width={24} height={24} aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <header className="border-b border-border p-4">
          <DialogTitle className="text-lg font-medium">{title}</DialogTitle>
          <DialogDescription className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </header>
        <div className="grid gap-3 p-4">
          <textarea
            className="min-h-[220px] resize-y border border-border bg-muted p-3 font-mono text-xs leading-relaxed outline-none focus:border-foreground"
            aria-label={inputLabel}
            autoFocus
            spellCheck={false}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
          />
          {error ? (
            <p className="m-0 text-xs font-medium" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 border-t border-border">
          <DialogClose asChild>
            <Button className="min-h-[41px] border-l-0">Cancel</Button>
          </DialogClose>
          <Button className="min-h-[41px]" aria-label={importLabel} onClick={onImport}>
            Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

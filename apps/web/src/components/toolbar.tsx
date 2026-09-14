import type { ChangeEventHandler, ReactNode, RefObject } from "react";
import { BookOpen, ChevronDown, Download, GalleryThumbnails, Gamepad, Image, InfoBox, Play, Save, Stop, Upload } from "pixelarticons/react";
import { Link } from "react-router";
import { BrandLink } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ActionProps {
  id: string;
  label: string;
  shortcut: string;
  hint: string;
  active?: boolean;
  disabled?: boolean;
  icon: ReactNode;
  onClick(): void;
}

function Action({ id, label, shortcut, hint, active, disabled, icon, onClick }: ActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          id={id}
          aria-label={label}
          aria-keyshortcuts={shortcut}
          variant={active ? "active" : "default"}
          disabled={disabled}
          onClick={onClick}
        >
          {icon}
          <span>{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

interface ToolbarProps {
  filename: string;
  examples: readonly { id: string; filename: string }[];
  running: boolean;
  compiling: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onExampleChange(id: string): void;
  onRun(): void;
  onSave(): void;
  onPlay(): void;
  onDetails(): void;
  onImport(): void;
  onExport(): void;
  onFileChange: ChangeEventHandler<HTMLInputElement>;
}

export function Toolbar(props: ToolbarProps) {
  return (
    <header className="topbar">
      <BrandLink />
      <div className="file-controls">
        <span id="filename" className="filename" aria-label="Current cartridge file">{props.filename}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Examples"
              className="example-trigger"
              data-cuelume-hover="tick"
              data-cuelume-press=""
              data-cuelume-release=""
            >
              <Gamepad width={24} height={24} data-icon="gamepad" aria-hidden="true" />
              <span>Examples</span>
              <ChevronDown width={24} height={24} data-icon="chevron-down" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {props.examples.map((example) => (
              <DropdownMenuItem
                key={example.id}
                onSelect={() => props.onExampleChange(example.id)}
              >
                {example.filename}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Link
          className="gallery-link"
          to="/gallery"
          data-cuelume-hover="tick"
          data-cuelume-press=""
          data-cuelume-release=""
        >
          <GalleryThumbnails width={24} height={24} data-icon="gallery" aria-hidden="true" />
          <span>Gallery</span>
        </Link>
        <Link
          className="gallery-link"
          to="/library"
          data-cuelume-hover="tick"
          data-cuelume-press=""
          data-cuelume-release=""
        >
          <BookOpen width={24} height={24} data-icon="library" aria-hidden="true" />
          <span>Library</span>
        </Link>
        <Link className="gallery-link" to="/sprites" data-cuelume-hover="tick" data-cuelume-press="" data-cuelume-release="">
          <Image width={24} height={24} data-icon="sprites" aria-hidden="true" />
          <span>Sprites</span>
        </Link>
      </div>
      <nav className="actions" aria-label="Cartridge actions">
        <Action
          id="run-button"
          label={props.running ? "Stop" : "Run"}
          shortcut="Control+Shift+Enter"
          hint="Run or rerun · Ctrl Shift Enter"
          active={props.running}
          disabled={props.compiling}
          icon={props.running
            ? <Stop width={24} height={24} data-icon="stop" aria-hidden="true" />
            : <Play width={24} height={24} data-icon="play" aria-hidden="true" />}
          onClick={props.onRun}
        />
        <Action
          id="save-button"
          label="Save"
          shortcut=""
          hint="Save to library"
          icon={<Save width={24} height={24} data-icon="save" aria-hidden="true" />}
          onClick={props.onSave}
        />
        <Action
          id="play-button"
          label="Play"
          shortcut=""
          hint="Save and open play mode"
          icon={<Gamepad width={24} height={24} data-icon="play-mode" aria-hidden="true" />}
          onClick={props.onPlay}
        />
        <Action
          id="details-button"
          label="Details"
          shortcut=""
          hint="Edit cartridge details"
          icon={<InfoBox width={24} height={24} data-icon="details" aria-hidden="true" />}
          onClick={props.onDetails}
        />
        <Action
          id="import-button"
          label="Import"
          shortcut="Control+O Meta+O"
          hint="Import · Ctrl/⌘ O"
          icon={<Upload width={24} height={24} data-icon="upload" aria-hidden="true" />}
          onClick={props.onImport}
        />
        <Action
          id="export-button"
          label="Export"
          shortcut="Control+S Meta+S"
          hint="Export · Ctrl/⌘ S"
          icon={<Download width={24} height={24} data-icon="download" aria-hidden="true" />}
          onClick={props.onExport}
        />
        <input
          ref={props.fileInputRef}
          id="file-input"
          type="file"
          accept=".tynt,application/json"
          hidden
          aria-hidden="true"
          tabIndex={-1}
          onChange={props.onFileChange}
        />
      </nav>
    </header>
  );
}

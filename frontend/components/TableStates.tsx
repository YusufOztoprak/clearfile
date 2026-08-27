import { AlertTriangle, Loader2, type LucideIcon } from "lucide-react";

// Shared loading/empty/error building blocks, used across dashboard, review,
// archive, audit, and upload. Two flavors of each:
//  - the "State" versions are plain <div>s, for non-table contexts
//    (widgets, lists of cards, the review queue, the upload panels...)
//  - the "Row" versions wrap the same markup in a <tr><td colSpan> for use
//    directly inside a <tbody>.
// Keeping one definition means a style tweak (spacing, icon size, wording
// pattern) only has to happen in one place instead of five almost-identical
// copies drifting apart over time.

type StateProps = {
  className?: string;
};

export function LoadingState({ className = "p-10" }: StateProps) {
  return (
    <div className={`flex items-center justify-center text-muted-foreground ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  );
}

export function ErrorState({ message, className = "p-4" }: StateProps & { message: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-destructive ${className}`}>
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  message,
  className = "p-10",
}: StateProps & { icon: LucideIcon; message: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 text-center text-muted-foreground ${className}`}>
      <Icon className="h-6 w-6" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <LoadingState />
      </td>
    </tr>
  );
}

export function ErrorRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <ErrorState message={message} className="p-6" />
      </td>
    </tr>
  );
}

export function EmptyRow({
  colSpan,
  icon,
  message,
}: {
  colSpan: number;
  icon: LucideIcon;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState icon={icon} message={message} />
      </td>
    </tr>
  );
}
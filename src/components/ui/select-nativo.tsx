import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Select nativo estilizado — integra directamente com react-hook-form (register).
 * Para casos com pesquisa/combobox, usar o Radix Select mais tarde.
 */
const SelectNativo = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
SelectNativo.displayName = "SelectNativo";

export { SelectNativo };

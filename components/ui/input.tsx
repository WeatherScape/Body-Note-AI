import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-line bg-white px-4 text-base text-ink outline-none transition placeholder:text-gray-400 focus:border-apple focus:ring-4 focus:ring-blue-100",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-gray-400 focus:border-apple focus:ring-4 focus:ring-blue-100",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-2xl border border-line bg-white px-4 text-base text-ink outline-none transition focus:border-apple focus:ring-4 focus:ring-blue-100",
        className
      )}
      {...props}
    />
  );
}

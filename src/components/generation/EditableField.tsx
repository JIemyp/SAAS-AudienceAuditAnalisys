"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  className?: string;
  label?: string;
}

export function EditableField({
  value,
  onSave,
  multiline = false,
  rows = 3,
  className,
  label,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {label}
          </label>
        )}
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            rows={rows}
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            autoFocus
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
          >
            <Check className="w-4 h-4" /> Save
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group relative", className)}>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white text-slate-500 rounded-lg hover:bg-slate-100 hover:text-blue-600 shadow-sm border"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      {label && (
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
          {label}
        </span>
      )}
      <p className={cn("text-sm text-slate-700 leading-relaxed", multiline && "whitespace-pre-wrap")}>
        {value}
      </p>
    </div>
  );
}

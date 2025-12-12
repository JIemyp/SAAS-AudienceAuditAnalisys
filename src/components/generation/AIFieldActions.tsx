"use client";

import { useState } from "react";
import { Pencil, RefreshCw, Sparkles, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AIFieldActionsProps {
  fieldName: string;
  fieldValue: string;
  onEdit: (newValue: string) => void;
  onRegenerate?: () => Promise<string>;
  regenerateEndpoint?: string;
  regeneratePayload?: Record<string, unknown>;
  className?: string;
  editType?: "input" | "textarea";
  rows?: number;
  placeholder?: string;
  showAlways?: boolean;
}

export function AIFieldActions({
  fieldName,
  fieldValue,
  onEdit,
  onRegenerate,
  regenerateEndpoint,
  regeneratePayload,
  className,
  editType = "textarea",
  rows = 3,
  placeholder,
  showAlways = false,
}: AIFieldActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editValue, setEditValue] = useState(fieldValue);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    onEdit(editValue);
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleCancel = () => {
    setEditValue(fieldValue);
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    if (!onRegenerate && !regenerateEndpoint) return;

    try {
      setIsRegenerating(true);

      let newValue: string;

      if (onRegenerate) {
        newValue = await onRegenerate();
      } else if (regenerateEndpoint) {
        const res = await fetch(regenerateEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...regeneratePayload,
            fieldName,
            currentValue: fieldValue,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        newValue = data.value;
      } else {
        return;
      }

      onEdit(newValue);
      setEditValue(newValue);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error("Regeneration failed:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const canRegenerate = onRegenerate || regenerateEndpoint;

  return (
    <div className={cn("group relative", className)}>
      {/* Action buttons - always visible or on hover */}
      <div
        className={cn(
          "absolute -top-2 right-0 flex items-center gap-1 z-10 transition-opacity",
          showAlways ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        {/* Success indicator */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium"
            >
              <Check className="w-3 h-3" />
              Saved
            </motion.div>
          )}
        </AnimatePresence>

        {!isEditing && !isRegenerating && (
          <>
            {/* Edit button */}
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 shadow-sm border border-slate-200 transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            {/* AI Regenerate button */}
            {canRegenerate && (
              <button
                onClick={handleRegenerate}
                className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-purple-50 hover:text-purple-600 shadow-sm border border-slate-200 transition-colors"
                title="Regenerate with AI"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}

        {isRegenerating && (
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            Regenerating...
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          {editType === "input" ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-blue-50/50"
              placeholder={placeholder}
              autoFocus
            />
          ) : (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-blue-50/50 resize-none"
              rows={rows}
              placeholder={placeholder}
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-xs font-medium transition-colors"
            >
              <Check className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-xs font-medium transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="pr-20">{fieldValue}</div>
      )}
    </div>
  );
}

// Simplified inline edit button for cards
interface EditButtonProps {
  onClick: () => void;
  className?: string;
  showAlways?: boolean;
}

export function EditButton({ onClick, className, showAlways = false }: EditButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "p-1.5 bg-white text-slate-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 shadow-sm border border-slate-200 transition-all",
        showAlways ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        className
      )}
      title="Edit"
    >
      <Pencil className="w-4 h-4" />
    </button>
  );
}

interface RegenerateButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
  showAlways?: boolean;
  size?: "sm" | "md";
}

export function RegenerateButton({
  onClick,
  isLoading = false,
  className,
  showAlways = false,
  size = "sm"
}: RegenerateButtonProps) {
  const sizeClasses = {
    sm: "p-1.5",
    md: "px-3 py-1.5 gap-1.5",
  };

  const iconSize = size === "sm" ? "w-4 h-4" : "w-4 h-4";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={isLoading}
      className={cn(
        "flex items-center bg-white text-slate-500 rounded-lg hover:bg-purple-50 hover:text-purple-600 shadow-sm border border-slate-200 transition-all disabled:opacity-50",
        sizeClasses[size],
        showAlways ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        className
      )}
      title="Regenerate with AI"
    >
      {isLoading ? (
        <Loader2 className={cn(iconSize, "animate-spin")} />
      ) : (
        <Sparkles className={iconSize} />
      )}
      {size === "md" && (
        <span className="text-xs font-medium">
          {isLoading ? "Regenerating..." : "Regenerate"}
        </span>
      )}
    </button>
  );
}

// Combined action bar for items
interface ItemActionsBarProps {
  onEdit: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
  isRegenerating?: boolean;
  showAlways?: boolean;
  className?: string;
}

export function ItemActionsBar({
  onEdit,
  onRegenerate,
  onDelete,
  isRegenerating = false,
  showAlways = false,
  className,
}: ItemActionsBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 transition-opacity",
        showAlways ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        className
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 shadow-sm border border-slate-200 transition-colors"
        title="Edit"
      >
        <Pencil className="w-4 h-4" />
      </button>

      {onRegenerate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRegenerate();
          }}
          disabled={isRegenerating}
          className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-purple-50 hover:text-purple-600 shadow-sm border border-slate-200 transition-colors disabled:opacity-50"
          title="Regenerate with AI"
        >
          {isRegenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </button>
      )}

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 shadow-sm border border-slate-200 transition-colors"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

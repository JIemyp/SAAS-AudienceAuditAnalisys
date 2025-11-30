"use client";

import { use, useState } from "react";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentGenerationPage } from "@/components/generation/SegmentGenerationPage";
import { CanvasDraft, EmotionalAspect, BehavioralPattern, BuyingSignal } from "@/types";
import { Palette, Heart, Activity, ShoppingCart, ChevronDown, ChevronUp, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { EditableField } from "@/components/generation/EditableField";

export default function CanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <SegmentGenerationPage<CanvasDraft>
      projectId={projectId}
      title="Pain Canvas"
      description="Deep dive into top pain points with emotional aspects, behavioral patterns, and buying signals. Complete this for each segment."
      stepType="canvas"
      generateEndpoint="/api/generate/canvas"
      approveEndpoint="/api/approve/canvas"
      draftTable="canvas_drafts"
      approvedTable="canvas"
      nextStepUrl="/generate/canvas-extended"
      icon={<Palette className="w-6 h-6" />}
      emptyStateMessage="Generate a comprehensive canvas analysis for each top pain point."
      renderDraft={(draft, onEdit) => (
        <CanvasDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function CanvasDraftView({
  draft,
  onEdit,
}: {
  draft: CanvasDraft;
  onEdit: (updates: Partial<CanvasDraft>) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["emotional", "behavioral", "buying"]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleEditEmotional = (index: number, updated: EmotionalAspect) => {
    const newAspects = [...(draft.emotional_aspects || [])];
    newAspects[index] = updated;
    onEdit({ emotional_aspects: newAspects });
  };

  const handleDeleteEmotional = (index: number) => {
    const newAspects = (draft.emotional_aspects || []).filter((_, i) => i !== index);
    onEdit({ emotional_aspects: newAspects });
  };

  const handleEditBehavioral = (index: number, updated: BehavioralPattern) => {
    const newPatterns = [...(draft.behavioral_patterns || [])];
    newPatterns[index] = updated;
    onEdit({ behavioral_patterns: newPatterns });
  };

  const handleDeleteBehavioral = (index: number) => {
    const newPatterns = (draft.behavioral_patterns || []).filter((_, i) => i !== index);
    onEdit({ behavioral_patterns: newPatterns });
  };

  const handleEditBuying = (index: number, updated: BuyingSignal) => {
    const newSignals = [...(draft.buying_signals || [])];
    newSignals[index] = updated;
    onEdit({ buying_signals: newSignals });
  };

  const handleDeleteBuying = (index: number) => {
    const newSignals = (draft.buying_signals || []).filter((_, i) => i !== index);
    onEdit({ buying_signals: newSignals });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <OverviewCard
          icon={<Heart className="w-5 h-5" />}
          label="Emotional Aspects"
          count={draft.emotional_aspects?.length || 0}
          color="rose"
        />
        <OverviewCard
          icon={<Activity className="w-5 h-5" />}
          label="Behavioral Patterns"
          count={draft.behavioral_patterns?.length || 0}
          color="purple"
        />
        <OverviewCard
          icon={<ShoppingCart className="w-5 h-5" />}
          label="Buying Signals"
          count={draft.buying_signals?.length || 0}
          color="emerald"
        />
      </div>

      <CollapsibleCard
        title="Emotional Aspects"
        icon={<Heart className="w-5 h-5" />}
        color="rose"
        isExpanded={expandedSections.includes("emotional")}
        onToggle={() => toggleSection("emotional")}
        count={draft.emotional_aspects?.length || 0}
      >
        <div className="space-y-4">
          {draft.emotional_aspects?.map((aspect, index) => (
            <EditableEmotionalAspectCard
              key={index}
              aspect={aspect}
              index={index}
              onEdit={(updated) => handleEditEmotional(index, updated)}
              onDelete={() => handleDeleteEmotional(index)}
            />
          ))}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Behavioral Patterns"
        icon={<Activity className="w-5 h-5" />}
        color="purple"
        isExpanded={expandedSections.includes("behavioral")}
        onToggle={() => toggleSection("behavioral")}
        count={draft.behavioral_patterns?.length || 0}
      >
        <div className="space-y-4">
          {draft.behavioral_patterns?.map((pattern, index) => (
            <EditableBehavioralPatternCard
              key={index}
              pattern={pattern}
              index={index}
              onEdit={(updated) => handleEditBehavioral(index, updated)}
              onDelete={() => handleDeleteBehavioral(index)}
            />
          ))}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Buying Signals"
        icon={<ShoppingCart className="w-5 h-5" />}
        color="emerald"
        isExpanded={expandedSections.includes("buying")}
        onToggle={() => toggleSection("buying")}
        count={draft.buying_signals?.length || 0}
      >
        <div className="space-y-4">
          {draft.buying_signals?.map((signal, index) => (
            <EditableBuyingSignalCard
              key={index}
              signal={signal}
              index={index}
              onEdit={(updated) => handleEditBuying(index, updated)}
              onDelete={() => handleDeleteBuying(index)}
            />
          ))}
        </div>
      </CollapsibleCard>
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: "rose" | "purple" | "emerald";
}) {
  const colorClasses = {
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className={`p-5 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <span className="text-xs font-medium uppercase tracking-wider opacity-80">
        {label}
      </span>
    </div>
  );
}

function CollapsibleCard({
  title,
  icon,
  color,
  isExpanded,
  onToggle,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: "rose" | "purple" | "emerald";
  isExpanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  const colorClasses = {
    rose: "bg-rose-500/10 text-rose-600",
    purple: "bg-purple-500/10 text-purple-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
  };

  return (
    <DraftCard>
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", colorClasses[color])}>
            {icon}
          </div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
            {count}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 border-t border-slate-100 pt-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DraftCard>
  );
}

function EditableEmotionalAspectCard({
  aspect,
  index,
  onEdit,
  onDelete,
}: {
  aspect: EmotionalAspect;
  index: number;
  onEdit: (updated: EmotionalAspect) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [emotion, setEmotion] = useState(aspect.emotion);
  const [intensity, setIntensity] = useState(aspect.intensity);
  const [description, setDescription] = useState(aspect.description);
  const [selfImageImpact, setSelfImageImpact] = useState(aspect.self_image_impact);

  const handleSave = () => {
    onEdit({
      ...aspect,
      emotion,
      intensity,
      description,
      self_image_impact: selfImageImpact,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEmotion(aspect.emotion);
    setIntensity(aspect.intensity);
    setDescription(aspect.description);
    setSelfImageImpact(aspect.self_image_impact);
    setIsEditing(false);
  };

  return (
    <div className="group relative p-5 bg-linear-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-xl">
      {!isEditing && (
        <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-slate-100 hover:text-blue-600 shadow-sm border"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 shadow-sm border"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Emotion</label>
              <input
                type="text"
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Intensity</label>
              <input
                type="text"
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Self-Image Impact</label>
            <textarea
              value={selfImageImpact}
              onChange={(e) => setSelfImageImpact(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
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
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-slate-900">{aspect.emotion}</h4>
            <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full">
              {aspect.intensity}
            </span>
          </div>
          <p className="text-sm text-slate-700 mb-4">{aspect.description}</p>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-rose-100">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Self-Image Impact
              </span>
              <p className="mt-1 text-sm text-slate-700">{aspect.self_image_impact}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Connected Fears
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {aspect.connected_fears?.map((fear, i) => (
                  <span key={i} className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full">
                    {fear}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {aspect.blocked_desires && aspect.blocked_desires.length > 0 && (
            <div className="mt-4 pt-4 border-t border-rose-100">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Blocked Desires
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {aspect.blocked_desires.map((desire, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                    {desire}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EditableBehavioralPatternCard({
  pattern,
  index,
  onEdit,
  onDelete,
}: {
  pattern: BehavioralPattern;
  index: number;
  onEdit: (updated: BehavioralPattern) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [patternName, setPatternName] = useState(pattern.pattern);
  const [frequency, setFrequency] = useState(pattern.frequency);
  const [description, setDescription] = useState(pattern.description);
  const [copingMechanism, setCopingMechanism] = useState(pattern.coping_mechanism);
  const [avoidance, setAvoidance] = useState(pattern.avoidance);

  const handleSave = () => {
    onEdit({
      ...pattern,
      pattern: patternName,
      frequency,
      description,
      coping_mechanism: copingMechanism,
      avoidance,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setPatternName(pattern.pattern);
    setFrequency(pattern.frequency);
    setDescription(pattern.description);
    setCopingMechanism(pattern.coping_mechanism);
    setAvoidance(pattern.avoidance);
    setIsEditing(false);
  };

  return (
    <div className="group relative p-5 bg-linear-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-xl">
      {!isEditing && (
        <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-slate-100 hover:text-blue-600 shadow-sm border"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 shadow-sm border"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pattern</label>
              <input
                type="text"
                value={patternName}
                onChange={(e) => setPatternName(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Frequency</label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Coping Mechanism</label>
              <textarea
                value={copingMechanism}
                onChange={(e) => setCopingMechanism(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avoidance</label>
              <textarea
                value={avoidance}
                onChange={(e) => setAvoidance(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={2}
              />
            </div>
          </div>
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
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-slate-900">{pattern.pattern}</h4>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              {pattern.frequency}
            </span>
          </div>
          <p className="text-sm text-slate-700 mb-4">{pattern.description}</p>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-100">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Coping Mechanism
              </span>
              <p className="mt-1 text-sm text-slate-700">{pattern.coping_mechanism}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Avoidance Behavior
              </span>
              <p className="mt-1 text-sm text-slate-700">{pattern.avoidance}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EditableBuyingSignalCard({
  signal,
  index,
  onEdit,
  onDelete,
}: {
  signal: BuyingSignal;
  index: number;
  onEdit: (updated: BuyingSignal) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [signalName, setSignalName] = useState(signal.signal);
  const [readinessLevel, setReadinessLevel] = useState(signal.readiness_level);
  const [messagingAngle, setMessagingAngle] = useState(signal.messaging_angle);
  const [proofNeeded, setProofNeeded] = useState(signal.proof_needed);

  const readinessColors = {
    high: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-slate-100 text-slate-700",
  };

  const handleSave = () => {
    onEdit({
      ...signal,
      signal: signalName,
      readiness_level: readinessLevel,
      messaging_angle: messagingAngle,
      proof_needed: proofNeeded,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSignalName(signal.signal);
    setReadinessLevel(signal.readiness_level);
    setMessagingAngle(signal.messaging_angle);
    setProofNeeded(signal.proof_needed);
    setIsEditing(false);
  };

  const readinessLevelKey = signal.readiness_level?.toLowerCase() as keyof typeof readinessColors;

  return (
    <div className="group relative p-5 bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
      {!isEditing && (
        <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-slate-100 hover:text-blue-600 shadow-sm border"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 shadow-sm border"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Signal</label>
              <input
                type="text"
                value={signalName}
                onChange={(e) => setSignalName(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Readiness Level</label>
              <select
                value={readinessLevel}
                onChange={(e) => setReadinessLevel(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Messaging Angle</label>
            <textarea
              value={messagingAngle}
              onChange={(e) => setMessagingAngle(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Proof Needed</label>
            <textarea
              value={proofNeeded}
              onChange={(e) => setProofNeeded(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
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
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-slate-900">{signal.signal}</h4>
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              readinessColors[readinessLevelKey] || readinessColors.medium
            )}>
              {signal.readiness_level}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Messaging Angle
              </span>
              <p className="mt-1 text-sm text-slate-700">{signal.messaging_angle}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Proof Needed
              </span>
              <p className="mt-1 text-sm text-slate-700">{signal.proof_needed}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

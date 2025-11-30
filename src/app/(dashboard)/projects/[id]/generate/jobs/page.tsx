"use client";

import { use, useState } from "react";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentGenerationPage } from "@/components/generation/SegmentGenerationPage";
import { JobsDraft, JobItem } from "@/types";
import { Target, Wrench, Heart, Users, ChevronRight, Pencil, Check, X, Plus, Trash2 } from "lucide-react";

export default function JobsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <SegmentGenerationPage<JobsDraft>
      projectId={projectId}
      title="Jobs to Be Done"
      description="Identify the functional, emotional, and social jobs your target audience is trying to accomplish and how your product helps. Complete this for each segment."
      stepType="jobs"
      generateEndpoint="/api/generate/jobs"
      approveEndpoint="/api/approve/jobs"
      draftTable="jobs_drafts"
      approvedTable="jobs"
      nextStepUrl="/generate/preferences"
      icon={<Target className="w-6 h-6" />}
      emptyStateMessage="Discover the tasks your customers are trying to accomplish using the Jobs-to-Be-Done framework."
      renderDraft={(draft, onEdit) => (
        <JobsDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function JobsDraftView({
  draft,
  onEdit,
}: {
  draft: JobsDraft;
  onEdit: (updates: Partial<JobsDraft>) => void;
}) {
  const handleEditJob = (type: 'functional_jobs' | 'emotional_jobs' | 'social_jobs', index: number, updatedJob: JobItem) => {
    const jobs = [...(draft[type] || [])];
    jobs[index] = updatedJob;
    onEdit({ [type]: jobs });
  };

  const handleDeleteJob = (type: 'functional_jobs' | 'emotional_jobs' | 'social_jobs', index: number) => {
    const jobs = (draft[type] || []).filter((_, i) => i !== index);
    onEdit({ [type]: jobs });
  };

  const handleAddJob = (type: 'functional_jobs' | 'emotional_jobs' | 'social_jobs', newJob: JobItem) => {
    const jobs = [...(draft[type] || []), newJob];
    onEdit({ [type]: jobs });
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Wrench className="w-5 h-5" />}
          label="Functional Jobs"
          count={draft.functional_jobs?.length || 0}
          color="blue"
        />
        <StatCard
          icon={<Heart className="w-5 h-5" />}
          label="Emotional Jobs"
          count={draft.emotional_jobs?.length || 0}
          color="rose"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Social Jobs"
          count={draft.social_jobs?.length || 0}
          color="purple"
        />
      </div>

      {/* Functional Jobs */}
      <DraftCard>
        <DraftSection
          title="Functional Jobs"
          icon={<Wrench className="w-5 h-5" />}
          color="blue"
        >
          <p className="text-sm text-slate-500 mb-4">
            Practical tasks and outcomes they want to achieve
          </p>
          <div className="space-y-4">
            {draft.functional_jobs?.map((job, index) => (
              <EditableJobCard
                key={index}
                job={job}
                index={index}
                color="blue"
                onEdit={(updatedJob) => handleEditJob('functional_jobs', index, updatedJob)}
                onDelete={() => handleDeleteJob('functional_jobs', index)}
              />
            ))}
            <AddJobForm color="blue" onAdd={(job) => handleAddJob('functional_jobs', job)} />
          </div>
        </DraftSection>
      </DraftCard>

      {/* Emotional Jobs */}
      <DraftCard>
        <DraftSection
          title="Emotional Jobs"
          icon={<Heart className="w-5 h-5" />}
          color="rose"
        >
          <p className="text-sm text-slate-500 mb-4">
            How they want to feel and emotional states they seek
          </p>
          <div className="space-y-4">
            {draft.emotional_jobs?.map((job, index) => (
              <EditableJobCard
                key={index}
                job={job}
                index={index}
                color="rose"
                onEdit={(updatedJob) => handleEditJob('emotional_jobs', index, updatedJob)}
                onDelete={() => handleDeleteJob('emotional_jobs', index)}
              />
            ))}
            <AddJobForm color="rose" onAdd={(job) => handleAddJob('emotional_jobs', job)} />
          </div>
        </DraftSection>
      </DraftCard>

      {/* Social Jobs */}
      <DraftCard>
        <DraftSection
          title="Social Jobs"
          icon={<Users className="w-5 h-5" />}
          color="purple"
        >
          <p className="text-sm text-slate-500 mb-4">
            How they want to be perceived by others
          </p>
          <div className="space-y-4">
            {draft.social_jobs?.map((job, index) => (
              <EditableJobCard
                key={index}
                job={job}
                index={index}
                color="purple"
                onEdit={(updatedJob) => handleEditJob('social_jobs', index, updatedJob)}
                onDelete={() => handleDeleteJob('social_jobs', index)}
              />
            ))}
            <AddJobForm color="purple" onAdd={(job) => handleAddJob('social_jobs', job)} />
          </div>
        </DraftSection>
      </DraftCard>
    </div>
  );
}

function StatCard({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: "blue" | "rose" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <span className="text-xs font-medium uppercase tracking-wider opacity-80">
        {label}
      </span>
    </div>
  );
}

function EditableJobCard({
  job,
  index,
  color,
  onEdit,
  onDelete,
}: {
  job: JobItem;
  index: number;
  color: "blue" | "rose" | "purple";
  onEdit: (job: JobItem) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editJob, setEditJob] = useState(job.job);
  const [editWhy, setEditWhy] = useState(job.why_it_matters);
  const [editHow, setEditHow] = useState(job.how_product_helps);

  const bgClasses = {
    blue: "bg-blue-50 border-blue-100",
    rose: "bg-rose-50 border-rose-100",
    purple: "bg-purple-50 border-purple-100",
  };

  const accentClasses = {
    blue: "bg-blue-500",
    rose: "bg-rose-500",
    purple: "bg-purple-500",
  };

  const handleSave = () => {
    onEdit({
      job: editJob,
      why_it_matters: editWhy,
      how_product_helps: editHow,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditJob(job.job);
    setEditWhy(job.why_it_matters);
    setEditHow(job.how_product_helps);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`relative p-5 rounded-xl border-2 ${bgClasses[color]}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${accentClasses[color]}`} />
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Job</label>
            <input
              type="text"
              value={editJob}
              onChange={(e) => setEditJob(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Why It Matters</label>
            <textarea
              value={editWhy}
              onChange={(e) => setEditWhy(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">How Product Helps</label>
            <textarea
              value={editHow}
              onChange={(e) => setEditHow(e.target.value)}
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
      </div>
    );
  }

  return (
    <div className={`group relative p-5 rounded-xl border ${bgClasses[color]} cursor-pointer hover:shadow-md transition-all`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${accentClasses[color]}`} />

      {/* Edit/Delete buttons */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-slate-100 hover:text-blue-600 shadow-sm"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <h4 className="font-semibold text-slate-900 mb-3 pr-16">{job.job}</h4>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider w-32 shrink-0 pt-0.5">
            Why It Matters
          </span>
          <p className="text-sm text-slate-700">{job.why_it_matters}</p>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider w-32 shrink-0 pt-0.5">
            Product Helps
          </span>
          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-sm text-slate-700">{job.how_product_helps}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddJobForm({
  color,
  onAdd,
}: {
  color: "blue" | "rose" | "purple";
  onAdd: (job: JobItem) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [job, setJob] = useState("");
  const [why, setWhy] = useState("");
  const [how, setHow] = useState("");

  const handleAdd = () => {
    if (job.trim() && why.trim() && how.trim()) {
      onAdd({
        job: job.trim(),
        why_it_matters: why.trim(),
        how_product_helps: how.trim(),
      });
      setJob("");
      setWhy("");
      setHow("");
      setIsAdding(false);
    }
  };

  const borderClasses = {
    blue: "border-blue-300 hover:border-blue-400",
    rose: "border-rose-300 hover:border-rose-400",
    purple: "border-purple-300 hover:border-purple-400",
  };

  if (isAdding) {
    return (
      <div className="p-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Job</label>
            <input
              type="text"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              placeholder="What job are they trying to do?"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Why It Matters</label>
            <textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Why is this job important to them?"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">How Product Helps</label>
            <textarea
              value={how}
              onChange={(e) => setHow(e.target.value)}
              placeholder="How does your product help with this job?"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
            >
              <Check className="w-4 h-4" /> Add Job
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setJob("");
                setWhy("");
                setHow("");
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsAdding(true)}
      className={`w-full p-4 rounded-xl border-2 border-dashed ${borderClasses[color]} text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-2`}
    >
      <Plus className="w-4 h-4" />
      Add Job
    </button>
  );
}

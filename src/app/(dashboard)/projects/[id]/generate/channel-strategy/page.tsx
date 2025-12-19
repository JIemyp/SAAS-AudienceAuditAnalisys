"use client";

import { use, useState } from "react";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentGenerationPage } from "@/components/generation/SegmentGenerationPage";
import { ChannelStrategyDraft, PlatformUsage, ContentPreference, TrustedSource, Community, SearchPatterns, AdvertisingResponse } from "@/types";
import { Radio, Users, Bookmark, MessageCircle, Search, Target, Pencil, Trash2, Check, X, Plus } from "lucide-react";

export default function ChannelStrategyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <SegmentGenerationPage<ChannelStrategyDraft>
      projectId={projectId}
      title="Channel Strategy"
      description="Discover where your audience spends time online, what content they consume, and which channels work best to reach them."
      stepType="channel-strategy"
      generateEndpoint="/api/generate/channel-strategy"
      approveEndpoint="/api/approve/channel-strategy"
      draftTable="channel_strategy_drafts"
      approvedTable="channel_strategy"
      nextStepUrl="/generate/competitive-intelligence"
      icon={<Radio className="w-6 h-6" />}
      emptyStateMessage="Discover the exact channels, platforms, and communities where your audience spends time and how to reach them effectively."
      renderDraft={(draft, onEdit) => (
        <ChannelStrategyDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function ChannelStrategyDraftView({
  draft,
  onEdit,
}: {
  draft: ChannelStrategyDraft;
  onEdit: (updates: Partial<ChannelStrategyDraft>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Radio className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-blue-900">
            Channel Strategy Analysis Complete
          </h3>
        </div>
        <p className="text-sm text-blue-700">
          Comprehensive analysis of where to find your audience, what content they engage with, and how to reach them effectively.
        </p>
      </div>

      {/* Primary Platforms */}
      {draft.primary_platforms && draft.primary_platforms.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Primary Platforms"
            icon={<Radio className="w-5 h-5" />}
            color="blue"
          >
            <div className="space-y-4">
              {draft.primary_platforms.map((platform, index) => (
                <PlatformCard
                  key={index}
                  platform={platform}
                  index={index}
                  onEdit={(updated) => {
                    const platforms = [...draft.primary_platforms];
                    platforms[index] = updated;
                    onEdit({ primary_platforms: platforms });
                  }}
                  onDelete={() => {
                    const platforms = draft.primary_platforms.filter((_, i) => i !== index);
                    onEdit({ primary_platforms: platforms });
                  }}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Content Preferences */}
      {draft.content_preferences && draft.content_preferences.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Content Preferences"
            icon={<Bookmark className="w-5 h-5" />}
            color="purple"
          >
            <div className="space-y-4">
              {draft.content_preferences.map((pref, index) => (
                <ContentPreferenceCard
                  key={index}
                  preference={pref}
                  index={index}
                  onEdit={(updated) => {
                    const prefs = [...draft.content_preferences];
                    prefs[index] = updated;
                    onEdit({ content_preferences: prefs });
                  }}
                  onDelete={() => {
                    const prefs = draft.content_preferences.filter((_, i) => i !== index);
                    onEdit({ content_preferences: prefs });
                  }}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Trusted Sources */}
      {draft.trusted_sources && draft.trusted_sources.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Trusted Sources"
            icon={<Users className="w-5 h-5" />}
            color="emerald"
          >
            <div className="space-y-4">
              {draft.trusted_sources.map((source, index) => (
                <TrustedSourceCard
                  key={index}
                  source={source}
                  index={index}
                  onEdit={(updated) => {
                    const sources = [...(draft.trusted_sources || [])];
                    sources[index] = updated;
                    onEdit({ trusted_sources: sources });
                  }}
                  onDelete={() => {
                    const sources = (draft.trusted_sources || []).filter((_, i) => i !== index);
                    onEdit({ trusted_sources: sources });
                  }}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Communities */}
      {draft.communities && draft.communities.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Communities"
            icon={<MessageCircle className="w-5 h-5" />}
            color="orange"
          >
            <div className="space-y-4">
              {draft.communities.map((community, index) => (
                <CommunityCard
                  key={index}
                  community={community}
                  index={index}
                  onEdit={(updated) => {
                    const communities = [...(draft.communities || [])];
                    communities[index] = updated;
                    onEdit({ communities: communities });
                  }}
                  onDelete={() => {
                    const communities = (draft.communities || []).filter((_, i) => i !== index);
                    onEdit({ communities: communities });
                  }}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Search Patterns */}
      {draft.search_patterns && (
        <DraftCard>
          <DraftSection
            title="Search Patterns"
            icon={<Search className="w-5 h-5" />}
            color="blue"
          >
            <SearchPatternsCard
              patterns={draft.search_patterns}
              onEdit={(updated) => onEdit({ search_patterns: updated })}
            />
          </DraftSection>
        </DraftCard>
      )}

      {/* Advertising Response */}
      {draft.advertising_response && (
        <DraftCard>
          <DraftSection
            title="Advertising Response"
            icon={<Target className="w-5 h-5" />}
            color="rose"
          >
            <AdvertisingResponseCard
              response={draft.advertising_response}
              onEdit={(updated) => onEdit({ advertising_response: updated })}
            />
          </DraftSection>
        </DraftCard>
      )}
    </div>
  );
}

// Platform Card Component
function PlatformCard({
  platform,
  index,
  onEdit,
  onDelete,
}: {
  platform: PlatformUsage;
  index: number;
  onEdit: (platform: PlatformUsage) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(platform);

  const handleSave = () => {
    onEdit(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(platform);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative p-6 bg-white border-2 border-slate-300 rounded-2xl">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Platform</label>
            <input
              type="text"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Usage Frequency</label>
              <select
                value={formData.usage_frequency}
                onChange={(e) => setFormData({ ...formData, usage_frequency: e.target.value as any })}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Activity Type</label>
              <select
                value={formData.activity_type}
                onChange={(e) => setFormData({ ...formData, activity_type: e.target.value as any })}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="lurking">Lurking</option>
                <option value="commenting">Commenting</option>
                <option value="posting">Posting</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Why They Use It</label>
            <textarea
              value={formData.why_they_use_it}
              onChange={(e) => setFormData({ ...formData, why_they_use_it: e.target.value })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
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
    <div className="group relative p-6 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl hover:shadow-md transition-all">
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

      <h4 className="text-lg font-semibold text-slate-900 mb-4 pr-16">
        {platform.platform}
      </h4>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-blue-50 rounded-xl">
          <span className="text-xs font-medium text-blue-700 uppercase tracking-wider block mb-1">
            Usage Frequency
          </span>
          <span className="text-sm text-blue-900 capitalize">{platform.usage_frequency}</span>
        </div>
        <div className="p-3 bg-purple-50 rounded-xl">
          <span className="text-xs font-medium text-purple-700 uppercase tracking-wider block mb-1">
            Activity Type
          </span>
          <span className="text-sm text-purple-900 capitalize">{platform.activity_type}</span>
        </div>
      </div>

      <div className="p-3 bg-emerald-50 rounded-xl">
        <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider block mb-2">
          Why They Use It
        </span>
        <p className="text-sm text-emerald-900">{platform.why_they_use_it}</p>
      </div>

      {platform.peak_activity_times && platform.peak_activity_times.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
            Peak Activity Times
          </span>
          <div className="flex flex-wrap gap-2">
            {platform.peak_activity_times.map((time, i) => (
              <span key={i} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg">
                {time}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Content Preference Card Component
function ContentPreferenceCard({
  preference,
  index,
  onEdit,
  onDelete,
}: {
  preference: ContentPreference;
  index: number;
  onEdit: (preference: ContentPreference) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(preference);

  const handleSave = () => {
    onEdit(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(preference);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative p-6 bg-white border-2 border-slate-300 rounded-2xl">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Format</label>
            <input
              type="text"
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Context</label>
            <input
              type="text"
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Attention Span</label>
            <select
              value={formData.attention_span}
              onChange={(e) => setFormData({ ...formData, attention_span: e.target.value as any })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="skimmers">Skimmers</option>
              <option value="deep_readers">Deep Readers</option>
              <option value="binge_watchers">Binge Watchers</option>
            </select>
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
    <div className="group relative p-6 bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-2xl hover:shadow-md transition-all">
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

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <span className="text-xs font-medium text-purple-700 uppercase tracking-wider block mb-1">Format</span>
          <p className="text-sm text-purple-900">{preference.format}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-purple-700 uppercase tracking-wider block mb-1">Context</span>
          <p className="text-sm text-purple-900">{preference.context}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-purple-700 uppercase tracking-wider block mb-1">Attention Span</span>
          <p className="text-sm text-purple-900 capitalize">{preference.attention_span.replace('_', ' ')}</p>
        </div>
      </div>

      {preference.triggering_topics && preference.triggering_topics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-100">
          <span className="text-xs font-medium text-purple-700 uppercase tracking-wider block mb-2">
            Triggering Topics
          </span>
          <div className="flex flex-wrap gap-2">
            {preference.triggering_topics.map((topic, i) => (
              <span key={i} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Trusted Source Card Component
function TrustedSourceCard({
  source,
  index,
  onEdit,
  onDelete,
}: {
  source: TrustedSource;
  index: number;
  onEdit: (source: TrustedSource) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(source);

  if (isEditing) {
    return (
      <div className="relative p-6 bg-white border-2 border-slate-300 rounded-2xl">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Source Type</label>
            <select
              value={formData.source_type}
              onChange={(e) => setFormData({ ...formData, source_type: e.target.value as any })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="industry_blogs">Industry Blogs</option>
              <option value="podcasts">Podcasts</option>
              <option value="youtube_channels">YouTube Channels</option>
              <option value="communities">Communities</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Specific Examples (comma separated)</label>
            <input
              type="text"
              value={formData.specific_examples.join(', ')}
              onChange={(e) => setFormData({ ...formData, specific_examples: e.target.value.split(',').map(s => s.trim()) })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Why Trusted</label>
            <textarea
              value={formData.why_trusted}
              onChange={(e) => setFormData({ ...formData, why_trusted: e.target.value })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onEdit(formData); setIsEditing(false); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
            >
              <Check className="w-4 h-4" /> Save
            </button>
            <button
              onClick={() => { setFormData(source); setIsEditing(false); }}
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
    <div className="group relative p-6 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-2xl hover:shadow-md transition-all">
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

      <div className="mb-4">
        <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider block mb-1">
          Source Type
        </span>
        <p className="text-lg font-semibold text-emerald-900 capitalize">
          {source.source_type.replace('_', ' ')}
        </p>
      </div>

      <div className="mb-4">
        <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider block mb-2">
          Specific Examples
        </span>
        <div className="flex flex-wrap gap-2">
          {source.specific_examples.map((example, i) => (
            <span key={i} className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg font-medium">
              {example}
            </span>
          ))}
        </div>
      </div>

      <div className="p-3 bg-white rounded-xl border border-emerald-100">
        <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider block mb-2">
          Why Trusted
        </span>
        <p className="text-sm text-emerald-900">{source.why_trusted}</p>
      </div>
    </div>
  );
}

// Community Card Component
function CommunityCard({
  community,
  index,
  onEdit,
  onDelete,
}: {
  community: Community;
  index: number;
  onEdit: (community: Community) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(community);

  if (isEditing) {
    return (
      <div className="relative p-6 bg-white border-2 border-slate-300 rounded-2xl">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="facebook_groups">Facebook Groups</option>
              <option value="subreddits">Subreddits</option>
              <option value="slack_communities">Slack Communities</option>
              <option value="forums">Forums</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Specific Names (comma separated)</label>
            <input
              type="text"
              value={formData.specific_names.join(', ')}
              onChange={(e) => setFormData({ ...formData, specific_names: e.target.value.split(',').map(s => s.trim()) })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Participation Level</label>
              <select
                value={formData.participation_level}
                onChange={(e) => setFormData({ ...formData, participation_level: e.target.value as any })}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="observer">Observer</option>
                <option value="occasional">Occasional</option>
                <option value="active">Active</option>
                <option value="influencer">Influencer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Influence on Purchases</label>
              <select
                value={formData.influence_on_purchases}
                onChange={(e) => setFormData({ ...formData, influence_on_purchases: e.target.value as any })}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onEdit(formData); setIsEditing(false); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
            >
              <Check className="w-4 h-4" /> Save
            </button>
            <button
              onClick={() => { setFormData(community); setIsEditing(false); }}
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
    <div className="group relative p-6 bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-2xl hover:shadow-md transition-all">
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

      <div className="mb-4">
        <span className="text-xs font-medium text-orange-700 uppercase tracking-wider block mb-1">
          Type
        </span>
        <p className="text-lg font-semibold text-orange-900 capitalize">
          {community.type.replace('_', ' ')}
        </p>
      </div>

      <div className="mb-4">
        <span className="text-xs font-medium text-orange-700 uppercase tracking-wider block mb-2">
          Specific Communities
        </span>
        <div className="flex flex-wrap gap-2">
          {community.specific_names.map((name, i) => (
            <span key={i} className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-lg font-medium">
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-3 bg-white rounded-xl border border-orange-100">
          <span className="text-xs font-medium text-orange-700 uppercase tracking-wider block mb-1">
            Participation
          </span>
          <p className="text-sm text-orange-900 capitalize">{community.participation_level}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-orange-100">
          <span className="text-xs font-medium text-orange-700 uppercase tracking-wider block mb-1">
            Purchase Influence
          </span>
          <p className="text-sm text-orange-900 capitalize">{community.influence_on_purchases}</p>
        </div>
      </div>
    </div>
  );
}

// Search Patterns Card Component
function SearchPatternsCard({
  patterns,
  onEdit,
}: {
  patterns: SearchPatterns;
  onEdit: (patterns: SearchPatterns) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(patterns);

  if (isEditing) {
    return (
      <div className="p-6 bg-white border-2 border-slate-300 rounded-2xl">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Typical Queries (comma separated)</label>
            <textarea
              value={formData.typical_queries.join(', ')}
              onChange={(e) => setFormData({ ...formData, typical_queries: e.target.value.split(',').map(s => s.trim()) })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Search Depth</label>
              <select
                value={formData.search_depth}
                onChange={(e) => setFormData({ ...formData, search_depth: e.target.value as any })}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="first_page_only">First Page Only</option>
                <option value="deep_research">Deep Research</option>
                <option value="comparison_shopping">Comparison Shopping</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Decision Timeline</label>
              <select
                value={formData.decision_timeline}
                onChange={(e) => setFormData({ ...formData, decision_timeline: e.target.value as any })}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="impulse">Impulse</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onEdit(formData); setIsEditing(false); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
            >
              <Check className="w-4 h-4" /> Save
            </button>
            <button
              onClick={() => { setFormData(patterns); setIsEditing(false); }}
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
    <div className="group relative p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-slate-100 hover:text-blue-600 shadow-sm"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4">
        <span className="text-xs font-medium text-blue-700 uppercase tracking-wider block mb-2">
          Typical Search Queries
        </span>
        <div className="flex flex-wrap gap-2">
          {patterns.typical_queries.map((query, i) => (
            <span key={i} className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg">
              {query}
            </span>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-3 bg-white rounded-xl border border-blue-100">
          <span className="text-xs font-medium text-blue-700 uppercase tracking-wider block mb-1">
            Search Depth
          </span>
          <p className="text-sm text-blue-900 capitalize">{patterns.search_depth.replace('_', ' ')}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-blue-100">
          <span className="text-xs font-medium text-blue-700 uppercase tracking-wider block mb-1">
            Decision Timeline
          </span>
          <p className="text-sm text-blue-900 capitalize">{patterns.decision_timeline}</p>
        </div>
      </div>
    </div>
  );
}

// Advertising Response Card Component
function AdvertisingResponseCard({
  response,
  onEdit,
}: {
  response: AdvertisingResponse;
  onEdit: (response: AdvertisingResponse) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(response);

  if (isEditing) {
    return (
      <div className="p-6 bg-white border-2 border-slate-300 rounded-2xl">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Channels They Notice (comma separated)</label>
            <input
              type="text"
              value={formData.channels_they_notice.join(', ')}
              onChange={(e) => setFormData({ ...formData, channels_they_notice: e.target.value.split(',').map(s => s.trim()) })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ad Formats That Work (comma separated)</label>
            <input
              type="text"
              value={formData.ad_formats_that_work.join(', ')}
              onChange={(e) => setFormData({ ...formData, ad_formats_that_work: e.target.value.split(',').map(s => s.trim()) })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ad Formats That Annoy (comma separated)</label>
            <input
              type="text"
              value={formData.ad_formats_that_annoy.join(', ')}
              onChange={(e) => setFormData({ ...formData, ad_formats_that_annoy: e.target.value.split(',').map(s => s.trim()) })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Retargeting Tolerance</label>
            <select
              value={formData.retargeting_tolerance}
              onChange={(e) => setFormData({ ...formData, retargeting_tolerance: e.target.value as any })}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onEdit(formData); setIsEditing(false); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
            >
              <Check className="w-4 h-4" /> Save
            </button>
            <button
              onClick={() => { setFormData(response); setIsEditing(false); }}
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
    <div className="group relative p-6 bg-gradient-to-br from-rose-50 to-white border border-rose-200 rounded-2xl">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-slate-100 hover:text-blue-600 shadow-sm"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-xs font-medium text-rose-700 uppercase tracking-wider block mb-2">
            Channels They Notice
          </span>
          <div className="flex flex-wrap gap-2">
            {response.channels_they_notice.map((channel, i) => (
              <span key={i} className="px-3 py-1.5 text-sm bg-rose-100 text-rose-700 rounded-lg">
                {channel}
              </span>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-xl border border-rose-100">
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider block mb-2">
              What Works
            </span>
            <ul className="space-y-1">
              {response.ad_formats_that_work.map((format, i) => (
                <li key={i} className="text-sm text-emerald-900 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  {format}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-white rounded-xl border border-rose-100">
            <span className="text-xs font-medium text-red-700 uppercase tracking-wider block mb-2">
              What Annoys
            </span>
            <ul className="space-y-1">
              {response.ad_formats_that_annoy.map((format, i) => (
                <li key={i} className="text-sm text-red-900 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  {format}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-rose-100">
          <span className="text-xs font-medium text-rose-700 uppercase tracking-wider block mb-1">
            Retargeting Tolerance
          </span>
          <p className="text-sm text-rose-900 capitalize">{response.retargeting_tolerance}</p>
        </div>
      </div>
    </div>
  );
}

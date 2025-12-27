"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface StrategicHighlightsProps {
  topSegments: Array<{ id: string; name: string; priority_score: number }>;
  topPains: Array<{ id: string; name: string; segment_name: string; impact_score: number }>;
  keyTriggers: string[];
  strategySummary?: {
    growth_bets?: Array<{ title: string; score?: number }>;
    positioning_pillars?: Array<{ pillar: string }>;
  };
}

export function StrategicHighlights({
  topSegments,
  topPains,
  keyTriggers,
  strategySummary,
}: StrategicHighlightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategic Highlights</CardTitle>
        <CardDescription>Highest-leverage segments, pains, and triggers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
              Top Segments
            </p>
            {topSegments.length === 0 ? (
              <p className="text-sm text-text-secondary">No segment priority data yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {topSegments.map((seg) => (
                  <li key={seg.id} className="flex items-center justify-between">
                    <span className="text-text-primary">{seg.name}</span>
                    <Badge variant="outline">Score {seg.priority_score}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
              Top Pains
            </p>
            {topPains.length === 0 ? (
              <p className="text-sm text-text-secondary">No top pains selected yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {topPains.map((pain) => (
                  <li key={pain.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-text-primary">{pain.name}</span>
                      <Badge variant="outline">Impact {pain.impact_score}</Badge>
                    </div>
                    <p className="text-xs text-text-secondary">Segment: {pain.segment_name}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
              Key Triggers
            </p>
            {keyTriggers.length === 0 ? (
              <p className="text-sm text-text-secondary">No trigger data yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {keyTriggers.map((trigger) => (
                  <Badge key={trigger} variant="secondary">
                    {trigger}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
              Strategy Summary
            </p>
            {strategySummary ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-text-secondary text-xs uppercase tracking-wider mb-2">Growth Bets</p>
                  <ul className="space-y-1">
                    {(strategySummary.growth_bets || []).slice(0, 3).map((bet, index) => (
                      <li key={`${bet.title}-${index}`} className="flex items-center justify-between">
                        <span className="text-text-primary">{bet.title}</span>
                        {typeof bet.score === "number" && (
                          <Badge variant="outline">Score {bet.score}</Badge>
                        )}
                      </li>
                    ))}
                    {(strategySummary.growth_bets || []).length === 0 && (
                      <li className="text-text-secondary">No growth bets yet.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-text-secondary text-xs uppercase tracking-wider mb-2">Positioning Pillars</p>
                  <ul className="space-y-1">
                    {(strategySummary.positioning_pillars || []).slice(0, 3).map((pillar, index) => (
                      <li key={`${pillar.pillar}-${index}`} className="text-text-primary">
                        {pillar.pillar}
                      </li>
                    ))}
                    {(strategySummary.positioning_pillars || []).length === 0 && (
                      <li className="text-text-secondary">No positioning pillars yet.</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Generate strategy summary to populate this block.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

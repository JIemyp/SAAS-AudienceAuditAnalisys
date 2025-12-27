import { useEffect, useState } from "react";
import { ProjectRole } from "@/types";
import { PAGE_KEYS, buildAccessMap } from "@/lib/page-access";

interface PageAccessState {
  accessMap: Record<string, boolean>;
  role: ProjectRole | null;
  isLoading: boolean;
  error: string | null;
}

export function usePageAccess(projectId: string | null) {
  const [state, setState] = useState<PageAccessState>({
    accessMap: {},
    role: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadAccess = async () => {
      if (!projectId) {
        if (!cancelled) {
          setState({
            accessMap: Object.fromEntries(PAGE_KEYS.map((key) => [key, true])),
            role: null,
            isLoading: false,
            error: null,
          });
        }
        return;
      }

      try {
        const res = await fetch(`/api/projects/${projectId}/page-access`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load page access");
        }

        const baseMap = buildAccessMap(data.pages || [], data.memberOverrides || []);
        let accessMap = { ...baseMap };
        const role = (data.role || null) as ProjectRole | null;

        if (role === "owner" || role === "editor") {
          accessMap = Object.fromEntries(PAGE_KEYS.map((key) => [key, true]));
        }

        if (role === "ugc_specialist") {
          const ugcAllowed = baseMap["ugc-creators"] === true;
          accessMap = Object.fromEntries(
            PAGE_KEYS.map((key) => [key, key === "ugc-creators" ? ugcAllowed : false])
          );
        }

        if (!cancelled) {
          setState({
            accessMap,
            role,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            accessMap: Object.fromEntries(PAGE_KEYS.map((key) => [key, true])),
            role: null,
            isLoading: false,
            error: err instanceof Error ? err.message : "Failed to load page access",
          });
        }
      }
    };

    loadAccess();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return state;
}

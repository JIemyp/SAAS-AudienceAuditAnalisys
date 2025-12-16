# Generate API Routes - Access Control Fix Status

## Problem
All generate API routes were only checking if `user_id` matches (owner only). Invited members with editor role were getting 404 errors.

## Solution Pattern
For each route:

1. **Add imports:**
```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
```

2. **After authentication, add:**
```typescript
const adminSupabase = createAdminClient();

// Check write access (owner or editor)
await requireWriteAccess(supabase, adminSupabase, projectId, user.id);
```

3. **Replace ownership check:**
- **OLD:**
```typescript
const { data: project } = await supabase
  .from("projects")
  .select("*")
  .eq("id", projectId)
  .eq("user_id", user.id)  // ❌ Owner-only check
  .single();
```

- **NEW:**
```typescript
const { data: project } = await adminSupabase
  .from("projects")
  .select("*")
  .eq("id", projectId)  // ✅ No user_id check, access validated above
  .single();
```

4. **Replace ALL supabase queries with adminSupabase** (after auth check)

## Files Fixed (13/26)

### ✅ Completed
1. `/src/app/api/generate/canvas/route.ts`
2. `/src/app/api/generate/overview/route.ts`
3. `/src/app/api/generate/segments/route.ts`
4. `/src/app/api/generate/portrait/route.ts`
5. `/src/app/api/generate/jobs/route.ts`
6. `/src/app/api/generate/pains/route.ts`
7. `/src/app/api/generate/validation/route.ts`
8. `/src/app/api/generate/preferences/route.ts`
9. `/src/app/api/generate/difficulties/route.ts`
10. `/src/app/api/generate/triggers/route.ts`

### ⏳ Remaining (16 files)
11. `/src/app/api/generate/segment-details/route.ts`
12. `/src/app/api/generate/segment-details-field/route.ts`
13. `/src/app/api/generate/portrait-final/route.ts`
14. `/src/app/api/generate/portrait-review/route.ts`
15. `/src/app/api/generate/segments-final/route.ts`
16. `/src/app/api/generate/segments-review/route.ts`
17. `/src/app/api/generate/pains-ranking/route.ts`
18. `/src/app/api/generate/canvas-extended/route.ts`
19. `/src/app/api/generate/canvas-missing/route.ts`
20. `/src/app/api/generate/canvas-regenerate-all/route.ts`
21. `/src/app/api/generate/jtbd-context/route.ts`
22. `/src/app/api/generate/field/route.ts`
23. `/src/app/api/generate/channel-strategy/route.ts`
24. `/src/app/api/generate/competitive-intelligence/route.ts`
25. `/src/app/api/generate/pricing-psychology/route.ts`
26. `/src/app/api/generate/trust-framework/route.ts`

## Testing Checklist

After all fixes are applied:

- [ ] Test as project owner - should work
- [ ] Test as invited editor - should work
- [ ] Test as invited viewer - should get 403 (no write access)
- [ ] Test with non-member - should get 404
- [ ] Verify all generate endpoints return proper data

## Key Changes Summary

- **Access Control:** Owner-only → Owner + Editors
- **Client Used:** Regular supabase → adminSupabase (bypasses RLS after access check)
- **Permission Check:** Added `requireWriteAccess()` before data operations
- **Security:** Still validates user authentication + project membership

## Benefits

1. ✅ Editors can now generate content
2. ✅ Proper permission-based access control
3. ✅ Maintains security (auth + membership required)
4. ✅ Uses admin client only after permission validation
5. ✅ Consistent pattern across all generate routes

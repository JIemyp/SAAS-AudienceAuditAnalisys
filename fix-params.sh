#!/bin/bash

# This script updates all page.tsx files to use async params for Next.js 16

# Export page
sed -i '' 's/export default function ExportPage({ params }: { params: { id: string } })/export default async function ExportPage({ params }: { params: Promise<{ id: string }> })/' src/app/\(dashboard\)/projects/\[id\]/export/page.tsx
sed -i '' '12a\
  const { id } = await params;
' src/app/\(dashboard\)/projects/\[id\]/export/page.tsx
sed -i '' 's/params\.id/id/g' src/app/\(dashboard\)/projects/\[id\]/export/page.tsx

# Overview page
sed -i '' 's/export default function OverviewPage({ params }: { params: { id: string } })/export default async function OverviewPage({ params }: { params: Promise<{ id: string }> })/' src/app/\(dashboard\)/projects/\[id\]/overview/page.tsx
sed -i '' '10a\
  const { id } = await params;
' src/app/\(dashboard\)/projects/\[id\]/overview/page.tsx
sed -i '' 's/params\.id/id/g' src/app/\(dashboard\)/projects/\[id\]/overview/page.tsx

# Processing page  
sed -i '' 's/export default function ProcessingPage({ params }: { params: { id: string } })/export default async function ProcessingPage({ params }: { params: Promise<{ id: string }> })/' src/app/\(dashboard\)/projects/\[id\]/processing/page.tsx
sed -i '' '17a\
  const { id } = await params;
' src/app/\(dashboard\)/projects/\[id\]/processing/page.tsx
sed -i '' 's/params\.id/id/g' src/app/\(dashboard\)/projects/\[id\]/processing/page.tsx

# Segments page
sed -i '' 's/export default function SegmentsPage({ params }: { params: { id: string } })/export default async function SegmentsPage({ params }: { params: Promise<{ id: string }> })/' src/app/\(dashboard\)/projects/\[id\]/segments/page.tsx
sed -i '' '14a\
  const { id } = await params;
' src/app/\(dashboard\)/projects/\[id\]/segments/page.tsx
sed -i '' 's/params\.id/id/g' src/app/\(dashboard\)/projects/\[id\]/segments/page.tsx

# Segment Detail page
sed -i '' 's/params: { id: string; segmentId: string }/params: Promise<{ id: string; segmentId: string }>/' src/app/\(dashboard\)/projects/\[id\]/segments/\[segmentId\]/page.tsx
sed -i '' '17a\
  const { id, segmentId } = await params;
' src/app/\(dashboard\)/projects/\[id\]/segments/\[segmentId\]/page.tsx
sed -i '' 's/params\.id/id/g' src/app/\(dashboard\)/projects/\[id\]/segments/\[segmentId\]/page.tsx
sed -i '' 's/params\.segmentId/segmentId/g' src/app/\(dashboard\)/projects/\[id\]/segments/\[segmentId\]/page.tsx

echo "All files updated!"

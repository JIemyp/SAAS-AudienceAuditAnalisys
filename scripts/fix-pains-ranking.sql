-- ================================================
-- Script: Fix pains_ranking table
-- Очистка и перенос только TOP болей из drafts
-- ================================================

-- 1. Посмотрим сколько сейчас записей
SELECT 'BEFORE FIX:' as status;
SELECT 'pains_ranking_drafts total:' as table_name, COUNT(*) as count FROM pains_ranking_drafts;
SELECT 'pains_ranking_drafts TOP:' as table_name, COUNT(*) as count FROM pains_ranking_drafts WHERE is_top_pain = true;
SELECT 'pains_ranking total:' as table_name, COUNT(*) as count FROM pains_ranking;
SELECT 'canvas_drafts total:' as table_name, COUNT(*) as count FROM canvas_drafts;
SELECT 'canvas total:' as table_name, COUNT(*) as count FROM canvas;

-- 2. Очистить pains_ranking
TRUNCATE TABLE pains_ranking;

-- 3. Вставить только TOP боли из drafts с segment_id из pains_initial
INSERT INTO pains_ranking (project_id, segment_id, pain_id, impact_score, is_top_pain, ranking_reasoning)
SELECT
    d.project_id,
    COALESCE(d.segment_id, p.segment_id) as segment_id,
    d.pain_id,
    d.impact_score,
    true as is_top_pain,
    d.ranking_reasoning
FROM pains_ranking_drafts d
LEFT JOIN pains_initial p ON d.pain_id = p.id
WHERE d.is_top_pain = true;

-- 4. Проверим результат
SELECT 'AFTER FIX:' as status;
SELECT 'pains_ranking total:' as table_name, COUNT(*) as count FROM pains_ranking;

-- 5. Покажем что попало в pains_ranking
SELECT
    pr.id,
    pr.project_id,
    pr.segment_id,
    s.name as segment_name,
    pi.name as pain_name,
    pr.impact_score,
    pr.is_top_pain
FROM pains_ranking pr
LEFT JOIN pains_initial pi ON pr.pain_id = pi.id
LEFT JOIN segments s ON pr.segment_id = s.id
ORDER BY pr.project_id, pr.segment_id, pr.impact_score DESC;

-- 6. ОПЦИОНАЛЬНО: Очистить canvas_drafts и canvas чтобы перегенерировать
-- Раскомментируй если нужно перегенерировать canvas
-- TRUNCATE TABLE canvas_drafts;
-- TRUNCATE TABLE canvas;

-- 7. Проверка: сколько TOP болей на каждый сегмент
SELECT
    s.name as segment_name,
    COUNT(pr.id) as top_pains_count
FROM segments s
LEFT JOIN pains_ranking pr ON s.id = pr.segment_id
GROUP BY s.id, s.name
ORDER BY s.name;

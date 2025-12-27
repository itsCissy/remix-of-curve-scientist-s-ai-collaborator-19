-- Consolidate duplicate main branches per project (keeps the main branch with the most messages)
WITH main_branches AS (
  SELECT
    b.id,
    b.project_id,
    b.created_at,
    (
      SELECT COUNT(*)
      FROM public.messages m
      WHERE m.branch_id = b.id
    ) AS msg_count
  FROM public.branches b
  WHERE b.is_main = true
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY project_id
      ORDER BY msg_count DESC, created_at ASC
    ) AS rn,
    FIRST_VALUE(id) OVER (
      PARTITION BY project_id
      ORDER BY msg_count DESC, created_at ASC
    ) AS keep_id
  FROM main_branches
),
to_move AS (
  SELECT id AS from_branch_id, keep_id, project_id
  FROM ranked
  WHERE rn > 1
),
move_messages AS (
  UPDATE public.messages m
  SET branch_id = t.keep_id
  FROM to_move t
  WHERE m.branch_id = t.from_branch_id
  RETURNING m.id
)
UPDATE public.branches b
SET is_main = false
FROM to_move t
WHERE b.id = t.from_branch_id;

-- Prevent future duplicates: only one main branch per project
CREATE UNIQUE INDEX IF NOT EXISTS branches_one_main_per_project
ON public.branches (project_id)
WHERE is_main = true;
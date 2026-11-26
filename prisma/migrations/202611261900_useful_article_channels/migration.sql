BEGIN;

-- Serialize this backfill with CMS edits to the same platform document.
SELECT id FROM "PlatformState" WHERE id = 'main' FOR UPDATE;

-- Carry over the editorial classification for these existing articles. Keep
-- their order, content, and any channel already saved in the destination.
UPDATE "PlatformState" AS state
SET data = jsonb_set(state.data, '{siteContent,gallery}', gallery.items, false),
    "updatedAt" = CURRENT_TIMESTAMP
FROM (
    SELECT jsonb_agg(
        CASE
            WHEN NOT (item ? 'channel') AND item->>'slug' IN (
                'citta-vecchia-e-ponte-carlo',
                'castello-e-mala-strana',
                'cambio-pagamenti-e-assistenza',
                'praga-senza-fretta-una-giornata-a-piedi',
                'arte-a-praga-e-in-boemia-parte-1',
                'bambino-gesu-di-praga'
            )
            THEN item || '{"channel":"useful"}'::jsonb
            ELSE item
        END ORDER BY position
    ) AS items
    FROM "PlatformState" AS source
    CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(source.data #> '{siteContent,gallery}') = 'array'
            THEN source.data #> '{siteContent,gallery}'
            ELSE '[]'::jsonb
        END
    ) WITH ORDINALITY AS articles(item, position)
    WHERE source.id = 'main'
) AS gallery
WHERE state.id = 'main'
  AND gallery.items IS NOT NULL
  AND state.data #> '{siteContent,gallery}' IS DISTINCT FROM gallery.items;

COMMIT;

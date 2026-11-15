-- Migration: migrate existing push subscription columns to JSON format and make them nullable
-- This avoids violating NOT NULL constraints on old, unmapped columns during new registrations.

DO $$
BEGIN
    -- 1. Migrate old single subscription columns to subscriptions_json if they exist and subscriptions_json is empty/null
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'push_subscriptions' AND column_name = 'subscriptions_json'
    ) AND EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'push_subscriptions' AND column_name = 'endpoint'
    ) THEN
        UPDATE push_subscriptions
        SET subscriptions_json = json_build_array(
            json_build_object(
                'endpoint', endpoint,
                'p256dh', p256dh,
                'auth', auth
            )
        )::text
        WHERE (subscriptions_json IS NULL OR subscriptions_json = '[]' OR subscriptions_json = '')
          AND endpoint IS NOT NULL;
    END IF;

    -- 2. Drop NOT NULL constraints on the old columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'endpoint') THEN
        ALTER TABLE push_subscriptions ALTER COLUMN endpoint DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'p256dh') THEN
        ALTER TABLE push_subscriptions ALTER COLUMN p256dh DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'auth') THEN
        ALTER TABLE push_subscriptions ALTER COLUMN auth DROP NOT NULL;
    END IF;
END $$;

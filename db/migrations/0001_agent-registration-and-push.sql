BEGIN;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS submission_key UUID;
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_submission_key ON leads (submission_key);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('admin', 'agent')),
  owner_id TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_owner_active
  ON push_subscriptions (owner_type, owner_id, active);

UPDATE leads
SET status = CASE status
  WHEN 'Application Received' THEN 'PENDING'
  WHEN 'Credentials Under Review' THEN 'PENDING'
  WHEN 'Approved Sourcing Partner' THEN 'APPROVED'
  WHEN 'Declined' THEN 'REJECTED'
  ELSE status
END
WHERE kind = 'agent'
  AND status IN ('Application Received', 'Credentials Under Review', 'Approved Sourcing Partner', 'Declined');

COMMIT;

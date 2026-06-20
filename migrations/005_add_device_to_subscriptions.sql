-- Add device column to flexible subscriptions to restrict by device type
ALTER TABLE subscriptions ADD COLUMN device device_type;

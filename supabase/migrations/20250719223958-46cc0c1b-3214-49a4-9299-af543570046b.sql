-- Extend user roles to include more granular options
ALTER TYPE user_role ADD VALUE 'manager';
ALTER TYPE user_role ADD VALUE 'viewer';
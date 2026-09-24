-- Truck fund total for the server only (architecture/truck-fund.md).
-- security_invoker: the view obeys fund_ledger's RLS, so anon would see 0 even if granted.
-- Grants revoked anyway: dollars are never public (Invariant 5).
create view fund_total with (security_invoker = true) as
  select coalesce(sum(amount_cents), 0)::bigint as total_cents from fund_ledger;

revoke all on fund_total from anon, authenticated;

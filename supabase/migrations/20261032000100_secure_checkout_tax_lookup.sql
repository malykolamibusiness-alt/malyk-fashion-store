-- Minimal, authenticated tax lookup boundary for checkout.
-- Tax table policies remain administrator-only; clients receive only the applicable calculation rule.

CREATE OR REPLACE FUNCTION public.get_checkout_tax_rule(p_country_code text, p_region_code text DEFAULT '')
RETURNS TABLE(tax_rate_basis_points integer, prices_include_tax boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tr.tax_rate_basis_points, tr.prices_include_tax
  FROM public.tax_rules tr
  WHERE tr.active = true
    AND tr.country_code = upper(trim(p_country_code))
    AND (tr.region_code IS NULL OR btrim(tr.region_code) = '' OR tr.region_code = upper(trim(p_region_code)))
  ORDER BY CASE WHEN tr.region_code IS NULL OR btrim(tr.region_code) = '' THEN 1 ELSE 0 END
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_checkout_tax_rule(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_checkout_tax_rule(text, text) TO authenticated;

-- Verwijder de tijdelijke test-trigger met hardcoded e-mail
-- Deze was enkel nodig voor initiële dev-setup en hoort niet in productie
DROP TRIGGER IF EXISTS on_user_created_assign_athletes ON auth.users;
DROP FUNCTION IF EXISTS public.assign_athletes_to_user();

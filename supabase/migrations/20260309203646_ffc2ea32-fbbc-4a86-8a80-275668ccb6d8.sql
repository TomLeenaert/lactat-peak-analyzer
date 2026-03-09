
CREATE OR REPLACE FUNCTION public.assign_athletes_to_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email = 'vanwijmeerschk@gmail.com' THEN
    UPDATE public.athletes
    SET user_id = NEW.id
    WHERE id IN (
      'be406b1a-f0c6-457a-862c-49bc3b7faebf',
      'e81aaed0-a510-44bc-a522-e38928c9e60c',
      'b7e480e3-bdee-4eae-be84-b0c16c220998',
      'f86fc33d-a641-41c6-af7c-e6070f69a30f',
      '08bbc6a7-db92-478e-8e86-87402dc15eb9',
      'a608c87b-48f3-41c0-a612-e2ab55ba3d9b',
      'eb7e8bb9-b2ba-4490-b113-ed4f1f15e1b3',
      '09953969-726c-467a-9f2b-6bea3ad696e8'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created_assign_athletes
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_athletes_to_user();

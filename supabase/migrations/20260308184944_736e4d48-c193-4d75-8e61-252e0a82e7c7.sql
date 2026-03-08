
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  club_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create athletes table
CREATE TABLE public.athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE,
  sport TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own athletes" ON public.athletes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own athletes" ON public.athletes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own athletes" ON public.athletes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own athletes" ON public.athletes FOR DELETE USING (auth.uid() = user_id);

-- Create test_results table
CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  protocol_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  results_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own test results" ON public.test_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.athletes WHERE athletes.id = test_results.athlete_id AND athletes.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own test results" ON public.test_results
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.athletes WHERE athletes.id = test_results.athlete_id AND athletes.user_id = auth.uid())
  );
CREATE POLICY "Users can update own test results" ON public.test_results
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.athletes WHERE athletes.id = test_results.athlete_id AND athletes.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own test results" ON public.test_results
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.athletes WHERE athletes.id = test_results.athlete_id AND athletes.user_id = auth.uid())
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON public.athletes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

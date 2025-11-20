/*
  # Entrepreneurs & Public Markets System

  ## Overview
  This migration creates the entrepreneur marketplace and public project tracking system
  where citizens can rate entrepreneurs, track public contracts, and provide guarantees
  through community support.

  ## 1. New Tables
  
  ### `entrepreneurs`
  - `id` (uuid, primary key) - Entrepreneur identifier
  - `user_id` (uuid, foreign key) - Reference to users table
  - `company_name` (text) - Company name
  - `registration_number` (text) - Official registration number
  - `category` (text) - Category: construction, agriculture, technology, services, etc.
  - `description` (text) - Company description
  - `logo_url` (text) - Company logo
  - `country_code` (text) - ISO country code
  - `city` (text) - City
  - `address` (text) - Physical address
  - `phone` (text) - Contact phone
  - `email` (text) - Contact email
  - `website` (text) - Company website
  - `verified` (boolean) - Verification status
  - `verification_documents` (jsonb) - Verification documents
  - `average_rating` (numeric) - Average rating (0-5)
  - `total_projects` (integer) - Total completed projects
  - `success_rate` (numeric) - Success rate percentage
  - `total_value_delivered` (numeric) - Total value of completed projects
  - `crown_score` (integer) - Entrepreneur CROWN score
  - `subscription_tier` (text) - Subscription: free, verified, premium
  - `subscription_expires_at` (timestamptz) - Subscription expiry
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `public_projects`
  - `id` (uuid, primary key) - Project identifier
  - `project_name` (text) - Project name
  - `project_number` (text) - Official project number
  - `government_agency` (text) - Issuing government agency
  - `category` (text) - Project category
  - `description` (text) - Project description
  - `location` (text) - Project location
  - `budget` (numeric) - Project budget
  - `currency` (text) - Budget currency
  - `start_date` (timestamptz) - Planned start date
  - `end_date` (timestamptz) - Planned end date
  - `actual_start_date` (timestamptz) - Actual start date
  - `actual_end_date` (timestamptz) - Actual completion date
  - `status` (text) - Status: tendering, awarded, in_progress, completed, cancelled
  - `awarded_to` (uuid) - Entrepreneur awarded (foreign key)
  - `citizen_support_count` (integer) - Number of citizen supports
  - `citizen_concern_count` (integer) - Number of concerns raised
  - `progress_percentage` (numeric) - Completion percentage
  - `quality_rating` (numeric) - Quality rating from citizens
  - `transparency_score` (numeric) - Transparency score
  - `documents` (jsonb) - Project documents
  - `images` (jsonb) - Project images
  - `milestones` (jsonb) - Project milestones
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `entrepreneur_ratings`
  - `id` (uuid, primary key) - Rating identifier
  - `entrepreneur_id` (uuid, foreign key) - Reference to entrepreneurs
  - `project_id` (uuid, foreign key) - Reference to public_projects
  - `rater_id` (uuid, foreign key) - Citizen who rated
  - `rating` (integer) - Rating (1-5)
  - `quality_score` (integer) - Quality score (1-5)
  - `timeliness_score` (integer) - Timeliness score (1-5)
  - `communication_score` (integer) - Communication score (1-5)
  - `value_for_money_score` (integer) - Value score (1-5)
  - `comment` (text) - Rating comment
  - `photos` (jsonb) - Evidence photos
  - `verified` (boolean) - Verification status
  - `created_at` (timestamptz) - Creation timestamp

  ### `citizen_supports`
  - `id` (uuid, primary key) - Support identifier
  - `project_id` (uuid, foreign key) - Reference to public_projects
  - `entrepreneur_id` (uuid, foreign key) - Reference to entrepreneurs
  - `citizen_id` (uuid, foreign key) - Citizen providing support
  - `support_type` (text) - Type: endorse, guarantee, concern, report
  - `amount` (numeric) - Micro-payment amount if applicable
  - `comment` (text) - Support comment
  - `evidence` (jsonb) - Supporting evidence
  - `status` (text) - Status: active, resolved, dismissed
  - `created_at` (timestamptz) - Creation timestamp

  ### `project_updates`
  - `id` (uuid, primary key) - Update identifier
  - `project_id` (uuid, foreign key) - Reference to public_projects
  - `update_type` (text) - Type: milestone, progress, issue, completion
  - `title` (text) - Update title
  - `description` (text) - Update description
  - `progress_percentage` (numeric) - Progress at time of update
  - `photos` (jsonb) - Update photos
  - `documents` (jsonb) - Update documents
  - `posted_by` (uuid) - User who posted (entrepreneur or admin)
  - `created_at` (timestamptz) - Creation timestamp

  ### `entrepreneur_portfolio`
  - `id` (uuid, primary key) - Portfolio item identifier
  - `entrepreneur_id` (uuid, foreign key) - Reference to entrepreneurs
  - `project_name` (text) - Past project name
  - `client` (text) - Client name
  - `category` (text) - Project category
  - `value` (numeric) - Project value
  - `completion_date` (timestamptz) - Completion date
  - `description` (text) - Project description
  - `images` (jsonb) - Project images
  - `certificates` (jsonb) - Certificates/awards
  - `verified` (boolean) - Verification status
  - `created_at` (timestamptz) - Creation timestamp

  ## 2. Security - Row Level Security (RLS)
  
  - Entrepreneurs can manage their own profiles
  - Public projects are publicly viewable
  - Citizens can rate and support
  - All ratings and supports are transparent
  - Portfolio items are publicly viewable

  ## 3. Important Notes
  
  - Platform does NOT handle government funds
  - Only provides transparency and citizen oversight
  - Entrepreneurs pay subscription fees to platform
  - Citizens pay micro-fees for guarantee/support actions
  - All data is publicly transparent for accountability
*/

-- Create entrepreneurs table
CREATE TABLE IF NOT EXISTS entrepreneurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name text UNIQUE NOT NULL,
  registration_number text UNIQUE NOT NULL,
  category text NOT NULL,
  description text,
  logo_url text,
  country_code text DEFAULT 'GN',
  city text,
  address text,
  phone text,
  email text,
  website text,
  verified boolean DEFAULT false,
  verification_documents jsonb DEFAULT '[]'::jsonb,
  average_rating numeric DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_projects integer DEFAULT 0,
  success_rate numeric DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
  total_value_delivered numeric DEFAULT 0,
  crown_score integer DEFAULT 500 CHECK (crown_score >= 0 AND crown_score <= 1000),
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'verified', 'premium')),
  subscription_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create public_projects table
CREATE TABLE IF NOT EXISTS public_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  project_number text UNIQUE,
  government_agency text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  budget numeric NOT NULL CHECK (budget > 0),
  currency text DEFAULT 'GNF',
  start_date timestamptz,
  end_date timestamptz,
  actual_start_date timestamptz,
  actual_end_date timestamptz,
  status text DEFAULT 'tendering' CHECK (status IN ('tendering', 'awarded', 'in_progress', 'completed', 'cancelled', 'delayed')),
  awarded_to uuid REFERENCES entrepreneurs(id),
  citizen_support_count integer DEFAULT 0,
  citizen_concern_count integer DEFAULT 0,
  progress_percentage numeric DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  quality_rating numeric DEFAULT 0 CHECK (quality_rating >= 0 AND quality_rating <= 5),
  transparency_score numeric DEFAULT 0 CHECK (transparency_score >= 0 AND transparency_score <= 100),
  documents jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  milestones jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create entrepreneur_ratings table
CREATE TABLE IF NOT EXISTS entrepreneur_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneur_id uuid NOT NULL REFERENCES entrepreneurs(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public_projects(id) ON DELETE SET NULL,
  rater_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quality_score integer CHECK (quality_score >= 1 AND quality_score <= 5),
  timeliness_score integer CHECK (timeliness_score >= 1 AND timeliness_score <= 5),
  communication_score integer CHECK (communication_score >= 1 AND communication_score <= 5),
  value_for_money_score integer CHECK (value_for_money_score >= 1 AND value_for_money_score <= 5),
  comment text,
  photos jsonb DEFAULT '[]'::jsonb,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entrepreneur_id, rater_id, project_id)
);

-- Create citizen_supports table
CREATE TABLE IF NOT EXISTS citizen_supports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public_projects(id) ON DELETE CASCADE,
  entrepreneur_id uuid REFERENCES entrepreneurs(id) ON DELETE CASCADE,
  citizen_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  support_type text NOT NULL CHECK (support_type IN ('endorse', 'guarantee', 'concern', 'report', 'favorite')),
  amount numeric DEFAULT 0,
  comment text,
  evidence jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

-- Create project_updates table
CREATE TABLE IF NOT EXISTS project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public_projects(id) ON DELETE CASCADE,
  update_type text NOT NULL CHECK (update_type IN ('milestone', 'progress', 'issue', 'completion', 'delay')),
  title text NOT NULL,
  description text NOT NULL,
  progress_percentage numeric CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  photos jsonb DEFAULT '[]'::jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  posted_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create entrepreneur_portfolio table
CREATE TABLE IF NOT EXISTS entrepreneur_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneur_id uuid NOT NULL REFERENCES entrepreneurs(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  client text NOT NULL,
  category text NOT NULL,
  value numeric CHECK (value > 0),
  completion_date timestamptz,
  description text,
  images jsonb DEFAULT '[]'::jsonb,
  certificates jsonb DEFAULT '[]'::jsonb,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_user ON entrepreneurs(user_id);
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_verified ON entrepreneurs(verified);
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_category ON entrepreneurs(category);
CREATE INDEX IF NOT EXISTS idx_public_projects_status ON public_projects(status);
CREATE INDEX IF NOT EXISTS idx_public_projects_awarded ON public_projects(awarded_to);
CREATE INDEX IF NOT EXISTS idx_public_projects_agency ON public_projects(government_agency);
CREATE INDEX IF NOT EXISTS idx_entrepreneur_ratings_entrepreneur ON entrepreneur_ratings(entrepreneur_id);
CREATE INDEX IF NOT EXISTS idx_entrepreneur_ratings_project ON entrepreneur_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_citizen_supports_project ON citizen_supports(project_id);
CREATE INDEX IF NOT EXISTS idx_citizen_supports_entrepreneur ON citizen_supports(entrepreneur_id);
CREATE INDEX IF NOT EXISTS idx_citizen_supports_citizen ON citizen_supports(citizen_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_project ON project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_entrepreneur_portfolio_entrepreneur ON entrepreneur_portfolio(entrepreneur_id);

-- Enable Row Level Security
ALTER TABLE entrepreneurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrepreneur_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrepreneur_portfolio ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entrepreneurs
CREATE POLICY "Anyone can view verified entrepreneurs"
  ON entrepreneurs FOR SELECT
  TO authenticated
  USING (verified = true OR user_id = auth.uid());

CREATE POLICY "Users can create own entrepreneur profile"
  ON entrepreneurs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Entrepreneurs can update own profile"
  ON entrepreneurs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for public_projects
CREATE POLICY "Anyone can view public projects"
  ON public_projects FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for entrepreneur_ratings
CREATE POLICY "Anyone can view ratings"
  ON entrepreneur_ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ratings"
  ON entrepreneur_ratings FOR INSERT
  TO authenticated
  WITH CHECK (rater_id = auth.uid());

-- RLS Policies for citizen_supports
CREATE POLICY "Anyone can view supports"
  ON citizen_supports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Citizens can create supports"
  ON citizen_supports FOR INSERT
  TO authenticated
  WITH CHECK (citizen_id = auth.uid());

-- RLS Policies for project_updates
CREATE POLICY "Anyone can view project updates"
  ON project_updates FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for entrepreneur_portfolio
CREATE POLICY "Anyone can view portfolio"
  ON entrepreneur_portfolio FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Entrepreneurs can manage own portfolio"
  ON entrepreneur_portfolio FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entrepreneurs
      WHERE entrepreneurs.user_id = auth.uid()
      AND entrepreneurs.id = entrepreneur_portfolio.entrepreneur_id
    )
  );

-- Triggers
CREATE TRIGGER update_entrepreneurs_updated_at
  BEFORE UPDATE ON entrepreneurs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_projects_updated_at
  BEFORE UPDATE ON public_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update entrepreneur average rating
CREATE OR REPLACE FUNCTION update_entrepreneur_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE entrepreneurs
  SET average_rating = (
    SELECT AVG(rating)::numeric
    FROM entrepreneur_ratings
    WHERE entrepreneur_id = NEW.entrepreneur_id
  )
  WHERE id = NEW.entrepreneur_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update average rating
CREATE TRIGGER update_entrepreneur_avg_rating
  AFTER INSERT OR UPDATE ON entrepreneur_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_entrepreneur_rating();

-- Function to update project support counts
CREATE OR REPLACE FUNCTION update_project_support_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.support_type IN ('endorse', 'guarantee') THEN
    UPDATE public_projects
    SET citizen_support_count = citizen_support_count + 1
    WHERE id = NEW.project_id;
  ELSIF NEW.support_type IN ('concern', 'report') THEN
    UPDATE public_projects
    SET citizen_concern_count = citizen_concern_count + 1
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update support counts
CREATE TRIGGER update_project_supports
  AFTER INSERT ON citizen_supports
  FOR EACH ROW
  EXECUTE FUNCTION update_project_support_counts();
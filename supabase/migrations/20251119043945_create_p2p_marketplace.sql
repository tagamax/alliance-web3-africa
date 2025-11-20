/*
  # P2P Marketplace System

  ## Overview
  This migration creates the P2P trading marketplace for Alliance Web3 Africa,
  enabling secure peer-to-peer trading with escrow protection.

  ## 1. New Tables

  ### `p2p_listings`
  - `id` (uuid, primary key) - Listing identifier
  - `user_id` (uuid, foreign key) - Seller/trader user ID
  - `listing_type` (text) - Type: buy or sell
  - `token_symbol` (text) - Token being traded (عLK3, USDT, etc.)
  - `amount` (numeric) - Total amount available
  - `remaining_amount` (numeric) - Amount still available
  - `price` (numeric) - Price per token
  - `currency` (text) - Fiat currency (GNF, USD, EUR, etc.)
  - `payment_methods` (jsonb) - Accepted payment methods array
  - `min_order` (numeric) - Minimum order amount
  - `max_order` (numeric) - Maximum order amount
  - `time_limit` (integer) - Payment time limit in minutes
  - `terms` (text) - Trading terms and conditions
  - `status` (text) - Status: active, paused, completed, cancelled
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Update timestamp

  ### `p2p_orders`
  - `id` (uuid, primary key) - Order identifier
  - `listing_id` (uuid, foreign key) - Reference to listing
  - `buyer_id` (uuid, foreign key) - Buyer user ID
  - `seller_id` (uuid, foreign key) - Seller user ID
  - `amount` (numeric) - Order amount
  - `price` (numeric) - Agreed price
  - `total` (numeric) - Total fiat amount
  - `currency` (text) - Fiat currency
  - `payment_method` (text) - Selected payment method
  - `status` (text) - Status: pending, paid, released, disputed, cancelled, completed
  - `escrow_address` (text) - Blockchain escrow address
  - `payment_deadline` (timestamptz) - Payment deadline
  - `paid_at` (timestamptz) - Payment confirmation timestamp
  - `released_at` (timestamptz) - Token release timestamp
  - `cancelled_at` (timestamptz) - Cancellation timestamp
  - `dispute_reason` (text) - Dispute reason if applicable
  - `created_at` (timestamptz) - Order creation timestamp

  ### `p2p_reviews`
  - `id` (uuid, primary key) - Review identifier
  - `order_id` (uuid, foreign key) - Reference to order
  - `reviewer_id` (uuid, foreign key) - User leaving review
  - `reviewed_user_id` (uuid, foreign key) - User being reviewed
  - `rating` (integer) - Rating 1-5
  - `comment` (text) - Review comment
  - `created_at` (timestamptz) - Review timestamp

  ## 2. Security - Row Level Security (RLS)

  All tables have RLS enabled with appropriate policies:
  - Users can view their own listings and orders
  - Users can view public active listings
  - Only order participants can view order details
  - Reviews are public but can only be created by order participants

  ## 3. Important Notes

  - Escrow protection for all trades
  - Automatic reputation system via reviews
  - Time limits for payment and disputes
  - Multi-currency and multi-payment method support
*/

-- Create p2p_listings table
CREATE TABLE IF NOT EXISTS p2p_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_type text NOT NULL CHECK (listing_type IN ('buy', 'sell')),
  token_symbol text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  remaining_amount numeric NOT NULL CHECK (remaining_amount >= 0),
  price numeric NOT NULL CHECK (price > 0),
  currency text NOT NULL,
  payment_methods jsonb DEFAULT '[]'::jsonb,
  min_order numeric DEFAULT 0 CHECK (min_order >= 0),
  max_order numeric CHECK (max_order >= min_order),
  time_limit integer DEFAULT 30 CHECK (time_limit > 0),
  terms text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create p2p_orders table
CREATE TABLE IF NOT EXISTS p2p_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES p2p_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  price numeric NOT NULL CHECK (price > 0),
  total numeric NOT NULL CHECK (total > 0),
  currency text NOT NULL,
  payment_method text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'released', 'disputed', 'cancelled', 'completed')),
  escrow_address text,
  payment_deadline timestamptz,
  paid_at timestamptz,
  released_at timestamptz,
  cancelled_at timestamptz,
  dispute_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create p2p_reviews table
CREATE TABLE IF NOT EXISTS p2p_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(order_id, reviewer_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_p2p_listings_user_id ON p2p_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_p2p_listings_status ON p2p_listings(status);
CREATE INDEX IF NOT EXISTS idx_p2p_listings_type ON p2p_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_p2p_orders_listing_id ON p2p_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_p2p_orders_buyer_id ON p2p_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_p2p_orders_seller_id ON p2p_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_p2p_orders_status ON p2p_orders(status);
CREATE INDEX IF NOT EXISTS idx_p2p_reviews_reviewed_user_id ON p2p_reviews(reviewed_user_id);

-- Enable Row Level Security
ALTER TABLE p2p_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for p2p_listings
CREATE POLICY "Anyone can view active listings"
  ON p2p_listings FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Users can view own listings"
  ON p2p_listings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own listings"
  ON p2p_listings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own listings"
  ON p2p_listings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for p2p_orders
CREATE POLICY "Users can view own orders"
  ON p2p_orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create orders"
  ON p2p_orders FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Order participants can update"
  ON p2p_orders FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS Policies for p2p_reviews
CREATE POLICY "Anyone can view reviews"
  ON p2p_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Order participants can create reviews"
  ON p2p_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM p2p_orders
      WHERE id = order_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
      AND status = 'completed'
    )
  );

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_p2p_listings_updated_at
  BEFORE UPDATE ON p2p_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate user rating
CREATE OR REPLACE FUNCTION get_user_p2p_rating(user_uuid uuid)
RETURNS TABLE (
  average_rating numeric,
  total_trades bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0)::numeric as average_rating,
    COUNT(*)::bigint as total_trades
  FROM p2p_reviews
  WHERE reviewed_user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all application tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_favourite_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────
-- profiles: users can read/write only their own row
-- ──────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ──────────────────────────────────────────
-- vendors: public read, owner write
-- ──────────────────────────────────────────
CREATE POLICY "vendors_select_all" ON vendors
  FOR SELECT USING (true);

CREATE POLICY "vendors_update_own" ON vendors
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "vendors_insert_own" ON vendors
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- ──────────────────────────────────────────
-- categories: public read only (managed by admins via service role)
-- ──────────────────────────────────────────
CREATE POLICY "categories_select_all" ON categories
  FOR SELECT USING (true);

-- ──────────────────────────────────────────
-- products: public read, vendor-owner write
-- ──────────────────────────────────────────
CREATE POLICY "products_select_all" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_insert_own" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = products.vendor_id
        AND vendors.owner_id = auth.uid()
    )
  );

CREATE POLICY "products_update_own" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = products.vendor_id
        AND vendors.owner_id = auth.uid()
    )
  );

CREATE POLICY "products_delete_own" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = products.vendor_id
        AND vendors.owner_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────
-- orders: customer sees their own; vendor sees orders for their store
-- ──────────────────────────────────────────
CREATE POLICY "orders_select_customer" ON orders
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "orders_select_vendor" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = orders.vendor_id
        AND vendors.owner_id = auth.uid()
    )
  );

CREATE POLICY "orders_insert_customer" ON orders
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "orders_update_vendor" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = orders.vendor_id
        AND vendors.owner_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────
-- order_products: follows parent order visibility
-- ──────────────────────────────────────────
CREATE POLICY "order_products_select_customer" ON order_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_products.order_id
        AND orders.profile_id = auth.uid()
    )
  );

CREATE POLICY "order_products_select_vendor" ON order_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN vendors ON vendors.id = orders.vendor_id
      WHERE orders.id = order_products.order_id
        AND vendors.owner_id = auth.uid()
    )
  );

CREATE POLICY "order_products_insert_customer" ON order_products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_products.order_id
        AND orders.profile_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────
-- mp_accounts: vendor owner only
-- ──────────────────────────────────────────
CREATE POLICY "mp_accounts_select_own" ON mp_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = mp_accounts.vendor_id
        AND vendors.owner_id = auth.uid()
    )
  );

CREATE POLICY "mp_accounts_insert_own" ON mp_accounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = mp_accounts.vendor_id
        AND vendors.owner_id = auth.uid()
    )
  );

CREATE POLICY "mp_accounts_update_own" ON mp_accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = mp_accounts.vendor_id
        AND vendors.owner_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────
-- addresses: owner only
-- ──────────────────────────────────────────
CREATE POLICY "addresses_select_own" ON addresses
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "addresses_insert_own" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "addresses_update_own" ON addresses
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "addresses_delete_own" ON addresses
  FOR DELETE USING (auth.uid() = profile_id);

-- ──────────────────────────────────────────
-- profile_favourite_vendors: owner only
-- ──────────────────────────────────────────
CREATE POLICY "favourites_select_own" ON profile_favourite_vendors
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "favourites_insert_own" ON profile_favourite_vendors
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "favourites_delete_own" ON profile_favourite_vendors
  FOR DELETE USING (auth.uid() = profile_id);

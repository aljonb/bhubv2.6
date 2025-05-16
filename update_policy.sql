-- Create a temporary policy that allows all inserts (for testing)
CREATE POLICY "Allow all inserts temporarily" ON appointments FOR INSERT USING (true);

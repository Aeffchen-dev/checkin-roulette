-- Enable Row Level Security but allow public read access for this quiz app
ALTER TABLE "Friends App Questions" ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to read questions (since this is a public quiz)
CREATE POLICY "Allow public read access to questions" 
ON "Friends App Questions" 
FOR SELECT 
USING (true);
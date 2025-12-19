-- Allows authenticated users to SELECT only their own messages.
-- Useful for Supabase Realtime when RLS enforcement is enabled.

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can read their messages" ON public.messages
      FOR SELECT
      TO authenticated
      USING (sender_id = auth.uid() OR receiver_id = auth.uid());
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists
      NULL;
  END;
END $$;

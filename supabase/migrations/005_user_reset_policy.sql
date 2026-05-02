-- Allow users to reset their own payment status to 'pending' when re-submitting proof
DROP POLICY IF EXISTS "Users can reset own payment status" ON public.users;
CREATE POLICY "Users can reset own payment status"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  payment_status = 'pending'
);

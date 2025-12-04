-- Create storage bucket for resource images
INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-images', 'resource-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload resource images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resource-images');

-- Allow public read access to resource images
CREATE POLICY "Public can view resource images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resource-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update resource images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'resource-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete resource images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'resource-images');
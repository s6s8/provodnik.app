-- Fix dead Unsplash photo IDs in production listings (T070)
-- photo-1571079570759 and photo-1520637836862 return HTTP 404

UPDATE listings
SET image_url = 'https://images.unsplash.com/photo-1543832923-44667a44c804?auto=format&fit=crop&w=1600&h=900&q=80'
WHERE image_url LIKE '%photo-1571079570759%'
  AND status = 'published';

UPDATE listings
SET image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&h=900&q=80'
WHERE image_url LIKE '%photo-1520637836862%'
  AND status = 'published';

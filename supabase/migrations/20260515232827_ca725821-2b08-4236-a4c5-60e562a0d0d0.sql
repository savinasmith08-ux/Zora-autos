
ALTER TABLE public.cars
  ADD CONSTRAINT cars_year_check CHECK (year >= 1886 AND year <= EXTRACT(YEAR FROM now())::int + 2) NOT VALID,
  ADD CONSTRAINT cars_price_check CHECK (price > 0 AND price < 100000000) NOT VALID,
  ADD CONSTRAINT cars_mileage_check CHECK (mileage >= 0 AND mileage < 10000000) NOT VALID,
  ADD CONSTRAINT cars_make_len CHECK (char_length(make) BETWEEN 1 AND 80) NOT VALID,
  ADD CONSTRAINT cars_model_len CHECK (char_length(model) BETWEEN 1 AND 120) NOT VALID,
  ADD CONSTRAINT cars_description_len CHECK (description IS NULL OR char_length(description) <= 5000) NOT VALID,
  ADD CONSTRAINT cars_vin_len CHECK (vin IS NULL OR char_length(vin) BETWEEN 1 AND 32) NOT VALID;

ALTER TABLE public.car_submissions
  ADD CONSTRAINT subs_year_check CHECK (year >= 1886 AND year <= EXTRACT(YEAR FROM now())::int + 2) NOT VALID,
  ADD CONSTRAINT subs_price_check CHECK (asking_price > 0 AND asking_price < 100000000) NOT VALID,
  ADD CONSTRAINT subs_mileage_check CHECK (mileage >= 0 AND mileage < 10000000) NOT VALID,
  ADD CONSTRAINT subs_make_len CHECK (char_length(make) BETWEEN 1 AND 80) NOT VALID,
  ADD CONSTRAINT subs_model_len CHECK (char_length(model) BETWEEN 1 AND 120) NOT VALID,
  ADD CONSTRAINT subs_name_len CHECK (char_length(name) BETWEEN 1 AND 120) NOT VALID,
  ADD CONSTRAINT subs_email_len CHECK (char_length(email) BETWEEN 3 AND 255) NOT VALID,
  ADD CONSTRAINT subs_description_len CHECK (description IS NULL OR char_length(description) <= 5000) NOT VALID;

UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'car-images';

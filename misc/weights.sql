ALTER TABLE walknet 
ALTER COLUMN the_geom 
TYPE geometry(linestring, 3857) 
USING ST_Transform(the_geom, 3857);

ALTER TABLE walknet 
ADD COLUMN nature_weight INTEGER, 
ADD COLUMN culture_weight INTEGER, 
ADD COLUMN market_weight INTEGER,
ADD COLUMN nature_cost DOUBLE PRECISION, 
ADD COLUMN culture_cost DOUBLE PRECISION, 
ADD COLUMN market_cost DOUBLE PRECISION;

-- Update nature_weight
UPDATE walknet 
SET 
  nature_weight = (
    SELECT COUNT(*) FROM (
      SELECT 1 FROM planet_osm_polygon
      WHERE (leisure = 'park' OR waterway = 'riverbank') AND ST_DWithin(walknet.the_geom, planet_osm_polygon.way, 150)
      UNION ALL
      SELECT 1 FROM planet_osm_line
      WHERE waterway = 'riverbank' AND ST_DWithin(walknet.the_geom, planet_osm_line.way, 150)
    ) AS matches
  );

-- Update culture_weight
UPDATE walknet 
SET 
  culture_weight = (
    SELECT COUNT(*) FROM (
      SELECT 1 FROM planet_osm_point
      WHERE (tourism IS NOT NULL) AND ST_DWithin(walknet.the_geom, planet_osm_point.way, 150)
      UNION ALL
      SELECT 1 FROM planet_osm_polygon
      WHERE (tourism IS NOT NULL OR amenity = 'place_of_worship' OR heritage IS NOT NULL) AND ST_DWithin(walknet.the_geom, planet_osm_polygon.way, 150)
    ) AS matches
  );

-- Update market_weight
UPDATE walknet 
SET 
  market_weight = (
    SELECT COUNT(*) FROM (
      SELECT 1 FROM planet_osm_point
      WHERE (shop IS NOT NULL OR amenity IN ('bar', 'cafe', 'pub', 'restaurant')) AND ST_DWithin(walknet.the_geom, planet_osm_point.way, 150)
    ) AS matches
  );


-- Update cost columns
UPDATE walknet
SET 
  nature_cost = CASE WHEN length_m * (1 - 0.3 * nature_weight) < 0 THEN 0 ELSE length_m * (1 - 0.1 * nature_weight) END,
  culture_cost = CASE WHEN length_m * (1 - 0.05 * culture_weight) < 0 THEN 0 ELSE length_m * (1 - 0.05 * culture_weight) END,
  market_cost = CASE WHEN length_m * (1 - 0.01 * market_weight) < 0 THEN 0 ELSE length_m * (1 - 0.01 * market_weight) END;
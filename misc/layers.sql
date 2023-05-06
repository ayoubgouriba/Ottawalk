-- osm_id, name, amenity, heritage, "natural", leisure, waterway, shop, tourism, waterway, way

DROP TABLE IF EXISTS osm_market;
DROP TABLE IF EXISTS osm_culture;
DROP TABLE IF EXISTS osm_point_culture;
DROP TABLE IF EXISTS osm_polygon_culture;
DROP TABLE IF EXISTS osm_nature;
DROP TABLE IF EXISTS osm_line_nature;
DROP TABLE IF EXISTS osm_polygon_nature;


CREATE TABLE osm_polygon_nature AS
SELECT osm_id, name, amenity, heritage, "natural", leisure, waterway, shop, tourism, way
FROM planet_osm_polygon
WHERE leisure = 'park'
   OR waterway IS NOT NULL
   OR "natural" = 'water';


CREATE TABLE osm_line_nature AS
SELECT osm_id, name, amenity, heritage, "natural", leisure, waterway, shop, tourism, way
FROM planet_osm_line
WHERE waterway IS NOT NULL OR leisure = 'track';

CREATE TABLE osm_nature AS
    SELECT * FROM osm_line_nature
    UNION
    SELECT * FROM osm_polygon_nature;

CREATE TABLE osm_polygon_culture AS
SELECT osm_id, name, amenity, heritage, "natural", leisure, waterway, shop, tourism, way
FROM planet_osm_polygon
WHERE tourism IS NOT NULL
  OR amenity = 'place_of_worship'
  OR heritage IS NOT NULL;

CREATE TABLE osm_point_culture AS
SELECT osm_id, name, amenity, heritage, "natural", leisure, waterway, shop, tourism, way
FROM planet_osm_point
WHERE tourism IS NOT NULL
  OR amenity = 'place_of_worship';


CREATE TABLE osm_culture AS
SELECT *
FROM osm_polygon_culture
UNION
SELECT *
FROM osm_point_culture;

CREATE TABLE osm_market AS
SELECT osm_id, name, amenity, heritage, "natural", leisure, waterway, shop, tourism, way
FROM planet_osm_point
WHERE shop IS NOT NULL
  OR (amenity = 'bar'
       OR amenity = 'cafe'
       OR amenity = 'pub'
       OR amenity = 'restaurant');
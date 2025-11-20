/*
  # Insert Default Mine Zones
  
  1. Data
    - Inserts 3 default mining zones for the game
    - Zones based on real African mining locations
    - Each zone has different characteristics and protection levels
  
  2. Details
    - Forêt de Ziama (Guinea) - Gold, High biodiversity, Protected
    - Plateau de Fouta (Guinea) - Bauxite, Medium biodiversity
    - Bassin du Niger (West Africa) - Diamond, Critical biodiversity, Protected
*/

-- Insert default zones only if they don't exist
INSERT INTO mine_zones (id, name, resource_type, resource_density, biodiversity_level, water_quality, risk_level, is_protected, protection_reason, location_gps, metadata)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'Forêt de Ziama',
    'Or',
    75,
    90,
    85,
    'high',
    true,
    'Zone de haute biodiversité avec espèces endémiques',
    '{"lat": 8.3833, "lon": -9.2833}',
    '{"country": "Guinée", "region": "Nzérékoré"}'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Plateau de Fouta',
    'Bauxite',
    85,
    70,
    75,
    'medium',
    false,
    null,
    '{"lat": 11.0, "lon": -12.0}',
    '{"country": "Guinée", "region": "Labé"}'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Bassin du Niger',
    'Diamant',
    60,
    95,
    90,
    'critical',
    true,
    'Zone protégée UNESCO - Écosystème fragile du bassin fluvial',
    '{"lat": 13.5, "lon": 2.1}',
    '{"country": "Multi-pays", "region": "Bassin du Niger"}'
  )
ON CONFLICT (id) DO NOTHING;

// Minimal French departments to region mapping (2016 regions)
// Notes:
// - City strings often contain a department code in parentheses, e.g., "Bordeaux (33)"
// - We parse that code to infer the region.

export const DEPT_TO_REGION: Record<string, string> = {
  // Île-de-France
  '75': "Île-de-France",
  '77': "Île-de-France",
  '78': "Île-de-France",
  '91': "Île-de-France",
  '92': "Île-de-France",
  '93': "Île-de-France",
  '94': "Île-de-France",
  '95': "Île-de-France",

  // Centre-Val de Loire
  '18': 'Centre-Val de Loire',
  '28': 'Centre-Val de Loire',
  '36': 'Centre-Val de Loire',
  '37': 'Centre-Val de Loire',
  '41': 'Centre-Val de Loire',
  '45': 'Centre-Val de Loire',

  // Bourgogne-Franche-Comté
  '21': 'Bourgogne-Franche-Comté',
  '25': 'Bourgogne-Franche-Comté',
  '39': 'Bourgogne-Franche-Comté',
  '58': 'Bourgogne-Franche-Comté',
  '70': 'Bourgogne-Franche-Comté',
  '71': 'Bourgogne-Franche-Comté',
  '89': 'Bourgogne-Franche-Comté',
  '90': 'Bourgogne-Franche-Comté',

  // Normandie
  '14': 'Normandie',
  '27': 'Normandie',
  '50': 'Normandie',
  '61': 'Normandie',
  '76': 'Normandie',

  // Hauts-de-France
  '02': 'Hauts-de-France',
  '59': 'Hauts-de-France',
  '60': 'Hauts-de-France',
  '62': 'Hauts-de-France',
  '80': 'Hauts-de-France',

  // Grand Est
  '08': 'Grand Est',
  '10': 'Grand Est',
  '51': 'Grand Est',
  '52': 'Grand Est',
  '54': 'Grand Est',
  '55': 'Grand Est',
  '57': 'Grand Est',
  '67': 'Grand Est',
  '68': 'Grand Est',
  '88': 'Grand Est',

  // Pays de la Loire
  '44': 'Pays de la Loire',
  '49': 'Pays de la Loire',
  '53': 'Pays de la Loire',
  '72': 'Pays de la Loire',
  '85': 'Pays de la Loire',

  // Bretagne
  '22': 'Bretagne',
  '29': 'Bretagne',
  '35': 'Bretagne',
  '56': 'Bretagne',

  // Nouvelle-Aquitaine
  '16': 'Nouvelle-Aquitaine',
  '17': 'Nouvelle-Aquitaine',
  '19': 'Nouvelle-Aquitaine',
  '23': 'Nouvelle-Aquitaine',
  '24': 'Nouvelle-Aquitaine',
  '33': 'Nouvelle-Aquitaine',
  '40': 'Nouvelle-Aquitaine',
  '47': 'Nouvelle-Aquitaine',
  '64': 'Nouvelle-Aquitaine',
  '79': 'Nouvelle-Aquitaine',
  '86': 'Nouvelle-Aquitaine',
  '87': 'Nouvelle-Aquitaine',

  // Occitanie
  '09': 'Occitanie',
  '11': 'Occitanie',
  '12': 'Occitanie',
  '30': 'Occitanie',
  '31': 'Occitanie',
  '32': 'Occitanie',
  '34': 'Occitanie',
  '46': 'Occitanie',
  '48': 'Occitanie',
  '65': 'Occitanie',
  '66': 'Occitanie',
  '81': 'Occitanie',
  '82': 'Occitanie',

  // Auvergne-Rhône-Alpes
  '01': 'Auvergne-Rhône-Alpes',
  '03': 'Auvergne-Rhône-Alpes',
  '07': 'Auvergne-Rhône-Alpes',
  '15': 'Auvergne-Rhône-Alpes',
  '26': 'Auvergne-Rhône-Alpes',
  '38': 'Auvergne-Rhône-Alpes',
  '42': 'Auvergne-Rhône-Alpes',
  '43': 'Auvergne-Rhône-Alpes',
  '63': 'Auvergne-Rhône-Alpes',
  '69': 'Auvergne-Rhône-Alpes',
  '73': 'Auvergne-Rhône-Alpes',
  '74': 'Auvergne-Rhône-Alpes',

  // Provence-Alpes-Côte d’Azur
  '04': 'Provence-Alpes-Côte d’Azur',
  '05': 'Provence-Alpes-Côte d’Azur',
  '06': 'Provence-Alpes-Côte d’Azur',
  '13': 'Provence-Alpes-Côte d’Azur',
  '83': 'Provence-Alpes-Côte d’Azur',
  '84': 'Provence-Alpes-Côte d’Azur',

  // Corse
  '2A': 'Corse',
  '2B': 'Corse',

  // Outre-mer
  '971': 'Guadeloupe',
  '972': 'Martinique',
  '973': 'Guyane',
  '974': 'La Réunion',
  '975': 'Saint-Pierre-et-Miquelon',
  '976': 'Mayotte',
  '977': 'Saint-Barthélemy',
  '978': 'Saint-Martin',
  '986': 'Wallis-et-Futuna',
  '987': 'Polynésie française',
  '988': 'Nouvelle-Calédonie',
};

export function extractDepartmentCodeFromCity(city?: string | null): string | null {
  if (!city) return null;
  const m = city.match(/\((\d{2}|2A|2B|97\d|98\d)\)/i);
  if (!m) return null;
  // Normalize e.g., 2a -> 2A, keep others as zero-padded or 3 digits
  const raw = m[1];
  const up = raw.toUpperCase();
  if (up.length === 1) return up.padStart(2, '0');
  if (up.length === 2 && /^\d{1}$/.test(up)) return up.padStart(2, '0');
  return up;
}

export function cityToRegion(city?: string | null): string | null {
  const dept = extractDepartmentCodeFromCity(city);
  if (!dept) return null;
  return DEPT_TO_REGION[dept] ?? null;
}

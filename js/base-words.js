/*
 * Paraules base per al joc Rescat – Anagrames.
 * Cada entrada: { word, hint } – sense accents, majúscules.
 *
 * Per afegir un altre idioma: crear un nou fitxer amb la mateixa estructura
 * i canviar l'import a index.html.
 */

const LANG = 'ca'; // Catalan

const BASE_WORDS = [
  { word: "TREBALLAR",  hint: "Verb: fer feina" },
  { word: "TEMPORADA",  hint: "Nom: un període de l'any" },
  { word: "CALENDARI",  hint: "Nom: full del temps" },
  { word: "PARLAMENT",  hint: "Nom: cambra legislativa" },
  { word: "CAMPIONAT",  hint: "Nom: competició esportiva" },
  { word: "BARCELONA",  hint: "Nom: capital de Catalunya" },
  { word: "IMPORTANT",  hint: "Adj: de gran valor" },
  { word: "MERAVELLA",  hint: "Nom: cosa extraordinària" },
  { word: "CARRETERA",  hint: "Nom: via per a vehicles" },
  { word: "MARINADES",  hint: "Nom: salses de vi i espècies" },
  { word: "CASTELLERS", hint: "Nom: els qui fan castells humans" },
  { word: "PERSONATGE", hint: "Nom: figura destacada" },
  { word: "TEMPORAL",   hint: "Adj: limitat en el temps" },
  { word: "PALMERES",   hint: "Nom: arbres tropicals" },
  { word: "SARDINES",   hint: "Nom: peixos de la costa" },
];

/* Scoring per longitud de paraula */
const SCORE_TABLE = {
  3: 1,
  4: 2,
  5: 5,
  6: 6,
  7: 7,
  8: 10,
  9: 15,
  10: 20,
};

function getScore(wordLength) {
  return SCORE_TABLE[wordLength] ?? (wordLength > 10 ? 20 : 0);
}
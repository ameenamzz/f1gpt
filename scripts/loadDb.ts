import "dotenv/config";
import OpenAI from "openai";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPEN_API_KEY,
} = process.env;

const openai = new OpenAI({ apiKey: OPEN_API_KEY }); // connecting to openai

//scrapping data
const f1Data = [
  "https://en.wikipedia.org/wiki/Formula_One",
  "https://www.skysports.com/f1/news",
  "https://www.formula1.com/en/latest",
  "https://www.motorsport.com/f1/news/?utm_source=chatgpt.com",
  "https://www.racefans.net/",
  "https://www.reddit.com/r/formula1/",
  "https://www.autosport.com/f1/",
  "https://www.statsf1.com/en/default.aspx?utm_source=chatgpt.com",
  "https://www.planetf1.com/",
  "https://www.britannica.com/sports/Formula-One-automobile-racing",
  "https://www.formulaonehistory.com/",
];

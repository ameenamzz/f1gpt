import { DataAPIClient } from "@datastax/astra-db-ts";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
// import { scrapePage } from "./utils/scrapePage";
import OpenAI from "openai";
import "dotenv/config";
import { text } from "stream/consumers";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

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

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);

// ✅ 'namespace' option is deprecated — removed
const db = client.db(ASTRA_DB_API_ENDPOINT);

// ✅ include namespace when creating or getting a collection
// const collection = db.collection(
//   `${ASTRA_DB_NAMESPACE}.${ASTRA_DB_COLLECTION}`
// );

// text spliter for proper embedding
//npm install @langchain/textsplitters(PACKAGE REQUIRED)
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

// creating collection in db
const createCollection = async (
  similarityMetric: SimilarityMetric = "dot_product"
) => {
  const res = await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: {
      dimension: 1536,
      metric: similarityMetric,
    },
  });
  console.log(res);
};

// npm install @langchain/community @langchain/core puppeteer --legacy-peer-deps (PACKAGE REQUIRED)
//function  for scraping data from web
const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    // evaluate -> a custom function to extract the content you want from the page
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML); //runs in the browser context and grabs all the HTML inside the <body> tag.
      await browser.close(); //closes the Puppeteer browser after scraping.
      return result; //returns the raw HTML as a string.
    },
  });
  return (await loader.scrape())?.replace(/<[^>]*>?/gm, "");
  //loader.scrape() → executes the Puppeteer loader, runs your evaluate function, and returns the scraped HTML.
  //?.replace(/<[^>]*>?/gm,'') → removes all HTML tags using a regex.
};

//ADDING DATA TO COLLECTION
const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION);
  for await (const url of f1Data) { 
    const content = await scrapePage(url); // calling scrapePage function to scrape data
    const chunks = await splitter.splitText(content); //splitting data into chunks
    for await (const chunk of chunks) {
      const embedding = await openai.embeddings.create({
        // converting them into vector (embedding)
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float",
      });

      const vector = embedding.data[0].embedding; //extracting or getting the ebe
      const res = await collection.insertOne({
        $vector: vector,
        text: chunk,
      });
    }
  }
};

createCollection().then(()=>loadSampleData())

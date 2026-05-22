// lib/notion.js
import axios from "axios";

export async function addToNotion({ url, categoria, nota, tags }) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = process.env.NOTION_DATABASE_ID;

  const payload = {
    parent: { database_id: DATABASE_ID },
    properties: {
      URL: { url },
      Categoria: { select: { name: categoria } },
      Nota: { rich_text: [{ text: { content: nota } }] },
      Tags: {
        multi_select: tags.map(t => ({ name: t }))
      }
    }
  };

  await axios.post("https://api.notion.com/v1/pages", payload, {
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    }
  });
}
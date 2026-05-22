// api/whatsapp.js
import axios from "axios";
import { addToNotion } from "../lib/notion.js";
import { commitToObsidian } from "../lib/markdown.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const body = req.body;
  const incoming = (body.Body || "").trim();
  const lines = incoming.split("\n").map(l => l.trim()).filter(Boolean);

  try {
    if (lines.length < 2) throw new Error("Formato insuficiente – veja o exemplo na README.");

    const cmd = lines[0].toLowerCase();
    const catMap = {
      "/pesquisa": "Pesquisa",
      "/exercicios": "Exercícios",
      "/saude": "Saúde",
      "/receitas": "Receitas",
      "/aulas": "Aulas"
    };
    const categoria = catMap[cmd] || cmd.replace("/", "").trim();

    const urlMatch = lines[1].match(/https?:\/\/\S+/i);
    if (!urlMatch) throw new Error("A segunda linha deve conter uma URL válida.");
    const url = urlMatch[0];

    const rawNote = lines.slice(2).join("\n");
    const tagMatch = rawNote.match(/tags?\s*:\s*(.+)/i);
    const tags = tagMatch ? tagMatch[1].split(",").map(t => t.trim()) : [];
    const nota = tagMatch ? rawNote.replace(tagMatch[0], "").trim() : rawNote;

    // Persistência
    await addToNotion({ url, categoria, nota, tags });
    const mdPath = await commitToObsidian({ url, categoria, nota, tags });

    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>✅ Salvo em *${categoria}* ✅\nArquivo: ${mdPath}</Message></Response>`;
    res.setHeader("Content-Type", "application/xml");
    res.send(twiml);
  } catch (err) {
    console.error(err);
    const errMsg = `❌ Erro: ${err.message}`;
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${errMsg}</Message></Response>`;
    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(twiml);
  }
}
// lib/markdown.js
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export function generateMarkdown({ url, categoria, nota, tags }) {
  const today = new Date().toISOString().split("T")[0];
  const slug = url.replace(/[^a-zA-Z0-9]/g, "-").substring(0, 40);
  const fileName = `${today}-${slug}.md`;

  const frontMatter = `---\nurl: "${url}"\ncategoria: "${categoria}"\ntags: [${tags.map(t => `"${t}"`).join(", ")}]\ndate: ${today}\n---`;
  const content = `${frontMatter}\n\n${nota}\n`;
  return { fileName, content };
}

/**
 * Commit a markdown file into the Obsidian vault repo.
 * O repositório do vault deve ser privado e acessível via token.
 */
export async function commitToObsidian({ url, categoria, nota, tags }) {
  const { fileName, content } = generateMarkdown({ url, categoria, nota, tags });

  const REPO = process.env.OBSIDIAN_GIT_REPO;   // ex.: https://github.com/usuario/obsidian-vault.git
  const BRANCH = process.env.OBSIDIAN_GIT_BRANCH || "main";
  const TOKEN = process.env.OBSIDIAN_GIT_TOKEN; // Personal Access Token

  const workDir = "/tmp/obsidian-vault";

  // Clone (shallow) o repositório
  await execAsync(`git clone --depth 1 ${REPO.replace(
    "https://",
    `https://${TOKEN}@`
  )} ${workDir}`);

  // Cria o markdown
  const fullPath = path.join(workDir, fileName);
  await execAsync(`echo "${content.replace(/"/g, '\\"')}" > "${fullPath}"`);

  // Commit & push
  await execAsync(`git -C ${workDir} config user.email "bot@vercel"`);
  await execAsync(`git -C ${workDir} config user.name "WhatsApp‑Bot"`);
  await execAsync(`git -C ${workDir} add "${fileName}"`);
  await execAsync(`git -C ${workDir} commit -m "Add link ${url}"`);
  await execAsync(`git -C ${workDir} push origin ${BRANCH}`);

  return fileName; // será exibido na resposta do WhatsApp
}
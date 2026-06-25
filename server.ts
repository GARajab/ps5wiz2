import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Path to our JSON database file
const DATA_DIR = path.join(process.cwd(), "src", "data");
const TUTORIALS_FILE = path.join(DATA_DIR, "tutorials.json");

// Ensure data folder and default file exist
function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TUTORIALS_FILE)) {
    const defaultData = [
      {
        "id": "ps5-umtx-kernel",
        "name": "PS5 Kernel Exploit (UMTX / BD-JB / Webkit)",
        "minFirmware": 1.00,
        "maxFirmware": 4.51,
        "ps5Model": "both",
        "status": "Stable",
        "difficulty": "Medium",
        "youtubeId": "b-hWeq-G99s",
        "description": "A full kernel exploit for firmwares 1.00 through 4.51. It uses a Webkit vulnerability (or the Blu-ray Disc Java exploit on Disc consoles) combined with the UMTX kernel exploit to enable homebrew, custom settings, and backups.",
        "requirements": [
          "A PS5 on firmware 4.51 or lower",
          "A PC or phone connected to the same local Wi-Fi network",
          "For Disc version: A rewritable Blu-ray Disc (BD-RE) and BD Writer (Optional but recommended over Webkit for stability)",
          "An exFAT formatted USB drive (for installing homebrew apps)"
        ],
        "steps": [
          "Navigate to PS5 Settings > Network > Settings > Set Up Internet Connection.",
          "Highlight your Wi-Fi/LAN connection, press the Options button, and select Advanced Settings.",
          "Set DNS Settings to 'Manual'. Set Primary DNS to '192.241.116.141' or '62.210.38.117' (this blocks Sony updates and redirects the User's Guide to the host site).",
          "Go back, restart your console, then go to Settings > User's Guide, Safety, and Warranty > User's Guide.",
          "The jailbreak host page will load. Select the exploit corresponding to your firmware (e.g., 4.03, 4.50, 4.51) and launch it.",
          "If you are on a Disc console and using BD-JB, insert your burned Blu-ray disc with the payload instead.",
          "Wait for the exploit to display 'Success! Payload loaded'. The web page will execute kernel exploits and unlock the Debug Settings menu.",
          "Go to PS5 Settings > Debug Settings to install homebrew package (.pkg) files and load your backups!"
        ]
      },
      {
        "id": "ps5-mast1c0re",
        "name": "Mast1c0re PS4 Emulator Exploit",
        "minFirmware": 4.52,
        "maxFirmware": 7.61,
        "ps5Model": "both",
        "status": "Alternative Method",
        "difficulty": "Hard",
        "youtubeId": "eO2ZqLgLreE",
        "description": "An exploit targeting the PS5's built-in PS4 emulator using save game vulnerabilities. It does not provide full PS5 kernel access, but allows running PS4 homebrew, ISO backups, and retro emulators.",
        "requirements": [
          "PS5 running firmware between 4.52 and 7.61",
          "A legitimate copy of the PS4 game 'Okage: Shadow King' purchased on your PSN account",
          "A PC or mobile device to send game save files",
          "An active internet connection on the same network"
        ],
        "steps": [
          "Buy and download 'Okage: Shadow King' from the PlayStation Store onto your PS5.",
          "Download the mast1c0re save game exploit files on your PC from GitHub.",
          "Use an exploit save transfer tool (like mast1c0re-file-sender) to copy the modified Okage game save files onto a USB drive, or transfer via PS Plus cloud saves.",
          "Load the game on your PS5, restore the exploit save game, and open the save file within the game.",
          "The game will crash and boot the mast1c0re loader. A black/blue screen will appear waiting for payloads.",
          "Use your PC to send the PS4 homebrew .elf or PS4 game backup to the PS5's IP address on port 9020.",
          "Enjoy running PS4 homebrew and classic emulator games directly on your PS5!"
        ]
      },
      {
        "id": "ps5-no-jailbreak",
        "name": "No Public Jailbreak Available (Stay & Block Updates)",
        "minFirmware": 7.62,
        "maxFirmware": 12.00,
        "ps5Model": "both",
        "status": "No Jailbreak",
        "difficulty": "None",
        "youtubeId": "8zD6H5K7P-Q",
        "description": "There is currently no public kernel exploit or jailbreak for PS5 consoles on firmware 7.62 or higher. The golden rule of PlayStation hacking is: STAY on the lowest possible firmware and NEVER update your console.",
        "requirements": [
          "A PS5 on firmware 7.62 or above",
          "A firm commitment to not updating your system!",
          "Automatic software updates disabled in settings"
        ],
        "steps": [
          "Immediately disable automatic updates: Go to Settings > System > System Software > System Software Update and Settings.",
          "Turn off 'Download Update Files Automatically' and 'Install Update Files Automatically'.",
          "To completely prevent accidental updates, consider setting up a custom DNS (e.g., Al Azif's DNS) to block Sony servers entirely.",
          "Wait patiently. Modern exploit chains require time, and hackers are actively researching newer firmwares. Your current firmware is your best chance for a future hack!"
        ]
      }
    ];
    fs.writeFileSync(TUTORIALS_FILE, JSON.stringify(defaultData, null, 2), "utf8");
  }
}

ensureDatabase();

// Middleware
app.use(express.json());

// Load tutorials helper
function getTutorials() {
  ensureDatabase();
  try {
    const raw = fs.readFileSync(TUTORIALS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database:", err);
    return [];
  }
}

// Save tutorials helper
function saveTutorials(data: any[]) {
  ensureDatabase();
  fs.writeFileSync(TUTORIALS_FILE, JSON.stringify(data, null, 2), "utf8");
}

// API Routes
app.get("/api/tutorials", (req, res) => {
  res.json(getTutorials());
});

// Create/Update a tutorial
app.post("/api/tutorials", (req, res) => {
  const tutorial = req.body;
  if (!tutorial.id || !tutorial.name || typeof tutorial.minFirmware !== 'number' || typeof tutorial.maxFirmware !== 'number') {
    return res.status(400).json({ error: "Missing required fields (id, name, minFirmware, maxFirmware)" });
  }

  const list = getTutorials();
  const existingIndex = list.findIndex((item: any) => item.id === tutorial.id);

  if (existingIndex > -1) {
    list[existingIndex] = tutorial;
  } else {
    list.push(tutorial);
  }

  saveTutorials(list);
  res.json({ success: true, data: tutorial });
});

// Update specific tutorial (PUT)
app.put("/api/tutorials/:id", (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const list = getTutorials();
  const index = list.findIndex((item: any) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Tutorial not found" });
  }

  list[index] = { ...list[index], ...updateData };
  saveTutorials(list);
  res.json({ success: true, data: list[index] });
});

// Delete a tutorial
app.delete("/api/tutorials/:id", (req, res) => {
  const { id } = req.params;
  const list = getTutorials();
  const filtered = list.filter((item: any) => item.id !== id);

  if (list.length === filtered.length) {
    return res.status(404).json({ error: "Tutorial not found" });
  }

  saveTutorials(filtered);
  res.json({ success: true, id });
});

// Full-stack Vite handling
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PS5 Jailbreak Wizard listening on port ${PORT}`);
  });
}

start();

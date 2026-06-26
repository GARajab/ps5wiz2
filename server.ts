import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Path to our JSON database file
const DATA_DIR = path.join(process.cwd(), "src", "data");
const TUTORIALS_FILE = path.join(DATA_DIR, "tutorials.json");
const FIRMWARES_FILE = path.join(DATA_DIR, "firmwares.json");

const DEFAULT_FIRMWARES = {
  ps4: [
    "13.50", "13.04", "13.02", "13.00", "12.52", "12.50", "12.02", "12.00", "11.52", "11.50", "11.02", "11.00", "10.71", "10.70", "10.50", "10.01", "10.00", "9.60", "9.51", "9.50", "9.04", "9.03", "9.00", "8.52", "8.50", "8.03", "8.01", "8.00", "7.55", "7.51", "7.50", "7.02", "7.01", "7.00", "6.72", "6.71", "6.70", "6.51", "6.50", "6.20", "6.02", "6.00", "5.56", "5.55", "5.53-01", "5.53", "5.50", "5.05", "5.03", "5.01", "5.00", "4.74", "4.73", "4.72", "4.71", "4.70", "4.55", "4.50", "4.07", "4.06", "4.05", "4.01", "4.00", "3.55", "3.50", "3.15", "3.11", "3.10", "3.00", "2.57", "2.55", "2.51", "2.50", "2.04", "2.03", "2.02", "2.01", "2.00", "1.76", "1.75", "1.74", "1.72", "1.71", "1.70", "1.62", "1.61", "1.60", "1.52", "1.51", "1.50b", "1.50", "1.07", "1.06", "1.05"
  ],
  ps5: [
    "13.40.00", "13.20.00", "13.00.00", "12.60.00", "12.40.00", "12.20.00", "12.00.00", "11.60.00", "11.40.00", "11.20.00", "11.00.00", "10.60.00", "10.40.00", "10.20.00", "10.01.00", "10.00.00", "09.60.00", "09.40.00", "09.20.00", "09.00.00", "08.60.00", "08.40.00", "08.20.02", "08.20.00", "08.00.00", "07.61.00", "07.60.00", "07.40.00", "07.20.00", "07.01.01", "07.01.00", "07.00.00", "06.50.00", "06.02.00", "06.00.01", "06.00.00", "05.50.00", "05.10.00", "05.02.00", "05.00.00", "04.51.00", "04.50.00", "04.03.00", "04.02.00", "04.00.00", "03.21.00", "03.20.00", "03.10.00", "03.00.00", "02.50.00", "02.30.00", "02.26.00", "02.25.00", "02.20.00", "02.00.00", "01.14.00", "01.12.00"
  ]
};

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
  if (!fs.existsSync(FIRMWARES_FILE)) {
    fs.writeFileSync(FIRMWARES_FILE, JSON.stringify(DEFAULT_FIRMWARES, null, 2), "utf8");
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

interface FirmwaresDB {
  ps4: string[];
  ps5: string[];
}

function getFirmwares(): FirmwaresDB {
  ensureDatabase();
  try {
    const raw = fs.readFileSync(FIRMWARES_FILE, "utf8");
    const parsed = JSON.parse(raw);
    // Auto-migrate if old database format (or flat array) is detected
    if (!parsed || Array.isArray(parsed) || !parsed.ps4 || !parsed.ps5) {
      saveFirmwares(DEFAULT_FIRMWARES);
      return DEFAULT_FIRMWARES;
    }
    return parsed;
  } catch (err) {
    console.error("Error reading firmwares database:", err);
    return DEFAULT_FIRMWARES;
  }
}

function saveFirmwares(data: FirmwaresDB) {
  ensureDatabase();
  const sortFw = (list: string[]) => {
    return [...list].sort((a, b) => {
      // Numerical comparison (treating versions cleanly if possible)
      const aNum = parseFloat(a);
      const bNum = parseFloat(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        const diff = bNum - aNum; // Descending order
        if (diff !== 0) return diff;
      }
      return b.localeCompare(a); // Standard string desc fallback
    });
  };

  const sorted: FirmwaresDB = {
    ps4: sortFw(data.ps4 || []),
    ps5: sortFw(data.ps5 || [])
  };
  fs.writeFileSync(FIRMWARES_FILE, JSON.stringify(sorted, null, 2), "utf8");
}

// API Routes
app.get("/api/firmwares", (req, res) => {
  res.json(getFirmwares());
});

app.post("/api/firmwares", (req, res) => {
  const { console: consoleType, value } = req.body;
  if (!value || typeof value !== "string" || !value.trim()) {
    return res.status(400).json({ error: "Missing or invalid firmware value" });
  }
  if (consoleType !== "ps4" && consoleType !== "ps5") {
    return res.status(400).json({ error: "Console type must be 'ps4' or 'ps5'" });
  }
  const db = getFirmwares();
  const list = db[consoleType] || [];
  if (list.includes(value.trim())) {
    return res.status(400).json({ error: "Firmware version already exists" });
  }
  list.push(value.trim());
  db[consoleType] = list;
  saveFirmwares(db);
  res.json({ success: true, data: value.trim(), list: getFirmwares() });
});

app.delete("/api/firmwares/:console/:value", (req, res) => {
  const { console: consoleType, value } = req.params;
  if (consoleType !== "ps4" && consoleType !== "ps5") {
    return res.status(400).json({ error: "Console type must be 'ps4' or 'ps5'" });
  }
  const db = getFirmwares();
  const list = db[consoleType] || [];
  const filtered = list.filter(item => item !== value);
  if (list.length === filtered.length) {
    return res.status(404).json({ error: "Firmware version not found" });
  }
  db[consoleType] = filtered;
  saveFirmwares(db);
  res.json({ success: true, deleted: value, list: getFirmwares() });
});

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

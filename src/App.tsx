import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Disc, 
  Sliders, 
  Video, 
  ListChecks, 
  Play, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Settings, 
  FileText, 
  HelpCircle, 
  AlertTriangle, 
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import { Tutorial, PS5ModelType } from './types';
import { 
  isSupabaseConfigured, 
  getSupabaseTutorials, 
  upsertSupabaseTutorial, 
  deleteSupabaseTutorial, 
  getSupabaseSQLScript 
} from './lib/supabase';
import { useToast } from './components/Toast';

// Premium High-Quality Console Images
import ps4ConsoleImg from './assets/images/ps4_console_1782379424211.jpg';
import ps5ConsoleImg from './assets/images/ps5_console_1782379438626.jpg';

export default function App() {
  const toast = useToast();

  // Wizard States
  const [consoleGen, setConsoleGen] = useState<'ps4' | 'ps5' | null>(null);
  const [model, setModel] = useState<PS5ModelType | null>(null);
  const [firmwareInput, setFirmwareInput] = useState<string>("4.03");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0);
  const [checkedRequirements, setCheckedRequirements] = useState<Record<string, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  // Database / Tutorials State
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState<boolean>(false);

  // Admin Mode States
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  
  // Tutorial Editing States
  const [editingTutorial, setEditingTutorial] = useState<Partial<Tutorial> | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Dynamic Firmware States & API interactions
  const [firmwareValues, setFirmwareValues] = useState<{ ps4: string[]; ps5: string[] }>({
    ps4: [
      "13.50", "13.04", "13.02", "13.00", "12.52", "12.50", "12.02", "12.00", "11.52", "11.50", "11.02", "11.00", "10.71", "10.70", "10.50", "10.01", "10.00", "9.60", "9.51", "9.50", "9.04", "9.03", "9.00", "8.52", "8.50", "8.03", "8.01", "8.00", "7.55", "7.51", "7.50", "7.02", "7.01", "7.00", "6.72", "6.71", "6.70", "6.51", "6.50", "6.20", "6.02", "6.00", "5.56", "5.55", "5.53-01", "5.53", "5.50", "5.05", "5.03", "5.01", "5.00", "4.74", "4.73", "4.72", "4.71", "4.70", "4.55", "4.50", "4.07", "4.06", "4.05", "4.01", "4.00", "3.55", "3.50", "3.15", "3.11", "3.10", "3.00", "2.57", "2.55", "2.51", "2.50", "2.04", "2.03", "2.02", "2.01", "2.00", "1.76", "1.75", "1.74", "1.72", "1.71", "1.70", "1.62", "1.61", "1.60", "1.52", "1.51", "1.50b", "1.50", "1.07", "1.06", "1.05"
    ],
    ps5: [
      "13.40.00", "13.20.00", "13.00.00", "12.60.00", "12.40.00", "12.20.00", "12.00.00", "11.60.00", "11.40.00", "11.20.00", "11.00.00", "10.60.00", "10.40.00", "10.20.00", "10.01.00", "10.00.00", "09.60.00", "09.40.00", "09.20.00", "09.00.00", "08.60.00", "08.40.00", "08.20.02", "08.20.00", "08.00.00", "07.61.00", "07.60.00", "07.40.00", "07.20.00", "07.01.01", "07.01.00", "07.00.00", "06.50.00", "06.02.00", "06.00.01", "06.00.00", "05.50.00", "05.10.00", "05.02.00", "05.00.00", "04.51.00", "04.50.00", "04.03.00", "04.02.00", "04.00.00", "03.21.00", "03.20.00", "03.10.00", "03.00.00", "02.50.00", "02.30.00", "02.26.00", "02.25.00", "02.20.00", "02.00.00", "01.14.00", "01.12.00"
    ]
  });
  const [newFirmwareVal, setNewFirmwareVal] = useState("");
  const [selectedAdminConsole, setSelectedAdminConsole] = useState<'ps4' | 'ps5'>('ps4');
  const [isAddingFw, setIsAddingFw] = useState(false);
  const [customFirmwareMode, setCustomFirmwareMode] = useState(false);

  const fetchFirmwares = async () => {
    try {
      const res = await fetch("/api/firmwares");
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object" && data.ps4 && data.ps5) {
          setFirmwareValues(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch firmwares:", e);
    }
  };

  // Load tutorials from actual server API database or Supabase
  const fetchTutorials = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const data = await getSupabaseTutorials();
        if (data) {
          setTutorials(data);
          setErrorMessage(null);
          return;
        }
      }

      // Local API server fallback
      const response = await fetch('/api/tutorials');
      if (response.ok) {
        const data = await response.json();
        setTutorials(data);
        setErrorMessage(null);
        // Cache to localStorage for offline mode
        localStorage.setItem('ps5-jailbreak-tutorials', JSON.stringify(data));
        return;
      }
      throw new Error('Local API server failed');
    } catch (err: any) {
      console.error('Fetch error:', err);
      
      let finalErrorMessage = "Offline Mode: Loaded from local browser cache.";
      if (isSupabaseConfigured) {
        const errMsg = err?.message || err?.details || String(err);
        if (errMsg.includes('relation "tutorials" does not exist') || errMsg.includes('does not exist') || errMsg.includes('42P01')) {
          finalErrorMessage = "Supabase connected, but the 'tutorials' table doesn't exist! Please click 'Admin Database Access' below, copy the SQL setup script, and run it in your Supabase SQL Editor.";
        } else {
          finalErrorMessage = `Supabase Connection/Auth Error: ${errMsg}. Running on local backup.`;
        }
      }

      // Try to load from localStorage first as offline fallback, otherwise use defaults
      const localCached = localStorage.getItem('ps5-jailbreak-tutorials');
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTutorials(parsed);
            setErrorMessage(finalErrorMessage);
            return;
          }
        } catch (e) {}
      }

      setErrorMessage(isSupabaseConfigured 
        ? `Could not load tutorials from Supabase. Error: ${err?.message || 'Table does not exist'}` 
        : "Running in offline fallback. Setup Supabase for live database updates.");
      
      // Default fallback values
      const defaultData: Tutorial[] = [
        {
          id: "ps5-umtx-kernel",
          name: "PS5 Kernel Exploit (UMTX / BD-JB / Webkit)",
          minFirmware: 1.00,
          maxFirmware: 4.51,
          ps5Model: "both",
          status: "Stable",
          difficulty: "Medium",
          youtubeId: "b-hWeq-G99s",
          description: "A full kernel exploit for firmwares 1.00 through 4.51. It uses a Webkit vulnerability (or the Blu-ray Disc Java exploit on Disc consoles) combined with the UMTX kernel exploit to enable homebrew, custom settings, and backups.",
          requirements: [
            "A PS5 on firmware 4.51 or lower",
            "A PC or phone connected to the same local Wi-Fi network",
            "For Disc version: A rewritable Blu-ray Disc (BD-RE) and BD Writer (Optional)",
            "An exFAT formatted USB drive (for homebrew)"
          ],
          steps: [
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
          id: "ps5-mast1c0re",
          name: "Mast1c0re PS5 Emulator Exploit",
          minFirmware: 4.52,
          maxFirmware: 7.61,
          ps5Model: "both",
          status: "Alternative Method",
          difficulty: "Hard",
          youtubeId: "eO2ZqLgLreE",
          description: "An exploit targeting the PS5's built-in PS4 emulator using save game vulnerabilities. It does not provide full PS5 kernel access, but allows running PS4 homebrew, ISO backups, and retro emulators.",
          requirements: [
            "PS5 running firmware between 4.52 and 7.61",
            "A legitimate copy of the PS4 game 'Okage: Shadow King' purchased on your PSN account",
            "A PC or mobile device to send game save files",
            "An active internet connection on the same network"
          ],
          steps: [
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
          id: "ps5-no-jailbreak",
          name: "No Public PS5 Jailbreak Available (Stay & Block Updates)",
          minFirmware: 7.62,
          maxFirmware: 12.00,
          ps5Model: "both",
          status: "No Jailbreak",
          difficulty: "None",
          youtubeId: "8zD6H5K7P-Q",
          description: "There is currently no public kernel exploit or jailbreak for PS5 consoles on firmware 7.62 or higher. The golden rule of PlayStation hacking is: STAY on the lowest possible firmware and NEVER update your console.",
          requirements: [
            "A PS5 on firmware 7.62 or above",
            "A firm commitment to not updating your system!",
            "Automatic software updates disabled in settings"
          ],
          steps: [
            "Immediately disable automatic updates: Go to Settings > System > System Software > System Software Update and Settings.",
            "Turn off 'Download Update Files Automatically' and 'Install Update Files Automatically'.",
            "To completely prevent accidental updates, consider setting up a custom DNS (e.g., Al Azif's DNS) to block Sony servers entirely.",
            "Wait patiently. Modern exploit chains require time, and hackers are actively researching newer firmwares. Your current firmware is your best chance for a future hack!"
          ]
        },
        {
          id: "ps4-goldhen-900",
          name: "PS4 GoldHEN Kernel Exploit (9.00)",
          minFirmware: 1.00,
          maxFirmware: 9.00,
          ps5Model: "all",
          status: "Stable",
          difficulty: "Easy",
          youtubeId: "zG6302wR60g",
          description: "The gold-standard jailbreak for PS4 firmware 9.00 or lower. It uses a Webkit exploit paired with a special exFAT USB flash drive containing the exfathax payload to execute a kernel exploit, enabling GoldHEN for homebrew, backups, cheats, and plugins.",
          requirements: [
            "A PS4 running firmware 9.00 or lower (if lower, you can update to exactly 9.00 via offline USB update)",
            "A spare USB flash drive (any size) to write the 'exfathax' image to",
            "A PC or phone to access the host page and write the USB image",
            "Win32DiskImager, Rufus, or BalenaEtcher to burn the image"
          ],
          steps: [
            "Download the PS4 update file for firmware 9.00 (reinstallation/recovery file) and update your console offline via USB if your current firmware is below 9.00.",
            "On your PC, download the 'exfathax.img' file and use BalenaEtcher or Rufus to write it to your spare USB flash drive. Do not format or open the USB after writing.",
            "On your PS4, go to Settings > Network > Set Up Internet Connection. Change DNS to Manual and set Primary DNS to '192.241.116.141' or '165.227.83.145' to block updates and load the exploit host.",
            "Open the PS4 Web Browser or go to Settings > User's Guide. Access a stable host (e.g., Karo Host or Al Azif's page).",
            "Click on 'GoldHEN v2.3' (or latest version) for 9.00.",
            "A prompt will appear: 'Insert USB now. Do not close this dialog until notification appears.'",
            "Insert your exfathax USB drive into any USB port of the PS4. Wait for the system notification 'Unsupported File System' to appear in the top left.",
            "Click 'OK' on the browser prompt. The exploit will run, inject GoldHEN, and display 'GoldHEN loaded!'. You can now safely remove the USB drive.",
            "Go to PS4 Settings > GoldHEN to configure homebrew package installer, FTP server, temperature controls, and game cheats!"
          ]
        },
        {
          id: "ps4-pppwn-1100",
          name: "PS4 PPPwn LAN Exploit (9.01 - 11.00)",
          minFirmware: 9.01,
          maxFirmware: 11.00,
          ps5Model: "all",
          status: "Stable",
          difficulty: "Hard",
          youtubeId: "2L8U41jT30A",
          description: "An advanced, stable kernel exploit for PS4 systems on firmware 9.01 up to 11.00. It utilizes a PPPoE network protocol exploit (PPPwn) triggered via an Ethernet cable connected to a PC, Raspberry Pi, or a smart router to load GoldHEN.",
          requirements: [
            "A PS4 running firmware between 9.01 and 11.00 (recommended to update to exactly 11.00 via offline USB)",
            "An Ethernet/LAN cable connecting your PS4 directly to your PC, Raspberry Pi, or compatible router",
            "A PC running Windows/macOS/Linux or a Raspberry Pi to execute the exploit trigger script",
            "The latest PPPwn executable (e.g. PPPwn GUI or pppwn-cpp wrapper) and the GoldHEN stage2.bin payload"
          ],
          steps: [
            "Prepare your PC by downloading a PPPwn GUI tool (like PPPwn Go or PPPwn C++) and select your target firmware version (e.g. 11.00).",
            "Copy the matching 'stage2.bin' payload for your firmware onto an exFAT or FAT32 USB drive and plug it into your PS4 console.",
            "Connect the Ethernet cable from your PC's network card directly to the LAN port on your PS4.",
            "On your PS4, go to Settings > Network > Set Up Internet Connection. Select 'Use a LAN Cable', choose 'Custom', and select 'PPPoE' for IP Address Settings.",
            "Enter any dummy text for PPPoE User ID and Password (e.g., 'ppp' for both). Leave DNS, MTU, and Proxy as Automatic.",
            "Do NOT run the connection test yet. On your PC, open the PPPwn tool, select the correct network interface card (Ethernet) and click 'Start Exploit'.",
            "On your PS4, click 'Test Internet Connection' to trigger the PPPoE request. The PPPwn script on your PC will intercept the connection and run the exploit phases.",
            "Watch the PC terminal output. Once it completes, your PS4 screen will display 'GoldHEN loaded!' in the top-left notification.",
            "Access the newly unlocked 'GoldHEN' menu at the top of your PS4 Settings screen to install packages and load custom homebrew!"
          ]
        },
        {
          id: "ps4-no-jailbreak",
          name: "No PS4 Jailbreak Available (Stay on <= 11.00)",
          minFirmware: 11.01,
          maxFirmware: 12.00,
          ps5Model: "all",
          status: "No Jailbreak",
          difficulty: "None",
          youtubeId: "8zD6H5K7P-Q",
          description: "There is currently no public kernel exploit or jailbreak for PlayStation 4 consoles on firmware 11.01, 11.02, 11.50, or higher. To ensure your best chance at a future jailbreak, keep your console completely offline and do not update.",
          requirements: [
            "A PS4 on firmware 11.01 or above",
            "A commitment to never update your console under any circumstances",
            "Automatic software downloads and updates disabled"
          ],
          steps: [
            "Go to PS4 Settings > System > Automatic Downloads.",
            "Uncheck 'System Software Update Files' and 'Install Automatically' to ensure the console never updates silently.",
            "Do NOT sign in to PlayStation Network (PSN) or update any games that require a higher system version.",
            "Consider using a custom DNS to block connection to Sony's official update servers entirely.",
            "Keep the console on your current firmware. Developers are always searching for new user-mode and kernel vulnerabilities. Patience is key!"
          ]
        }
      ];
      setTutorials(defaultData);
      localStorage.setItem('ps5-jailbreak-tutorials', JSON.stringify(defaultData));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
    fetchFirmwares();
  }, []);

  // Reset selected video index when navigation states change
  useEffect(() => {
    setSelectedVideoIndex(0);
  }, [currentStep, firmwareInput, consoleGen, model]);

  // Dynamic list of PlayStation system firmware milestones
  const FIRMWARE_VALUES = consoleGen === 'ps4' ? firmwareValues.ps4 : (consoleGen === 'ps5' ? firmwareValues.ps5 : [...firmwareValues.ps4, ...firmwareValues.ps5]);

  // Parse any stored youtubeId value to check if it's a multiple video array JSON
  const parseTutorialVideos = (youtubeIdValue: string, tutorialName: string, minFw: number, maxFw: number) => {
    if (!youtubeIdValue) return [];
    const val = youtubeIdValue.trim();
    if (val.startsWith('[')) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          return parsed.map((v: any) => ({
            youtubeId: String(v.youtubeId || v.url || ''),
            minFirmware: Number(v.minFirmware !== undefined ? v.minFirmware : minFw),
            maxFirmware: Number(v.maxFirmware !== undefined ? v.maxFirmware : maxFw),
            title: String(v.title || tutorialName || 'Video Guide')
          }));
        }
      } catch (e) {
        console.error("Failed to parse nested videos JSON:", e);
      }
    }
    // Fallback: single video spanning the whole range
    return [{
      youtubeId: youtubeIdValue,
      minFirmware: minFw,
      maxFirmware: maxFw,
      title: tutorialName || 'Companion Video Guide'
    }];
  };

  // Find matching videos for the user's entered firmware
  const getMatchedVideos = () => {
    if (!consoleGen) return [];
    const firmwareNum = parseFloat(firmwareInput);
    if (isNaN(firmwareNum)) return [];

    const matchedList: { youtubeId: string; minFirmware: number; maxFirmware: number; title: string; tutorialName: string }[] = [];
    
    tutorials.forEach(t => {
      const isPs4Tutorial = t.id.startsWith('ps4-');
      const isPs5Tutorial = !isPs4Tutorial;

      if (consoleGen === 'ps4' && !isPs4Tutorial) return;
      if (consoleGen === 'ps5' && !isPs5Tutorial) return;

      let isModelCompatible = true;
      if (consoleGen === 'ps5') {
        isModelCompatible = t.ps5Model === 'both' || t.ps5Model === model;
      } else if (consoleGen === 'ps4') {
        isModelCompatible = t.ps5Model === 'all' || t.ps5Model === 'both' || t.ps5Model === model || model === 'all';
      }

      if (!isModelCompatible) return;

      // Parse videos
      const videos = parseTutorialVideos(t.youtubeId, t.name, t.minFirmware, t.maxFirmware);
      videos.forEach(v => {
        if (firmwareNum >= v.minFirmware && firmwareNum <= v.maxFirmware) {
          matchedList.push({
            ...v,
            tutorialName: t.name
          });
        }
      });
    });

    return matchedList;
  };

  // Helper to extract YouTube video ID from various formats
  const extractYoutubeId = (urlOrId: string): string => {
    if (!urlOrId) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlOrId.match(regExp);
    return (match && match[2].length === 11) ? match[2] : urlOrId;
  };

  // Find appropriate tutorial based on wizard choices
  const getMatchedTutorial = (): Tutorial | null => {
    if (!consoleGen) return null;
    if (consoleGen === 'ps5' && !model) return null;

    const firmwareNum = parseFloat(firmwareInput);
    if (isNaN(firmwareNum)) return null;

    // Filter tutorials matching criteria
    const matched = tutorials.find(t => {
      const isPs4Tutorial = t.id.startsWith('ps4-');
      const isPs5Tutorial = !isPs4Tutorial;

      if (consoleGen === 'ps4' && !isPs4Tutorial) return false;
      if (consoleGen === 'ps5' && !isPs5Tutorial) return false;

      let isModelCompatible = true;
      if (consoleGen === 'ps5') {
        isModelCompatible = t.ps5Model === 'both' || t.ps5Model === model;
      } else if (consoleGen === 'ps4') {
        isModelCompatible = t.ps5Model === 'all' || t.ps5Model === 'both' || t.ps5Model === model || model === 'all';
      }

      const isFirmwareCompatible = firmwareNum >= t.minFirmware && firmwareNum <= t.maxFirmware;
      return isModelCompatible && isFirmwareCompatible;
    });

    return matched || null;
  };

  const matchedTutorial = getMatchedTutorial();

  // Handle Wizard Reset
  const handleReset = () => {
    setConsoleGen(null);
    setModel(null);
    setFirmwareInput("4.03");
    setCurrentStep(1);
    setCheckedRequirements({});
    setCheckedSteps({});
  };

  // Quick Firmware Presets
  const firmwarePresets = consoleGen === 'ps4' ? [
    { value: "5.05", label: "v5.05 (Stable)", type: "low" },
    { value: "6.72", label: "v6.72 (Stable)", type: "low" },
    { value: "9.00", label: "v9.00 (Recommended)", type: "low" },
    { value: "11.00", label: "v11.00 (PPPwn)", type: "low" },
    { value: "11.50", label: "v11.50 (No JB)", type: "high" }
  ] : [
    { value: "2.00", label: "v2.00 (UMTX)", type: "low" },
    { value: "3.00", label: "v3.00 (UMTX)", type: "low" },
    { value: "4.03", label: "v4.03 (Recommended)", type: "low" },
    { value: "4.50", label: "v4.50 (UMTX)", type: "low" },
    { value: "4.51", label: "v4.51 (UMTX Limit)", type: "low" }
  ];

  // Admin Authentication (Simple password setup: 'Rajab@1954' for edit flow)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "Rajab@1954") {
      setIsAdminAuthenticated(true);
      setAdminAuthError(null);
      // Select first tutorial for editing by default if available
      if (tutorials.length > 0) {
        setEditingTutorial({ ...tutorials[0] });
      } else {
        setEditingTutorial({
          id: `ps5-custom-${Date.now()}`,
          name: "",
          minFirmware: 1.00,
          maxFirmware: 4.51,
          ps5Model: "both",
          status: "Stable",
          difficulty: "Medium",
          youtubeId: "",
          description: "",
          requirements: [""],
          steps: [""]
        });
      }
    } else {
      setAdminAuthError("Invalid Administrator Passcode. Please try again.");
    }
  };

  // Add a new firmware milestone version
  const handleAddFirmware = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirmwareVal) return;
    const cleanVal = newFirmwareVal.trim();
    if (!cleanVal) return;
    const list = selectedAdminConsole === 'ps4' ? firmwareValues.ps4 : firmwareValues.ps5;
    if (list.includes(cleanVal)) {
      toast.warning("Firmware version already exists!");
      return;
    }

    setIsAddingFw(true);
    try {
      const res = await fetch("/api/firmwares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ console: selectedAdminConsole, value: cleanVal }),
      });
      if (res.ok) {
        const data = await res.json();
        setFirmwareValues(data.list);
        setNewFirmwareVal("");
        toast.success(`Firmware v${cleanVal} added to ${selectedAdminConsole.toUpperCase()}!`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add firmware");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to communicate with server");
    } finally {
      setIsAddingFw(false);
    }
  };

  // Delete a firmware milestone version
  const handleDeleteFirmware = async (consoleType: 'ps4' | 'ps5', val: string) => {
    if (!window.confirm(`Are you sure you want to delete firmware v${val} from ${consoleType.toUpperCase()}? This will remove it from selection options.`)) return;
    try {
      const res = await fetch(`/api/firmwares/${consoleType}/${val}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        setFirmwareValues(data.list);
        toast.success(`Firmware v${val} deleted from ${consoleType.toUpperCase()}!`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete firmware");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete firmware from server");
    }
  };

  // Save/Update tutorial
  const handleSaveTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTutorial) return;

    // Validate
    if (!editingTutorial.id || !editingTutorial.name) {
      toast.warning("Please provide a Tutorial ID and Name");
      return;
    }

    // Convert requirements and steps to lists if string
    const formatList = (val: any): string[] => {
      if (Array.isArray(val)) return val.filter(Boolean);
      if (typeof val === 'string') {
        return val.split('\n').map(l => l.trim()).filter(Boolean);
      }
      return [];
    };

    const formattedTutorial = {
      ...editingTutorial,
      minFirmware: Number(editingTutorial.minFirmware || 1.00),
      maxFirmware: Number(editingTutorial.maxFirmware || 12.00),
      youtubeId: (editingTutorial.youtubeId && editingTutorial.youtubeId.trim().startsWith('[')) 
        ? editingTutorial.youtubeId.trim() 
        : extractYoutubeId(editingTutorial.youtubeId || ""),
      requirements: formatList(editingTutorial.requirements),
      steps: formatList(editingTutorial.steps)
    } as Tutorial;

    try {
      if (isSupabaseConfigured) {
        const saved = await upsertSupabaseTutorial(formattedTutorial);
        if (saved) {
          await fetchTutorials();
          setIsCreatingNew(false);
          setEditingTutorial(saved);
          toast.success("Tutorial successfully saved to Supabase cloud database!");
          return;
        }
      }

      // Try local server API first
      try {
        const response = await fetch('/api/tutorials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedTutorial)
        });

        if (response.ok) {
          const result = await response.json();
          await fetchTutorials();
          setIsCreatingNew(false);
          setEditingTutorial(result.data);
          toast.success("Tutorial database updated on local server successfully!");
          return;
        }
      } catch (srvErr) {
        console.warn("Express API failed, saving to browser cache instead.", srvErr);
      }

      // Offline storage fallback
      const currentList = [...tutorials];
      const existingIdx = currentList.findIndex(t => t.id === formattedTutorial.id);
      if (existingIdx > -1) {
        currentList[existingIdx] = formattedTutorial;
      } else {
        currentList.push(formattedTutorial);
      }
      setTutorials(currentList);
      localStorage.setItem('ps5-jailbreak-tutorials', JSON.stringify(currentList));
      setIsCreatingNew(false);
      setEditingTutorial(formattedTutorial);
      toast.info("Notice: Running in Offline Mode. Tutorial saved to local browser cache. Connect Supabase to persist changes globally!");
    } catch (err: any) {
      toast.error(`Error saving tutorial: ${err.message}`);
    }
  };

  // Delete tutorial
  const handleDeleteTutorial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tutorial from the database?")) return;

    try {
      if (isSupabaseConfigured) {
        const success = await deleteSupabaseTutorial(id);
        if (success) {
          await fetchTutorials();
          if (tutorials.length > 0) {
            setEditingTutorial({ ...tutorials[0] });
          } else {
            setEditingTutorial(null);
          }
          toast.success("Tutorial deleted from Supabase database.");
          return;
        }
      }

      // Try local server
      try {
        const response = await fetch(`/api/tutorials/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchTutorials();
          if (tutorials.length > 0) {
            setEditingTutorial({ ...tutorials[0] });
          } else {
            setEditingTutorial(null);
          }
          toast.success("Tutorial deleted from local server database.");
          return;
        }
      } catch (srvErr) {
        console.warn("Express server unavailable, removing from browser cache.", srvErr);
      }

      // LocalStorage fallback
      const filtered = tutorials.filter(t => t.id !== id);
      setTutorials(filtered);
      localStorage.setItem('ps5-jailbreak-tutorials', JSON.stringify(filtered));
      if (filtered.length > 0) {
        setEditingTutorial({ ...filtered[0] });
      } else {
        setEditingTutorial(null);
      }
      toast.info("Tutorial removed from offline browser cache.");
    } catch (err: any) {
      toast.error(`Error deleting: ${err.message}`);
    }
  };

  // Admin dynamic form inputs modification helper
  const updateEditingField = (field: keyof Tutorial, value: any) => {
    if (!editingTutorial) return;
    setEditingTutorial(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Render difficulty rating badge
  const renderDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      "None": "bg-slate-100 text-slate-800 border-slate-200",
      "Easy": "bg-emerald-50 text-emerald-700 border-emerald-200/60",
      "Medium": "bg-amber-50 text-amber-700 border-amber-200/60",
      "Hard": "bg-rose-50 text-rose-700 border-rose-200/60"
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-mono font-medium rounded-full border ${colors[difficulty] || "bg-blue-50 text-blue-700 border-blue-200/60"}`}>
        {difficulty} Difficulty
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white flex flex-col relative overflow-hidden">
      {/* Decorative background grid and neon glow */}
      <div className="absolute inset-0 tech-grid pointer-events-none opacity-40 z-0"></div>
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* Top Header Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleReset}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-500/10">
              <Cpu className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold tracking-tight text-lg text-slate-900 flex items-center gap-2">
                PS5 Jailbreak <span className="text-indigo-600 text-xs px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">Wizard</span>
              </h1>
              <p className="text-xs text-slate-500">Interactive Hack & Compatibility Guide</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                if (isAdminMode) {
                  // close editing state
                  setIsAdminAuthenticated(false);
                  setAdminPassword("");
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                isAdminMode 
                  ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              <Settings className="h-3.5 w-3.5 animate-spin-slow" />
              <span>{isAdminMode ? "Exit Admin Mode" : "Admin Database Access"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 relative z-10 flex flex-col justify-start">
        
        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* -------------------- ADMIN MODE VIEW -------------------- */}
        {isAdminMode ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md flex-1 flex flex-col">
            
            {/* Admin Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="font-display font-semibold text-xl text-slate-900 flex items-center gap-2">
                  <Sliders className="text-amber-500 h-5 w-5" />
                  Jailbreak Tutorials Database Manager
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Add, edit and format tailored guides and update corresponding YouTube instructional clips seamlessly.
                </p>
              </div>
              <div className="mt-2 md:mt-0 flex flex-col items-end gap-1">
                <span className="text-xs bg-slate-50 px-3 py-1 rounded border border-slate-200 font-mono text-slate-600">
                  Storage Status: {
                    isSupabaseConfigured ? (
                      <span className="text-emerald-600 font-bold">Supabase Cloud Connected</span>
                    ) : errorMessage?.includes("Offline Mode") ? (
                      <span className="text-amber-600 font-bold">Offline Browser Cache</span>
                    ) : (
                      <span className="text-indigo-600 font-bold">Local JSON Server</span>
                    )
                  }
                </span>
              </div>
            </div>

            {/* Supabase SQL Setup and configuration guide */}
            <div className="mb-6 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-950">
              <div className="flex items-start space-x-3">
                <Sparkles className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-indigo-900">
                    {isSupabaseConfigured 
                      ? "✓ Supabase Cloud Connection Active" 
                      : "Connect to Supabase Cloud Database to resolve Vercel 404 errors!"}
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    {isSupabaseConfigured 
                      ? "Your PS5 Jailbreak Wizard is connected directly to your Supabase instance. Edits and guides will reflect instantly across all deployments (including Vercel, Netlify, or Cloud Run)." 
                      : "Because static environments (like Vercel) are serverless and cannot write to local files, you need a cloud database. We support Supabase! Simply configure your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables in your Vercel Dashboard, then use the SQL Script below to create your tables."}
                  </p>
                  <button 
                    onClick={() => setShowSqlGuide(!showSqlGuide)}
                    className="mt-2 inline-flex items-center space-x-1.5 font-mono font-bold text-indigo-600 hover:text-indigo-700 hover:underline animate-pulse"
                  >
                    <span>{showSqlGuide ? "Hide SQL Setup Script" : "Show Supabase SQL Setup Script (Copy & Run)"}</span>
                    <ChevronRight className={`h-3 w-3 transition-transform ${showSqlGuide ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
              {showSqlGuide && (
                <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 text-left font-mono text-[10px] text-slate-300 relative">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getSupabaseSQLScript());
                      toast.success("Supabase table SQL setup script copied to clipboard!");
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-[10px] text-white rounded font-sans font-medium transition-all shadow-sm"
                  >
                    Copy SQL Script
                  </button>
                  <pre className="overflow-x-auto max-h-[220px] no-scrollbar whitespace-pre">{getSupabaseSQLScript()}</pre>
                </div>
              )}
            </div>

            {/* IF NOT AUTHENTICATED */}
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto my-12 p-6 bg-slate-50 rounded-xl border border-slate-200 shadow-sm text-center">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Administrator Verification</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  To modify or write tutorials directly onto the file system database, please enter the administrator passcode.
                </p>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      placeholder="Enter administrator code"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-center font-mono text-slate-900 placeholder-slate-400 focus:outline-none"
                      autoFocus
                    />
                    <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                      Tip: Use <span className="font-mono text-amber-600 font-semibold bg-slate-150 px-1 py-0.5 rounded">Rajab@1954</span> to access immediately.
                    </p>
                  </div>

                  {adminAuthError && (
                    <p className="text-xs text-rose-600 font-mono">{adminAuthError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2 rounded-lg transition-all"
                  >
                    Unlock Edit Panel
                  </button>
                </form>
              </div>
            ) : (
              /* IF AUTHENTICATED ADMIN PANEL */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-stretch">
                               {/* Left Side: Tutorial selector list & Firmware Manager */}
                <div className="lg:col-span-4 flex flex-col space-y-6">
                  {/* Tutorial Selector List */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col h-[320px]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-mono text-xs uppercase tracking-wider text-indigo-600 font-bold flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        Tutorials List ({tutorials.length})
                      </h3>
                      <button
                        onClick={() => {
                          setIsCreatingNew(true);
                          setEditingTutorial({
                            id: `ps5-jailbreak-${Date.now().toString().slice(-4)}`,
                            name: "New PS5 Jailbreak Tutorial",
                            minFirmware: 1.00,
                            maxFirmware: 12.00,
                            ps5Model: "both",
                            status: "New Method",
                            difficulty: "Medium",
                            youtubeId: "",
                            description: "",
                            requirements: ["A PS5 console", "High-speed Internet"],
                            steps: ["Ensure updates are turned off.", "Set up your environment."]
                          });
                        }}
                        className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add New</span>
                      </button>
                    </div>

                    <div className="overflow-y-auto space-y-2 flex-1 pr-1 no-scrollbar">
                      {tutorials.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setEditingTutorial({ ...item });
                            setIsCreatingNew(false);
                          }}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                            editingTutorial?.id === item.id && !isCreatingNew
                              ? "bg-indigo-50/70 border-indigo-500 text-slate-900 shadow-xs"
                              : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-mono text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {item.ps5Model === 'both' ? 'All Models' : item.ps5Model === 'digital' ? 'Digital Only' : 'Disk Only'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              FW {item.minFirmware.toFixed(2)} - {item.maxFirmware.toFixed(2)}
                            </span>
                          </div>
                          <h4 className="font-semibold text-xs text-slate-900 truncate">{item.name}</h4>
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                            <span className="text-amber-600">Difficulty: {item.difficulty}</span>
                            <span className="text-slate-400">ID: {item.id}</span>
                          </div>
                        </div>
                      ))}

                      {tutorials.length === 0 && (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          No tutorials currently in database. Click 'Add New' to insert.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Firmware Versions Manager Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col space-y-3">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-indigo-600 font-bold flex items-center gap-1.5">
                      <Settings className="h-3.5 w-3.5" />
                      Manage Firmware Presets ({(firmwareValues.ps4?.length || 0) + (firmwareValues.ps5?.length || 0)})
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Add custom firmware milestone versions or delete outdated ones. Changes apply to all select lists immediately.
                    </p>

                    {/* Add new firmware inline form */}
                    <form onSubmit={handleAddFirmware} className="flex gap-1.5">
                      <select
                        value={selectedAdminConsole}
                        onChange={(e) => setSelectedAdminConsole(e.target.value as 'ps4' | 'ps5')}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 font-mono font-bold focus:outline-none"
                      >
                        <option value="ps4">PS4</option>
                        <option value="ps5">PS5</option>
                      </select>
                      <input
                        type="text"
                        value={newFirmwareVal}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9.]/g, '');
                          setNewFirmwareVal(clean);
                        }}
                        placeholder="e.g. 11.50"
                        className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none font-mono font-semibold"
                        required
                        disabled={isAddingFw}
                      />
                      <button
                        type="submit"
                        disabled={isAddingFw || !newFirmwareVal}
                        className="text-xs font-mono font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {isAddingFw ? "Adding..." : "Add"}
                      </button>
                    </form>

                    {/* Side by side columns for PS4 and PS5 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {/* PS4 column */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 border-b pb-0.5 mb-1 flex justify-between">
                          <span>PS4 Firmwares</span>
                          <span className="text-slate-400">({firmwareValues.ps4?.length || 0})</span>
                        </div>
                        <div className="overflow-y-auto max-h-[140px] border border-slate-200/80 bg-white rounded-lg p-2 space-y-1 no-scrollbar">
                          {(firmwareValues.ps4 || []).map((fw) => (
                            <div key={`ps4-${fw}`} className="flex items-center justify-between text-[11px] font-mono bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-slate-700">
                              <span className="font-semibold">v{fw}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteFirmware('ps4', fw)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                                title={`Delete firmware v${fw} from PS4`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {(!firmwareValues.ps4 || firmwareValues.ps4.length === 0) && (
                            <p className="text-[9px] text-slate-400 italic text-center py-2">No firmwares found.</p>
                          )}
                        </div>
                      </div>

                      {/* PS5 column */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 border-b pb-0.5 mb-1 flex justify-between">
                          <span>PS5 Firmwares</span>
                          <span className="text-slate-400">({firmwareValues.ps5?.length || 0})</span>
                        </div>
                        <div className="overflow-y-auto max-h-[140px] border border-slate-200/80 bg-white rounded-lg p-2 space-y-1 no-scrollbar">
                          {(firmwareValues.ps5 || []).map((fw) => (
                            <div key={`ps5-${fw}`} className="flex items-center justify-between text-[11px] font-mono bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-slate-700">
                              <span className="font-semibold">v{fw}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteFirmware('ps5', fw)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                                title={`Delete firmware v${fw} from PS5`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {(!firmwareValues.ps5 || firmwareValues.ps5.length === 0) && (
                            <p className="text-[9px] text-slate-400 italic text-center py-2">No firmwares found.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Editorial fields */}
                <div className="lg:col-span-8 flex flex-col">
                  {editingTutorial ? (
                    <form onSubmit={handleSaveTutorial} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 no-scrollbar">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-xs font-mono font-bold text-amber-600 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {isCreatingNew ? "CREATING NEW GUIDE" : "EDITING EXISTING GUIDE"}
                          </span>
                          {!isCreatingNew && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTutorial(editingTutorial.id!)}
                              className="text-rose-600 hover:text-rose-700 text-xs font-mono flex items-center gap-1 px-2 py-1 rounded bg-rose-50 border border-rose-200"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete from DB
                            </button>
                          )}
                        </div>

                        {/* ID and Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-semibold">Tutorial ID (Unique Key)</label>
                            <input
                              type="text"
                              value={editingTutorial.id || ""}
                              onChange={(e) => updateEditingField("id", e.target.value)}
                              disabled={!isCreatingNew}
                              placeholder="e.g. ps5-umtx-exploit"
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-50"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-semibold">Method Name / Title</label>
                            <input
                              type="text"
                              value={editingTutorial.name || ""}
                              onChange={(e) => updateEditingField("name", e.target.value)}
                              placeholder="e.g. Webkit & UMTX Kernel Hack"
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        {/* Firmware boundaries & console model selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-semibold">Min Firmware Supported</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingTutorial.minFirmware || ""}
                              onChange={(e) => updateEditingField("minFirmware", parseFloat(e.target.value))}
                              placeholder="e.g. 1.00"
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-semibold">Max Firmware Supported</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingTutorial.maxFirmware || ""}
                              onChange={(e) => updateEditingField("maxFirmware", parseFloat(e.target.value))}
                              placeholder="e.g. 4.51"
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-semibold">Target PS5 Console Model</label>
                            <select
                              value={editingTutorial.ps5Model || "both"}
                              onChange={(e) => updateEditingField("ps5Model", e.target.value as PS5ModelType)}
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded px-2.5 py-2 text-xs text-slate-900 focus:outline-none"
                            >
                              <option value="both">All Consoles (Digital & Disk)</option>
                              <option value="digital">Digital Version Only</option>
                              <option value="disk">Disc Version Only</option>
                            </select>
                          </div>
                        </div>

                        {/* Status, Difficulty */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-semibold">Status Badge (e.g. Stable)</label>
                            <input
                              type="text"
                              value={editingTutorial.status || ""}
                              onChange={(e) => updateEditingField("status", e.target.value)}
                              placeholder="e.g. Stable, WIP, Beta"
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-semibold">Difficulty Rating</label>
                            <select
                              value={editingTutorial.difficulty || "Medium"}
                              onChange={(e) => updateEditingField("difficulty", e.target.value)}
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded px-2.5 py-2 text-xs text-slate-900 focus:outline-none"
                            >
                              <option value="None">None (N/A)</option>
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>
                          </div>
                        </div>

                        {/* YouTube Video List Manager Section */}
                        {(() => {
                          const editingVideos = editingTutorial ? parseTutorialVideos(
                            editingTutorial.youtubeId || "",
                            editingTutorial.name || "",
                            editingTutorial.minFirmware || 1.00,
                            editingTutorial.maxFirmware || 12.00
                          ) : [];

                          return (
                            <div className="bg-slate-100/60 rounded-xl p-4 border border-slate-200/80 space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold flex items-center gap-1.5">
                                    <Video className="h-4 w-4 text-red-500" />
                                    Video Guides & Firmware Ranges
                                  </h4>
                                  <p className="text-[10px] text-slate-500">
                                    Associate multiple videos with overlapping or distinct firmware ranges.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!editingTutorial) return;
                                    const currentVideos = parseTutorialVideos(
                                      editingTutorial.youtubeId || "",
                                      editingTutorial.name || "",
                                      editingTutorial.minFirmware || 1.00,
                                      editingTutorial.maxFirmware || 12.00
                                    );
                                    const newVideo = {
                                      youtubeId: "",
                                      minFirmware: editingTutorial.minFirmware || 1.00,
                                      maxFirmware: editingTutorial.maxFirmware || 12.00,
                                      title: `Alternative Setup Video ${currentVideos.length + 1}`
                                    };
                                    const updated = [...currentVideos, newVideo];
                                    updateEditingField("youtubeId", JSON.stringify(updated));
                                  }}
                                  className="text-[11px] font-mono font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add Video
                                </button>
                              </div>

                              {editingVideos.length === 0 ? (
                                <div className="p-4 bg-white rounded-lg border border-slate-200 text-center text-xs text-slate-500 italic">
                                  No videos added yet. Click "Add Video" to associate a video tutorial with a firmware range.
                                </div>
                              ) : (
                                <div className="space-y-3.5">
                                  {editingVideos.map((video, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-3 relative group">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                          Video #{idx + 1}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const currentVideos = [...editingVideos];
                                            currentVideos.splice(idx, 1);
                                            updateEditingField("youtubeId", currentVideos.length > 0 ? JSON.stringify(currentVideos) : "");
                                          }}
                                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                          title="Remove Video"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Video Link */}
                                        <div>
                                          <label className="block text-[10px] font-mono uppercase text-slate-500 mb-0.5">YouTube Link / Video ID</label>
                                          <input
                                            type="text"
                                            value={video.youtubeId}
                                            onChange={(e) => {
                                              const currentVideos = [...editingVideos];
                                              currentVideos[idx].youtubeId = extractYoutubeId(e.target.value);
                                              updateEditingField("youtubeId", JSON.stringify(currentVideos));
                                            }}
                                            placeholder="e.g. b-hWeq-G99s or full URL"
                                            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none font-mono"
                                            required
                                          />
                                        </div>

                                        {/* Video Title */}
                                        <div>
                                          <label className="block text-[10px] font-mono uppercase text-slate-500 mb-0.5">Video Title / Label</label>
                                          <input
                                            type="text"
                                            value={video.title}
                                            onChange={(e) => {
                                              const currentVideos = [...editingVideos];
                                              currentVideos[idx].title = e.target.value;
                                              updateEditingField("youtubeId", JSON.stringify(currentVideos));
                                            }}
                                            placeholder="e.g. PPPwn Exploit USB Guide"
                                            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                                            required
                                          />
                                        </div>
                                      </div>

                                      {/* Firmware Ranges Select Dropdowns */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded border border-slate-100">
                                        <div>
                                          <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                                            Min Firmware Supported
                                          </label>
                                          <div className="flex gap-1.5">
                                            <select
                                              value={video.minFirmware.toFixed(2)}
                                              onChange={(e) => {
                                                const currentVideos = [...editingVideos];
                                                currentVideos[idx].minFirmware = parseFloat(e.target.value);
                                                updateEditingField("youtubeId", JSON.stringify(currentVideos));
                                              }}
                                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none"
                                            >
                                              {FIRMWARE_VALUES.map(val => (
                                                <option key={val} value={val}>v{val}</option>
                                              ))}
                                            </select>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={video.minFirmware}
                                              onChange={(e) => {
                                                const currentVideos = [...editingVideos];
                                                currentVideos[idx].minFirmware = parseFloat(e.target.value) || 1.00;
                                                updateEditingField("youtubeId", JSON.stringify(currentVideos));
                                              }}
                                              className="w-16 bg-white border border-slate-200 focus:border-indigo-500 rounded px-1.5 py-1 text-xs text-slate-900 focus:outline-none text-center font-mono"
                                              title="Custom Min Firmware"
                                            />
                                          </div>
                                        </div>

                                        <div>
                                          <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                                            Max Firmware Supported
                                          </label>
                                          <div className="flex gap-1.5">
                                            <select
                                              value={video.maxFirmware.toFixed(2)}
                                              onChange={(e) => {
                                                const currentVideos = [...editingVideos];
                                                currentVideos[idx].maxFirmware = parseFloat(e.target.value);
                                                updateEditingField("youtubeId", JSON.stringify(currentVideos));
                                              }}
                                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none"
                                            >
                                              {FIRMWARE_VALUES.map(val => (
                                                <option key={val} value={val}>v{val}</option>
                                              ))}
                                            </select>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={video.maxFirmware}
                                              onChange={(e) => {
                                                const currentVideos = [...editingVideos];
                                                currentVideos[idx].maxFirmware = parseFloat(e.target.value) || 12.00;
                                                updateEditingField("youtubeId", JSON.stringify(currentVideos));
                                              }}
                                              className="w-16 bg-white border border-slate-200 focus:border-indigo-500 rounded px-1.5 py-1 text-xs text-slate-900 focus:outline-none text-center font-mono"
                                              title="Custom Max Firmware"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Embed Mini-Preview */}
                                      {video.youtubeId && (
                                        <div className="text-[10px] font-mono text-slate-400 bg-slate-50 p-1.5 rounded flex items-center justify-between">
                                          <span className="truncate">Embed ID: <strong className="text-slate-850 font-bold">{video.youtubeId}</strong></span>
                                          <a
                                            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-rose-600 hover:underline flex items-center gap-0.5 font-sans"
                                          >
                                            <span>Test Link</span>
                                            <ExternalLink className="h-2.5 w-2.5" />
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Description */}
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-semibold">Guide Overview / Description</label>
                          <textarea
                            value={editingTutorial.description || ""}
                            onChange={(e) => updateEditingField("description", e.target.value)}
                            rows={3}
                            placeholder="Provide a comprehensive summary of how this exploit behaves and what it triggers..."
                            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                          />
                        </div>

                        {/* Requirements */}
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-semibold flex items-center justify-between">
                            <span>Pre-requisites / Requirements (one per line)</span>
                            <span className="text-[9px] text-slate-400 font-mono">Press Enter to add lines</span>
                          </label>
                          <textarea
                            value={editingTutorial.requirements?.join("\n") || ""}
                            onChange={(e) => updateEditingField("requirements", e.target.value.split("\n"))}
                            rows={3}
                            placeholder="PS5 running firmware 4.51 or lower&#10;PC connected to the same Wi-Fi&#10;exFAT USB drive"
                            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded px-3 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none"
                          />
                        </div>

                        {/* Steps */}
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-semibold flex items-center justify-between">
                            <span>Step-by-Step Instructions (one per line)</span>
                            <span className="text-[9px] text-slate-400 font-mono">Each line constitutes one numbered step</span>
                          </label>
                          <textarea
                            value={editingTutorial.steps?.join("\n") || ""}
                            onChange={(e) => updateEditingField("steps", e.target.value.split("\n"))}
                            rows={4}
                            placeholder="Step 1: Go to network settings...&#10;Step 2: Enter Primary DNS...&#10;Step 3: Open User's Guide..."
                            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded px-3 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none"
                          />
                        </div>

                      </div>

                      {/* Form Actions */}
                      <div className="flex space-x-3 pt-4 border-t border-slate-200 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Cancel edits? Any unsaved changes will be lost.")) {
                              setIsCreatingNew(false);
                              if (tutorials.length > 0) {
                                setEditingTutorial({ ...tutorials[0] });
                              }
                            }
                          }}
                          className="flex-1 py-2 rounded-lg text-xs font-mono font-medium border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
                        >
                          Reset / Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/10 transition-all"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save to Server Database</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex-1 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400">
                      <HelpCircle className="h-8 w-8 mb-2 text-slate-300" />
                      <p className="text-xs">Select or add a tutorial to populate editor fields.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <button
                onClick={() => {
                  setIsAdminMode(false);
                  setIsAdminAuthenticated(false);
                }}
                className="text-xs text-slate-500 hover:text-indigo-600 transition-all"
              >
                ← Return to Jailbreak Wizard Guide
              </button>
            </div>
          </div>
        ) : (
          /* -------------------- USER WIZARD VIEW -------------------- */
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center">
            
            {/* Elegant Header Hero */}
            <div className="text-center mb-8">
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 inline-block mb-3 shadow-xs">
                Firmware Companion Pro
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-slate-900">
                Find Your PS4 & PS5 Jailbreak Method
              </h2>
              <p className="text-sm text-slate-500 max-w-lg mx-auto mt-2 leading-relaxed">
                Choose your hardware generation, select your console model, input your system firmware version, and retrieve your custom step-by-step hack guide.
              </p>
            </div>

            {/* Steps Visual Indicator */}
            <div className="flex items-center justify-center space-x-3 mb-10 max-w-md mx-auto">
              <div 
                onClick={() => consoleGen && setCurrentStep(1)}
                className={`flex items-center space-x-1.5 cursor-pointer text-xs font-mono transition-all ${
                  currentStep >= 1 ? "text-indigo-600 font-bold" : "text-slate-400"
                }`}
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center border text-[11px] ${
                  currentStep >= 1 ? "bg-indigo-50 border-indigo-500 text-indigo-600 font-bold" : "bg-slate-100 border-slate-200 text-slate-400"
                }`}>1</span>
                <span>Console Model</span>
              </div>
              <div className="h-px bg-slate-200 w-8"></div>
              <div 
                onClick={() => consoleGen && (consoleGen === 'ps4' || model) && setCurrentStep(2)}
                className={`flex items-center space-x-1.5 cursor-pointer text-xs font-mono transition-all ${
                  currentStep >= 2 ? "text-indigo-600 font-bold" : "text-slate-400"
                }`}
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center border text-[11px] ${
                  currentStep >= 2 ? "bg-indigo-50 border-indigo-500 text-indigo-600 font-bold" : "bg-slate-100 border-slate-200 text-slate-400"
                }`}>2</span>
                <span>Firmware Check</span>
              </div>
              <div className="h-px bg-slate-200 w-8"></div>
              <div className={`flex items-center space-x-1.5 text-xs font-mono transition-all ${
                currentStep === 3 ? "text-indigo-600 font-bold" : "text-slate-400"
              }`}>
                <span className={`h-6 w-6 rounded-full flex items-center justify-center border text-[11px] ${
                  currentStep === 3 ? "bg-indigo-50 border-indigo-500 text-indigo-600 font-bold" : "bg-slate-100 border-slate-200 text-slate-400"
                }`}>3</span>
                <span>Jailbreak Guide</span>
              </div>
            </div>

            {/* WIZARD CONTENT CARDS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-md min-h-[380px] flex flex-col justify-between relative">
              
              {/* STEP 1: CONSOLE MODEL */}
              {currentStep === 1 && (
                <div className="space-y-6 flex-1 flex flex-col justify-center animate-fade-in">
                  {consoleGen === null ? (
                    // SELECT CONSOLE GENERATION WITH PICS
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-display font-bold text-slate-900 mb-1">
                          Select Your PlayStation Generation
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Choose your console platform to load compatible firmware exploits, kernels, and customized interactive guide checklists.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full pt-2">
                        {/* PLAYSTATION 4 */}
                        <button
                          onClick={() => {
                            setConsoleGen('ps4');
                            setModel('both'); // Default model to skip choosing fat/slim/pro
                            setFirmwareInput("9.00");
                            setCurrentStep(2); // Go directly to Step 2
                          }}
                          className="group relative bg-slate-50 border border-slate-200 hover:border-indigo-500 hover:bg-slate-100/30 rounded-2xl p-4 text-left transition-all overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg hover:shadow-indigo-500/5 duration-300 cursor-pointer"
                        >
                          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-950 mb-4 relative border border-slate-100">
                            <img 
                              src={ps4ConsoleImg} 
                              alt="PlayStation 4 Console" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                          </div>
                          
                          <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              PlayStation 4
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Welcome To Freedum.
                            </p>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-mono font-semibold">
                            <span>Explore PS4 Guides</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>

                        {/* PLAYSTATION 5 */}
                        <button
                          onClick={() => {
                            setConsoleGen('ps5');
                            setModel(null); // Let them choose Digital vs Disc
                            setFirmwareInput("4.03");
                          }}
                          className="group relative bg-slate-50 border border-slate-200 hover:border-indigo-500 hover:bg-slate-100/30 rounded-2xl p-4 text-left transition-all overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg hover:shadow-indigo-500/5 duration-300 cursor-pointer"
                        >
                          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-950 mb-4 relative border border-slate-100">
                            <img 
                              src={ps5ConsoleImg} 
                              alt="PlayStation 5 Console" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                          </div>
                          
                          <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              PlayStation 5
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Run UMTX kernel exploits, BD-JB Java disc payloads, or Mast1c0re PS4 emulator exploits.
                            </p>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-mono font-semibold">
                            <span>Explore PS5 Guides</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : consoleGen === 'ps4' ? (
                    // SELECT PS4 MODEL TYPE
                    <div className="space-y-5 animate-fade-in">
                      <div className="text-center">
                        <button 
                          onClick={() => setConsoleGen(null)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 inline-flex items-center space-x-1 mb-2 font-mono cursor-pointer"
                        >
                          <ArrowLeft className="h-3 w-3" />
                          <span>Change Console Generation</span>
                        </button>
                        <h3 className="text-lg font-display font-bold text-slate-900 mb-1">
                          Which PlayStation 4 model do you own?
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          All PS4 hardware models support the identical Webkit and PPPwn exploits, but choosing your exact hardware matches our setup logs correctly.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto w-full pt-2">
                        {/* FAT */}
                        <button
                          onClick={() => {
                            setModel('fat');
                            setCurrentStep(2);
                          }}
                          className={`group relative p-5 rounded-xl border text-left transition-all cursor-pointer ${
                            model === 'fat'
                              ? 'bg-indigo-50/50 border-indigo-500 shadow-md shadow-indigo-500/5 text-slate-950'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <Layers className="h-4.5 w-4.5" />
                            </div>
                            <span className="text-[9px] font-mono font-medium text-slate-400 uppercase tracking-widest">Original</span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 mt-3 group-hover:text-indigo-600 transition-colors">PS4 Fat / Classic</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                            Includes 10xx, 11xx, and 12xx series hardware revisions. Both touch or tactile power buttons.
                          </p>
                          <div className="mt-3 pt-3 border-t border-slate-200/85 flex items-center justify-between text-[11px] text-indigo-600 font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Select Fat</span>
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </button>

                        {/* SLIM */}
                        <button
                          onClick={() => {
                            setModel('slim');
                            setCurrentStep(2);
                          }}
                          className={`group relative p-5 rounded-xl border text-left transition-all cursor-pointer ${
                            model === 'slim'
                              ? 'bg-indigo-50/50 border-indigo-500 shadow-md shadow-indigo-500/5 text-slate-950'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <Cpu className="h-4.5 w-4.5" />
                            </div>
                            <span className="text-[9px] font-mono font-medium text-slate-400 uppercase tracking-widest">Slimmer</span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 mt-3 group-hover:text-indigo-600 transition-colors">PS4 Slim</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                            20xx and 21xx/22xx series revisions. Extremely light-weight, highly energy efficient, and silent.
                          </p>
                          <div className="mt-3 pt-3 border-t border-slate-200/85 flex items-center justify-between text-[11px] text-indigo-600 font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Select Slim</span>
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </button>

                        {/* PRO */}
                        <button
                          onClick={() => {
                            setModel('pro');
                            setCurrentStep(2);
                          }}
                          className={`group relative p-5 rounded-xl border text-left transition-all cursor-pointer ${
                            model === 'pro'
                              ? 'bg-indigo-50/50 border-indigo-500 shadow-md shadow-indigo-500/5 text-slate-950'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <Sparkles className="h-4.5 w-4.5" />
                            </div>
                            <span className="text-[9px] font-mono font-medium text-slate-400 uppercase tracking-widest">Enhanced</span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 mt-3 group-hover:text-indigo-600 transition-colors">PS4 Pro</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                            70xx, 71xx, and 72xx series hardware. Enhanced GPU clock, 4K render capability, and extra USB port.
                          </p>
                          <div className="mt-3 pt-3 border-t border-slate-200/85 flex items-center justify-between text-[11px] text-indigo-600 font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Select Pro</span>
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </button>
                      </div>

                      <div className="text-center pt-2">
                        <button
                          onClick={() => {
                            setModel('all');
                            setCurrentStep(2);
                          }}
                          className="text-xs text-slate-500 hover:text-indigo-600 transition-colors font-sans underline underline-offset-4 cursor-pointer"
                        >
                          Skip and select general PS4 / All Models
                        </button>
                      </div>
                    </div>
                  ) : (
                    // SELECT PS5 MODEL TYPE
                    <div className="space-y-6 animate-fade-in">
                      <div className="text-center">
                        <button 
                          onClick={() => setConsoleGen(null)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 inline-flex items-center space-x-1 mb-2 font-mono cursor-pointer"
                        >
                          <ArrowLeft className="h-3 w-3" />
                          <span>Change Console Generation</span>
                        </button>
                        <h3 className="text-lg font-display font-bold text-slate-900 mb-1">
                          Which PlayStation 5 model do you own?
                        </h3>
                        <p className="text-xs text-slate-500">
                          Disk/Disc consoles support specific Blu-ray disc Java exploit payloads, whereas Digital editions utilize purely web-based hosts.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-xl mx-auto w-full pt-2">
                        {/* DIGITAL OPTION */}
                        <button
                          onClick={() => {
                            setModel('digital');
                            setCurrentStep(2);
                          }}
                          className={`group relative p-6 rounded-xl border text-left transition-all cursor-pointer ${
                            model === 'digital'
                              ? 'bg-indigo-50/50 border-indigo-500 shadow-md shadow-indigo-500/5 text-slate-950'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <Cpu className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">Symmetrical Design</span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 mt-4 group-hover:text-indigo-600 transition-colors">Digital Version</h4>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            Sleek edition without optical drive tray. Relies entirely on the Webkit browser sandbox for payload delivery and homebrew setup.
                          </p>
                          <div className="mt-4 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-indigo-600 font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Select Version</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        </button>

                        {/* DISK OPTION */}
                        <button
                          onClick={() => {
                            setModel('disk');
                            setCurrentStep(2);
                          }}
                          className={`group relative p-6 rounded-xl border text-left transition-all cursor-pointer ${
                            model === 'disk'
                              ? 'bg-indigo-50/50 border-indigo-500 shadow-md shadow-indigo-500/5 text-slate-950'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <Disc className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">Blu-Ray Built-In</span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 mt-4 group-hover:text-indigo-600 transition-colors">Disk / Disc Version</h4>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            Consoles equipped with the physical Blu-ray drive. Supports BD-JB Java disc exploits which are highly stable and reliable.
                          </p>
                          <div className="mt-4 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-indigo-600 font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Select Version</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: FIRMWARE INPUT */}
              {currentStep === 2 && (
                <div className="space-y-6 flex-1 flex flex-col justify-center animate-fade-in">
                  <div className="text-center">
                    <button 
                      onClick={() => {
                        if (consoleGen === 'ps4') {
                          setConsoleGen(null);
                        }
                        setCurrentStep(1);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 inline-flex items-center space-x-1 mb-2 font-mono cursor-pointer"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Back to {consoleGen === 'ps4' ? 'Console' : 'Model'} Selection</span>
                    </button>
                    <h3 className="text-lg font-display font-bold text-slate-900">
                      Enter Your System Firmware Version
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      {consoleGen === 'ps4' ? (
                        <>Check your firmware version on your PS4 in: <span className="text-indigo-600 font-mono font-semibold bg-indigo-50/50 px-1 py-0.5 rounded border border-indigo-100">Settings &gt; System &gt; System Information</span>.</>
                      ) : (
                        <>Check your firmware version on your PS5 in: <span className="text-indigo-600 font-mono font-semibold bg-indigo-50/50 px-1 py-0.5 rounded border border-indigo-100">Settings &gt; System &gt; System Software &gt; Console Information</span>.</>
                      )}
                    </p>
                  </div>

                  <div className="max-w-xl mx-auto w-full space-y-5">
                    {/* Dynamic typed Firmware input slider / text box combo */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                            {customFirmwareMode ? "Manual Firmware Version Input" : "Select Firmware Version"}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomFirmwareMode(!customFirmwareMode);
                              // Reset to preset if switching back to dropdown
                              if (customFirmwareMode) {
                                setFirmwareInput(consoleGen === 'ps4' ? "9.00" : "4.03");
                              }
                            }}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-mono underline font-bold cursor-pointer"
                          >
                            {customFirmwareMode ? "Choose from list" : "Type custom version"}
                          </button>
                        </div>
                        
                        {customFirmwareMode ? (
                          <input
                            type="text"
                            value={firmwareInput}
                            onChange={(e) => {
                              // sanitize to only allow decimals
                              const clean = e.target.value.replace(/[^0-9.]/g, '');
                              setFirmwareInput(clean);
                            }}
                            className="w-full bg-transparent text-xl font-mono font-bold text-slate-900 placeholder-slate-300 border-none outline-none focus:ring-0"
                            placeholder={consoleGen === 'ps4' ? "e.g. 9.00" : "e.g. 4.03"}
                          />
                        ) : (
                          <select
                            value={firmwareInput}
                            onChange={(e) => setFirmwareInput(e.target.value)}
                            className="w-full bg-transparent text-lg font-mono font-bold text-slate-900 border-none outline-none focus:ring-0 cursor-pointer pr-8"
                          >
                            {FIRMWARE_VALUES.map((fw) => {
                              const fwNum = parseFloat(fw);
                              let suffix = "";
                              if (consoleGen === 'ps4') {
                                if (fwNum <= 11.00) suffix = " - (Jailbreak Available)";
                                else if (fwNum <= 11.50) suffix = " - (Webkit Only)";
                              } else {
                                if (fwNum <= 4.51) suffix = " - (Jailbreak Available)";
                                else if (fwNum <= 7.61) suffix = " - (Alternative Exploit)";
                              }
                              return (
                                <option key={fw} value={fw} className="font-mono text-slate-900 text-sm">
                                  v{fw}{suffix}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>
                      <div className="h-10 w-px bg-slate-200"></div>
                      <div className="text-right">
                        <span className="text-[10px] block font-mono text-slate-500 uppercase">Input Status</span>
                        {isNaN(parseFloat(firmwareInput)) ? (
                          <span className="text-xs font-mono font-bold text-rose-600">Invalid Number</span>
                        ) : consoleGen === 'ps4' ? (
                          parseFloat(firmwareInput) <= 11.00 ? (
                            <span className="text-xs font-mono font-bold text-emerald-600">✓ Hackable</span>
                          ) : parseFloat(firmwareInput) <= 11.50 ? (
                            <span className="text-xs font-mono font-bold text-amber-600">⚡ Webkit Only</span>
                          ) : (
                            <span className="text-xs font-mono font-bold text-slate-500">No Jailbreak Yet</span>
                          )
                        ) : parseFloat(firmwareInput) <= 4.51 ? (
                          <span className="text-xs font-mono font-bold text-emerald-600">✓ Hackable</span>
                        ) : parseFloat(firmwareInput) <= 7.61 ? (
                          <span className="text-xs font-mono font-bold text-amber-600">⚡ Alt Available</span>
                        ) : (
                          <span className="text-xs font-mono font-bold text-slate-500">No Jailbreak Yet</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Preset Badges */}
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2.5">
                        Popular Firmwares & Presets
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {firmwarePresets.map((preset) => (
                          <button
                            key={preset.value}
                            onClick={() => setFirmwareInput(preset.value)}
                            className={`p-2 rounded-lg text-xs font-mono border text-center transition-all cursor-pointer ${
                              firmwareInput === preset.value
                                ? "bg-indigo-600 border-indigo-500 text-white font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/50"
                            }`}
                          >
                            {preset.value}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Proceed Action Button */}
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (firmwareInput && !isNaN(parseFloat(firmwareInput))) {
                            setCurrentStep(3);
                          } else {
                            toast.warning("Please enter a valid numeric firmware version (e.g. 9.00)");
                          }
                        }}
                        disabled={!firmwareInput || isNaN(parseFloat(firmwareInput))}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white font-semibold text-xs py-2.5 rounded-lg transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-1.5 disabled:opacity-40 cursor-pointer"
                      >
                        <span>Match Hack Tutorial</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* STEP 3: RESULT JAILBREAK GUIDE */}
              {currentStep === 3 && (
                <div className="space-y-6 flex-1">
                  
                  {/* Result Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 inline-flex items-center space-x-1 font-mono self-start"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Back to Firmware Input</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">Selection:</span>
                      <span className="text-xs font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-indigo-600">
                        {model === 'digital' ? 'Digital' : 'Disk'} Edition
                      </span>
                      <span className="text-xs font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-indigo-600">
                        Firmware {firmwareInput}
                      </span>
                    </div>
                  </div>

                  {matchedTutorial ? (
                    <div className="space-y-6 text-left">
                      
                      {/* Name and Basic badges */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                        <div>
                          <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider block mb-1">Matched Hack Method</span>
                          <h4 className="text-base md:text-lg font-bold text-slate-900">{matchedTutorial.name}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          {renderDifficultyBadge(matchedTutorial.difficulty)}
                          <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-full bg-slate-50 border border-slate-200 text-indigo-600">
                            Status: {matchedTutorial.status}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <h5 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                          <Info className="h-3.5 w-3.5 text-indigo-600" />
                          Method Overview
                        </h5>
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-150">
                          {matchedTutorial.description}
                        </p>
                      </div>

                      {/* Video Guide Embed Area */}
                      {(() => {
                        const matchedVideos = getMatchedVideos();
                        if (matchedVideos.length === 0) {
                          return (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3 text-slate-500">
                              <Video className="h-5 w-5 text-slate-400 shrink-0" />
                              <p className="text-xs italic">No video tutorial was embedded for this firmware method yet.</p>
                            </div>
                          );
                        }

                        // Ensure we have a valid selected index
                        const activeIndex = selectedVideoIndex < matchedVideos.length ? selectedVideoIndex : 0;
                        const activeVideo = matchedVideos[activeIndex];

                        return (
                          <div className="space-y-4 animate-fade-in">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-150 pb-2">
                              <h5 className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Video className="h-3.5 w-3.5 text-red-500" />
                                {matchedVideos.length > 1 ? `Compatible Video Guides (${matchedVideos.length} found)` : "Companion Video Guide"}
                              </h5>
                              {matchedVideos.length > 1 && (
                                <span className="text-[10px] font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono animate-pulse">
                                  Overlapping FW Videos Found!
                                </span>
                              )}
                            </div>

                            {/* Multiple Videos Selection Tabs */}
                            {matchedVideos.length > 1 && (
                              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-2">
                                <p className="text-[11px] text-slate-650 font-medium px-1">
                                  Select a companion video covering firmware range {firmwareInput}:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {matchedVideos.map((vid, idx) => {
                                    const isSelected = idx === activeIndex;
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedVideoIndex(idx)}
                                        className={`p-2.5 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                                          isSelected
                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                            : "bg-white border-slate-200 hover:bg-slate-105 hover:bg-slate-50 text-slate-750"
                                        }`}
                                      >
                                        <div className="font-semibold line-clamp-1 flex items-center gap-1">
                                          {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>}
                                          {vid.title}
                                        </div>
                                        <div className={`text-[10px] mt-0.5 font-mono ${isSelected ? "text-indigo-200" : "text-slate-450"}`}>
                                          FW: {vid.minFirmware.toFixed(2)} - {vid.maxFirmware.toFixed(2)}
                                          {vid.tutorialName && vid.tutorialName !== vid.title && ` • (${vid.tutorialName})`}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Embed Iframe Area */}
                            {activeVideo.youtubeId ? (
                              <div className="space-y-2 animate-fade-in">
                                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${extractYoutubeId(activeVideo.youtubeId)}`}
                                    title={`${activeVideo.title} Tutorial Guide`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full border-0"
                                  ></iframe>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-1 px-1">
                                  <p className="text-[10px] text-slate-500 italic truncate max-w-full sm:max-w-md">
                                    Playing: <span className="font-semibold text-slate-750 font-mono">{activeVideo.title}</span> (FW: {activeVideo.minFirmware.toFixed(2)} - {activeVideo.maxFirmware.toFixed(2)})
                                  </p>
                                  <a
                                    href={`https://www.youtube.com/watch?v=${extractYoutubeId(activeVideo.youtubeId)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-rose-600 hover:text-rose-500 transition-colors shrink-0 bg-rose-50 px-2 py-1 rounded-md border border-rose-100"
                                    id="btn-watch-youtube"
                                  >
                                    <span>Watch on YouTube</span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3 text-slate-500">
                                <Video className="h-5 w-5 text-slate-400 shrink-0" />
                                <p className="text-xs italic">This selected video is missing its YouTube URL or ID.</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Pre-requisites checklist */}
                      <div className="space-y-2.5">
                        <h5 className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <ListChecks className="h-3.5 w-3.5 text-indigo-600" />
                          Before You Start (Checklist)
                        </h5>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                          {matchedTutorial.requirements && matchedTutorial.requirements.map((req, i) => (
                            <label
                              key={i}
                              className={`flex items-start space-x-2.5 p-1.5 rounded text-xs cursor-pointer transition-colors ${
                                checkedRequirements[`req-${i}`] 
                                  ? 'text-slate-450 line-through' 
                                  : 'text-slate-700 hover:text-slate-900'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={!!checkedRequirements[`req-${i}`]}
                                onChange={(e) => setCheckedRequirements(prev => ({
                                  ...prev,
                                  [`req-${i}`]: e.target.checked
                                }))}
                                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-0 bg-white"
                              />
                              <span>{req}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Steps Checklist */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-indigo-600" />
                          Step-By-Step Hacking Procedure
                        </h5>
                        <div className="space-y-2.5">
                          {matchedTutorial.steps && matchedTutorial.steps.map((step, idx) => (
                            <div
                              key={idx}
                              onClick={() => setCheckedSteps(prev => ({
                                ...prev,
                                [idx]: !prev[idx]
                              }))}
                              className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start space-x-3 ${
                                checkedSteps[idx]
                                  ? "bg-slate-50 border-slate-200 text-slate-400 line-through"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <span className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] ${
                                checkedSteps[idx]
                                  ? "bg-slate-100 border-slate-200 text-slate-400"
                                  : "bg-indigo-50 border-indigo-100 text-indigo-600 font-bold"
                              }`}>
                                {idx + 1}
                              </span>
                              <p className="flex-1 leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500 space-y-4">
                      <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-amber-500">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">No Configured Tutorial Found</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          There is no specific tutorial matching firmware <span className="font-mono text-indigo-600">{firmwareInput}</span> for your <span className="font-mono text-indigo-600">{model}</span> console in the database.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono transition-all border border-slate-200"
                        >
                          Restart Wizard
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reset Bottom Controls */}
                  <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-mono">
                      Stay updated! Never download Sony software updates.
                    </p>
                    <button
                      onClick={handleReset}
                      className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 rounded-lg text-xs font-medium border border-indigo-200 transition-all"
                    >
                      Check Another PS5
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Footer information */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 z-10 text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-2 sm:space-y-0">
          <p>© 2026 PS5 Hacking Companion. Created for educational and homebrew development research only.</p>
          <p className="font-mono text-[10px]">
            FW Database: <span className="text-indigo-400">Live JSON Node Store</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export type PS5ModelType = 'digital' | 'disk' | 'both' | 'fat' | 'slim' | 'pro' | 'all';

export interface Tutorial {
  id: string;
  name: string;
  minFirmware: number;
  maxFirmware: number;
  ps5Model: PS5ModelType;
  status: 'Stable' | 'Alternative Method' | 'No Jailbreak' | string;
  difficulty: 'None' | 'Easy' | 'Medium' | 'Hard';
  youtubeId: string; // Embeddable YouTube ID
  description: string;
  requirements: string[];
  steps: string[];
}

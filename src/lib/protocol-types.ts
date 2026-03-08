export interface ProtocolSettings {
  startSpeed: number;
  stepIncrement: number;
  stepDuration: number;
  numberOfSteps: number;
  allOutEnabled: boolean;
  allOutDistance: number; // meters
  allOutDuration: number; // seconds
}

export const DEFAULT_PROTOCOL: ProtocolSettings = {
  startSpeed: 9,
  stepIncrement: 1,
  stepDuration: 5,
  numberOfSteps: 8,
  allOutEnabled: true,
  allOutDistance: 800,
  allOutDuration: 180,
};

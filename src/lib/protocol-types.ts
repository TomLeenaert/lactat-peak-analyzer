export interface ProtocolSettings {
  startSpeed: number;
  stepIncrement: number; // km/h increment (used internally)
  paceIncrementSec: number; // pace increment in seconds (UI)
  stepDistance: number; // meters per step
  numberOfSteps: number; // kept for backwards compat, not shown in UI
  allOutEnabled: boolean;
  allOutDistance: number; // meters
  allOutDuration: number; // seconds
}

export const DEFAULT_PROTOCOL: ProtocolSettings = {
  startSpeed: 9,
  stepIncrement: 1,
  paceIncrementSec: 30, // 0:30 faster each step
  stepDistance: 1600,
  numberOfSteps: 8,
  allOutEnabled: true,
  allOutDistance: 800,
  allOutDuration: 180,
};

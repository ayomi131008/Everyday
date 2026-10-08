import { Vector3D } from '../core/Types';

export interface ObjectiveDef {
  id: string;
  title: string;
  instruction: string;
  rewardCents: number;
  targetLocation?: string;
  targetMarker?: Vector3D;
}

export const TUTORIAL_CHAIN: ObjectiveDef[] = [
  {
    id: 'explore_controls',
    title: 'Find Your Bearings',
    instruction: 'Use WASD to walk around Dunmore Square. Look around using your mouse.',
    rewardCents: 500, // $5 welcome bonus
  },
  {
    id: 'reach_diner',
    title: 'Find Mel’s Diner',
    instruction: 'Walk down Dunmore Ave to Mel’s Diner. Look for the glowing diner neon sign.',
    rewardCents: 0,
    targetLocation: 'exterior',
    targetMarker: { x: -16, y: 1.0, z: 8 },
  },
  {
    id: 'apply_job',
    title: 'Speak with Manager Mel',
    instruction: 'Enter Mel’s Diner and talk to Mel at the time clock to get hired.',
    rewardCents: 1000,
    targetLocation: 'diner',
    targetMarker: { x: 198, y: 1.0, z: 4 },
  },
  {
    id: 'complete_shift',
    title: 'Work Your First Shift',
    instruction: 'Clock in at the diner counter and assemble customer orders on the line.',
    rewardCents: 1500,
  },
  {
    id: 'buy_food',
    title: 'Eat a Hot Meal',
    instruction: 'Your stomach is rumbling. Order food at Mel’s counter or grab snacks at QuikStop and eat.',
    rewardCents: 500,
  },
  {
    id: 'rest_or_clean',
    title: 'Freshen Up at Home',
    instruction: 'Return to Lindqvist Arms (14 Pell St). Take a hot shower or sleep in your bed.',
    rewardCents: 500,
    targetLocation: 'exterior',
    targetMarker: { x: 16, y: 1.0, z: -8 },
  },
  {
    id: 'pay_rent',
    title: 'Pay Your First Rent',
    instruction: 'Rent is $90 every 3 days. Interact with the mail slot board in Lindqvist Arms to pay.',
    rewardCents: 2000,
  },
  {
    id: 'save_upgrade',
    title: 'Brightwater Dreams',
    instruction: 'Save $300 in your wallet to unlock future lifestyle upgrades and neighborhood expansions.',
    rewardCents: 0,
  },
];

export const DAILY_GOAL_TEMPLATES = [
  {
    id: 'daily_earn',
    text: 'Earn at least $50 working today',
    target: 5000,
    rewardCents: 1500,
  },
  {
    id: 'daily_hygiene',
    text: 'Take a shower to keep hygiene above 80',
    target: 1,
    rewardCents: 500,
  },
  {
    id: 'daily_park',
    text: 'Visit Dunmore Park and shoot some hoops',
    target: 1,
    rewardCents: 500,
  },
  {
    id: 'daily_diner_shift',
    text: 'Complete 2 shifts at Mel’s Diner',
    target: 2,
    rewardCents: 2000,
  },
];

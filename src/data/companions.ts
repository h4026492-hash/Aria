import { CompanionCharacter } from '@/types';

// Real human face companions for D-ID API
// Using publicly accessible images that work with D-ID's video generation
// D-ID requires direct image URLs that are publicly accessible

// D-ID provides sample presenter images we can use
const FEMALE_PRESENTER_1 = 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg';
const FEMALE_PRESENTER_2 = 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/amy.jpg';  
const FEMALE_PRESENTER_3 = 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/emma.jpg';
const MALE_PRESENTER_1 = 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/will.jpg';
const MALE_PRESENTER_2 = 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/charles.jpg';
const MALE_PRESENTER_3 = 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/joseph.jpg';

export const companions: CompanionCharacter[] = [
  {
    id: 'aria',
    name: 'Aria',
    gender: 'female',
    style: 'Professional Coach',
    description: 'Warm, supportive, and focused on your growth',
    images: {
      neutral: FEMALE_PRESENTER_1,
      happy: FEMALE_PRESENTER_1,
      talking: FEMALE_PRESENTER_1,
      thinking: FEMALE_PRESENTER_1,
      listening: FEMALE_PRESENTER_1,
    },
  },
  {
    id: 'luna',
    name: 'Luna',
    gender: 'female',
    style: 'Friendly Companion',
    description: 'Fun, encouraging, and always positive',
    images: {
      neutral: FEMALE_PRESENTER_2,
      happy: FEMALE_PRESENTER_2,
      talking: FEMALE_PRESENTER_2,
      thinking: FEMALE_PRESENTER_2,
      listening: FEMALE_PRESENTER_2,
    },
  },
  {
    id: 'maya',
    name: 'Maya',
    gender: 'female',
    style: 'Life Mentor',
    description: 'Wise, calm, and deeply understanding',
    images: {
      neutral: FEMALE_PRESENTER_3,
      happy: FEMALE_PRESENTER_3,
      talking: FEMALE_PRESENTER_3,
      thinking: FEMALE_PRESENTER_3,
      listening: FEMALE_PRESENTER_3,
    },
  },
  {
    id: 'alex',
    name: 'Alex',
    gender: 'male',
    style: 'Success Coach',
    description: 'Motivating, driven, and goal-focused',
    images: {
      neutral: MALE_PRESENTER_1,
      happy: MALE_PRESENTER_1,
      talking: MALE_PRESENTER_1,
      thinking: MALE_PRESENTER_1,
      listening: MALE_PRESENTER_1,
    },
  },
  {
    id: 'marcus',
    name: 'Marcus',
    gender: 'male',
    style: 'Friendly Mentor',
    description: 'Supportive, patient, and understanding',
    images: {
      neutral: MALE_PRESENTER_2,
      happy: MALE_PRESENTER_2,
      talking: MALE_PRESENTER_2,
      thinking: MALE_PRESENTER_2,
      listening: MALE_PRESENTER_2,
    },
  },
  {
    id: 'james',
    name: 'James',
    gender: 'male',
    style: 'Life Coach',
    description: 'Calm, wise, and insightful',
    images: {
      neutral: MALE_PRESENTER_3,
      happy: MALE_PRESENTER_3,
      talking: MALE_PRESENTER_3,
      thinking: MALE_PRESENTER_3,
      listening: MALE_PRESENTER_3,
    },
  },
];

export function getCompanionById(id: string): CompanionCharacter | undefined {
  return companions.find(c => c.id === id);
}

export function getCompanionsByGender(gender: 'male' | 'female'): CompanionCharacter[] {
  return companions.filter(c => c.gender === gender);
}

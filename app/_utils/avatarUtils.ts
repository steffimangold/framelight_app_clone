// utils/avatarUtils.ts
import { botttsNeutral, thumbs } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";

// Available avatar styles
export type AvatarStyle = "botttsNeutral" | "thumbs";

export const JESSICA = {
  name: "Jessica",
  style: "botttsNeutral" as AvatarStyle,
  color: "purple",
  backgroundColor: "3498db",
  customOptions: {},
};

export const BROOKLYNN = {
  name: "Brooklynn",
  style: "botttsNeutral" as AvatarStyle,
  color: "green",
  backgroundColor: "e74c3c",
  customOptions: {},
};

export const ANDREA = {
  name: "Andrea",
  style: "botttsNeutral" as AvatarStyle,
  color: "blue",
  backgroundColor: "00897b",
  customOptions: {},
};

export const CHRISTIAN = {
  name: "Christian",
  style: "botttsNeutral" as AvatarStyle,
  color: "red",
  backgroundColor: "757575",
  customOptions: {},
};

export const CHASE = {
  name: "Chase",
  style: "botttsNeutral" as AvatarStyle,
  color: "cyan",
  backgroundColor: "7cb342",
  customOptions: {},
};

export const ROBERT = {
  name: "Robert",
  style: "botttsNeutral" as AvatarStyle,
  color: "deepOrange",
  backgroundColor: "6d4c41",
  customOptions: {},
};

export const AIDAN_BOTTTS = {
  name: "Aidan",
  style: "botttsNeutral" as AvatarStyle,
  color: "yellow",
  backgroundColor: "fb8c00",
  customOptions: {},
};

export const AIDEN = {
  name: "Aiden",
  style: "botttsNeutral" as AvatarStyle,
  color: "pink",
  backgroundColor: "c0aede",
  customOptions: {},
};

// For thumbs style
export const RYAN = {
  name: "Ryan",
  style: "thumbs" as AvatarStyle,
  color: "lightBlue",
  backgroundColor: "3498db",
  customOptions: {},
};

export const AMAYA = {
  name: "Amaya",
  style: "thumbs" as AvatarStyle,
  color: "deepPurple",
  backgroundColor: "e74c3c",
  customOptions: {},
};

export const AIDAN_THUMBS = {
  name: "Aidan",
  style: "thumbs" as AvatarStyle,
  color: "amber",
  backgroundColor: "2ecc71",
  customOptions: {},
};

export const VIVIAN = {
  name: "Vivian",
  style: "thumbs" as AvatarStyle,
  color: "orange",
  backgroundColor: "f39c12",
  customOptions: {},
};

// Group them for easy iteration
export const BOTTTS_AVATARS = [
  JESSICA,
  BROOKLYNN,
  ANDREA,
  CHRISTIAN,
  CHASE,
  ROBERT,
  AIDAN_BOTTTS,
  AIDEN,
];

export const THUMBS_AVATARS = [RYAN, AMAYA, AIDAN_THUMBS, VIVIAN];

// Combined list of all avatars
export const ALL_AVATARS = [...BOTTTS_AVATARS, ...THUMBS_AVATARS];

// Default styling options for each avatar type
export const DEFAULT_STYLE_OPTIONS: Record<AvatarStyle, any> = {
  botttsNeutral: {
    colors: [
      "amber",
      "blue",
      "blueGrey",
      "brown",
      "cyan",
      "deepOrange",
      "deepPurple",
      "green",
      "grey",
      "indigo",
      "lightBlue",
      "lightGreen",
      "lime",
      "orange",
      "pink",
      "purple",
      "red",
      "teal",
      "yellow",
    ],
    backgroundColor: ["3498db", "e74c3c", "2ecc71", "f39c12", "9b59b6"],
    radius: 50,
  },
  thumbs: {
    backgroundColor: ["3498db", "e74c3c", "2ecc71", "f39c12", "9b59b6"],
    radius: 50,
  },
};

/**
 * Generates an avatar for a specific person using their name as the seed
 * @param name The name of the person (used as seed for consistent generation)
 * @param style The avatar style to use
 * @param customColor Optional specific color for this avatar
 * @param customBackgroundColor Optional specific background color
 * @param additionalOptions Any other custom options
 * @returns SVG string of the generated avatar
 */
export const generateNamedAvatar = (
  name: string,
  style: AvatarStyle = "botttsNeutral",
  customColor?: string,
  customBackgroundColor?: string,
  additionalOptions?: Record<string, any>
) => {
  // Start with default options for the style
  const baseOptions = { ...DEFAULT_STYLE_OPTIONS[style] };

  // Apply custom colors if provided
  const options = {
    ...baseOptions,
    ...additionalOptions,
    // Always use the name as seed for consistency
    seed: name,
    // Override with specific colors if provided
    ...(customColor ? { colors: [customColor] } : {}),
    ...(customBackgroundColor
      ? { backgroundColor: [customBackgroundColor] }
      : {}),
  };

  // Create and return the avatar based on the style
  if (style === "botttsNeutral") {
    return createAvatar(botttsNeutral, options).toString();
  } else {
    return createAvatar(thumbs, options).toString();
  }
};

/**
 * Generate a single avatar by avatar object with custom colors
 * @param avatar The avatar object containing name, style, and color options
 * @returns The avatar with SVG data
 */
export const generateAvatar = (avatar: {
  name: string;
  style: AvatarStyle;
  color?: string;
  backgroundColor?: string;
  customOptions?: Record<string, any>;
}) => {
  return {
    ...avatar,
    svg: generateNamedAvatar(
      avatar.name,
      avatar.style,
      avatar.color,
      avatar.backgroundColor,
      avatar.customOptions
    ),
  };
};

/**
 * Generates all avatars for the profile selection
 * @returns Array of avatar objects with name, style, and SVG
 */
export const getAllProfileAvatars = () => {
  return ALL_AVATARS.map((avatar) => ({
    ...avatar,
    svg: generateNamedAvatar(
      avatar.name,
      avatar.style,
      avatar.color,
      avatar.backgroundColor,
      avatar.customOptions
    ),
  }));
};

/**
 * Gets a specific avatar by index
 * @param index The index of the avatar to get
 * @returns The avatar object with name, style, and SVG
 */
export const getAvatarByIndex = (index: number) => {
  const avatars = getAllProfileAvatars();
  // Ensure index is valid
  const safeIndex = index >= 0 && index < avatars.length ? index : 0;
  return avatars[safeIndex];
};

/**
 * Gets botttsNeutral style avatars
 * @returns Array of botttsNeutral avatars with SVG data
 */
export const getBotttsAvatars = () => {
  return BOTTTS_AVATARS.map((avatar) => ({
    ...avatar,
    svg: generateNamedAvatar(
      avatar.name,
      "botttsNeutral",
      avatar.color,
      avatar.backgroundColor,
      avatar.customOptions
    ),
  }));
};

/**
 * Gets thumbs style avatars
 * @returns Array of thumbs avatars with SVG data
 */
export const getThumbsAvatars = () => {
  return THUMBS_AVATARS.map((avatar) => ({
    ...avatar,
    svg: generateNamedAvatar(
      avatar.name,
      "thumbs",
      avatar.color,
      avatar.backgroundColor,
      avatar.customOptions
    ),
  }));
};

/**
 * Find an avatar by name and style
 * @param name The name to search for
 * @param style The style to search for
 * @returns The avatar object with SVG if found, or null
 */
export const findAvatar = (name: string, style?: AvatarStyle) => {
  const avatar = ALL_AVATARS.find(
    (a) => a.name === name && (style ? a.style === style : true)
  );

  if (!avatar) return null;

  return {
    ...avatar,
    svg: generateNamedAvatar(
      avatar.name,
      avatar.style,
      avatar.color,
      avatar.backgroundColor,
      avatar.customOptions
    ),
  };
};

/**
 * Gets the avatar index from the ALL_AVATARS array
 * @param name The name of the avatar
 * @param style The style of the avatar
 * @returns The index of the avatar in the ALL_AVATARS array, or 0 if not found
 */
export const getAvatarIndex = (name: string, style: AvatarStyle): number => {
  const index = ALL_AVATARS.findIndex(
    (avatar) => avatar.name === name && avatar.style === style
  );
  return index >= 0 ? index : 0;
};

/**
 * Gets a random avatar
 * @returns A random avatar with SVG data
 */
export const getRandomAvatar = () => {
  const randomIndex = Math.floor(Math.random() * ALL_AVATARS.length);
  const randomAvatar = ALL_AVATARS[randomIndex];
  return {
    ...randomAvatar,
    svg: generateNamedAvatar(
      randomAvatar.name,
      randomAvatar.style,
      randomAvatar.color,
      randomAvatar.backgroundColor,
      randomAvatar.customOptions
    ),
  };
};

/**
 * Gets a random avatar index
 * @returns A random index from the ALL_AVATARS array
 */
export const getRandomAvatarIndex = (): number => {
  return Math.floor(Math.random() * ALL_AVATARS.length);
};

// Export types for better type checking
export type AvatarData = {
  name: string;
  style: AvatarStyle;
  color?: string;
  backgroundColor?: string;
  customOptions?: Record<string, any>;
  svg: string;
};

export type BasicAvatarData = {
  name: string;
  style: AvatarStyle;
  color?: string;
  backgroundColor?: string;
  customOptions?: Record<string, any>;
};

/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#17343A',
    tint: '#17656A',

    // Core surfaces
    background: '#F2F6F3',
    foreground: '#17343A',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#17343A',

    // Primary action color (buttons, links, active states)
    primary: '#17656A',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E5EFEB',
    secondaryForeground: '#17343A',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#E9EFEC',
    mutedForeground: '#75858A',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#F4E6C9',
    accentForeground: '#6F4C12',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    warning: '#C47C17',
    success: '#32856D',

    // Borders and input outlines
    border: '#E1E9E5',
    input: '#D8E3DE',
  },
  dark: {
    text: '#EEF6F3',
    tint: '#80C7BB',
    background: '#101F23',
    foreground: '#EEF6F3',
    card: '#192B30',
    cardForeground: '#EEF6F3',
    primary: '#80C7BB',
    primaryForeground: '#102125',
    secondary: '#22373B',
    secondaryForeground: '#E7F2EE',
    muted: '#22373B',
    mutedForeground: '#A1B4B4',
    accent: '#443923',
    accentForeground: '#F1D397',
    destructive: '#EE7770',
    destructiveForeground: '#241514',
    warning: '#E2B45F',
    success: '#69B89E',
    border: '#2D4144',
    input: '#2D4144',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;

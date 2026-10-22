import type { SocialLink } from "@/components/footer/social-links";

/**
 * Shirtat social channels. Add a new channel here and it shows up in the
 * footer icons and in the Organization JSON-LD `sameAs` list.
 * Supported platforms: see SocialPlatform in components/footer/social-links.tsx.
 */
export const socialLinks: readonly SocialLink[] = [
  { platform: "x", url: "https://x.com/shirtathq" },
  { platform: "instagram", url: "https://www.instagram.com/shirtathq/" },
  { platform: "facebook", url: "https://www.facebook.com/profile.php?id=61555940265854" },
];

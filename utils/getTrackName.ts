import { POLKADOT_TRACKS } from "@/lib/constants";

export const getTrackName = (track: string | number): string => {
  if (!track) return "Unknown Track";

  // Ensure we're working with a string
  const trackId = track.toString();

  // Type guard to check if the track exists in POLKADOT_TRACKS
  if (trackId in POLKADOT_TRACKS) {
    return POLKADOT_TRACKS[trackId as keyof typeof POLKADOT_TRACKS].name;
  }

  return `Unknown Track (${track})`;
};

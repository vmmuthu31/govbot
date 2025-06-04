import { POLKADOT_TRACKS } from "@/lib/constants";

export const getTrackName = (track: string | number): string => {
  if (!track) return "Unknown Track";

  const trackId = track.toString();

  if (trackId in POLKADOT_TRACKS) {
    return POLKADOT_TRACKS[trackId as keyof typeof POLKADOT_TRACKS].name;
  }

  return `Unknown Track (${track})`;
};

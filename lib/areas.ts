/**
 * PLACEHOLDER — areas and communities of CTM Parish.
 *
 * Replace the AREAS array below with the official parish list and nothing else
 * changes: the server validates every submission against this file, and the
 * COMMUNITY screen builds its options from it.
 *
 * Parish is always CTM Parish. It is stored implicitly and never asked.
 */

export type Area = { name: string; communities: string[] };

export const AREAS: Area[] = [
  { name: "[PLACEHOLDER] Area One", communities: ["[PLACEHOLDER] Community A1", "[PLACEHOLDER] Community A2", "[PLACEHOLDER] Community A3"] },
  { name: "[PLACEHOLDER] Area Two", communities: ["[PLACEHOLDER] Community B1", "[PLACEHOLDER] Community B2"] },
  { name: "[PLACEHOLDER] Area Three", communities: ["[PLACEHOLDER] Community C1", "[PLACEHOLDER] Community C2", "[PLACEHOLDER] Community C3"] },
  { name: "[PLACEHOLDER] Area Four", communities: ["[PLACEHOLDER] Community D1"] },
];

export const AREA_NAMES = AREAS.map((a) => a.name);

export function communitiesFor(area: string): string[] {
  return AREAS.find((a) => a.name === area)?.communities ?? [];
}

/** The server's check: the community must belong to the area given. */
export function isValidAreaCommunity(area: string, community: string): boolean {
  return communitiesFor(area).includes(community);
}

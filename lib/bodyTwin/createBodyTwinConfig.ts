import type { BodyTwinAppearance } from "@/types/bodyTwin";

export const defaultBodyTwinAppearance: BodyTwinAppearance = {
  baseType: "natural",
  skinTone: "#fff7ed",
  hairStyle: "medium",
  hairColor: "#d6a85f",
  eyeType: "smile",
  outfitColor: "#bfdbfe",
  coreColor: "mint",
  bodyStyle: "soft",
  name: "Buddy"
};

export function normalizeBodyTwinAppearance(appearance?: Partial<BodyTwinAppearance>): BodyTwinAppearance {
  return {
    ...defaultBodyTwinAppearance,
    ...appearance,
    name: appearance?.name?.trim() || defaultBodyTwinAppearance.name
  };
}

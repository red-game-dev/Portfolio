import { useCallback } from "react";

import { industryAnchor, industryFromHash } from "@/config/sections";
import useHashState from "@/hooks/useHashState";
import { Industry } from "@/types/industry";

// The industry filter lives in the URL hash (#industry-fintech), so the first screen's chips, My History
// and the boss fights share one state and a filtered view can be linked.
export default function useIndustryFromHash(industries: Industry[]) {
  const parse = useCallback((hash: string) => industryFromHash(hash, industries), [industries]);

  return useHashState(parse, industryAnchor);
}

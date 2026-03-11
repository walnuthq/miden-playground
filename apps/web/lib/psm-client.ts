import { PsmHttpClient } from "@openzeppelin/psm-client";
import { MIDEN_PSM_ENDPOINT_URL } from "@/lib/constants";

export const psmClient = new PsmHttpClient(MIDEN_PSM_ENDPOINT_URL);

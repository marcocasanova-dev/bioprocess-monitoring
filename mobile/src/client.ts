import createClient from "openapi-fetch";
import type { paths } from "./api-types";
import { API_BASE_URL } from "./config";

export const client = createClient<paths>({ baseUrl: API_BASE_URL });

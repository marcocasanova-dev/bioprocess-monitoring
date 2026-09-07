import { Platform } from "react-native";

/**
 * Backend base URL.
 *
 * Override via EXPO_PUBLIC_API_URL (e.g. in a .env file) when running on a
 * physical device through Expo Go — point it at your machine's LAN IP and
 * start the backend with `uvicorn api:app --reload --host 0.0.0.0` so it
 * accepts connections from outside localhost.
 *
 * Simulators/emulators get a working default without any setup:
 *  - iOS Simulator shares the host's loopback, so "localhost" works.
 *  - Android Emulator maps the host's loopback to 10.0.2.2.
 */
const DEFAULT_URL = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_URL;

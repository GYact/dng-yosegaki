import { readFileSync } from "fs";
import path from "path";
import type { Graduate, GraduateData } from "./types";

const dataDir = path.join(process.cwd(), "data");

export function getGraduateData(): GraduateData {
  const filePath = path.join(dataDir, "graduates.json");
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

export function getGraduates(): Graduate[] {
  return getGraduateData().graduates;
}

export function getGraduate(slug: string): Graduate | undefined {
  return getGraduates().find((g) => g.slug === slug);
}

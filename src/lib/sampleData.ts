import dataset from "@/data/culturalArtifacts.json";
import { CulturalArtifact, LocationNode } from "./types";

export const COMPTON_CENTER: [number, number] = [-118.2201, 33.8958];

const typedDataset = dataset as {
  locations: LocationNode[];
  artifacts: CulturalArtifact[];
};

export const SAMPLE_LOCATIONS: LocationNode[] = typedDataset.locations;
export const SAMPLE_ARTIFACTS: CulturalArtifact[] = typedDataset.artifacts;

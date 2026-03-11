import { Location } from "./types";

export const COMPTON_CENTER: [number, number] = [-118.2201, 33.8958];

export const SAMPLE_LOCATIONS: Location[] = [
  // Downtown / City Hall cluster
  { id: "s1", lat: 33.8958, lng: -118.2201, label: "City Hall", weight: 1 },
  { id: "s2", lat: 33.8962, lng: -118.2195, label: "Compton Courthouse", weight: 0.9 },
  { id: "s3", lat: 33.8955, lng: -118.2215, label: "Downtown", weight: 0.8 },
  { id: "s4", lat: 33.8970, lng: -118.2185, label: "Compton Blvd & Willowbrook", weight: 0.85 },
  { id: "s5", lat: 33.8948, lng: -118.2225, label: "Compton Civic Center", weight: 0.75 },

  // Compton College area
  { id: "s6", lat: 33.9040, lng: -118.2290, label: "Compton College", weight: 1 },
  { id: "s7", lat: 33.9052, lng: -118.2275, label: "College Campus", weight: 0.7 },
  { id: "s8", lat: 33.9035, lng: -118.2310, label: "Artesia Blvd", weight: 0.6 },

  // Centennial High School area
  { id: "s9", lat: 33.8980, lng: -118.2190, label: "Centennial High School", weight: 0.9 },
  { id: "s10", lat: 33.8990, lng: -118.2175, label: "Near Centennial", weight: 0.65 },

  // Compton Airport vicinity
  { id: "s11", lat: 33.8897, lng: -118.2358, label: "Compton Airport", weight: 0.8 },
  { id: "s12", lat: 33.8910, lng: -118.2340, label: "Near Airport", weight: 0.55 },
  { id: "s13", lat: 33.8885, lng: -118.2375, label: "Airport Blvd", weight: 0.5 },

  // Willowbrook area
  { id: "s14", lat: 33.9015, lng: -118.2195, label: "Willowbrook Ave", weight: 0.75 },
  { id: "s15", lat: 33.9000, lng: -118.2210, label: "Willowbrook", weight: 0.7 },

  // South Compton
  { id: "s16", lat: 33.8750, lng: -118.2180, label: "South Compton", weight: 0.65 },
  { id: "s17", lat: 33.8770, lng: -118.2150, label: "Dominguez", weight: 0.7 },
  { id: "s18", lat: 33.8785, lng: -118.2195, label: "Dominguez High School", weight: 0.85 },

  // East Compton
  { id: "s19", lat: 33.8940, lng: -118.1950, label: "East Compton", weight: 0.6 },
  { id: "s20", lat: 33.8920, lng: -118.1920, label: "Compton/Lynwood border", weight: 0.55 },
  { id: "s21", lat: 33.8960, lng: -118.1980, label: "Long Beach Blvd", weight: 0.7 },

  // Central spread
  { id: "s22", lat: 33.8920, lng: -118.2100, label: "Central Ave", weight: 0.75 },
  { id: "s23", lat: 33.8935, lng: -118.2050, label: "Compton Ave", weight: 0.8 },
  { id: "s24", lat: 33.8905, lng: -118.2130, label: "Alameda St", weight: 0.65 },
  { id: "s25", lat: 33.8975, lng: -118.2270, label: "Santa Fe Ave", weight: 0.7 },

  // Northwest cluster
  { id: "s26", lat: 33.9025, lng: -118.2380, label: "NW Compton", weight: 0.6 },
  { id: "s27", lat: 33.9010, lng: -118.2410, label: "Near Gardena border", weight: 0.55 },

  // Additional spread points
  { id: "s28", lat: 33.8860, lng: -118.2270, label: "Greenleaf Blvd", weight: 0.6 },
  { id: "s29", lat: 33.8840, lng: -118.2100, label: "Compton/Carson border", weight: 0.5 },
  { id: "s30", lat: 33.8830, lng: -118.2320, label: "SW Compton", weight: 0.55 },
  { id: "s31", lat: 33.9060, lng: -118.2150, label: "Rosecrans Ave", weight: 0.65 },
  { id: "s32", lat: 33.9070, lng: -118.2050, label: "NE Compton", weight: 0.5 },
  { id: "s33", lat: 33.8870, lng: -118.2050, label: "Palmer St area", weight: 0.6 },
];

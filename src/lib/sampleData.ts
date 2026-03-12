import { CulturalArtifact, LocationNode } from "./types";

export const COMPTON_CENTER: [number, number] = [-118.2201, 33.8958];

export const SAMPLE_LOCATIONS: LocationNode[] = [
  {
    id: "loc-city-hall",
    lat: 33.8958,
    lng: -118.2201,
    name: "Compton City Hall",
    neighborhood: "Civic Center",
  },
  {
    id: "loc-courthouse",
    lat: 33.8962,
    lng: -118.2195,
    name: "Compton Courthouse",
    neighborhood: "Downtown",
  },
  {
    id: "loc-centennial",
    lat: 33.898,
    lng: -118.219,
    name: "Centennial High School",
    neighborhood: "Central Compton",
  },
  {
    id: "loc-rosecrans",
    lat: 33.906,
    lng: -118.215,
    name: "Rosecrans Ave",
    neighborhood: "North Compton",
  },
  {
    id: "loc-downtown",
    lat: 33.8955,
    lng: -118.2215,
    name: "Downtown Compton",
    neighborhood: "Downtown",
  },
];

export const SAMPLE_ARTIFACTS: CulturalArtifact[] = [
  {
    id: "art-rosecrans-compton",
    type: "lyric-snippet",
    locationId: "loc-rosecrans",
    title: "Weekend on Rosecrans",
    creator: "Kendrick Lamar",
    sourceTitle: "Compton (feat. Dr. Dre)",
    year: 2012,
    caption: "Won't you spend a weekend on Rosecrans...",
    description:
      "A direct Rosecrans reference that makes the street itself part of the song's Compton geography.",
    tags: ["lyric", "rosecrans", "good kid m.A.A.d city"],
    heatWeight: 1,
    resource: {
      kind: "youtube",
      url: "https://www.youtube.com/watch?v=JIe8QrYUbiE",
      startSeconds: 160,
    },
  },
  {
    id: "art-centennial-state-of-mind",
    type: "lyric-snippet",
    locationId: "loc-centennial",
    title: "Centennial High reference",
    creator: "Kendrick Lamar",
    sourceTitle: "Compton State of Mind",
    year: 2009,
    caption: "Centennial High, had me swimming with a pool of sharks.",
    description:
      "A school-specific lyric reference that roots Kendrick's coming-of-age story in a precise Compton landmark.",
    tags: ["lyric", "centennial", "mixtape"],
    heatWeight: 0.96,
    resource: {
      kind: "external",
      url: "https://www.lyricsify.com/lyrics/kendrick-lamar/compton-state-of-mind",
      label: "Lyrics source",
    },
  },
  {
    id: "art-cityhall-not-like-us",
    type: "music-video",
    locationId: "loc-city-hall",
    title: "Not Like Us crowd sequence",
    creator: "Kendrick Lamar",
    sourceTitle: "Not Like Us",
    year: 2024,
    caption: "Victory-lap visuals filmed around Compton civic landmarks.",
    description:
      "The video shoot brought Kendrick, Mustard, and hundreds of locals around City Hall and nearby civic sites.",
    tags: ["video", "city hall", "mustard"],
    heatWeight: 1,
    resource: {
      kind: "youtube",
      url: "https://www.youtube.com/watch?v=H58vbez_m4E",
      startSeconds: 115,
    },
  },
  {
    id: "art-cityhall-key-photo",
    type: "image",
    locationId: "loc-city-hall",
    title: "Key to the City ceremony photos",
    creator: "Getty Images",
    sourceTitle: "Key to the City Ceremony with Kendrick Lamar",
    year: 2016,
    caption: "Photo archive from Kendrick Lamar receiving the key to Compton.",
    description:
      "An image-driven artifact tied to the Civic Center plaza, representing Compton honoring one of its defining artists.",
    tags: ["photo", "city hall", "ceremony"],
    heatWeight: 0.72,
    resource: {
      kind: "image",
      sourceUrl:
        "https://www.gettyimages.co.uk/photos/key-to-the-city-ceremony-with-kendrick-lamar",
      credit: "Getty Images",
    },
  },
  {
    id: "art-courthouse-soc",
    type: "film-snippet",
    locationId: "loc-courthouse",
    title: "Straight Outta Compton courthouse reference",
    creator: "Universal Pictures",
    sourceTitle: "Straight Outta Compton",
    year: 2015,
    caption: "Film-related reference connected to the courthouse block during production in Compton.",
    description:
      "Anchors the movie layer of the map to a real civic location associated with the film's Compton production footprint.",
    tags: ["film", "nwa", "courthouse"],
    heatWeight: 0.9,
    resource: {
      kind: "youtube",
      url: "https://www.youtube.com/watch?v=RS1rYL19APQ",
      startSeconds: 44,
    },
  },
  {
    id: "art-centennial-bompton",
    type: "film-snippet",
    locationId: "loc-centennial",
    title: "NOISEY Bompton: Centennial segment",
    creator: "VICE / NOISEY",
    sourceTitle: "Bompton: Growing Up With Kendrick Lamar",
    year: 2016,
    caption: "Documentary footage revisiting Centennial High as part of Kendrick's story.",
    description:
      "A documentary artifact that connects school memory, neighborhood context, and hip hop lineage.",
    tags: ["documentary", "vice", "centennial"],
    heatWeight: 0.85,
    resource: {
      kind: "youtube",
      url: "https://www.youtube.com/watch?v=CA1EmLFi4OA",
      startSeconds: 170,
    },
  },
  {
    id: "art-downtown-king-kunta",
    type: "music-video",
    locationId: "loc-downtown",
    title: "King Kunta downtown visual",
    creator: "Kendrick Lamar",
    sourceTitle: "King Kunta",
    year: 2015,
    caption: "Compton street-level performance imagery that turned downtown into a stage.",
    description:
      "Adds a second music-video reference to show how multiple visual artifacts can cluster in central Compton.",
    tags: ["video", "downtown", "to pimp a butterfly"],
    heatWeight: 0.94,
    resource: {
      kind: "youtube",
      url: "https://www.youtube.com/watch?v=hRK7PVJFbS8",
      startSeconds: 24,
    },
  },
];

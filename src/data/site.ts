import overviewHero from "../assets/images/overview-hero.png"
import habitatHero from "../assets/images/habitat-hero.png"
import behaviorHero from "../assets/images/behavior-hero.png"
import dietHero from "../assets/images/diet-hero.png"
import reproHero from "../assets/images/repro-hero.png"
import conservationHero from "../assets/images/conservation-hero.png"

export interface NavItem {
  label: string
  href: string
}

export const topics: { title: string; href: string; blurb: string; image: string }[] = [
  {
    title: "Species Overview",
    href: "/overview",
    blurb: "Taxonomy, anatomy, and the unmistakable features that make the manul one of the world's most distinctive small cats.",
    image: overviewHero.src,
  },
  {
    title: "Habitat & Range",
    href: "/habitat",
    blurb: "The cold steppes, rocky outcrops, and high plateaus of Central Asia where Pallas's cats make their home.",
    image: habitatHero.src,
  },
  {
    title: "Behavior",
    href: "/behavior",
    blurb: "Solitary, secretive, and superbly camouflaged — how the manul hunts, hides, and survives.",
    image: behaviorHero.src,
  },
  {
    title: "Diet & Hunting",
    href: "/diet",
    blurb: "Pikas, voles, and small birds: the ambush predator's menu and stalking strategy.",
    image: dietHero.src,
  },
  {
    title: "Reproduction & Lifespan",
    href: "/reproduction",
    blurb: "A brief breeding season, vulnerable kittens, and the challenges of growing up on the steppe.",
    image: reproHero.src,
  },
  {
    title: "Conservation",
    href: "/conservation",
    blurb: "Threats, protections, and the global effort to safeguard a famously hard-to-study cat.",
    image: conservationHero.src,
  },
]

export const mainNav: NavItem[] = [
  { label: "Overview", href: "/overview" },
  { label: "Habitat", href: "/habitat" },
  { label: "Behavior", href: "/behavior" },
  { label: "Diet", href: "/diet" },
  { label: "Reproduction", href: "/reproduction" },
  { label: "Conservation", href: "/conservation" },
  { label: "Field Guide", href: "/field-guide" },
  { label: "Gallery", href: "/gallery" },
]

export const quickFacts = [
  { label: "Scientific name", value: "Otocolobus manul" },
  { label: "Common names", value: "Pallas's cat, manul, steppe cat" },
  { label: "Weight", value: "2.5 – 4.5 kg" },
  { label: "Body length", value: "46 – 65 cm" },
  { label: "Tail length", value: "21 – 31 cm" },
  { label: "Lifespan (wild)", value: "~6 years" },
  { label: "Lifespan (captivity)", value: "up to 12 years" },
  { label: "IUCN status", value: "Least Concern (declining)" },
  { label: "Elevation range", value: "up to 5,000+ m" },
  { label: "Active period", value: "Crepuscular" },
]

"use client";

// Calendar-based ticket page for Our Hero, Balthazar
import Image from "next/image";
import { useState, useRef, useMemo, memo, useCallback, useTransition, useEffect } from "react";
import { OhbTracking, ohbTrack } from "@/components/OhbTracking";
import { motion } from "framer-motion";

// Brand Colors - Dark theme palette
const BRAND = {
  black: "#000000",
  white: "#ffffff",
  gray: "#666666",
  lightGray: "#1a1a1a",
  darkGray: "#111111",
};

// Digital release 8/11/2026. The Apple TV link intentionally omits the country
// code so Apple redirects each visitor to their own storefront (verified 301,
// affiliate query params preserved) — this covers UK/IE and CA without any
// geo-detection. The at/ct params are WG's affiliate attribution; keep them.
const WATCH_PROVIDERS = [
  {
    label: "Apple TV",
    logo: "/assets/providers/apple-tv.svg",
    href: "https://tv.apple.com/movie/our-hero-balthazar/umc.cmc.1g1532lsxaqk8su6isibi7n79?at=1000l3cjs&ct=wgpic&itsct=tv_box_link&itscg=30200&mttnsubad=umc.cmc.1g1532lsxaqk8su6isibi7n79",
  },
  {
    label: "Prime Video",
    logo: "/assets/providers/prime-video.svg",
    href: "https://www.primevideo.com/detail/0IMJBWIYHPI4ZKHN0TKVU8CNJE",
  },
  {
    label: "Fandango at Home",
    logo: "/assets/providers/fandango-at-home.svg",
    href: "https://athome.fandango.com/content/browse/details/Our-Hero-Balthazar/5037404",
  },
];

// Official Trailer on the WG Pictures YouTube channel — same video the OHB
// site uses. Keep the two in sync if the trailer is ever re-uploaded.
const TRAILER_ID = "NLzyq75U6G4";

// Real movie data from ourherobalthazar.com
const MOVIE = {
  title: "OUR HERO, BALTHAZAR",
  tagline: "TAKE A SHOT AT FRIENDSHIP",
  synopsis: "Ultra-wealthy NYC teenager Balthy makes dramatic gun control videos to impress his activist crush. When an online troll targets his content, Balthy becomes convinced he's communicating with a potential school shooter and embarks on an ill-advised journey to Texas to confront him.",
  director: "Oscar Boyson",
  writers: "Ricky Camilleri & Oscar Boyson",
  year: "2026",
  rating: "R",
  runtime: "98 mins",
  cast: [
    "Jaeden Martell",
    "Asa Butterfield",
    "Anna Baryshnikov",
    "Jennifer Ehle",
    "Becky Ann Baker",
    "Avan Jogia",
    "Pippa Knowles",
    "Noah Centineo",
    "Chris Bauer",
  ],
};

// Theater logo paths
const THEATER_LOGOS: Record<string, string> = {
  "Regal": "/assets/ohb/regal.svg",
  "AMC": "/assets/ohb/amc.svg",
  "Alamo": "/assets/ohb/alamo.svg",
  "Fandango": "/assets/ohb/fandango.png",
  "Angelika": "/angelikalogo.svg",
  "Reading": "/reading_logo_us.svg",
  "Roxy": "/assets/ohb/roxy.png",
};

// Showtime data structure
interface Showtime {
  theater: string;
  date: string;
  time: string;
  eventType: string;
  ticketLink: string;
}

// Parse CSV text into Showtime array
function parseCSV(csvText: string): Showtime[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    // Handle commas within quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return {
      theater: values[0] || '',
      date: values[1] || '',
      time: values[2] || '',
      eventType: values[3] || '',
      ticketLink: values[4] || '',
    };
  });
}

// City mapping for theaters — keep in sync with OHB public/index.html
const THEATER_CITIES: Record<string, string> = {
  "Regal Union Square": "New York",
  "Regal Union Square (NYC)": "New York",
  "AMC The Americana at Brand 18": "Los Angeles",
  "AMC Burbank Town Center 8": "Los Angeles",
  "Alamo Drafthouse DTLA": "Los Angeles",
  "Alamo Drafthouse Sloan's Lake": "Denver",
  "Alamo Drafthouse Sloan's Lake (Denver - CO)": "Denver",
  "Alamo Drafthouse Wrigleyville": "Chicago",
  "Alamo Drafthouse Wrigleyville (Chicago - IL)": "Chicago",
  "Los Feliz 3": "Los Angeles",
  "HQ LO2": "New Haven",
  "Angelika Village East": "New York",
  "Village East by Angelika": "New York",
  "Village East by Angelika (NYC)": "New York",
  "Angelika New York (SoHo)": "New York",
  "Angelika Mosaic (Fairfax - VA)": "Fairfax",
  "Angelika Mosaic (Fairfax VA)": "Fairfax",
  "Angelika Mosaic (Fairfax, VA)": "Fairfax",
  "Angelika Film Center Mosaic": "Fairfax",
  "Cinema 123 by Angelika (NYC)": "New York",
  "Angelika Pop-Up at Union Market (DC)": "Washington DC",
  "Angelika Film Center - Dallas": "Dallas",
  "Angelika Film Center (Dallas - TX)": "Dallas",
  "Cedar Lee Theatre": "Cleveland",
  "Playhouse Square Campus": "Cleveland",
  "Phoenix Film Foundation": "Phoenix",
  "Cinema 3 - Piers Handling Cinema": "Toronto",
  "Reading Cinemas Manville (NJ)": "New Jersey",
  "Consolidated Ward with TITAN LUXE": "Honolulu",
  "Moxie Cinema": "Springfield",
  "Angelika Carmel Mountain (San Diego)": "San Diego",
  "Angelika Carmel Mountain (San Diego - CA)": "San Diego",
  "Gardena Cinema (Los Angeles)": "Los Angeles",
  "Gardena Cinema (Los Angeles - CA)": "Los Angeles",
  "Roxie Theater (San Francisco)": "San Francisco",
  "Roxie Theater (San Francisco - CA)": "San Francisco",
  "Roxy Cinema (NYC)": "New York",
  "Laemmle Town Center (Encino)": "Los Angeles",
  "Laemmle Town Center (Encino - CA)": "Los Angeles",
  "Landmark Midtown Art Cinema (Atlanta)": "Atlanta",
  "Landmark Midtown Art Cinema (Atlanta - GA)": "Atlanta",
  "Landmark Del Mar (Santa Cruz)": "Santa Cruz",
  "Landmark Del Mar (Santa Cruz - CA)": "Santa Cruz",
  "Tower Theatre by Angelika (Sacramento)": "Sacramento",
  "Tower Theatre by Angelika (Sacramento - CA)": "Sacramento",
  "The Tower Theatre by Angelika": "Sacramento",
  "Apple Cinemas Westbrook (ME)": "Maine",
  "Landmark Opera Plaza Cinema (San Francisco)": "San Francisco",
  "Landmark Opera Plaza Cinema (San Francisco - CA)": "San Francisco",
  "Landmark Lagoon Cinema (Minneapolis)": "Minneapolis",
  "Landmark Lagoon Cinema (Minneapolis - MN)": "Minneapolis",
  "Landmark Piedmont Theatre (Oakland)": "Oakland",
  "Landmark Piedmont Theatre (Oakland - CA)": "Oakland",
  "Landmark Ritz Five (Philadelphia)": "Philadelphia",
  "Landmark Ritz Five (Philadelphia - PA)": "Philadelphia",
  "Laemmle NoHo 7 (North Hollywood)": "Los Angeles",
  "Laemmle NoHo 7 (North Hollywood - CA)": "Los Angeles",
  "Regal E-Walk": "New York",
  "Regal E-Walk (NYC)": "New York",
  "Regal Essex Crossing": "New York",
  "Regal Essex Crossing (NYC)": "New York",
  "Regal Winter Park Village": "Orlando",
  "Regal Winter Park Village (Orlando - FL)": "Orlando",
  "Regal Edwards Ontario Palace": "Ontario",
  "Regal Edwards Ontario Palace (Ontario - CA)": "Ontario",
  "Regal Long Beach": "Long Beach",
  "Regal Long Beach (Long Beach - CA)": "Long Beach",
  "Regal Meridian": "Seattle",
  "Regal Meridian (Seattle - WA)": "Seattle",
  "Regal Benders Landing": "Houston",
  "Regal Benders Landing (Houston - TX)": "Houston",
  "Regal New Roc": "New Rochelle",
  "Regal New Roc (New Rochelle - NY)": "New Rochelle",
  "Landmark Kendall Square Cinema (Boston)": "Boston",
  "Landmark Kendall Square Cinema (Boston - MA)": "Boston",
  "Landmark Mayan Theatre (Denver)": "Denver",
  "Landmark Mayan Theatre (Denver - CO)": "Denver",
  "Michigan Theater (Ann Arbor)": "Ann Arbor",
  "Michigan Theater (Ann Arbor - MI)": "Ann Arbor",
  "Regal Fox Tower (Portland)": "Portland",
  "Regal Fox Tower (Portland - OR)": "Portland",
  "Regal Irvine Spectrum": "Irvine",
  "Regal Irvine Spectrum (Irvine - CA)": "Irvine",
  "Regal Edwards Long Beach": "Long Beach",
  "Laemmle Noho 7": "Los Angeles",
  "Laemmle NoHo 7": "North Hollywood",
  "Laemmle Monica Film Center": "Santa Monica",
  "Laemmle Glendale": "Glendale",
  "Laemmle Glendale (Glendale)": "Glendale",
  "Laemmle Royal": "Santa Monica",
  "Laemmle Royal (Santa Monica)": "Santa Monica",
  "The Frida Cinema": "Santa Ana",
  "Screenland Armour": "North Kansas City",
  "Flix Brewhouse Round Rock": "Round Rock",
  "Flix Brewhouse Albuquerque": "Albuquerque",
  "Flix Brewhouse ABQ Coors": "Albuquerque",
  "Flix Brewhouse ABQ Tramway": "Albuquerque",
  "Flix Brewhouse Albuquerque Tramway": "Albuquerque",
  "Flix Brewhouse Carmel": "Carmel",
  "Flix Brewhouse Des Moines": "Des Moines",
  "Flix Brewhouse El Paso East": "El Paso",
  "Flix Brewhouse El Paso Montecillo": "El Paso",
  "Flix Brewhouse East El Paso": "El Paso",
  "Flix Brewhouse Montecillo": "El Paso",
  "Flix Brewhouse West El Paso": "El Paso",
  "Flix Brewhouse El Paso West Towne": "El Paso",
  "Flix Brewhouse Frisco": "Frisco",
  "Flix Brewhouse Frisco/Little Elm": "Frisco",
  "Flix Brewhouse Katy": "Katy",
  "Flix Brewhouse Lubbock": "Lubbock",
  "Flix Brewhouse Madison": "Madison",
  "Flix Brewhouse Mansfield": "Mansfield",
  "Flix Brewhouse Oklahoma City": "Oklahoma City",
  "Flix Brewhouse San Antonio": "San Antonio",
  "Savor Cinema (Fort Lauderdale)": "Fort Lauderdale",
  "Greenfield Garden Cinemas": "Greenfield",
  "The Eastwood (Playhouse Paradiso)": "Los Angeles",
  "The Eastwood (Eastwood Mainstage)": "Los Angeles",
  "The Eastwood": "Los Angeles",
  "Rio Theatre (Vancouver)": "Vancouver",
  "Fox Theatre (Toronto)": "Toronto",
  "Bytowne Cinema (Ottawa)": "Ottawa",
  "Playhouse Cinema (Hamilton)": "Hamilton",
  "Roxy Bremerton": "Bremerton",
  "Cinema Art Theater (Lewes)": "Lewes",
  "Ciné Athens": "Athens",
  "The Plaza Theatre": "Calgary",
  "Kan-Kan Cinema & Bar (Indianapolis)": "Indianapolis",
  "Tivoli Cinema (Charlottetown)": "Charlottetown",
  "The Independent Picture House (Charlotte)": "Charlotte",
  "FACETS Cinema (Chicago)": "Chicago",
  "Pop's Art Theatre": "Rochester",
  "Jean Cocteau Cinema": "Santa Fe",
  "The Nightlight": "Akron",
  "Tasveer Film Center": "Seattle",
  "Sleepy Hollow Cinema": "Sleepy Hollow",
  "Landmark 24 Whitby": "Whitby",
  "Landmark 24 Kanata": "Kanata",
  "Landmark 10 Kingston": "Kingston",
  "Landmark 10 Pen Centre": "St. Catharines",
  "Landmark 16 Country Hills": "Calgary",
  "Landmark 9 City Centre": "Edmonton",
  "Landmark 12 Surrey": "Surrey",
  "Landmark Grand 10 Kelowna": "Kelowna",
  "Landmark 9 Brandon": "Brandon",
  "Landmark 8 Regina": "Regina",
  "Landmark 7 Saskatoon": "Saskatoon",
  "Landmark Cinemas Windsor": "Windsor",
  "Landmark 6 Jackson Square": "Hamilton",
  "Landmark 8 London": "London, ON",
  "Landmark 8 Grant Park": "Winnipeg",
  "SilverCity Victoria Cinemas": "Victoria",
  "SilverCity London Cinemas": "London, ON",
  "SilverCity Thunder Bay Cinemas": "Thunder Bay",
  "Oriental Theatre (Milwaukee)": "Milwaukee",
  "The Cameo Cinema (Edinburgh)": "Edinburgh",
  "Picturehouse at FACT (Liverpool)": "Liverpool",
  "Greenwich Picturehouse (London)": "London",
  "Tyneside Cinema (Newcastle)": "Newcastle",
  "Picturehouse Central (London)": "London",
  "Finsbury Park Picturehouse (London)": "London",
  "Hackney Picturehouse (London)": "London",
  "Ritzy Cinema (London)": "London",
  "Cinema City (Norwich)": "Norwich",
  "Duke's at Komedia (Brighton)": "Brighton",
  "Watershed (Bristol)": "Bristol",
  "Arts Picturehouse (Cambridge)": "Cambridge",
  "Metro Cinema (Edmonton)": "Edmonton",
  "Williams Center Rivoli": "Rutherford",
  "Williams Center Cinema": "Rutherford",
  "Lumiere Cinema": "Los Angeles",
  "Fountain Theatre": "Mesilla",
  "Ojai Playhouse": "Ojai",
  "Strand Theatre": "Rockland",
  "Garland Theater": "Spokane",
  "Sandpoint Cinemas": "Ponderay",
  "Hayden Cinema": "Hayden",
  "Zeitgeist Theatre & Lounge (Arabi)": "Arabi",
  "Lyric Theatre": "Blacksburg",
  "O Cinema South Beach": "Miami Beach",
};

// City display labels (City - ST format for dropdown)
const CITY_LABELS: Record<string, string> = {
  "Ann Arbor": "Ann Arbor - MI",
  "Atlanta": "Atlanta - GA",
  "Boston": "Boston - MA",
  "Chicago": "Chicago - IL",
  "Cleveland": "Cleveland - OH",
  "Dallas": "Dallas - TX",
  "Denver": "Denver - CO",
  "Fairfax": "Fairfax - VA",
  "Glendale": "Glendale - CA",
  "Houston": "Houston - TX",
  "Honolulu": "Honolulu - HI",
  "Springfield": "Springfield - MO",
  "Long Beach": "Long Beach - CA",
  "Los Angeles": "Los Angeles - CA",
  "Maine": "Westbrook - ME",
  "Minneapolis": "Minneapolis - MN",
  "New Haven": "New Haven - CT",
  "New Jersey": "Manville - NJ",
  "New Rochelle": "New Rochelle - NY",
  "New York": "New York - NY",
  "Oakland": "Oakland - CA",
  "Ontario": "Ontario - CA",
  "Orlando": "Orlando - FL",
  "Philadelphia": "Philadelphia - PA",
  "Phoenix": "Phoenix - AZ",
  "Portland": "Portland - OR",
  "Sacramento": "Sacramento - CA",
  "San Diego": "San Diego - CA",
  "San Francisco": "San Francisco - CA",
  "Santa Ana": "Santa Ana - CA",
  "Santa Cruz": "Santa Cruz - CA",
  "Santa Fe": "Santa Fe - NM",
  "Seattle": "Seattle - WA",
  "Toronto": "Toronto - ON",
  "Washington DC": "Washington - DC",
  "Irvine": "Irvine - CA",
  "Spokane": "Spokane - WA",
  "Ponderay": "Ponderay - ID",
  "Hayden": "Hayden - ID",
  "Arabi": "Arabi - LA",
  "Blacksburg": "Blacksburg - VA",
  "Miami Beach": "Miami Beach - FL",
  "Mesilla": "Mesilla - NM",
  "Ojai": "Ojai - CA",
  "Rockland": "Rockland - ME",
  "Round Rock": "Round Rock - TX",
  "Albuquerque": "Albuquerque - NM",
  "Carmel": "Carmel - IN",
  "Des Moines": "Des Moines - IA",
  "El Paso": "El Paso - TX",
  "Frisco": "Frisco - TX",
  "Katy": "Katy - TX",
  "Lubbock": "Lubbock - TX",
  "Madison": "Madison - WI",
  "Mansfield": "Mansfield - TX",
  "Oklahoma City": "Oklahoma City - OK",
  "San Antonio": "San Antonio - TX",
  "Fort Lauderdale": "Fort Lauderdale - FL",
  "Greenfield": "Greenfield - MA",
  "Santa Monica": "Santa Monica - CA",
  "Vancouver": "Vancouver - BC",
  "Ottawa": "Ottawa - ON",
  "Hamilton": "Hamilton - ON",
  "Bremerton": "Bremerton - WA",
  "Charlotte": "Charlotte - NC",
  "North Kansas City": "North Kansas City - MO",
  "Lewes": "Lewes - DE",
  "Indianapolis": "Indianapolis - IN",
  "Charlottetown": "Charlottetown - PE",
  "Whitby": "Whitby - ON",
  "Kanata": "Kanata - ON",
  "Kingston": "Kingston - ON",
  "St. Catharines": "St. Catharines - ON",
  "Calgary": "Calgary - AB",
  "Edmonton": "Edmonton - AB",
  "Surrey": "Surrey - BC",
  "Kelowna": "Kelowna - BC",
  "Brandon": "Brandon - MB",
  "Regina": "Regina - SK",
  "Rutherford": "Rutherford - NJ",
  "Rochester": "Rochester - MN",
  "Akron": "Akron - OH",
  "North Hollywood": "North Hollywood - CA",
  "Saskatoon": "Saskatoon - SK",
  "Windsor": "Windsor - ON",
  "London, ON": "London - ON",
  "Winnipeg": "Winnipeg - MB",
  "Victoria": "Victoria - BC",
  "Thunder Bay": "Thunder Bay - ON",
  "Milwaukee": "Milwaukee - WI",
  "Edinburgh": "Edinburgh - UK",
  "Liverpool": "Liverpool - UK",
  "London": "London - UK",
  "Newcastle": "Newcastle - UK",
  "Norwich": "Norwich - UK",
  "Brighton": "Brighton - UK",
  "Bristol": "Bristol - UK",
  "Cambridge": "Cambridge - UK",
};

// Get city from theater name
const getTheaterCity = (theaterName: string): string => {
  return THEATER_CITIES[theaterName] || "Unknown";
};

// Sort showtimes by date, theater, then time
const sortShowtimes = (showtimes: Showtime[]): Showtime[] => {
  return [...showtimes].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.theater !== b.theater) return a.theater.localeCompare(b.theater);
    return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
  });
};

// Get theater brand from name
const getTheaterBrand = (theaterName: string): string | null => {
  if (theaterName.toLowerCase().includes("regal")) return "Regal";
  if (theaterName.toLowerCase().includes("amc")) return "AMC";
  if (theaterName.toLowerCase().includes("alamo")) return "Alamo";
  if (theaterName.toLowerCase().includes("los feliz")) return "Fandango";
  if (theaterName.toLowerCase().includes("angelika")) return "Angelika";
  if (theaterName.toLowerCase().includes("reading")) return "Reading";
  if (theaterName.toLowerCase().includes("roxy")) return "Roxy";
  return null;
};

// Check if event is special (Q&A, intro, etc.)
const isSpecialEvent = (eventType: string): boolean => {
  const lower = eventType.toLowerCase();
  return lower.includes("q&a") || lower.includes("intro") || lower.includes("baby day") || lower.includes("special screening") || lower.includes("special event");
};

// Check if event is sold out
const isSoldOut = (eventType: string): boolean => {
  return eventType.toLowerCase().includes("sold out");
};

// Parse time string to minutes for sorting (cached)
const parseTimeToMinutes = (time: string): number => {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const isPM = match[3].toUpperCase() === "PM";
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// Check if a date is in the past (relative to midnight Pacific Time)
const isPastDatePST = (dateStr: string): boolean => {
  // Get current date in Pacific Time
  const nowPST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const todayPST = new Date(nowPST.getFullYear(), nowPST.getMonth(), nowPST.getDate());

  // Parse the showtime date (YYYY-MM-DD format)
  const [year, month, day] = dateStr.split('-').map(Number);
  const showtimeDate = new Date(year, month - 1, day);

  return showtimeDate < todayPST;
};



// Memoized Date Button - prevents unnecessary re-renders
const DateButton = memo(function DateButton({
  date,
  isSelected,
  isDisabled,
  onSelect,
}: {
  date: { dateStr: string; day: string; weekday: string; month: string };
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (dateStr: string) => void;
}) {
  return (
    <button
      onClick={() => !isDisabled && onSelect(date.dateStr)}
      disabled={isDisabled}
      className={`flex-shrink-0 flex flex-col items-center justify-center px-6 md:px-10 py-6 border-r-2 transition-all ${isDisabled
          ? "bg-black/50 border-white/5 cursor-not-allowed"
          : isSelected
            ? "bg-white border-black"
            : "bg-black border-white/10"
        }`}
      style={{ minWidth: "120px" }}
    >
      <span className={`text-[10px] tracking-[0.2em] font-bold mb-1 uppercase ${isDisabled ? "text-white/30" : isSelected ? "text-black" : "text-white"
        }`}>
        {date.month}
      </span>
      <span className={`text-[10px] tracking-[0.15em] font-bold mb-1 uppercase ${isDisabled ? "text-white/20" : isSelected ? "text-black/40" : "text-white/40"
        }`}>
        {date.weekday}
      </span>
      <span
        className={`text-5xl md:text-7xl tracking-tighter ${isDisabled ? "text-white/30" : isSelected ? "text-black" : "text-white"
          }`}
        style={{
          fontFamily: "'Neue Haas Grotesk Display', 'Inter', sans-serif",
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {date.day}
      </span>
    </button>
  );
});

// Memoized Theater Row - prevents unnecessary re-renders
const TheaterRow = memo(function TheaterRow({
  theaterName,
  showtimes
}: {
  theaterName: string;
  showtimes: Showtime[];
}) {
  const brand = getTheaterBrand(theaterName);
  const logoPath = brand ? THEATER_LOGOS[brand] : null;

  return (
    <div className="py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 md:gap-8 items-start">
      {/* Theater Info */}
      <div className="flex flex-col">
        {logoPath && (
          <div className="h-5 mb-2 flex items-center">
            <img
              src={logoPath}
              alt={brand || ""}
              className={brand === "Fandango" || brand === "Angelika" ? "" : "invert"}
              style={{ width: "60px", height: "20px", objectFit: "contain", objectPosition: "left" }}
            />
          </div>
        )}
        <span className="text-sm font-bold uppercase text-white">{theaterName}</span>
        {showtimes.some(s => isSpecialEvent(s.eventType)) && (
          <div className="mt-2 text-[10px] font-bold px-2 py-1 bg-white text-black inline-block self-start uppercase tracking-wide">
            Special Event
          </div>
        )}
      </div>

      {/* Showtimes */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {showtimes.map((showtime, j) => {
          const special = isSpecialEvent(showtime.eventType);
          const soldOut = isSoldOut(showtime.eventType);

          return (
            <a
              key={j}
              href={soldOut ? undefined : showtime.ticketLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-3 border-2 transition-all font-bold tracking-tight uppercase flex flex-col items-center ${soldOut ? "cursor-not-allowed opacity-50" : "hover:scale-105"}`}
              style={{
                borderColor: BRAND.white,
                color: special ? BRAND.black : BRAND.white,
                backgroundColor: special ? BRAND.white : "transparent",
                pointerEvents: soldOut ? "none" : "auto",
              }}
              title={showtime.eventType}
            >
              <span className="text-base md:text-lg">{showtime.time}</span>
              {special && (
                <span className="text-[8px] mt-1 tracking-wider opacity-70">
                  {showtime.eventType.includes("Q&A") ? "Q&A" :
                    showtime.eventType.includes("Intro") ? "INTRO" :
                      showtime.eventType.includes("Baby") ? "BABY DAY" :
                        showtime.eventType.toLowerCase().includes("special screening") ? "SPECIAL SCREENING" : "SPECIAL"}
                </span>
              )}
              {soldOut && (
                <span className="text-[8px] mt-1 tracking-wider text-red-500 font-bold">
                  SOLD OUT
                </span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
});

// Memoized Hero Section - prevents re-render on date changes
const HeroSection = memo(function HeroSection() {
  return (
    <div className="relative py-12 px-6 md:px-12 lg:px-16" style={{ backgroundColor: BRAND.black }}>
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs tracking-[0.2em] font-bold mb-3 uppercase text-white">
            {MOVIE.tagline}
          </p>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl mb-6 uppercase leading-[0.9] text-white"
            style={{
              fontFamily: "'Neue Haas Grotesk Display', 'Inter', sans-serif",
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            our hero, balthazar
          </h2>
          <p className="text-white/80 mb-8 leading-relaxed text-sm max-w-2xl">
            {MOVIE.synopsis}
          </p>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-[10px] tracking-[0.2em] font-bold text-white/50 mb-1 uppercase">Directed by</p>
              <p className="text-sm font-bold text-white">{MOVIE.director}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] font-bold text-white/50 mb-1 uppercase">Written by</p>
              <p className="text-sm font-bold text-white">{MOVIE.writers}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] font-bold text-white/50 mb-1 uppercase">Film Details</p>
              <p className="text-sm font-bold text-white">
                {MOVIE.year} <span className="inline-block border-2 border-white px-1 text-[10px] ml-1 font-bold">{MOVIE.rating}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] font-bold text-white/50 mb-1 uppercase">Runtime</p>
              <p className="text-sm font-bold text-white">{MOVIE.runtime}</p>
            </div>
          </div>

          {/* Cast */}
          <div>
            <p className="text-[10px] tracking-[0.2em] font-bold text-white/50 mb-1 uppercase">Starring</p>
            <p className="text-sm font-bold text-white">{MOVIE.cast.join(", ")}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
});

export default function OurHeroBalthazarPage() {
  const [showtimesData, setShowtimesData] = useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSpecialOnly, setShowSpecialOnly] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [trailerPlaying, setTrailerPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  // Fetch CSV data on mount
  useEffect(() => {
    fetch('/data/showtimes.csv')
      .then(res => res.text())
      .then(csvText => {
        const parsed = parseCSV(csvText);
        setShowtimesData(parsed);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load showtimes:', err);
        setIsLoading(false);
      });
  }, []);

  // Sorted showtimes
  const sortedShowtimes = useMemo(() => sortShowtimes(showtimesData), [showtimesData]);

  // Get unique cities from showtimes (only for future dates)
  const availableCities = useMemo(() => {
    const citySet = new Set(
      showtimesData
        .filter(s => !isPastDatePST(s.date))
        .map(s => getTheaterCity(s.theater))
    );
    return Array.from(citySet).sort();
  }, [showtimesData]);

  // Get dates available for selected city
  const datesForSelectedCity = useMemo(() => {
    if (!selectedCity) return new Set<string>();
    const dates = new Set<string>();
    showtimesData.forEach(s => {
      if (getTheaterCity(s.theater) === selectedCity) {
        dates.add(s.date);
      }
    });
    return dates;
  }, [selectedCity, showtimesData]);

  // Get dates that have special events (Q&A, intro, etc.)
  const datesWithSpecialEvents = useMemo(() => {
    const dates = new Set<string>();
    showtimesData.forEach(s => {
      if (isSpecialEvent(s.eventType)) {
        dates.add(s.date);
      }
    });
    return dates;
  }, [showtimesData]);

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
      setLocationDropdownOpen(false);
    }
  }, []);

  // Set up click outside listener
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Get unique dates from showtimes (excluding past dates based on Pacific Time)
  const availableDates = useMemo(() => {
    const dateSet = new Set(showtimesData.map(s => s.date));
    return Array.from(dateSet)
      .filter(dateStr => !isPastDatePST(dateStr))
      .sort()
      .map(dateStr => {
        const date = new Date(dateStr + "T00:00:00");
        return {
          dateStr,
          day: date.getDate().toString().padStart(2, "0"),
          weekday: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
          month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
        };
      });
  }, [showtimesData]);

  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [isPending, startTransition] = useTransition();

  // Set initial date when data loads
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDateStr) {
      setSelectedDateStr(availableDates[0].dateStr);
    }
  }, [availableDates, selectedDateStr]);

  const handleDateClick = useCallback((dateStr: string) => {
    startTransition(() => {
      setSelectedDateStr(dateStr);
    });
  }, []);

  // Get showtimes for ALL dates to pre-render them
  const showtimesByDateAndTheater = useMemo(() => {
    const grouped: Record<string, Record<string, Showtime[]>> = {};

    availableDates.forEach(date => {
      let filtered = sortedShowtimes.filter(s => s.date === date.dateStr);
      if (showSpecialOnly) {
        filtered = filtered.filter(s => isSpecialEvent(s.eventType));
      }
      // Filter by selected city
      if (selectedCity) {
        filtered = filtered.filter(s => getTheaterCity(s.theater) === selectedCity);
      }

      const byTheater: Record<string, Showtime[]> = {};
      filtered.forEach(showtime => {
        if (!byTheater[showtime.theater]) {
          byTheater[showtime.theater] = [];
        }
        byTheater[showtime.theater].push(showtime);
      });
      grouped[date.dateStr] = byTheater;
    });

    return grouped;
  }, [availableDates, showSpecialOnly, selectedCity, sortedShowtimes]);

  const currentTheaters = Object.keys(showtimesByDateAndTheater[selectedDateStr] || {});

  if (isLoading) {
    return (
      <div
        className="min-h-screen text-white flex items-center justify-center"
        style={{
          fontFamily: "'Neue Haas Grotesk Text Pro', 'Inter', sans-serif",
          backgroundColor: BRAND.black,
        }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold uppercase tracking-wide animate-pulse">Loading Showtimes...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{
        fontFamily: "'Neue Haas Grotesk Text Pro', 'Inter', sans-serif",
        backgroundColor: BRAND.black,
      }}
    >
      {/* GA4 events for the influencer campaign (UTM capture + link clicks) */}
      <OhbTracking />

      {/* Back to wgpictures.com home */}
      <nav aria-label="Back to home" className="fixed top-6 left-6 z-50">
        <a
          href="/"
          className="w-10 h-10 flex items-center justify-center border-2 border-white hover:bg-white hover:text-black transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </a>
      </nav>

      {/* ============================================================
           WATCH AT HOME — primary CTA. Digital release 8/11/2026.
           ============================================================ */}
      <section
        id="watch-at-home"
        aria-label="Watch at home"
        className="relative pt-10 pb-12"
        style={{ backgroundColor: BRAND.black }}
      >
        <div className="text-center pb-6">
          <h2
            className="text-white text-2xl md:text-3xl uppercase tracking-[0.15em]"
            style={{
              fontFamily: "'Neue Haas Grotesk Display', 'Inter', sans-serif",
              fontWeight: 900,
            }}
          >
            Watch at Home
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 px-[4vw]">
          {WATCH_PROVIDERS.map((provider) => (
            <a
              key={provider.label}
              href={provider.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch on ${provider.label}`}
              data-track={`watch_${provider.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`}
              /* White tile: the official logos run in full brand colour, and
                 Apple TV's mark is near-black (#0d0d0d) while Prime Video's
                 wordmark is dark navy (#232F3E) — both vanish on black. */
              className="inline-flex items-center justify-center w-full sm:w-[17rem] max-w-[21rem] min-h-[5.25rem] sm:min-h-[6rem] px-6 py-5 border-2 border-white bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_0_0_2px_rgba(255,255,255,0.45)]"
            >
              {/* Official logos vary widely in aspect ratio (Apple ~2:1,
                  Prime ~3.25:1, Fandango ~10:1), so cap both axes and let
                  each fit its own box instead of forcing one height. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={provider.logo}
                alt={provider.label}
                className="block h-auto w-auto max-h-9 sm:max-h-10 max-w-full object-contain"
              />
            </a>
          ))}
        </div>
        <p className="pt-5 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-white/50">
          Availability varies by region.
        </p>
      </section>

      {/* Trailer — sits below the Watch at Home links, mirroring the OHB site.
          Facade pattern: the poster is swapped for the embed on click, so the
          YouTube player is only loaded if someone actually wants it. */}
      <section
        id="trailer"
        aria-label="Official trailer"
        className="relative pb-12"
        style={{ backgroundColor: BRAND.black }}
      >
        <div className="mx-[4vw] max-w-[1100px] xl:mx-auto">
          <div className="relative w-full aspect-video overflow-hidden bg-black">
            {trailerPlaying ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${TRAILER_ID}?autoplay=1&rel=0`}
                title="Our Hero, Balthazar — Official Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  ohbTrack("trailer_play", { video_id: TRAILER_ID });
                  setTrailerPlaying(true);
                }}
                aria-label="Play the official trailer"
                className="group absolute inset-0 h-full w-full cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/brand/teaser-preview.jpg"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-90"
                />
                <span className="absolute inset-0 bg-black/30" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
                    <path d="M30 24l24 14-24 14z" fill="#ffffff" />
                  </svg>
                </span>
                <span className="absolute bottom-5 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-white/80">
                  Official Trailer
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
           FILM INFO — poster, synopsis, cast and credits.
           ============================================================ */}
      <section id="film-info" aria-label="About the film">
        <HeroSection />
      </section>

      {/* ============================================================
           SPECIAL SCREENINGS — theatrical listings.
           Sits below the film info so the page opens on the TVOD links
           and the trailer; screenings are no longer the first thing a
           visitor sees.
           ============================================================ */}
      <section id="special-screenings" aria-label="Special screenings">
        {/* Date Picker */}
        <div
          className="relative pt-10 mx-[4vw] border-t border-white/15"
          style={{ backgroundColor: BRAND.black }}
        >
          {/* Theatrical showtimes — secondary to digital */}
          <div className="text-center pb-4">
            <h2
              className="text-white/60 text-2xl md:text-3xl uppercase tracking-[0.15em]"
              style={{
                fontFamily: "'Neue Haas Grotesk Display', 'Inter', sans-serif",
                fontWeight: 900,
              }}
            >
              Also Playing in Theaters
            </h2>
          </div>
          {availableDates.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg font-bold uppercase tracking-wide opacity-60">
                No upcoming showtimes available
              </p>
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="flex overflow-x-auto"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {availableDates.map((date) => {
                  const cityDisabled = selectedCity !== null && !datesForSelectedCity.has(date.dateStr);
                  const specialDisabled = showSpecialOnly && !datesWithSpecialEvents.has(date.dateStr);
                  const isDisabled = cityDisabled || specialDisabled;
                  return (
                    <DateButton
                      key={date.dateStr}
                      date={date}
                      isSelected={selectedDateStr === date.dateStr}
                      isDisabled={isDisabled}
                      onSelect={handleDateClick}
                    />
                  );
                })}
              </div>
              {/* Scroll arrows */}
              <button
                onClick={() => scrollRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-colors border-2"
                style={{
                  backgroundColor: BRAND.black,
                  borderColor: BRAND.white,
                  color: BRAND.white,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scrollRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-colors border-2"
                style={{
                  backgroundColor: BRAND.black,
                  borderColor: BRAND.white,
                  color: BRAND.white,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Location Bar */}
        <div className="px-6 md:px-12 lg:px-16 py-4 flex items-center justify-between relative" style={{ backgroundColor: BRAND.lightGray }} ref={locationRef}>
          <button
            onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
            className="flex items-center gap-2 text-white hover:opacity-70 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-wide">
              {selectedCity ? (CITY_LABELS[selectedCity] || selectedCity) : "All Locations"}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className={`transition-transform ${locationDropdownOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Dropdown */}
          {locationDropdownOpen && (
            <div className="absolute top-full left-0 right-0 bg-black border-2 border-t-0 border-white/20 z-50 shadow-lg">
              <button
                onClick={() => {
                  setSelectedCity(null);
                  setLocationDropdownOpen(false);
                }}
                className={`w-full px-6 py-3 text-left text-sm font-bold uppercase tracking-wide hover:bg-white hover:text-black transition-colors flex items-center justify-between ${selectedCity === null ? "bg-white text-black" : "text-white"
                  }`}
              >
                All Locations
                {selectedCity === null && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
              {availableCities.map(city => (
                <button
                  key={city}
                  onClick={() => {
                    setSelectedCity(city);
                    setLocationDropdownOpen(false);
                    // If current selected date is not available in the new city, select the first available date
                    const cityDates = new Set<string>();
                    showtimesData.forEach(s => {
                      if (getTheaterCity(s.theater) === city) {
                        cityDates.add(s.date);
                      }
                    });
                    if (!cityDates.has(selectedDateStr)) {
                      const firstAvailableDate = availableDates.find(d => cityDates.has(d.dateStr));
                      if (firstAvailableDate) {
                        setSelectedDateStr(firstAvailableDate.dateStr);
                      }
                    }
                  }}
                  className={`w-full px-6 py-3 text-left text-sm font-bold uppercase tracking-wide hover:bg-white hover:text-black transition-colors flex items-center justify-between ${selectedCity === city ? "bg-white text-black" : "text-white"
                    }`}
                >
                  {CITY_LABELS[city] || city}
                  {selectedCity === city && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Special Events Toggle */}
            <button
              onClick={() => {
                const newValue = !showSpecialOnly;
                setShowSpecialOnly(newValue);
                if (newValue && !datesWithSpecialEvents.has(selectedDateStr)) {
                  const firstAvailableDate = availableDates.find(d => datesWithSpecialEvents.has(d.dateStr));
                  if (firstAvailableDate) {
                    setSelectedDateStr(firstAvailableDate.dateStr);
                  }
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 border-2 text-[10px] font-bold uppercase tracking-wide transition-all ${showSpecialOnly
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-white border-white/40 hover:border-white"
                }`}
            >
              <span>Q&A / Special</span>
              {showSpecialOnly && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
            <div className="text-xs tracking-[0.15em] font-bold uppercase text-white/60">
              {currentTheaters.length} {currentTheaters.length === 1 ? "Theater" : "Theaters"}
            </div>
          </div>
        </div>

        {/* Theater Showtimes Grid */}
        <div className="px-6 md:px-12 lg:px-16 py-8" style={{ backgroundColor: BRAND.black }}>
          <div className="max-w-6xl mx-auto">
            {availableDates.map(date => {
              const byTheater = showtimesByDateAndTheater[date.dateStr] || {};
              const theaterNames = Object.keys(byTheater);
              const isSelected = selectedDateStr === date.dateStr;

              return (
                <div
                  key={date.dateStr}
                  style={{ display: isSelected ? "block" : "none" }}
                >
                  {theaterNames.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-lg font-bold uppercase tracking-wide opacity-60">
                        {showSpecialOnly ? "No special events on this date" : "No showtimes available for this date"}
                      </p>
                    </div>
                  ) : (
                    theaterNames.map((theaterName) => (
                      <TheaterRow
                        key={theaterName}
                        theaterName={theaterName}
                        showtimes={byTheater[theaterName]}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* Additional Details Footer */}
      {/* <div className="px-6 md:px-12 lg:px-16 py-12" style={{ backgroundColor: BRAND.lightGray }}>
          <div className="max-w-6xl mx-auto">
            <h3
              className="text-2xl mb-8 uppercase text-white"
              style={{
                fontFamily: "'Neue Haas Grotesk Display', 'Inter', sans-serif",
                fontWeight: 900,
              }}
            >
              Additional Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-[10px] tracking-[0.2em] font-bold text-white/50 mb-1 uppercase">Directed by</p>
                <p className="text-sm font-bold text-white">{MOVIE.director}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] font-bold text-white/50 mb-1 uppercase">Written by</p>
                <p className="text-sm font-bold text-white">{MOVIE.writers}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] font-bold text-white/50 mb-1 uppercase">Film Details</p>
                <p className="text-sm font-bold text-white">
                  {MOVIE.year} <span className="inline-block border-2 border-white px-1 text-[10px] ml-1 font-bold">{MOVIE.rating}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] font-bold text-white/50 mb-1 uppercase">Runtime</p>
                <p className="text-sm font-bold text-white">{MOVIE.runtime}</p>
              </div>
            </div>
            <div className="mt-8">
              <p className="text-[10px] tracking-[0.2em] font-bold text-white/50 mb-1 uppercase">Starring</p>
              <p className="text-sm font-bold text-white">{MOVIE.cast.join(", ")}</p>
            </div>
          </div>
        </div> */}

      {/* Footer */}
      <footer
        className="px-6 md:px-12 lg:px-16 py-6 mt-auto"
        style={{ backgroundColor: BRAND.black, color: BRAND.white }}
      >
        {/* Logo */}
        <div className="flex justify-start">
          <svg width="60" height="19" viewBox="0 0 1740 553" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M92.2718 8.98177C106.741 7.7515 121.931 8.08558 136.457 8.45367C158.308 9.00743 181.658 10.7296 201.86 19.8345C245.638 39.5655 295.025 125.963 324.401 166.403C331.086 175.606 337.802 185.37 345.664 193.589C351.437 199.623 360.326 207.425 369.256 207.395C389.875 207.326 453.5 110.073 466.671 91.9427C480.599 72.7692 499.084 46.5865 515.527 30.1957C524.223 21.5269 535.141 15.6003 546.983 12.4765C568.102 6.90592 591.79 8.4442 613.513 8.382L677.061 8.31144C702.631 8.35636 736.205 5.69111 760.196 14.6174C792.318 26.5698 859.609 133.372 881.351 163.675C889.023 174.372 896.448 185.991 905.794 195.304C911.045 200.531 918.368 206.515 926.219 206.414C933.364 206.322 940.093 201.883 945.275 197.356C971.758 174.236 1002.85 116.129 1022.79 84.9967C1033.37 68.4904 1044.38 51.6649 1058.08 37.5717C1068.23 27.1271 1078.61 19.1298 1092.88 15.0404C1108.43 10.5811 1127.88 12.7694 1144 12.528L1239.86 11.3551C1344.56 10.0732 1449.26 9.54089 1553.97 9.75835C1588.54 9.95619 1623.31 9.68046 1657.83 11.0377C1670.15 11.9127 1683.79 11.7079 1695.96 13.5179C1737.05 19.6362 1741.61 82.187 1709.89 102.956C1702.87 107.551 1693.95 109.194 1685.85 109.34C1664.57 109.723 1643.32 109.121 1622.08 108.925L1481.65 108.076C1450.52 107.976 1419.4 108.246 1388.28 108.884C1298.31 110.627 1214.04 116.791 1145.24 182.754C1085.04 240.481 1090.69 315.755 1147.73 373.087C1167.59 392.906 1191.22 408.563 1217.21 419.141C1283.9 446.531 1380.48 447.438 1452.47 448.201C1472.75 448.513 1495.44 447.029 1515.51 447.692C1580.54 449.842 1583.63 443.629 1583.5 381.305C1583.43 367.165 1585.93 339.188 1572.55 330.04C1561.3 322.353 1540.66 324.274 1526.81 323.984L1449.23 322.995C1438.8 322.9 1427.26 323.235 1417.02 322.104C1411.18 321.458 1404.29 318.843 1399.71 315.264C1392.04 308.686 1389.39 298.27 1388.67 288.834C1382.88 213.684 1404.43 223.327 1469.75 223.41L1565.16 223.479L1648.3 223.413C1687.61 223.381 1728.05 215.878 1730.4 269.135C1731.14 285.858 1730.6 302.62 1730.59 319.34L1730.62 414.153L1730.66 477.663C1730.72 489.559 1731.74 503.944 1730.24 515.487C1725.16 554.403 1683.63 546.892 1656.53 546.817L1582.66 546.827L1343.92 546.836L1115.47 546.84L1041.21 546.915C1028 546.924 1014.41 547.11 1001.24 546.655C993.346 546.382 985.598 542.147 979.396 537.343C950.993 515.341 924.715 486.069 900.484 459.769C848.993 403.897 800.463 345.658 749.621 289.257C727.909 266.341 707.768 241.22 684.393 219.967C667.155 204.292 655.497 202.509 638.436 218.705C617.377 238.698 600.066 261.327 582.306 284.027C539.374 338.898 500.726 396.935 459.53 453.098C441.33 477.914 423.766 503.219 404.185 526.97C396.401 536.412 385.857 546.323 373.037 547.189C363.556 547.843 353.069 543.763 346.292 537.249C338.478 529.737 330.399 518.302 323.892 509.469C313.501 495.343 303.195 481.154 292.975 466.904C231.554 379.763 171.618 291.585 113.193 202.409C92.0603 170.513 70.6788 138.782 49.0511 107.219C37.0483 89.7231 24.6727 72.0735 12.8501 54.4597C9.56431 48.9316 6.12755 42.2999 5.90835 35.7846C4.92947 6.68943 46.7984 10.1662 66.3243 9.87991C74.9766 9.67646 83.6265 9.37703 92.2718 8.98177Z" fill="white"/>
          </svg>
        </div>
        {/* <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] tracking-[0.15em] font-bold uppercase">
          <div className="flex gap-6">
            <a href="https://ourherobalthazar.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
              Official Site
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
              Instagram
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
              Twitter
            </a>
          </div>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>&copy; 2026 WG Pictures</span>
        </div> */}
      </footer>
    </div>
  );
}

/* =====================================================================
   HJELTE SPORTS CENTER — Community Sports Hub
   Content & configuration. Edit this file to update the page.
   No build step required: plain JavaScript loaded by index.html.

   Conventions
   - Days: 0 = Sunday … 6 = Saturday
   - Times: 24h "HH:MM"
   - Entries marked `example: true` are SAMPLE listings to be replaced
     with real groups as they submit their information.
   ===================================================================== */

window.HJELTE = {

  /* ------------------------------------------------------------------
     Site configuration
     ------------------------------------------------------------------ */
  config: {
    siteName: "Hjelte Sports Center",
    tagline: "Community Sports Hub",
    // Shown under the schedule as "Last Updated". Leave "" to fall back
    // to the file's last-modified date.
    lastUpdated: "2026-09-18",
    // Where form submissions and contact buttons go (mailto fallback).
    contactEmail: "teamla@losangelescricket.org",
    // Optional: set to a Formspree / Google Apps Script / Netlify endpoint
    // to POST forms instead of opening the visitor's email client.
    formEndpoint: "",
    // Show small filename tags on empty photo slots (handy while building).
    showPhotoSlotLabels: false,
    // Facility facts (source: City of Los Angeles Recreation and Parks)
    address: "16200 Burbank Blvd., Encino, CA 91436",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Hjelte+Sports+Center+16200+Burbank+Blvd+Encino+CA+91436",
    hours: "Daily, dawn – 10:30 PM",
    permitOfficePhone: "818-765-0284",
    cityPageUrl: "https://recreation.parks.lacity.gov/reccenter/hjelte-sports",
    region: "Sepulveda Basin Recreation Area · Council District 6",
    // Apps Script web app URL (see backend/SETUP.md). Empty = use the sample
    // data in this file only.
    apiUrl: "https://script.google.com/macros/s/AKfycbyw8qki9BtdOsAn42zegfiJSm0d9tbmCpKSu9Zdy8ycK_KhqRlo79_GaMUXf_IAlbf-/exec",
    // Public admin center link (admin.html in this repo)
    adminUrl: "admin.html",
    // Labels for permit status shown on group cards and the roster
    permitLabels: { permitted: "Permitted", none: "No permit on file", unknown: "Permit status unknown" },
    projectAreas: ["Fields & turf", "Water & irrigation", "Restrooms", "Signage & wayfinding", "Trash & recycling", "Facility updates"]
  },

  /* ------------------------------------------------------------------
     Photo slots. Put files in assets/img/ and reference them here.
     Empty string = illustrated placeholder is shown instead.
     ------------------------------------------------------------------ */
  images: {
    hero: "assets/img/hero-aerial.jpg",   // enhanced aerial (Los Angeles Cricket concept plan)
    about: "assets/img/about-aerial.jpg",
    featuredBefore: "",       // "assets/img/lac-pitch-before.jpg"
    featuredDuring: "",       // "assets/img/lac-pitch-during.jpg"
    featuredAfter: "",        // "assets/img/lac-pitch-after.jpg"
    sports: {                 // per-sport card photos (optional)
      baseball: "", softball: "", cricket: "", soccer: "", disc: "",
      fitness: "", youth: "", community: "", other: ""
    }
  },

  /* ------------------------------------------------------------------
     Sports played at Hjelte
     ------------------------------------------------------------------ */
  sports: [
    { id: "baseball", name: "Baseball", color: "#8C4A3A", icon: "baseball",
      blurb: "Youth baseball shares the four lighted diamonds with softball programs.",
      activities: ["Team practices", "League games", "Youth development", "Weekend tournaments"] },
    { id: "softball", name: "Softball", color: "#8A6F1F", icon: "softball",
      blurb: "One of the busiest activities at the complex — slow-pitch, fast-pitch and co-ed leagues.",
      activities: ["Adult leagues", "Co-ed evenings", "Youth fast-pitch", "Tournaments"] },
    { id: "cricket", name: "Cricket", color: "#2E7D4F", icon: "cricket",
      blurb: "Home to the Los Angeles Cricket Ground, a natural-turf pitch in Encino developed by the community ahead of LA28.",
      activities: ["Youth coaching", "Net & pitch practice", "Weekend matches", "Community intros"] },
    { id: "soccer", name: "Soccer", color: "#2F6F8F", icon: "soccer",
      blurb: "The shared outfield hosts small-sided games, youth training and informal pickup.",
      activities: ["Youth training", "Pickup games", "Skills clinics", "Small-sided leagues"] },
    { id: "disc", name: "Disc / Frisbee Sports", color: "#6B5B95", icon: "disc",
      blurb: "Ultimate and disc pickup on the shared outfield, evenings and weekends.",
      activities: ["Ultimate pickup", "League nights", "Youth clinics", "Throwing practice"] },
    { id: "fitness", name: "Fitness & Training", color: "#5A6B7A", icon: "fitness",
      blurb: "Bootcamps, running groups and conditioning sessions along the perimeter road and west lawn.",
      activities: ["Morning bootcamps", "Run clubs", "Conditioning", "Walking groups"] },
    { id: "youth", name: "Youth Recreation", color: "#A6591F", icon: "youth",
      blurb: "Programs and camps that introduce kids to sport in a safe, open setting.",
      activities: ["Camps", "After-school programs", "Multi-sport intros", "Family days"] },
    { id: "community", name: "Community Activities", color: "#3D4248", icon: "community",
      blurb: "Cleanup days, gatherings, cultural celebrations and neighborhood events.",
      activities: ["Cleanup days", "Community events", "Celebrations", "Volunteer projects"] },
    { id: "other", name: "Other Sports", color: "#63676C", icon: "other",
      blurb: "Kickball, flag football, lacrosse and whatever the community brings next.",
      activities: ["Kickball", "Flag football", "Lacrosse", "Rugby touch"] }
  ],

  /* ------------------------------------------------------------------
     Facilities (used by schedule filters and the map)
     ------------------------------------------------------------------ */
  facilities: [
    { id: "sbA", name: "Softball Diamond 1 (upper left)", sport: "softball" },
    { id: "sbB", name: "Softball Diamond 2 (upper right)", sport: "softball" },
    { id: "sbC", name: "Softball Diamond 3 (lower left)", sport: "softball" },
    { id: "sbD", name: "Softball Diamond 4 (lower right)", sport: "softball" },
    { id: "cricket", name: "Los Angeles Cricket Ground (center)", sport: "cricket" },
    { id: "outfield", name: "Shared Outfield", sport: "soccer" },
    { id: "soccerN", name: "Soccer / Football — North", sport: "soccer" },
    { id: "soccerS", name: "Soccer / Football — South", sport: "soccer" },
    { id: "soccerW", name: "Soccer / Football — West", sport: "soccer" },
    { id: "soccerE", name: "Soccer / Football — East", sport: "soccer" },
    { id: "westLawn", name: "West Lawn & Picnic Area", sport: "community" },
    { id: "path", name: "Perimeter Road & Path", sport: "fitness" }
  ],

  /* ------------------------------------------------------------------
     Activity types & user categories
     ------------------------------------------------------------------ */
  activityTypes: ["Practice", "Game", "League", "Youth Program", "Open Recreation",
                  "Community Activity", "Tournament", "Training", "Maintenance", "Special Event"],

  categories: {
    permitted:   { label: "Permitted Activity",
                   desc: "Activity associated with an organization or program using the facility during an authorized scheduled period." },
    community:   { label: "Community / Independent Activity",
                   desc: "Known recurring recreational or informal activity that may occur outside structured permitted programming." },
    open:        { label: "Open Recreation",
                   desc: "General community use when applicable." },
    maintenance: { label: "Maintenance / Facility Work",
                   desc: "Scheduled field maintenance or improvement activity." }
  },

  /* ------------------------------------------------------------------
     Directory — who uses Hjelte
     category: "permitted" | "community"
     ages: "Youth" | "Adult" | "Mixed"     level: "Competitive" | "Recreational"
     ------------------------------------------------------------------ */
  groups: [
    {
      id: "lac", name: "Los Angeles Cricket", short: "LAC", sport: "cricket",
      category: "permitted", permitStatus: "permitted", paidPermit: true, badges: ["PERMITTED ORGANIZATION", "NONPROFIT", "YOUTH PROGRAM"],
      programType: "Youth cricket development & community cricket", ages: "Mixed", level: "Recreational",
      days: [0, 6, 3], times: "Sat–Sun 9:00 AM – 1:00 PM · Wed 5:00 – 7:30 PM",
      website: "https://losangelescricket.org", social: "https://instagram.com/LosAngelesCricket",
      socialHandle: "@LosAngelesCricket", email: "teamla@losangelescricket.org",
      description: "Nonprofit uniting Los Angeles across cultures and neighborhoods through cricket. Developed the natural-turf cricket pitch at Hjelte and runs youth coaching and community sessions ahead of the LA28 Games."
    },
    {
      id: "ex-softball-league", name: "Valley Evening Softball League", short: "VS", sport: "softball", example: true,
      category: "permitted", permitStatus: "permitted", paidPermit: true, badges: ["PERMITTED ORGANIZATION", "LEAGUE"],
      programType: "Adult co-ed slow-pitch league", ages: "Adult", level: "Recreational",
      days: [1, 2, 4], times: "Mon · Tue · Thu 6:30 – 10:00 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Weeknight co-ed slow-pitch league using the softball diamonds under lights during the spring and fall seasons."
    },
    {
      id: "ex-youth-softball", name: "Encino Youth Fast-Pitch", short: "EY", sport: "softball", example: true,
      category: "permitted", permitStatus: "permitted", paidPermit: true, badges: ["PERMITTED ORGANIZATION", "YOUTH PROGRAM"],
      programType: "Girls fast-pitch, ages 8–14", ages: "Youth", level: "Competitive",
      days: [2, 4, 6], times: "Tue · Thu 4:30 – 6:30 PM · Sat 9:00 AM – 1:00 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Youth fast-pitch program with weekday practices and Saturday game days on Diamonds 1–2."
    },
    {
      id: "ex-baseball-club", name: "Sepulveda Basin Baseball Club", short: "SB", sport: "baseball", example: true,
      category: "permitted", permitStatus: "permitted", paidPermit: true, badges: ["PERMITTED ORGANIZATION", "CLUB", "YOUTH PROGRAM"],
      programType: "Youth travel baseball, 10U–14U", ages: "Youth", level: "Competitive",
      days: [1, 3, 0], times: "Mon · Wed 5:00 – 7:30 PM · Sun 10:00 AM – 3:00 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Youth baseball program using Diamond 2 for weekday practices and Sunday games."
    },
    {
      id: "ex-youth-soccer", name: "Basin Youth Soccer Academy", short: "BY", sport: "soccer", example: true,
      category: "permitted", permitStatus: "permitted", paidPermit: true, badges: ["PERMITTED ORGANIZATION", "YOUTH PROGRAM"],
      programType: "Recreational youth soccer, ages 5–12", ages: "Youth", level: "Recreational",
      days: [2, 4, 6], times: "Tue · Thu 4:00 – 6:00 PM · Sat 8:00 AM – 12:00 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Small-sided youth soccer on the shared outfield with Saturday morning game days."
    },
    {
      id: "ex-ultimate", name: "Valley Ultimate Pickup", short: "VU", sport: "disc", example: true,
      category: "community", permitStatus: "none", paidPermit: false, badges: ["COMMUNITY GROUP", "OPEN RECREATION"],
      programType: "Ultimate frisbee pickup — all welcome", ages: "Adult", level: "Recreational",
      days: [3, 0], times: "Wed 6:30 – 8:30 PM · Sun 10:00 AM – 12:30 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Recurring drop-in ultimate on the shared outfield. Bring a light and a dark shirt; newcomers welcome."
    },
    {
      id: "ex-bootcamp", name: "Sunrise Bootcamp Encino", short: "SB", sport: "fitness", example: true,
      category: "community", permitStatus: "none", paidPermit: false, badges: ["COMMUNITY GROUP"],
      programType: "Outdoor group fitness", ages: "Adult", level: "Recreational",
      days: [1, 3, 5], times: "Mon · Wed · Fri 6:00 – 7:00 AM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Early-morning conditioning sessions along the perimeter road and the west lawn."
    },
    {
      id: "ex-weekend-cricket", name: "Weekend Social Cricket", short: "WC", sport: "cricket", example: true,
      category: "community", permitStatus: "unknown", paidPermit: false, badges: ["COMMUNITY GROUP", "RECURRING COMMUNITY ACTIVITY"],
      programType: "Tape-ball social cricket", ages: "Mixed", level: "Recreational",
      days: [6], times: "Sat 3:00 – 6:00 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Informal weekend tape-ball games on the west lawn. Families and first-timers encouraged."
    },
    {
      id: "ex-pickup-soccer", name: "Sunday Pickup Soccer", short: "PS", sport: "soccer", example: true,
      category: "community", permitStatus: "none", paidPermit: false, badges: ["COMMUNITY GROUP", "OPEN RECREATION"],
      programType: "Adult pickup soccer", ages: "Adult", level: "Recreational",
      days: [0], times: "Sun 4:00 – 6:30 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Long-running Sunday afternoon pickup game on the shared outfield."
    },
    {
      id: "ex-walk-club", name: "Basin Walk & Talk Club", short: "WT", sport: "fitness", example: true,
      category: "community", permitStatus: "none", paidPermit: false, badges: ["COMMUNITY GROUP"],
      programType: "Neighborhood walking group", ages: "Mixed", level: "Recreational",
      days: [2, 4], times: "Tue · Thu 8:00 – 9:00 AM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Friendly loop walks on the perimeter path, open to all ages and paces."
    },
    {
      id: "ex-kickball", name: "Encino Kickball Social", short: "KB", sport: "other", example: true,
      category: "community", permitStatus: "none", paidPermit: false, badges: ["COMMUNITY GROUP", "RECURRING COMMUNITY ACTIVITY"],
      programType: "Adult social kickball", ages: "Adult", level: "Recreational",
      days: [5], times: "Fri 6:00 – 8:00 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Casual Friday-evening kickball on Diamond 4 when available."
    }
  ],

  /* ------------------------------------------------------------------
     Weekly recurring schedule
     day: 0–6 · type: see activityTypes · category: permitted | community | open | maintenance
     ------------------------------------------------------------------ */
  schedule: [
    // Sunday
    { day: 0, start: "10:00", end: "15:00", sport: "baseball", groupId: "ex-baseball-club",    facility: "sbB",     type: "Game",              category: "permitted" },
    { day: 0, start: "10:00", end: "12:30", sport: "disc",     groupId: "ex-ultimate",         facility: "outfield",   type: "Open Recreation",   category: "community" },
    { day: 0, start: "16:00", end: "18:30", sport: "soccer",   groupId: "ex-pickup-soccer",    facility: "outfield",   type: "Open Recreation",   category: "community" },
    { day: 0, start: "09:00", end: "11:00", sport: "softball", groupId: null,                  facility: "sbC",     type: "League",            category: "permitted",  title: "Adult softball — league play" },
    { day: 0, start: "11:00", end: "13:00", sport: "community",groupId: null,                  facility: "outfield", type: "Maintenance",       category: "maintenance", title: "Field maintenance" },
    { day: 0, start: "13:00", end: "18:00", sport: "cricket",  groupId: "lac",                 facility: "cricket", type: "Practice",          category: "permitted" },
    // Monday
    { day: 1, start: "06:00", end: "07:00", sport: "fitness",  groupId: "ex-bootcamp",         facility: "westLawn", type: "Training",         category: "community" },
    { day: 1, start: "08:00", end: "12:00", sport: "community",groupId: null,                  facility: "sbA",     type: "Maintenance",       category: "maintenance", title: "Infield grooming — Diamonds 1–2" },
    { day: 1, start: "17:00", end: "19:30", sport: "baseball", groupId: "ex-baseball-club",    facility: "sbB",     type: "Practice",          category: "permitted" },
    { day: 1, start: "18:30", end: "22:00", sport: "softball", groupId: "ex-softball-league",  facility: "sbC",     type: "League",            category: "permitted" },
    // Tuesday
    { day: 2, start: "08:00", end: "09:00", sport: "fitness",  groupId: "ex-walk-club",        facility: "path",    type: "Open Recreation",   category: "community" },
    { day: 2, start: "16:00", end: "18:00", sport: "soccer",   groupId: "ex-youth-soccer",     facility: "outfield",   type: "Youth Program",     category: "permitted" },
    { day: 2, start: "16:30", end: "18:30", sport: "softball", groupId: "ex-youth-softball",   facility: "sbA",     type: "Practice",          category: "permitted" },
    { day: 2, start: "18:30", end: "22:00", sport: "softball", groupId: "ex-softball-league",  facility: "sbC",     type: "League",            category: "permitted" },
    // Wednesday
    { day: 3, start: "06:00", end: "07:00", sport: "fitness",  groupId: "ex-bootcamp",         facility: "westLawn", type: "Training",         category: "community" },
    { day: 3, start: "17:00", end: "19:30", sport: "cricket",  groupId: "lac",                 facility: "cricket", type: "Practice",          category: "permitted" },
    { day: 3, start: "17:00", end: "19:30", sport: "baseball", groupId: "ex-baseball-club",    facility: "sbB",     type: "Practice",          category: "permitted" },
    { day: 3, start: "18:30", end: "20:30", sport: "disc",     groupId: "ex-ultimate",         facility: "outfield",   type: "Open Recreation",   category: "community" },
    // Thursday
    { day: 4, start: "08:00", end: "09:00", sport: "fitness",  groupId: "ex-walk-club",        facility: "path",    type: "Open Recreation",   category: "community" },
    { day: 4, start: "16:00", end: "18:00", sport: "soccer",   groupId: "ex-youth-soccer",     facility: "outfield",   type: "Youth Program",     category: "permitted" },
    { day: 4, start: "16:30", end: "18:30", sport: "softball", groupId: "ex-youth-softball",   facility: "sbB",     type: "Practice",          category: "permitted" },
    { day: 4, start: "18:30", end: "22:00", sport: "softball", groupId: "ex-softball-league",  facility: "sbD",     type: "League",            category: "permitted" },
    // Friday
    { day: 5, start: "06:00", end: "07:00", sport: "fitness",  groupId: "ex-bootcamp",         facility: "westLawn", type: "Training",         category: "community" },
    { day: 5, start: "09:00", end: "13:00", sport: "community",groupId: null,                  facility: "outfield",   type: "Maintenance",       category: "maintenance", title: "Outfield mowing & irrigation check" },
    { day: 5, start: "18:00", end: "20:00", sport: "other",    groupId: "ex-kickball",         facility: "sbD",     type: "Open Recreation",   category: "community" },
    // Saturday
    { day: 6, start: "08:00", end: "12:00", sport: "soccer",   groupId: "ex-youth-soccer",     facility: "outfield",   type: "Game",              category: "permitted" },
    { day: 6, start: "09:00", end: "13:00", sport: "softball", groupId: "ex-youth-softball",   facility: "sbA",     type: "Game",              category: "permitted" },
    { day: 6, start: "13:00", end: "17:00", sport: "community",groupId: null,                  facility: "westLawn",    type: "Open Recreation",   category: "open", title: "Open lawn — general community use" },
    { day: 6, start: "15:00", end: "18:00", sport: "cricket",  groupId: "ex-weekend-cricket",  facility: "westLawn",    type: "Open Recreation",   category: "community" },
    { day: 6, start: "09:00", end: "11:00", sport: "softball", groupId: null,                  facility: "sbC",     type: "League",            category: "permitted",  title: "Adult softball — league play" },
    { day: 6, start: "11:00", end: "13:00", sport: "community",groupId: null,                  facility: "outfield", type: "Maintenance",       category: "maintenance", title: "Field maintenance" },
    { day: 6, start: "13:00", end: "18:00", sport: "cricket",  groupId: "lac",                 facility: "cricket", type: "Practice",          category: "permitted" }
  ],

  /* ------------------------------------------------------------------
     Dated special events (shown in Today / This Week / Upcoming)
     ------------------------------------------------------------------ */
  specialEvents: [
    { date: "2026-09-25", start: "15:00", end: "17:00", title: "Los Angeles Cricket — practice", sport: "cricket", groupId: "lac", facility: "cricket", type: "Practice", category: "permitted",
      note: "Squad practice on the cricket ground. Please stay outside the boundary while play is on." },
    { date: "2026-09-26", start: "13:00", end: "18:00", title: "Los Angeles Cricket — match", sport: "cricket", groupId: "lac", facility: "cricket", type: "Game", category: "permitted",
      note: "Rope boundary in place. Spectators welcome along the west side of the ground." },
    { date: "2026-09-27", start: "13:00", end: "18:00", title: "Los Angeles Cricket — match", sport: "cricket", groupId: "lac", facility: "cricket", type: "Game", category: "permitted",
      note: "Rope boundary in place. Spectators welcome along the west side of the ground." },
    { date: "2026-09-19", start: "09:00", end: "13:00", title: "Cricket Community Open Day", sport: "cricket", groupId: "lac", facility: "cricket", type: "Special Event", category: "permitted",
      note: "Try cricket for the first time — bats, balls and coaches provided." },
    { date: "2026-09-26", start: "08:00", end: "11:00", title: "Fall Field Cleanup Day", sport: "community", groupId: null, facility: "westLawn", type: "Community Activity", category: "community",
      note: "Gloves and bags provided. Meet at the Burbank Blvd entrance." },
    { date: "2026-10-03", start: "08:00", end: "17:00", title: "Softball Fall Classic", sport: "softball", groupId: "ex-softball-league", facility: "sbA", type: "Tournament", category: "permitted", example: true,
      note: "Diamonds 1–4 reserved all day." },
    { date: "2026-10-10", start: "09:00", end: "14:00", title: "Youth Multi-Sport Family Day", sport: "youth", groupId: null, facility: "outfield", type: "Special Event", category: "community",
      note: "Rotating stations: soccer, cricket, softball and disc." },
    { date: "2026-10-17", start: "07:00", end: "12:00", title: "Irrigation Upgrade — Shared Outfield (south half)", sport: "community", groupId: null, facility: "outfield", type: "Maintenance", category: "maintenance",
      note: "South half of the outfield closed for the morning." }
  ],

  /* ------------------------------------------------------------------
     Facility map locations. x/y/w/h are percentages of the map canvas.
     shape: "diamond" | "rect" | "pitch" | "pin"
     ------------------------------------------------------------------ */
  mapLocations: [
    { id: "outfield", name: "Shared Outfield", short: "Shared Outfield", kind: "Open Turf", sport: "soccer", shape: "rect", x: 31.6, y: 10.1, w: 56.8, h: 81.1, lx: 38.7, ly: 33.1, facility: "outfield",
      fieldInfo: "One continuous grass outfield, 544 ft across the top home-plate span and 543 ft down the side. Everything else on this map sits inside it.", uses: "Soccer, ultimate, fitness, family days and warm-ups wherever a marked area is not in use.", accessibility: "Level grass throughout; firm dirt road around the outside." },

    { id: "cricket", name: "Los Angeles Cricket Ground", short: "Cricket Ground", kind: "Cricket Ground", sport: "cricket", shape: "circle", x: 59.8, y: 50.5, r: 21.9, lx: 59.8, ly: 37, facility: "cricket",
      fieldInfo: "420 ft playing circle (210 ft radius) centred between the four home plates, with a 20 × 80 ft prepared natural-turf pitch at its middle. The boundary is roped on match days.", uses: "Permitted cricket activity: youth coaching, practice and community matches.", accessibility: "Grass approach from the field entrance; stay outside the rope while play is on." },
    { id: "pitchZone", name: "Protected Pitch Zone", short: "Protected zone", kind: "Protected Area", sport: "cricket", shape: "rect", x: 57.18, y: 42.29, w: 5.22, h: 16.41, noLabel: true, facility: "cricket",
      fieldInfo: "The prepared 20 × 80 ft pitch plus a 15 ft buffer on every side — a 50 × 110 ft protected rectangle at the centre of the ground.", uses: "No activities are scheduled here at any time. It opens only for cricket practice and matches, so the prepared turf stays playable.", accessibility: "Please walk around this rectangle rather than across it." },

    { id: "sbA", name: "Softball Diamond 1", short: "Diamond 1", emoji: "⚾", kind: "Softball Diamond", sport: "softball", shape: "circle", x: 36.8, y: 17.6, r: 7.8, facility: "sbA",
      fieldInfo: "Upper-left diamond. Skinned infield, backstop cage, bleachers and lights behind home plate; the outfield faces the centre of the park.", uses: "Leagues, youth fast-pitch, tournaments.", accessibility: "Closest diamond to the parking lot and the field entrance." },
    { id: "sbB", name: "Softball Diamond 2", short: "Diamond 2", emoji: "⚾", kind: "Softball Diamond", sport: "softball", shape: "circle", x: 83.2, y: 17.6, r: 7.8, facility: "sbB",
      fieldInfo: "Upper-right diamond. Skinned infield, backstop cage, bleachers and lights. 544 ft home-plate span across to Diamond 1.", uses: "Leagues, youth baseball practices, tournaments.", accessibility: "Reached along the outside road; longest walk from parking." },
    { id: "sbC", name: "Softball Diamond 3", short: "Diamond 3", emoji: "⚾", kind: "Softball Diamond", sport: "softball", shape: "circle", x: 36.8, y: 83.7, r: 7.8, facility: "sbC",
      fieldInfo: "Lower-left diamond. Skinned infield, backstop cage, bleachers and lights. 543 ft span up to Diamond 1.", uses: "Weeknight adult leagues.", accessibility: "Short walk from the south end of the parking lot." },
    { id: "sbD", name: "Softball Diamond 4", short: "Diamond 4", emoji: "⚾", kind: "Softball Diamond", sport: "softball", shape: "circle", x: 83.2, y: 83.7, r: 7.8, facility: "sbD",
      fieldInfo: "Lower-right diamond. Skinned infield, backstop cage, bleachers and lights. 536 ft span across to Diamond 3.", uses: "Leagues, youth baseball, kickball, open play when available.", accessibility: "Reached along the outside road." },

    { id: "soccerN", name: "Soccer / Football — North", short: "", emoji: "⚽", kind: "Soccer / Football Area", sport: "soccer", shape: "rect", x: 50.4, y: 11.3, w: 18.8, h: 17.9, facility: "soccerN",
      fieldInfo: "180 × 120 ft small-sided area (60 × 40 yd) laid out across the open space between Diamonds 1 and 2.", uses: "Small-sided soccer and football, youth training, warm-ups. Portable goals only — no permanent posts.", accessibility: "Level grass; nearest to the north end of the field." },
    { id: "soccerS", name: "Soccer / Football — South", short: "", emoji: "⚽", kind: "Soccer / Football Area", sport: "soccer", shape: "rect", x: 50.4, y: 71.7, w: 18.8, h: 17.9, facility: "soccerS",
      fieldInfo: "180 × 120 ft small-sided area (60 × 40 yd) in the open space between Diamonds 3 and 4.", uses: "Small-sided soccer and football, youth training, pickup games. Portable goals only.", accessibility: "Level grass; close to the south end of the outside road." },
    { id: "soccerW", name: "Soccer / Football — West", short: "", emoji: "⚽", kind: "Soccer / Football Area", sport: "soccer", shape: "rect", x: 32.4, y: 37.1, w: 12.5, h: 26.8, facility: "soccerW",
      fieldInfo: "180 × 120 ft small-sided area running north–south alongside the cricket ground, on the parking-lot side.", uses: "Small-sided soccer and football, training grids, pickup games. Portable goals only.", accessibility: "Closest marked area to the parking lot and restrooms." },
    { id: "soccerE", name: "Soccer / Football — East", short: "", emoji: "⚽", kind: "Soccer / Football Area", sport: "soccer", shape: "rect", x: 74.6, y: 37.1, w: 12.5, h: 26.8, facility: "soccerE",
      fieldInfo: "180 × 120 ft small-sided area running north–south on the far side of the cricket ground.", uses: "Small-sided soccer and football, training grids, pickup games. Portable goals only.", accessibility: "Reached along the outside road on the east side." },

    { id: "parking", name: "Parking (west lot)", short: "Parking", kind: "Parking", sport: null, shape: "rect", x: 6, y: 12, w: 16, h: 76,
      fieldInfo: "Unpaved lot along the west side of the field.", uses: "Visitor parking, team drop-off.", accessibility: "Level; short walk to the field entrance." },
    { id: "restrooms", name: "Restrooms & Storage", short: "Restrooms", kind: "Restrooms", sport: null, shape: "pin", x: 27.1, y: 55.6,
      fieldInfo: "Building between the parking lot and the field.", uses: "Open during facility hours.", accessibility: "Level approach from parking." },
    { id: "entranceMain", name: "Field Entrance (from parking)", short: "Entrance", kind: "Entrance", sport: null, shape: "pin", x: 14, y: 7,
      fieldInfo: "Main pedestrian entry, at the north end of the parking lot.", uses: "Arrival, drop-off, wayfinding.", accessibility: "Firm surface from the parking lot to the grass edge." }
  ],

  /* ------------------------------------------------------------------
     Featured facility development
     ------------------------------------------------------------------ */
  featured: {
    title: "Los Angeles Cricket Ground",
    subtitle: "20 ft × 80 ft natural-turf cricket pitch developed within Hjelte Sports Center.",
    description: "A regulation-length natural-turf pitch established on the open field, giving Los Angeles youth a dedicated place to learn and play cricket ahead of the sport's return at the LA28 Olympic Games. The surrounding outfield remains shared multi-use turf.",
    funding: "Los Angeles Cricket (nonprofit) with community support",
    benefit: "Free and low-cost youth coaching, community intro sessions and a home ground for Valley cricket.",
    partners: ["Los Angeles Cricket", "City of Los Angeles Department of Recreation and Parks (facility)", "Community volunteers"],
    status: "COMPLETED",
    lead: "Los Angeles Cricket",
    geometry: [["Prepared pitch", "20 × 80 ft (6.67 × 26.67 yd)"], ["Boundary radius", "210 ft (70 yd)"], ["Boundary diameter", "420 ft (140 yd)"], ["Boundary circumference", "1,319.5 ft (439.8 yd)"], ["Home-plate spans", "1–2 544 ft · 3–4 536 ft · 1–3 543 ft · 2–4 539 ft"]],
    documents: [
      { label: "Ground plan & dimensions", file: "assets/img/lac-ground-specs.jpg", caption: "Enhanced aerial concept with measured spans. Google Maps estimates, not a survey." },
      { label: "Visitor guide", file: "assets/img/cricket-visitor-guide.jpg", caption: "Quick guide for park visitors when cricket is in progress." }
    ],
    hero: {
      file: "assets/img/lac-pitch-hero.webp",
      alt: "The completed Los Angeles Cricket Ground at Hjelte Sports Center — prepared natural-turf pitch with stumps set, the outfield and floodlights behind.",
      caption: "The completed pitch at Hjelte, set up for play."
    }
  },

  /* ------------------------------------------------------------------
     Projects & improvements
     status: PROPOSED | PLANNING | FUNDRAISING | IN PROGRESS | COMPLETED
     ------------------------------------------------------------------ */
  projects: [
    { id: "cricket-pitch", area: "Fields & turf", title: "Los Angeles Cricket Ground", status: "COMPLETED",
      description: "A 20 ft × 80 ft natural-turf cricket pitch prepared in the middle of the shared outfield, with a 420 ft playing circle marked on match days.",
      impact: "A dedicated home for community cricket in the Valley, on a field that stays open to every other sport around it.",
      lead: "Los Angeles Cricket", partners: ["Community volunteers"], goal: null, raised: null,
      volunteer: "Pitch care days — mowing, rolling and crease marking" },
    { id: "irrigation", area: "Water & irrigation", title: "Irrigation Repair — Shared Outfield", status: "IN PROGRESS",
      description: "Replacing failed sprinkler heads and adjusting coverage on the south half of the outfield, where dry patches have been spreading.",
      impact: "Healthier grass across the whole outfield, for soccer, cricket and everyone else who uses it.",
      lead: "Facility maintenance", partners: ["Los Angeles Cricket"], goal: null, raised: null,
      volunteer: "Report dry spots, join a post-work walk-through" },
    { id: "restroom-refresh", area: "Restrooms", title: "Restroom Building Refresh", status: "PLANNING",
      description: "Fixtures, lighting, doors and paint for the restroom building, plus a supply cabinet so volunteers can top up between City service visits.",
      impact: "Cleaner, safer restrooms every day the fields are in use.",
      lead: "Community coalition", partners: ["City of Los Angeles Recreation and Parks (approval)"], goal: null, raised: null,
      volunteer: "Condition survey, paint day, supply drives" },
    { id: "signage", area: "Signage & wayfinding", title: "Field Numbers & Wayfinding Signs", status: "PLANNING",
      description: "Numbers on each diamond, a map board at the entrance and QR codes that open this page, so visiting teams can find their field without asking.",
      impact: "An easier arrival for new visitors, visiting teams and anyone here for the first time.",
      lead: "Community coalition", partners: ["City of Los Angeles Recreation and Parks (review)"], goal: null, raised: null,
      volunteer: "Design, Spanish translation, installation day" },
    { id: "waste", area: "Trash & recycling", title: "Trash & Recycling Stations", status: "PROPOSED",
      description: "Paired trash and recycling bins at each field and at the parking lot entrance, emptied on a posted schedule.",
      impact: "Less litter blowing across the outfield and an easier job for the volunteers who pick it up.",
      lead: "Open to a lead organization", partners: [], goal: null, raised: null,
      volunteer: "Litter pickups, bin placement walk-through" },
    { id: "facility-updates", area: "Facility updates", title: "Small Repairs Wish List", status: "PROPOSED",
      description: "A rolling list of small fixes gathered from the people who use the park: backstop netting, dugout repairs, a bulletin board at the entrance, bike racks.",
      impact: "Dozens of small fixes that together make the complex feel looked after.",
      lead: "Open to a lead organization", partners: [], goal: null, raised: null,
      volunteer: "Walk-through audits, quick-fix days" }
  ],

  /* ------------------------------------------------------------------
     Stewardship work log — effort put into maintaining and improving
     the park. hours = people-hours; value is no longer displayed; costs are tracked off-site.
     ------------------------------------------------------------------ */
  worklog: [
    { id: "w1", date: "2026-09-12", organization: "Los Angeles Cricket", groupId: "lac", activity: "Cricket pitch mowing, rolling and crease re-marking", area: "Fields & turf", hours: 14, volunteers: 5, materials: "Line paint, fuel", verified: true },
    { id: "w2", date: "2026-09-06", organization: "Valley Evening Softball League", groupId: "ex-softball-league", activity: "Infield dragging and base-peg repair, Diamonds 3–4", area: "Fields & turf", hours: 9, volunteers: 4, materials: "Base pegs", verified: true, example: true },
    { id: "w3", date: "2026-08-30", organization: "Basin Walk & Talk Club", groupId: "ex-walk-club", activity: "Perimeter road litter pickup", area: "Facility updates", hours: 6, volunteers: 6, materials: "Bags, gloves", verified: true, example: true },
    { id: "w4", date: "2026-08-23", organization: "Los Angeles Cricket", groupId: "lac", activity: "Outfield irrigation dry-spot survey shared with facility staff", area: "Water & irrigation", hours: 4, volunteers: 2, materials: "", verified: true },
    { id: "w5", date: "2026-08-16", organization: "Basin Youth Soccer Academy", groupId: "ex-youth-soccer", activity: "Portable goal repair and net replacement", area: "Equipment", hours: 5, volunteers: 3, materials: "Two nets", verified: false, example: true },
    { id: "w6", date: "2026-08-09", organization: "Community volunteers", groupId: null, activity: "Bleacher cleaning and graffiti removal at the diamond cluster", area: "Seating & shade", hours: 12, volunteers: 8, materials: "Cleaner, rollers", verified: true }
  ],

  /* ------------------------------------------------------------------
     Latest updates (admins post these from the admin center)
     sport: sport id or "all"
     ------------------------------------------------------------------ */
  updates: [
    { id: "u1", createdAt: "2026-09-17T18:00:00", author: "Los Angeles Cricket", sport: "cricket", groupId: "lac", title: "Cricket Community Open Day this Saturday", body: "Free intro session 9 AM – 1 PM on the cricket ground. Bats and balls provided; wear trainers and bring water." },
    { id: "u2", createdAt: "2026-09-15T09:30:00", author: "Hub maintainers", sport: "all", groupId: null, title: "Outfield irrigation repair in progress", body: "Expect hoses and marked dry spots on the south half of the outfield through the end of the month. Soccer and ultimate groups are using the north half where needed." },
    { id: "u3", createdAt: "2026-09-10T16:15:00", author: "Hub maintainers", sport: "softball", groupId: null, title: "Diamond 1 lights back on", body: "The two failed fixtures on Diamond 1 were replaced. Evening league play resumes on the normal schedule." }
  ],

  /* ------------------------------------------------------------------
     Ways to contribute
     ------------------------------------------------------------------ */
  contribute: [
    { id: "volunteer", title: "Volunteer", icon: "hands",
      text: "Support cleanup days, sports programs, events, field preparation and community projects.",
      cta: "Volunteer", subject: "Volunteering at Hjelte" },
    { id: "sponsor", title: "Sponsor", icon: "star",
      text: "Businesses and organizations can support programs, facilities and events.",
      cta: "Become a Sponsor", subject: "Sponsorship at Hjelte" },
    { id: "equipment", title: "Donate Equipment", icon: "box",
      text: "Contribute sports equipment, field equipment, tents, water stations, seating or other useful materials.",
      cta: "Contribute Equipment", subject: "Equipment donation for Hjelte" },
    { id: "fund", title: "Fund a Project", icon: "target",
      text: "Support a specific improvement.",
      cta: "View Projects", href: "#projects" },
    { id: "collaborate", title: "Collaborate", icon: "link",
      text: "Schools, nonprofits, leagues, businesses and community organizations can propose partnerships.",
      cta: "Start a Conversation", subject: "Partnership proposal — Hjelte" }
  ]
};

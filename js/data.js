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
    showPhotoSlotLabels: true,
    // Facility facts (source: City of Los Angeles Recreation and Parks)
    address: "16200 Burbank Blvd., Encino, CA 91436",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Hjelte+Sports+Center+16200+Burbank+Blvd+Encino+CA+91436",
    hours: "Daily, dawn – 10:30 PM",
    permitOfficePhone: "818-765-0284",
    cityPageUrl: "https://recreation.parks.lacity.gov/reccenter/hjelte-sports",
    region: "Sepulveda Basin Recreation Area · Council District 6"
  },

  /* ------------------------------------------------------------------
     Photo slots. Put files in assets/img/ and reference them here.
     Empty string = illustrated placeholder is shown instead.
     ------------------------------------------------------------------ */
  images: {
    hero: "",                 // e.g. "assets/img/hero-aerial.jpg" (wide, ≥ 2000px)
    about: "",                // "assets/img/about-aerial.jpg"
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
      blurb: "Diamond play for youth and adult teams on lighted fields.",
      activities: ["Team practices", "League games", "Youth development", "Weekend tournaments"] },
    { id: "softball", name: "Softball", color: "#A98A2E", icon: "softball",
      blurb: "One of the busiest activities at the complex — slow-pitch, fast-pitch and co-ed leagues.",
      activities: ["Adult leagues", "Co-ed evenings", "Youth fast-pitch", "Tournaments"] },
    { id: "cricket", name: "Cricket", color: "#2E7D4F", icon: "cricket",
      blurb: "Home to a natural-turf cricket pitch developed by the community ahead of LA28.",
      activities: ["Youth coaching", "Net & pitch practice", "Weekend matches", "Community intros"] },
    { id: "soccer", name: "Soccer", color: "#2F6F8F", icon: "soccer",
      blurb: "Open turf hosts small-sided games, youth training and informal pickup.",
      activities: ["Youth training", "Pickup games", "Skills clinics", "Small-sided leagues"] },
    { id: "disc", name: "Disc / Frisbee Sports", color: "#6B5B95", icon: "disc",
      blurb: "Ultimate and disc pickup on the open multi-use turf, evenings and weekends.",
      activities: ["Ultimate pickup", "League nights", "Youth clinics", "Throwing practice"] },
    { id: "fitness", name: "Fitness & Training", color: "#5A6B7A", icon: "fitness",
      blurb: "Bootcamps, running groups and conditioning sessions along the paths and lawns.",
      activities: ["Morning bootcamps", "Run clubs", "Conditioning", "Walking groups"] },
    { id: "youth", name: "Youth Recreation", color: "#C27B3A", icon: "youth",
      blurb: "Programs and camps that introduce kids to sport in a safe, open setting.",
      activities: ["Camps", "After-school programs", "Multi-sport intros", "Family days"] },
    { id: "community", name: "Community Activities", color: "#3D4248", icon: "community",
      blurb: "Cleanup days, gatherings, cultural celebrations and neighborhood events.",
      activities: ["Cleanup days", "Community events", "Celebrations", "Volunteer projects"] },
    { id: "other", name: "Other Sports", color: "#7A7E83", icon: "other",
      blurb: "Kickball, flag football, lacrosse and whatever the community brings next.",
      activities: ["Kickball", "Flag football", "Lacrosse", "Rugby touch"] }
  ],

  /* ------------------------------------------------------------------
     Facilities (used by schedule filters and the map)
     ------------------------------------------------------------------ */
  facilities: [
    { id: "sb1", name: "Softball Diamond 1", sport: "softball" },
    { id: "sb2", name: "Softball Diamond 2", sport: "softball" },
    { id: "sb3", name: "Softball Diamond 3", sport: "softball" },
    { id: "sb4", name: "Softball Diamond 4", sport: "softball" },
    { id: "bbA", name: "Baseball Field A", sport: "baseball" },
    { id: "bbB", name: "Baseball Field B", sport: "baseball" },
    { id: "turfN", name: "Multi-Use Turf North", sport: "soccer" },
    { id: "turfS", name: "Multi-Use Turf South", sport: "disc" },
    { id: "cricket", name: "Los Angeles Cricket Ground", sport: "cricket" },
    { id: "training", name: "Training Area", sport: "fitness" },
    { id: "lawn", name: "Open Recreation Lawn", sport: "community" },
    { id: "path", name: "Perimeter Path", sport: "fitness" }
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
      category: "permitted", badges: ["PERMITTED ORGANIZATION", "NONPROFIT", "YOUTH PROGRAM"],
      programType: "Youth cricket development & community cricket", ages: "Mixed", level: "Recreational",
      days: [0, 6, 3], times: "Sat–Sun 9:00 AM – 1:00 PM · Wed 5:00 – 7:30 PM",
      website: "https://losangelescricket.org", social: "https://instagram.com/LosAngelesCricket",
      socialHandle: "@LosAngelesCricket", email: "teamla@losangelescricket.org",
      description: "Nonprofit uniting Los Angeles across cultures and neighborhoods through cricket. Developed the natural-turf cricket pitch at Hjelte and runs youth coaching and community sessions ahead of the LA28 Games."
    },
    {
      id: "ex-softball-league", name: "Valley Evening Softball League", short: "VS", sport: "softball", example: true,
      category: "permitted", badges: ["PERMITTED ORGANIZATION", "LEAGUE"],
      programType: "Adult co-ed slow-pitch league", ages: "Adult", level: "Recreational",
      days: [1, 2, 4], times: "Mon · Tue · Thu 6:30 – 10:00 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Sample listing. Weeknight co-ed slow-pitch league using the softball diamonds under lights during the spring and fall seasons."
    },
    {
      id: "ex-youth-softball", name: "Encino Youth Fast-Pitch", short: "EY", sport: "softball", example: true,
      category: "permitted", badges: ["PERMITTED ORGANIZATION", "YOUTH PROGRAM"],
      programType: "Girls fast-pitch, ages 8–14", ages: "Youth", level: "Competitive",
      days: [2, 4, 6], times: "Tue · Thu 4:30 – 6:30 PM · Sat 9:00 AM – 1:00 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Sample listing. Youth fast-pitch program with weekday practices and Saturday game days on Diamonds 1–2."
    },
    {
      id: "ex-baseball-club", name: "Sepulveda Basin Baseball Club", short: "SB", sport: "baseball", example: true,
      category: "permitted", badges: ["PERMITTED ORGANIZATION", "CLUB", "YOUTH PROGRAM"],
      programType: "Youth travel baseball, 10U–14U", ages: "Youth", level: "Competitive",
      days: [1, 3, 0], times: "Mon · Wed 5:00 – 7:30 PM · Sun 10:00 AM – 3:00 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Sample listing. Club baseball program using the lighted baseball diamond for weekday practices and Sunday games."
    },
    {
      id: "ex-youth-soccer", name: "Basin Youth Soccer Academy", short: "BY", sport: "soccer", example: true,
      category: "permitted", badges: ["PERMITTED ORGANIZATION", "YOUTH PROGRAM"],
      programType: "Recreational youth soccer, ages 5–12", ages: "Youth", level: "Recreational",
      days: [2, 4, 6], times: "Tue · Thu 4:00 – 6:00 PM · Sat 8:00 AM – 12:00 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Sample listing. Small-sided youth soccer on the north multi-use turf with Saturday morning game days."
    },
    {
      id: "ex-ultimate", name: "Valley Ultimate Pickup", short: "VU", sport: "disc", example: true,
      category: "community", badges: ["COMMUNITY GROUP", "OPEN RECREATION"],
      programType: "Ultimate frisbee pickup — all welcome", ages: "Adult", level: "Recreational",
      days: [3, 0], times: "Wed 6:30 – 8:30 PM · Sun 10:00 AM – 12:30 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Sample listing. Recurring drop-in ultimate on the south turf. Bring a light and a dark shirt; newcomers welcome."
    },
    {
      id: "ex-bootcamp", name: "Sunrise Bootcamp Encino", short: "SB", sport: "fitness", example: true,
      category: "community", badges: ["COMMUNITY GROUP"],
      programType: "Outdoor group fitness", ages: "Adult", level: "Recreational",
      days: [1, 3, 5], times: "Mon · Wed · Fri 6:00 – 7:00 AM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Sample listing. Early-morning conditioning sessions along the perimeter path and training area."
    },
    {
      id: "ex-weekend-cricket", name: "Weekend Social Cricket", short: "WC", sport: "cricket", example: true,
      category: "community", badges: ["COMMUNITY GROUP", "RECURRING COMMUNITY ACTIVITY"],
      programType: "Tape-ball social cricket", ages: "Mixed", level: "Recreational",
      days: [6], times: "Sat 3:00 – 6:00 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Sample listing. Informal weekend tape-ball games on the open lawn. Families and first-timers encouraged."
    },
    {
      id: "ex-pickup-soccer", name: "Sunday Pickup Soccer", short: "PS", sport: "soccer", example: true,
      category: "community", badges: ["COMMUNITY GROUP", "OPEN RECREATION"],
      programType: "Adult pickup soccer", ages: "Adult", level: "Recreational",
      days: [0], times: "Sun 4:00 – 6:30 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Sample listing. Long-running Sunday afternoon pickup game on the south turf."
    },
    {
      id: "ex-walk-club", name: "Basin Walk & Talk Club", short: "WT", sport: "fitness", example: true,
      category: "community", badges: ["COMMUNITY GROUP"],
      programType: "Neighborhood walking group", ages: "Mixed", level: "Recreational",
      days: [2, 4], times: "Tue · Thu 8:00 – 9:00 AM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Sample listing. Friendly loop walks on the perimeter path, open to all ages and paces."
    },
    {
      id: "ex-kickball", name: "Encino Kickball Social", short: "KB", sport: "other", example: true,
      category: "community", badges: ["COMMUNITY GROUP", "RECURRING COMMUNITY ACTIVITY"],
      programType: "Adult social kickball", ages: "Adult", level: "Recreational",
      days: [5], times: "Fri 6:00 – 8:00 PM",
      website: "", social: "", socialHandle: "", email: "",
      description: "Sample listing. Casual Friday-evening kickball on Diamond 4 when available."
    }
  ],

  /* ------------------------------------------------------------------
     Weekly recurring schedule
     day: 0–6 · type: see activityTypes · category: permitted | community | open | maintenance
     ------------------------------------------------------------------ */
  schedule: [
    // Sunday
    { day: 0, start: "09:00", end: "13:00", sport: "cricket",  groupId: "lac",                 facility: "cricket", type: "Youth Program",     category: "permitted" },
    { day: 0, start: "10:00", end: "15:00", sport: "baseball", groupId: "ex-baseball-club",    facility: "bbA",     type: "Game",              category: "permitted" },
    { day: 0, start: "10:00", end: "12:30", sport: "disc",     groupId: "ex-ultimate",         facility: "turfS",   type: "Open Recreation",   category: "community" },
    { day: 0, start: "16:00", end: "18:30", sport: "soccer",   groupId: "ex-pickup-soccer",    facility: "turfS",   type: "Open Recreation",   category: "community" },
    // Monday
    { day: 1, start: "06:00", end: "07:00", sport: "fitness",  groupId: "ex-bootcamp",         facility: "training", type: "Training",         category: "community" },
    { day: 1, start: "08:00", end: "12:00", sport: "community",groupId: null,                  facility: "sb1",     type: "Maintenance",       category: "maintenance", title: "Infield grooming — Diamonds 1–2" },
    { day: 1, start: "17:00", end: "19:30", sport: "baseball", groupId: "ex-baseball-club",    facility: "bbA",     type: "Practice",          category: "permitted" },
    { day: 1, start: "18:30", end: "22:00", sport: "softball", groupId: "ex-softball-league",  facility: "sb3",     type: "League",            category: "permitted" },
    // Tuesday
    { day: 2, start: "08:00", end: "09:00", sport: "fitness",  groupId: "ex-walk-club",        facility: "path",    type: "Open Recreation",   category: "community" },
    { day: 2, start: "16:00", end: "18:00", sport: "soccer",   groupId: "ex-youth-soccer",     facility: "turfN",   type: "Youth Program",     category: "permitted" },
    { day: 2, start: "16:30", end: "18:30", sport: "softball", groupId: "ex-youth-softball",   facility: "sb1",     type: "Practice",          category: "permitted" },
    { day: 2, start: "18:30", end: "22:00", sport: "softball", groupId: "ex-softball-league",  facility: "sb3",     type: "League",            category: "permitted" },
    // Wednesday
    { day: 3, start: "06:00", end: "07:00", sport: "fitness",  groupId: "ex-bootcamp",         facility: "training", type: "Training",         category: "community" },
    { day: 3, start: "17:00", end: "19:30", sport: "cricket",  groupId: "lac",                 facility: "cricket", type: "Practice",          category: "permitted" },
    { day: 3, start: "17:00", end: "19:30", sport: "baseball", groupId: "ex-baseball-club",    facility: "bbA",     type: "Practice",          category: "permitted" },
    { day: 3, start: "18:30", end: "20:30", sport: "disc",     groupId: "ex-ultimate",         facility: "turfS",   type: "Open Recreation",   category: "community" },
    // Thursday
    { day: 4, start: "08:00", end: "09:00", sport: "fitness",  groupId: "ex-walk-club",        facility: "path",    type: "Open Recreation",   category: "community" },
    { day: 4, start: "16:00", end: "18:00", sport: "soccer",   groupId: "ex-youth-soccer",     facility: "turfN",   type: "Youth Program",     category: "permitted" },
    { day: 4, start: "16:30", end: "18:30", sport: "softball", groupId: "ex-youth-softball",   facility: "sb2",     type: "Practice",          category: "permitted" },
    { day: 4, start: "18:30", end: "22:00", sport: "softball", groupId: "ex-softball-league",  facility: "sb4",     type: "League",            category: "permitted" },
    // Friday
    { day: 5, start: "06:00", end: "07:00", sport: "fitness",  groupId: "ex-bootcamp",         facility: "training", type: "Training",         category: "community" },
    { day: 5, start: "09:00", end: "13:00", sport: "community",groupId: null,                  facility: "turfN",   type: "Maintenance",       category: "maintenance", title: "Turf mowing & irrigation check" },
    { day: 5, start: "18:00", end: "20:00", sport: "other",    groupId: "ex-kickball",         facility: "sb4",     type: "Open Recreation",   category: "community" },
    // Saturday
    { day: 6, start: "08:00", end: "12:00", sport: "soccer",   groupId: "ex-youth-soccer",     facility: "turfN",   type: "Game",              category: "permitted" },
    { day: 6, start: "09:00", end: "13:00", sport: "cricket",  groupId: "lac",                 facility: "cricket", type: "Youth Program",     category: "permitted" },
    { day: 6, start: "09:00", end: "13:00", sport: "softball", groupId: "ex-youth-softball",   facility: "sb1",     type: "Game",              category: "permitted" },
    { day: 6, start: "13:00", end: "17:00", sport: "community",groupId: null,                  facility: "lawn",    type: "Open Recreation",   category: "open", title: "Open lawn — general community use" },
    { day: 6, start: "15:00", end: "18:00", sport: "cricket",  groupId: "ex-weekend-cricket",  facility: "lawn",    type: "Open Recreation",   category: "community" }
  ],

  /* ------------------------------------------------------------------
     Dated special events (shown in Today / This Week / Upcoming)
     ------------------------------------------------------------------ */
  specialEvents: [
    { date: "2026-09-19", start: "09:00", end: "13:00", title: "Cricket Community Open Day", sport: "cricket", groupId: "lac", facility: "cricket", type: "Special Event", category: "permitted",
      note: "Try cricket for the first time — bats, balls and coaches provided." },
    { date: "2026-09-26", start: "08:00", end: "11:00", title: "Fall Field Cleanup Day", sport: "community", groupId: null, facility: "lawn", type: "Community Activity", category: "community",
      note: "Gloves and bags provided. Meet at the Burbank Blvd entrance." },
    { date: "2026-10-03", start: "08:00", end: "17:00", title: "Softball Fall Classic", sport: "softball", groupId: "ex-softball-league", facility: "sb1", type: "Tournament", category: "permitted",
      note: "Sample event. Diamonds 1–4 reserved all day." },
    { date: "2026-10-10", start: "09:00", end: "14:00", title: "Youth Multi-Sport Family Day", sport: "youth", groupId: null, facility: "turfN", type: "Special Event", category: "community",
      note: "Rotating stations: soccer, cricket, softball and disc." },
    { date: "2026-10-17", start: "07:00", end: "12:00", title: "Irrigation Upgrade — Turf South", sport: "community", groupId: null, facility: "turfS", type: "Maintenance", category: "maintenance",
      note: "South turf closed for the morning." }
  ],

  /* ------------------------------------------------------------------
     Facility map locations. x/y/w/h are percentages of the map canvas.
     shape: "diamond" | "rect" | "pitch" | "pin"
     ------------------------------------------------------------------ */
  mapLocations: [
    { id: "entranceMain", name: "Main Entrance — Burbank Blvd", kind: "Entrance", sport: null, shape: "pin", x: 50, y: 6,
      fieldInfo: "Primary vehicle and pedestrian entrance from Burbank Blvd.", uses: "Arrival, drop-off, wayfinding signage.", accessibility: "Curb cuts and paved path to parking and fields." },
    { id: "parking", name: "Parking", kind: "Parking", sport: null, shape: "rect", x: 8, y: 12, w: 48, h: 12,
      fieldInfo: "Surface lot along the Burbank Blvd frontage.", uses: "Visitor parking, team drop-off.", accessibility: "Accessible stalls near the restroom building." },
    { id: "restrooms", name: "Restrooms", kind: "Restrooms", sport: null, shape: "pin", x: 34, y: 30,
      fieldInfo: "Central restroom building between the diamonds.", uses: "Open during facility hours.", accessibility: "Accessible restroom available." },
    { id: "sb1", name: "Softball Diamond 1", kind: "Softball Diamond", sport: "softball", shape: "diamond", x: 23, y: 40, r: 6,
      fieldInfo: "Skinned infield, lighted, backstop and dugouts.", uses: "Leagues, youth fast-pitch, tournaments.", accessibility: "Paved access to bleachers.", facility: "sb1" },
    { id: "sb2", name: "Softball Diamond 2", kind: "Softball Diamond", sport: "softball", shape: "diamond", x: 45, y: 40, r: 6,
      fieldInfo: "Skinned infield, lighted, backstop and dugouts.", uses: "Leagues, practices, tournaments.", accessibility: "Paved access to bleachers.", facility: "sb2" },
    { id: "sb3", name: "Softball Diamond 3", kind: "Softball Diamond", sport: "softball", shape: "diamond", x: 23, y: 65, r: 6,
      fieldInfo: "Skinned infield, lighted, backstop and dugouts.", uses: "Weeknight adult leagues.", accessibility: "Paved access to bleachers.", facility: "sb3" },
    { id: "sb4", name: "Softball Diamond 4", kind: "Softball Diamond", sport: "softball", shape: "diamond", x: 45, y: 65, r: 6,
      fieldInfo: "Skinned infield, lighted, backstop and dugouts.", uses: "Leagues, kickball, open play when available.", accessibility: "Paved access to bleachers.", facility: "sb4" },
    { id: "seating", name: "Seating & Bleachers", kind: "Seating", sport: null, shape: "pin", x: 34, y: 52.5,
      fieldInfo: "Bleachers serving the diamond cluster; shade limited.", uses: "Spectators, team gatherings.", accessibility: "Level paved approach." },
    { id: "bbA", name: "Baseball Field A", kind: "Baseball Diamond", sport: "baseball", shape: "diamond", x: 76, y: 40, r: 9,
      fieldInfo: "Full-size lighted baseball diamond with grass infield.", uses: "Club practices, league and weekend games.", accessibility: "Paved path from the east lot.", facility: "bbA" },
    { id: "bbB", name: "Baseball Field B", kind: "Baseball Diamond", sport: "baseball", shape: "diamond", x: 76, y: 73, r: 6,
      fieldInfo: "Youth-size diamond.", uses: "Youth practices and games.", accessibility: "Grass approach; firm paths nearby.", facility: "bbB" },
    { id: "turfN", name: "Multi-Use Turf North", kind: "Open Turf", sport: "soccer", shape: "rect", x: 8, y: 80, w: 28, h: 13,
      fieldInfo: "Natural-grass open turf, portable goals.", uses: "Youth soccer, clinics, family days.", accessibility: "Level grass; paved perimeter path.", facility: "turfN" },
    { id: "turfS", name: "Multi-Use Turf South", kind: "Open Turf", sport: "disc", shape: "rect", x: 40, y: 80, w: 24, h: 13,
      fieldInfo: "Natural-grass open turf.", uses: "Ultimate, pickup soccer, disc practice.", accessibility: "Level grass; paved perimeter path.", facility: "turfS" },
    { id: "cricket", name: "Los Angeles Cricket Ground", kind: "Cricket Pitch", sport: "cricket", shape: "pitch", x: 70, y: 84, w: 4, h: 12,
      fieldInfo: "20 ft × 80 ft natural-turf pitch developed by Los Angeles Cricket within the open field.", uses: "Youth coaching, practice, community matches.", accessibility: "Grass approach from the perimeter path.", facility: "cricket" },
    { id: "training", name: "Training Area", kind: "Training", sport: "fitness", shape: "rect", x: 86, y: 82, w: 9, h: 10,
      fieldInfo: "Open lawn corner used for conditioning.", uses: "Bootcamps, warm-ups, agility work.", accessibility: "Adjacent to paved path.", facility: "training" },
    { id: "lawn", name: "Open Recreation Lawn", kind: "Open Lawn", sport: "community", shape: "rect", x: 60, y: 12, w: 32, h: 12,
      fieldInfo: "Unprogrammed lawn near the entrance.", uses: "Picnics, informal games, community gatherings.", accessibility: "Level; adjacent to parking.", facility: "lawn" },
    { id: "entranceEast", name: "East Access Point", kind: "Entrance", sport: null, shape: "pin", x: 95, y: 30,
      fieldInfo: "Pedestrian access from the east side of the complex.", uses: "Walk-in access to the baseball fields.", accessibility: "Paved connection to the perimeter path." },
    { id: "path", name: "Perimeter Path", kind: "Path", sport: "fitness", shape: "pin", x: 9, y: 60,
      fieldInfo: "Loop path around the fields connecting to the wider Sepulveda Basin trail network.", uses: "Walking, running, warm-ups.", accessibility: "Paved and level.", facility: "path" }
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
    phases: [
      { key: "featuredBefore", label: "Before", caption: "Open turf prior to pitch development." },
      { key: "featuredDuring", label: "During construction", caption: "Grading, soil preparation and turf establishment." },
      { key: "featuredAfter",  label: "Completed pitch", caption: "Natural-turf pitch ready for play." }
    ]
  },

  /* ------------------------------------------------------------------
     Projects & improvements
     status: PROPOSED | PLANNING | FUNDRAISING | IN PROGRESS | COMPLETED
     ------------------------------------------------------------------ */
  projects: [
    { id: "shade", title: "Shade Structures at the Diamond Cluster", status: "FUNDRAISING",
      description: "Two shade canopies over the shared bleachers between Diamonds 1–4.",
      impact: "Cooler, safer spectating for families across all softball programs on hot Valley afternoons.",
      lead: "Community coalition", partners: ["Local businesses", "Softball leagues"], goal: 18000, raised: 6400,
      volunteer: "Fundraising committee, install-day helpers" },
    { id: "hydration", title: "Hydration Stations", status: "PLANNING",
      description: "Bottle-filling stations near the restrooms and the multi-use turf.",
      impact: "Free water for thousands of players and visitors each season; fewer single-use bottles.",
      lead: "Open to a lead organization", partners: [], goal: 9500, raised: 0,
      volunteer: "Grant research, site survey" },
    { id: "irrigation", title: "Irrigation Repair — Turf South", status: "IN PROGRESS",
      description: "Replace failed heads and adjust coverage on the south multi-use turf.",
      impact: "Healthier grass for soccer, disc and cricket outfield use.",
      lead: "Facility maintenance", partners: ["Disc sports groups", "Los Angeles Cricket"], goal: null, raised: null,
      volunteer: "Reporting dry spots, post-work walk-throughs" },
    { id: "youth-equipment", title: "Youth Equipment Library", status: "PROPOSED",
      description: "A shared, lockable cache of youth bats, balls, cones, goals and stumps that any program can borrow.",
      impact: "Lowers the cost of starting a youth program at Hjelte.",
      lead: "Open to a lead organization", partners: ["Youth programs"], goal: 6000, raised: 0,
      volunteer: "Equipment drives, inventory keeping" },
    { id: "signage", title: "Community Wayfinding Signage", status: "PLANNING",
      description: "Field numbers, a facility map board at the entrance and QR codes linking to this hub.",
      impact: "Easier arrival for new visitors and visiting teams.",
      lead: "Community coalition", partners: ["City of Los Angeles Recreation and Parks (review)"], goal: 4500, raised: 1200,
      volunteer: "Design, translation, installation" },
    { id: "benches", title: "Sideline Benches — Multi-Use Turf", status: "FUNDRAISING",
      description: "Six durable benches along the north and south turf sidelines.",
      impact: "Seating for youth teams and families where none exists today.",
      lead: "Youth soccer programs", partners: ["Neighborhood council (proposed)"], goal: 7200, raised: 2900,
      volunteer: "Install-day helpers" },
    { id: "scoreboard", title: "Portable Scoreboards", status: "PROPOSED",
      description: "Two battery-powered portable scoreboards shareable across softball, baseball and cricket.",
      impact: "A better game-day experience for every sport without fixed installations.",
      lead: "Open to a lead organization", partners: [], goal: 5400, raised: 0,
      volunteer: "Sponsor outreach" },
    { id: "cricket-pitch", title: "Los Angeles Cricket Ground", status: "COMPLETED",
      description: "20 ft × 80 ft natural-turf cricket pitch developed within the open field.",
      impact: "A dedicated home for youth and community cricket in the Valley.",
      lead: "Los Angeles Cricket", partners: ["Community volunteers"], goal: null, raised: null,
      volunteer: "Pitch care days" }
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

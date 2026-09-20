/* =====================================================================
   Hjelte Sports Center — one-time sample data seeding
   ---------------------------------------------------------------------
   Run seedSampleData() ONCE after setup() to fill the sheet with the same
   sample content the static site ships with. Every group except Los
   Angeles Cricket is a placeholder (example: TRUE) — replace them with
   real groups as submissions come in.

   Run clearSampleData() to delete every row marked example (and the
   schedule blocks and work-log entries that belong to those groups).
   ===================================================================== */

const SEED_GROUPS = [
  {
    "id": "lac",
    "name": "Los Angeles Cricket",
    "short": "LAC",
    "sport": "cricket",
    "category": "permitted",
    "permitStatus": "permitted",
    "paidPermit": true,
    "badges": "PERMITTED ORGANIZATION|NONPROFIT|YOUTH PROGRAM",
    "programType": "Youth cricket development & community cricket",
    "ages": "Mixed",
    "level": "Recreational",
    "days": "0|6|3",
    "times": "Sat–Sun 9:00 AM – 1:00 PM · Wed 5:00 – 7:30 PM",
    "website": "https://losangelescricket.org",
    "social": "https://instagram.com/LosAngelesCricket",
    "socialHandle": "@LosAngelesCricket",
    "email": "teamla@losangelescricket.org",
    "description": "Nonprofit uniting Los Angeles across cultures and neighborhoods through cricket. Developed the natural-turf cricket pitch at Hjelte and runs youth coaching and community sessions ahead of the LA28 Games.",
    "description_es": "",
    "logoUrl": "",
    "status": "approved",
    "example": false
  },
  {
    "id": "ex-softball-league",
    "name": "Valley Evening Softball League",
    "short": "VS",
    "sport": "softball",
    "category": "permitted",
    "permitStatus": "permitted",
    "paidPermit": true,
    "badges": "PERMITTED ORGANIZATION|LEAGUE",
    "programType": "Adult co-ed slow-pitch league",
    "ages": "Adult",
    "level": "Recreational",
    "days": "1|2|4",
    "times": "Mon · Tue · Thu 6:30 – 10:00 PM",
    "website": "",
    "social": "",
    "socialHandle": "",
    "email": "",
    "description": "Sample listing. Weeknight co-ed slow-pitch league using the softball diamonds under lights during the spring and fall seasons.",
    "description_es": "",
    "logoUrl": "",
    "status": "approved",
    "example": true
  },
  {
    "id": "ex-youth-softball",
    "name": "Encino Youth Fast-Pitch",
    "short": "EY",
    "sport": "softball",
    "category": "permitted",
    "permitStatus": "permitted",
    "paidPermit": true,
    "badges": "PERMITTED ORGANIZATION|YOUTH PROGRAM",
    "programType": "Girls fast-pitch, ages 8–14",
    "ages": "Youth",
    "level": "Competitive",
    "days": "2|4|6",
    "times": "Tue · Thu 4:30 – 6:30 PM · Sat 9:00 AM – 1:00 PM",
    "website": "",
    "social": "",
    "socialHandle": "",
    "email": "",
    "description": "Sample listing. Youth fast-pitch program with weekday practices and Saturday game days on Diamonds 1–2.",
    "description_es": "",
    "logoUrl": "",
    "status": "approved",
    "example": true
  },
  {
    "id": "ex-baseball-club",
    "name": "Sepulveda Basin Baseball Club",
    "short": "SB",
    "sport": "baseball",
    "category": "permitted",
    "permitStatus": "permitted",
    "paidPermit": true,
    "badges": "PERMITTED ORGANIZATION|CLUB|YOUTH PROGRAM",
    "programType": "Youth travel baseball, 10U–14U",
    "ages": "Youth",
    "level": "Competitive",
    "days": "1|3|0",
    "times": "Mon · Wed 5:00 – 7:30 PM · Sun 10:00 AM – 3:00 PM",
    "website": "",
    "social": "",
    "socialHandle": "",
    "email": "",
    "description": "Sample listing. Youth baseball program using Diamond 2 for weekday practices and Sunday games.",
    "description_es": "",
    "logoUrl": "",
    "status": "approved",
    "example": true
  },
  {
    "id": "ex-youth-soccer",
    "name": "Basin Youth Soccer Academy",
    "short": "BY",
    "sport": "soccer",
    "category": "permitted",
    "permitStatus": "permitted",
    "paidPermit": true,
    "badges": "PERMITTED ORGANIZATION|YOUTH PROGRAM",
    "programType": "Recreational youth soccer, ages 5–12",
    "ages": "Youth",
    "level": "Recreational",
    "days": "2|4|6",
    "times": "Tue · Thu 4:00 – 6:00 PM · Sat 8:00 AM – 12:00 PM",
    "website": "",
    "social": "",
    "socialHandle": "",
    "email": "",
    "description": "Sample listing. Small-sided youth soccer on the shared outfield with Saturday morning game days.",
    "description_es": "",
    "logoUrl": "",
    "status": "approved",
    "example": true
  },
  {
    "id": "ex-ultimate",
    "name": "Valley Ultimate Pickup",
    "short": "VU",
    "sport": "disc",
    "category": "community",
    "permitStatus": "none",
    "paidPermit": false,
    "badges": "COMMUNITY GROUP|OPEN RECREATION",
    "programType": "Ultimate frisbee pickup — all welcome",
    "ages": "Adult",
    "level": "Recreational",
    "days": "3|0",
    "times": "Wed 6:30 – 8:30 PM · Sun 10:00 AM – 12:30 PM",
    "website": "",
    "social": "",
    "socialHandle": "",
    "email": "",
    "description": "Sample listing. Recurring drop-in ultimate on the shared outfield. Bring a light and a dark shirt; newcomers welcome.",
    "description_es": "",
    "logoUrl": "",
    "status": "approved",
    "example": true
  },
  {
    "id": "ex-bootcamp",
    "name": "Sunrise Bootcamp Encino",
    "short": "SB",
    "sport": "fitness",
    "category": "community",
    "permitStatus": "none",
    "paidPermit": false,
    "badges": "COMMUNITY GROUP",
    "programType": "Outdoor group fitness",
    "ages": "Adult",
    "level": "Recreational",
    "days": "1|3|5",
    "times": "Mon · Wed · Fri 6:00 – 7:00 AM",
    "website": "",
    "social": "",
    "socialHandle": "",
    "email": "",
    "description": "Sample listing. Early-morning conditioning sessions along the perimeter road and the west lawn.",
    "description_es": "",
    "logoUrl": "",
    "status": "approved",
    "example": true
  },
  {
    "id": "ex-weekend-cricket",
    "name": "Weekend Social Cricket",
    "short": "WC",
    "sport": "cricket",
    "category": "community",
    "permitStatus": "unknown",
    "paidPermit": false,
    "badges": "COMMUNITY GROUP|RECURRING COMMUNITY ACTIVITY",
    "programType": "Tape-ball social cricket",
    "ages": "Mixed",
    "level": "Recreational",
    "days": "6",
    "times": "Sat 3:00 – 6:00 PM",
    "website": "",
    "social": "",
    "socialHandle": "",
    "email": "",
    "description": "Sample listing. Informal weekend tape-ball games on the west lawn. Families and first-timers encouraged.",
    "description_es": "",
    "logoUrl": "",
    "status": "approved",
    "example": true
  },
  {
    "id": "ex-pickup-soccer",
    "name": "Sunday Pickup Soccer",
    "short": "PS",
    "sport": "soccer",
    "category": "community",
    "permitStatus": "none",
    "paidPermit": false,
    "badges": "COMMUNITY GROUP|OPEN RECREATION",
    "programType": "Adult pickup soccer",
    "ages": "Adult",
    "level": "Recreational",
    "days": "0",
    "times": "Sun 4:00 – 6:30 PM",
    "website": "",
    "social": "",
    "socialHandle": "",
    "email": "",
    "description": "Sample listing. Long-running Sunday afternoon pickup game on the shared outfield.",
    "description_es": "",
    "logoUrl": "",
    "status": "approved",
    "example": true
  },
  {
    "id": "ex-walk-club",
    "name": "Basin Walk & Talk Club",
    "short": "WT",
    "sport": "fitness",
    "category": "community",
    "permitStatus": "none",
    "paidPermit": false,
    "badges": "COMMUNITY GROUP",
    "programType": "Neighborhood walking group",
    "ages": "Mixed",
    "level": "Recreational",
    "days": "2|4",
    "times": "Tue · Thu 8:00 – 9:00 AM",
    "website": "",
    "social": "",
    "socialHandle": "",
    "email": "",
    "description": "Sample listing. Friendly loop walks on the perimeter path, open to all ages and paces.",
    "description_es": "",
    "logoUrl": "",
    "status": "approved",
    "example": true
  },
  {
    "id": "ex-kickball",
    "name": "Encino Kickball Social",
    "short": "KB",
    "sport": "other",
    "category": "community",
    "permitStatus": "none",
    "paidPermit": false,
    "badges": "COMMUNITY GROUP|RECURRING COMMUNITY ACTIVITY",
    "programType": "Adult social kickball",
    "ages": "Adult",
    "level": "Recreational",
    "days": "5",
    "times": "Fri 6:00 – 8:00 PM",
    "website": "",
    "social": "",
    "socialHandle": "",
    "email": "",
    "description": "Sample listing. Casual Friday-evening kickball on Diamond 4 when available.",
    "description_es": "",
    "logoUrl": "",
    "status": "approved",
    "example": true
  }
];
const SEED_SCHEDULE = [
  {
    "id": "s1",
    "groupId": "lac",
    "day": 0,
    "start": "09:00",
    "end": "13:00",
    "sport": "cricket",
    "facility": "cricket",
    "type": "Youth Program",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s2",
    "groupId": "ex-baseball-club",
    "day": 0,
    "start": "10:00",
    "end": "15:00",
    "sport": "baseball",
    "facility": "sbB",
    "type": "Game",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s3",
    "groupId": "ex-ultimate",
    "day": 0,
    "start": "10:00",
    "end": "12:30",
    "sport": "disc",
    "facility": "outfield",
    "type": "Open Recreation",
    "category": "community",
    "title": "",
    "notes": ""
  },
  {
    "id": "s4",
    "groupId": "ex-pickup-soccer",
    "day": 0,
    "start": "16:00",
    "end": "18:30",
    "sport": "soccer",
    "facility": "outfield",
    "type": "Open Recreation",
    "category": "community",
    "title": "",
    "notes": ""
  },
  {
    "id": "s5",
    "groupId": "ex-bootcamp",
    "day": 1,
    "start": "06:00",
    "end": "07:00",
    "sport": "fitness",
    "facility": "westLawn",
    "type": "Training",
    "category": "community",
    "title": "",
    "notes": ""
  },
  {
    "id": "s6",
    "groupId": "",
    "day": 1,
    "start": "08:00",
    "end": "12:00",
    "sport": "community",
    "facility": "sbA",
    "type": "Maintenance",
    "category": "maintenance",
    "title": "Infield grooming — Diamonds 1–2",
    "notes": ""
  },
  {
    "id": "s7",
    "groupId": "ex-baseball-club",
    "day": 1,
    "start": "17:00",
    "end": "19:30",
    "sport": "baseball",
    "facility": "sbB",
    "type": "Practice",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s8",
    "groupId": "ex-softball-league",
    "day": 1,
    "start": "18:30",
    "end": "22:00",
    "sport": "softball",
    "facility": "sbC",
    "type": "League",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s9",
    "groupId": "ex-walk-club",
    "day": 2,
    "start": "08:00",
    "end": "09:00",
    "sport": "fitness",
    "facility": "path",
    "type": "Open Recreation",
    "category": "community",
    "title": "",
    "notes": ""
  },
  {
    "id": "s10",
    "groupId": "ex-youth-soccer",
    "day": 2,
    "start": "16:00",
    "end": "18:00",
    "sport": "soccer",
    "facility": "outfield",
    "type": "Youth Program",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s11",
    "groupId": "ex-youth-softball",
    "day": 2,
    "start": "16:30",
    "end": "18:30",
    "sport": "softball",
    "facility": "sbA",
    "type": "Practice",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s12",
    "groupId": "ex-softball-league",
    "day": 2,
    "start": "18:30",
    "end": "22:00",
    "sport": "softball",
    "facility": "sbC",
    "type": "League",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s13",
    "groupId": "ex-bootcamp",
    "day": 3,
    "start": "06:00",
    "end": "07:00",
    "sport": "fitness",
    "facility": "westLawn",
    "type": "Training",
    "category": "community",
    "title": "",
    "notes": ""
  },
  {
    "id": "s14",
    "groupId": "lac",
    "day": 3,
    "start": "17:00",
    "end": "19:30",
    "sport": "cricket",
    "facility": "cricket",
    "type": "Practice",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s15",
    "groupId": "ex-baseball-club",
    "day": 3,
    "start": "17:00",
    "end": "19:30",
    "sport": "baseball",
    "facility": "sbB",
    "type": "Practice",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s16",
    "groupId": "ex-ultimate",
    "day": 3,
    "start": "18:30",
    "end": "20:30",
    "sport": "disc",
    "facility": "outfield",
    "type": "Open Recreation",
    "category": "community",
    "title": "",
    "notes": ""
  },
  {
    "id": "s17",
    "groupId": "ex-walk-club",
    "day": 4,
    "start": "08:00",
    "end": "09:00",
    "sport": "fitness",
    "facility": "path",
    "type": "Open Recreation",
    "category": "community",
    "title": "",
    "notes": ""
  },
  {
    "id": "s18",
    "groupId": "ex-youth-soccer",
    "day": 4,
    "start": "16:00",
    "end": "18:00",
    "sport": "soccer",
    "facility": "outfield",
    "type": "Youth Program",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s19",
    "groupId": "ex-youth-softball",
    "day": 4,
    "start": "16:30",
    "end": "18:30",
    "sport": "softball",
    "facility": "sbB",
    "type": "Practice",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s20",
    "groupId": "ex-softball-league",
    "day": 4,
    "start": "18:30",
    "end": "22:00",
    "sport": "softball",
    "facility": "sbD",
    "type": "League",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s21",
    "groupId": "ex-bootcamp",
    "day": 5,
    "start": "06:00",
    "end": "07:00",
    "sport": "fitness",
    "facility": "westLawn",
    "type": "Training",
    "category": "community",
    "title": "",
    "notes": ""
  },
  {
    "id": "s22",
    "groupId": "",
    "day": 5,
    "start": "09:00",
    "end": "13:00",
    "sport": "community",
    "facility": "outfield",
    "type": "Maintenance",
    "category": "maintenance",
    "title": "Outfield mowing & irrigation check",
    "notes": ""
  },
  {
    "id": "s23",
    "groupId": "ex-kickball",
    "day": 5,
    "start": "18:00",
    "end": "20:00",
    "sport": "other",
    "facility": "sbD",
    "type": "Open Recreation",
    "category": "community",
    "title": "",
    "notes": ""
  },
  {
    "id": "s24",
    "groupId": "ex-youth-soccer",
    "day": 6,
    "start": "08:00",
    "end": "12:00",
    "sport": "soccer",
    "facility": "outfield",
    "type": "Game",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s25",
    "groupId": "lac",
    "day": 6,
    "start": "09:00",
    "end": "13:00",
    "sport": "cricket",
    "facility": "cricket",
    "type": "Youth Program",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s26",
    "groupId": "ex-youth-softball",
    "day": 6,
    "start": "09:00",
    "end": "13:00",
    "sport": "softball",
    "facility": "sbA",
    "type": "Game",
    "category": "permitted",
    "title": "",
    "notes": ""
  },
  {
    "id": "s27",
    "groupId": "",
    "day": 6,
    "start": "13:00",
    "end": "17:00",
    "sport": "community",
    "facility": "westLawn",
    "type": "Open Recreation",
    "category": "open",
    "title": "Open lawn — general community use",
    "notes": ""
  },
  {
    "id": "s28",
    "groupId": "ex-weekend-cricket",
    "day": 6,
    "start": "15:00",
    "end": "18:00",
    "sport": "cricket",
    "facility": "westLawn",
    "type": "Open Recreation",
    "category": "community",
    "title": "",
    "notes": ""
  }
];
const SEED_EVENTS = [
  {
    "id": "e1",
    "date": "2026-09-19",
    "start": "09:00",
    "end": "13:00",
    "title": "Cricket Community Open Day",
    "sport": "cricket",
    "groupId": "lac",
    "facility": "cricket",
    "type": "Special Event",
    "category": "permitted",
    "note": "Try cricket for the first time — bats, balls and coaches provided."
  },
  {
    "id": "e2",
    "date": "2026-09-26",
    "start": "08:00",
    "end": "11:00",
    "title": "Fall Field Cleanup Day",
    "sport": "community",
    "groupId": "",
    "facility": "westLawn",
    "type": "Community Activity",
    "category": "community",
    "note": "Gloves and bags provided. Meet at the Burbank Blvd entrance."
  },
  {
    "id": "e3",
    "date": "2026-10-03",
    "start": "08:00",
    "end": "17:00",
    "title": "Softball Fall Classic",
    "sport": "softball",
    "groupId": "ex-softball-league",
    "facility": "sbA",
    "type": "Tournament",
    "category": "permitted",
    "note": "Sample event. Diamonds 1–4 reserved all day."
  },
  {
    "id": "e4",
    "date": "2026-10-10",
    "start": "09:00",
    "end": "14:00",
    "title": "Youth Multi-Sport Family Day",
    "sport": "youth",
    "groupId": "",
    "facility": "outfield",
    "type": "Special Event",
    "category": "community",
    "note": "Rotating stations: soccer, cricket, softball and disc."
  },
  {
    "id": "e5",
    "date": "2026-10-17",
    "start": "07:00",
    "end": "12:00",
    "title": "Irrigation Upgrade — Shared Outfield (south half)",
    "sport": "community",
    "groupId": "",
    "facility": "outfield",
    "type": "Maintenance",
    "category": "maintenance",
    "note": "South half of the outfield closed for the morning."
  }
];
const SEED_UPDATES = [
  {
    "id": "u1",
    "createdAt": "2026-09-17T18:00:00",
    "author": "Los Angeles Cricket",
    "sport": "cricket",
    "groupId": "lac",
    "title": "Cricket Community Open Day this Saturday",
    "body": "Free intro session 9 AM – 1 PM on the cricket ground. Bats and balls provided; wear trainers and bring water.",
    "title_es": "",
    "body_es": "",
    "sentAt": ""
  },
  {
    "id": "u2",
    "createdAt": "2026-09-15T09:30:00",
    "author": "Hub maintainers",
    "sport": "all",
    "groupId": "",
    "title": "Outfield irrigation repair in progress",
    "body": "Expect hoses and marked dry spots on the south half of the outfield through the end of the month. Soccer and ultimate groups are using the north half where needed.",
    "title_es": "",
    "body_es": "",
    "sentAt": ""
  },
  {
    "id": "u3",
    "createdAt": "2026-09-10T16:15:00",
    "author": "Hub maintainers",
    "sport": "softball",
    "groupId": "",
    "title": "Diamond 1 lights back on",
    "body": "The two failed fixtures on Diamond 1 were replaced. Evening league play resumes on the normal schedule.",
    "title_es": "",
    "body_es": "",
    "sentAt": ""
  }
];
const SEED_PROJECTS = [
  {
    "id": "restroom-refresh",
    "area": "Restrooms",
    "title": "Restroom Building Refresh",
    "status": "PLANNING",
    "description": "Fixtures, lighting, doors and paint for the central restroom building, plus a cleaning-supply cabinet for volunteer touch-ups between City service visits.",
    "impact": "Cleaner, safer restrooms for every visitor, every day the fields are in use.",
    "lead": "Community coalition",
    "partners": "City of Los Angeles Recreation and Parks (approval)|Local plumbing trades (proposed)",
    "goal": 24000,
    "raised": 3100,
    "volunteer": "Condition survey, paint day, supply drives",
    "targetDate": "2027-03"
  },
  {
    "id": "portable-restrooms",
    "area": "Restrooms",
    "title": "Tournament-Day Portable Restrooms",
    "status": "FUNDRAISING",
    "description": "A seasonal fund for additional portable units with hand-washing stations on tournament and family-day weekends.",
    "impact": "Shorter lines and better hygiene on the busiest days of the year.",
    "lead": "Softball & baseball programs",
    "partners": "Los Angeles Cricket|Youth soccer programs",
    "goal": 4800,
    "raised": 1750,
    "volunteer": "Event-day coordination",
    "targetDate": ""
  },
  {
    "id": "facility-updates",
    "area": "Facility updates",
    "title": "Facility Updates Wish List",
    "status": "PROPOSED",
    "description": "Rolling list gathered from users: backstop netting repairs, dugout roofs, a bulletin board at the entrance, bike racks and trash/recycling pairs at each field.",
    "impact": "Dozens of small fixes that together make the complex feel cared for.",
    "lead": "Open to a lead organization",
    "partners": "",
    "goal": 15000,
    "raised": "",
    "volunteer": "Walk-through audits, prioritizing the list, quick-fix days",
    "targetDate": ""
  },
  {
    "id": "shade",
    "area": "Seating & shade",
    "title": "Shade Structures at the Diamond Cluster",
    "status": "FUNDRAISING",
    "description": "Two shade canopies over the shared bleachers between Diamonds 1–4.",
    "impact": "Cooler, safer spectating for families across all softball programs on hot Valley afternoons.",
    "lead": "Community coalition",
    "partners": "Local businesses|Softball leagues",
    "goal": 18000,
    "raised": 6400,
    "volunteer": "Fundraising committee, install-day helpers",
    "targetDate": ""
  },
  {
    "id": "hydration",
    "area": "Water & irrigation",
    "title": "Hydration Stations",
    "status": "PLANNING",
    "description": "Bottle-filling stations near the restroom building and the west entrance.",
    "impact": "Free water for thousands of players and visitors each season; fewer single-use bottles.",
    "lead": "Open to a lead organization",
    "partners": "",
    "goal": 9500,
    "raised": "",
    "volunteer": "Grant research, site survey",
    "targetDate": ""
  },
  {
    "id": "irrigation",
    "area": "Water & irrigation",
    "title": "Irrigation Repair — Shared Outfield",
    "status": "IN PROGRESS",
    "description": "Replace failed heads and adjust coverage on the south half of the shared outfield.",
    "impact": "Healthier grass for soccer, disc and cricket outfield use.",
    "lead": "Facility maintenance",
    "partners": "Disc sports groups|Los Angeles Cricket",
    "goal": "",
    "raised": "",
    "volunteer": "Reporting dry spots, post-work walk-throughs",
    "targetDate": ""
  },
  {
    "id": "youth-equipment",
    "area": "Equipment",
    "title": "Youth Equipment Library",
    "status": "PROPOSED",
    "description": "A shared, lockable cache of youth bats, balls, cones, goals and stumps that any program can borrow.",
    "impact": "Lowers the cost of starting a youth program at Hjelte.",
    "lead": "Open to a lead organization",
    "partners": "Youth programs",
    "goal": 6000,
    "raised": "",
    "volunteer": "Equipment drives, inventory keeping",
    "targetDate": ""
  },
  {
    "id": "signage",
    "area": "Signage & wayfinding",
    "title": "Community Wayfinding Signage",
    "status": "PLANNING",
    "description": "Field numbers, a facility map board at the entrance and QR codes linking to this hub.",
    "impact": "Easier arrival for new visitors and visiting teams.",
    "lead": "Community coalition",
    "partners": "City of Los Angeles Recreation and Parks (review)",
    "goal": 4500,
    "raised": 1200,
    "volunteer": "Design, translation, installation",
    "targetDate": ""
  },
  {
    "id": "benches",
    "area": "Seating & shade",
    "title": "Sideline Benches — Shared Outfield",
    "status": "FUNDRAISING",
    "description": "Six durable benches along the outfield edges between the diamonds.",
    "impact": "Seating for youth teams and families where none exists today.",
    "lead": "Youth soccer programs",
    "partners": "Neighborhood council (proposed)",
    "goal": 7200,
    "raised": 2900,
    "volunteer": "Install-day helpers",
    "targetDate": ""
  },
  {
    "id": "scoreboard",
    "area": "Equipment",
    "title": "Portable Scoreboards",
    "status": "PROPOSED",
    "description": "Two battery-powered portable scoreboards shareable across softball, baseball and cricket.",
    "impact": "A better game-day experience for every sport without fixed installations.",
    "lead": "Open to a lead organization",
    "partners": "",
    "goal": 5400,
    "raised": "",
    "volunteer": "Sponsor outreach",
    "targetDate": ""
  },
  {
    "id": "cricket-pitch",
    "area": "Fields & turf",
    "title": "Los Angeles Cricket Ground",
    "status": "COMPLETED",
    "description": "20 ft × 80 ft natural-turf cricket pitch developed within the open field.",
    "impact": "A dedicated home for youth and community cricket in the Valley.",
    "lead": "Los Angeles Cricket",
    "partners": "Community volunteers",
    "goal": "",
    "raised": "",
    "volunteer": "Pitch care days",
    "targetDate": ""
  }
];
const SEED_WORKLOG = [
  {
    "id": "w1",
    "date": "2026-09-12",
    "organization": "Los Angeles Cricket",
    "groupId": "lac",
    "activity": "Cricket pitch mowing, rolling and crease re-marking",
    "area": "Fields & turf",
    "hours": 14,
    "volunteers": 5,
    "materials": "Line paint, fuel",
    "value": 120,
    "verified": true,
    "addedBy": "seed"
  },
  {
    "id": "w2",
    "date": "2026-09-06",
    "organization": "Valley Evening Softball League",
    "groupId": "ex-softball-league",
    "activity": "Infield dragging and base-peg repair, Diamonds 3–4",
    "area": "Fields & turf",
    "hours": 9,
    "volunteers": 4,
    "materials": "Base pegs",
    "value": 60,
    "verified": true,
    "addedBy": "seed"
  },
  {
    "id": "w3",
    "date": "2026-08-30",
    "organization": "Basin Walk & Talk Club",
    "groupId": "ex-walk-club",
    "activity": "Perimeter road litter pickup",
    "area": "Facility updates",
    "hours": 6,
    "volunteers": 6,
    "materials": "Bags, gloves",
    "value": 25,
    "verified": true,
    "addedBy": "seed"
  },
  {
    "id": "w4",
    "date": "2026-08-23",
    "organization": "Los Angeles Cricket",
    "groupId": "lac",
    "activity": "Outfield irrigation dry-spot survey shared with facility staff",
    "area": "Water & irrigation",
    "hours": 4,
    "volunteers": 2,
    "materials": "",
    "value": 0,
    "verified": true,
    "addedBy": "seed"
  },
  {
    "id": "w5",
    "date": "2026-08-16",
    "organization": "Basin Youth Soccer Academy",
    "groupId": "ex-youth-soccer",
    "activity": "Portable goal repair and net replacement",
    "area": "Equipment",
    "hours": 5,
    "volunteers": 3,
    "materials": "Two nets",
    "value": 180,
    "verified": false,
    "addedBy": "seed"
  },
  {
    "id": "w6",
    "date": "2026-08-09",
    "organization": "Community volunteers",
    "groupId": "",
    "activity": "Bleacher cleaning and graffiti removal at the diamond cluster",
    "area": "Seating & shade",
    "hours": 12,
    "volunteers": 8,
    "materials": "Cleaner, rollers",
    "value": 90,
    "verified": true,
    "addedBy": "seed"
  }
];

function seedSampleData() {
  const pairs = [["Groups", SEED_GROUPS], ["Schedule", SEED_SCHEDULE], ["Events", SEED_EVENTS],
                 ["Updates", SEED_UPDATES], ["Projects", SEED_PROJECTS], ["WorkLog", SEED_WORKLOG]];
  pairs.forEach(function (p) {
    const name = p[0], rows = p[1], sh = sheet(name);
    if (sh.getLastRow() > 1) { Logger.log(name + " already has data — skipped."); return; }
    const head = SCHEMA[name];
    const values = rows.map(function (r) { return head.map(function (k) { return r[k] === undefined ? "" : r[k]; }); });
    sh.getRange(2, 1, values.length, head.length).setValues(values);
    Logger.log("Seeded " + values.length + " rows into " + name);
  });
  touch();
}

function clearSampleData() {
  const groups = rows("Groups"), sampleIds = groups.filter(function (g) { return g.example; }).map(function (g) { return g.id; });
  ["Schedule", "Events", "Updates", "WorkLog"].forEach(function (name) {
    rows(name).forEach(function (r) { if (sampleIds.indexOf(r.groupId) !== -1) deleteRowBy(name, "id", r.id); });
  });
  sampleIds.forEach(function (id) { deleteRowBy("Groups", "id", id); });
  Logger.log("Removed " + sampleIds.length + " sample groups and their rows.");
  touch();
}

/* ---------------------------------------------------------------------
   One-shot: apply the weekend programme to the live sheet.
   Saturday and Sunday — adult softball on Diamond 3 (sbC) 9–11, field
   maintenance 11–1, Los Angeles Cricket 1–6 — plus the dated LAC practice
   and the two match days. Also renumbers "Diamond A–D" text to 1–4.
   Safe to run twice: existing matching rows are removed first.
   --------------------------------------------------------------------- */
function applyWeekendSchedule() {
  const WEEKEND = [
    { day: 0, start: "09:00", end: "11:00", sport: "softball",  groupId: "",    facility: "sbC",      type: "League",      category: "permitted",   title: "Adult softball — league play" },
    { day: 0, start: "11:00", end: "13:00", sport: "community", groupId: "",    facility: "outfield", type: "Maintenance", category: "maintenance", title: "Field maintenance" },
    { day: 0, start: "13:00", end: "18:00", sport: "cricket",   groupId: "lac", facility: "cricket",  type: "Practice",    category: "permitted",   title: "" },
    { day: 6, start: "09:00", end: "11:00", sport: "softball",  groupId: "",    facility: "sbC",      type: "League",      category: "permitted",   title: "Adult softball — league play" },
    { day: 6, start: "11:00", end: "13:00", sport: "community", groupId: "",    facility: "outfield", type: "Maintenance", category: "maintenance", title: "Field maintenance" },
    { day: 6, start: "13:00", end: "18:00", sport: "cricket",   groupId: "lac", facility: "cricket",  type: "Practice",    category: "permitted",   title: "" }
  ];
  const EVENTS = [
    { date: "2026-09-25", start: "15:00", end: "17:00", title: "Los Angeles Cricket — practice", sport: "cricket", groupId: "lac", facility: "cricket", type: "Practice", category: "permitted",
      note: "Squad practice on the cricket ground. Please stay outside the boundary while play is on." },
    { date: "2026-09-26", start: "13:00", end: "18:00", title: "Los Angeles Cricket — match", sport: "cricket", groupId: "lac", facility: "cricket", type: "Game", category: "permitted",
      note: "Rope boundary in place. Spectators welcome along the west side of the ground." },
    { date: "2026-09-27", start: "13:00", end: "18:00", title: "Los Angeles Cricket — match", sport: "cricket", groupId: "lac", facility: "cricket", type: "Game", category: "permitted",
      note: "Rope boundary in place. Spectators welcome along the west side of the ground." }
  ];

  // the old all-morning weekend cricket block now sits inside the maintenance window
  rows("Schedule").forEach(function (r) {
    if ((Number(r.day) === 0 || Number(r.day) === 6) && r.facility === "cricket" &&
        String(r.start) === "09:00" && String(r.type) === "Youth Program") deleteRowBy("Schedule", "id", r.id);
  });
  // drop anything this function added before, so a re-run does not duplicate
  rows("Schedule").forEach(function (r) {
    if (String(r.id).indexOf("wk-") === 0) deleteRowBy("Schedule", "id", r.id);
  });
  rows("Events").forEach(function (r) {
    if (String(r.id).indexOf("lacw-") === 0) deleteRowBy("Events", "id", r.id);
  });

  WEEKEND.forEach(function (e, i) { e.id = "wk-" + i; upsertRow("Schedule", "id", e); });
  EVENTS.forEach(function (e, i) { e.id = "lacw-" + i; upsertRow("Events", "id", e); });

  // "Diamond A" -> "Diamond 1" everywhere the sheets carry free text
  const NUM = { A: "1", B: "2", C: "3", D: "4" };
  const fix = function (v) {
    return typeof v === "string"
      ? v.replace(/\bDiamonds?\s+[A-D](\s*[–-]\s*[A-D])?\b/g, function (m) {
          return m.replace(/Diamond(s?)/, "\u0000$1").replace(/[A-D]/g, function (c) { return NUM[c]; }).replace(/\u0000/, "Diamond");
        })
      : v;
  };
  [["Schedule", ["title", "notes"]], ["Events", ["title", "note"]], ["Groups", ["description", "description_es"]],
   ["Updates", ["title", "body"]], ["Projects", ["title", "description", "impact"]], ["WorkLog", ["activity"]]]
    .forEach(function (pair) {
      rows(pair[0]).forEach(function (r) {
        let changed = false;
        pair[1].forEach(function (k) { const v = fix(r[k]); if (v !== r[k]) { r[k] = v; changed = true; } });
        if (changed) upsertRow(pair[0], "id", r);
      });
    });

  touch();
  Logger.log("Weekend programme applied: " + WEEKEND.length + " schedule rows, " + EVENTS.length + " events.");
}


/* ---------------------------------------------------------------------
   One-shot: replace the Projects sheet with the shorter, simpler list.
   The cricket ground leads and is marked completed; youth-specific and
   build-heavy items are gone. Safe to run twice.
   --------------------------------------------------------------------- */
function applyProjects() {
  const KEEP = [
    {"id": "cricket-pitch", "area": "Fields & turf", "title": "Los Angeles Cricket Ground", "status": "COMPLETED", "description": "A 20 ft × 80 ft natural-turf cricket pitch prepared in the middle of the shared outfield, with a 420 ft playing circle marked on match days.", "impact": "A dedicated home for community cricket in the Valley, on a field that stays open to every other sport around it.", "lead": "Los Angeles Cricket", "partners": ["Community volunteers"], "goal": "", "raised": "", "volunteer": "Pitch care days — mowing, rolling and crease marking", "targetDate": ""},
    {"id": "irrigation", "area": "Water & irrigation", "title": "Irrigation Repair — Shared Outfield", "status": "IN PROGRESS", "description": "Replacing failed sprinkler heads and adjusting coverage on the south half of the outfield, where dry patches have been spreading.", "impact": "Healthier grass across the whole outfield, for soccer, cricket and everyone else who uses it.", "lead": "Facility maintenance", "partners": ["Los Angeles Cricket"], "goal": "", "raised": "", "volunteer": "Report dry spots, join a post-work walk-through", "targetDate": ""},
    {"id": "restroom-refresh", "area": "Restrooms", "title": "Restroom Building Refresh", "status": "PLANNING", "description": "Fixtures, lighting, doors and paint for the restroom building, plus a supply cabinet so volunteers can top up between City service visits.", "impact": "Cleaner, safer restrooms every day the fields are in use.", "lead": "Community coalition", "partners": ["City of Los Angeles Recreation and Parks (approval)"], "goal": "", "raised": "", "volunteer": "Condition survey, paint day, supply drives", "targetDate": ""},
    {"id": "signage", "area": "Signage & wayfinding", "title": "Field Numbers & Wayfinding Signs", "status": "PLANNING", "description": "Numbers on each diamond, a map board at the entrance and QR codes that open this page, so visiting teams can find their field without asking.", "impact": "An easier arrival for new visitors, visiting teams and anyone here for the first time.", "lead": "Community coalition", "partners": ["City of Los Angeles Recreation and Parks (review)"], "goal": "", "raised": "", "volunteer": "Design, Spanish translation, installation day", "targetDate": ""},
    {"id": "waste", "area": "Trash & recycling", "title": "Trash & Recycling Stations", "status": "PROPOSED", "description": "Paired trash and recycling bins at each field and at the parking lot entrance, emptied on a posted schedule.", "impact": "Less litter blowing across the outfield and an easier job for the volunteers who pick it up.", "lead": "Open to a lead organization", "partners": [], "goal": "", "raised": "", "volunteer": "Litter pickups, bin placement walk-through", "targetDate": ""},
    {"id": "facility-updates", "area": "Facility updates", "title": "Small Repairs Wish List", "status": "PROPOSED", "description": "A rolling list of small fixes gathered from the people who use the park: backstop netting, dugout repairs, a bulletin board at the entrance, bike racks.", "impact": "Dozens of small fixes that together make the complex feel looked after.", "lead": "Open to a lead organization", "partners": [], "goal": "", "raised": "", "volunteer": "Walk-through audits, quick-fix days", "targetDate": ""}
  ];
  rows("Projects").forEach(function (r) { deleteRowBy("Projects", "id", r.id); });
  KEEP.forEach(function (p) { upsertRow("Projects", "id", p); });
  touch();
  Logger.log("Projects replaced: " + KEEP.length + " rows.");
}


/* ---------------------------------------------------------------------
   One-shot: apply the current curated content to the live sheet.
   Replaces the Projects tab with the shorter list and updates the
   Los Angeles Cricket group row (youth rec + pro tiers). Safe to re-run.
   --------------------------------------------------------------------- */
/* Footballeros — adult pickup soccer on the west soccer/football area,
   Friday and Saturday 6-7 pm. Re-runnable: it clears its own rows first. */
function applyFootballeros() {
  const GROUP = {
    id: "footballeros", name: "Footballeros", short: "Footballeros", sport: "soccer",
    category: "community", permitStatus: "none", paidPermit: false,
    badges: "COMMUNITY GROUP", programType: "Adult pickup soccer", ages: "Adult",
    level: "Recreational", participants: "", days: "5,6", times: "Fri\u2013Sat 6:00 \u2013 7:00 PM",
    website: "", social: "", socialHandle: "", email: "",
    description: "A neighbourhood pickup crew \u2014 footballeros is Spanish for footballers \u2014 who meet on the west soccer/football area on Friday and Saturday evenings. New players are welcome to join a side.",
    description_es: "", logoUrl: "", status: "approved", example: false, updatedAt: new Date().toISOString()
  };
  const SLOTS = [
    { day: 5, start: "18:00", end: "19:00", sport: "soccer", groupId: "footballeros", facility: "soccerW", type: "Open Recreation", category: "community", title: "" },
    { day: 6, start: "18:00", end: "19:00", sport: "soccer", groupId: "footballeros", facility: "soccerW", type: "Open Recreation", category: "community", title: "" }
  ];
  ensureSheet_("Groups");
  ensureSheet_("Schedule");
  upsertRow("Groups", "id", GROUP);
  rows("Schedule").forEach(function (r) {
    if (String(r.id).indexOf("fb-") === 0) deleteRowBy("Schedule", "id", r.id);
  });
  SLOTS.forEach(function (e, i) { e.id = "fb-" + i; upsertRow("Schedule", "id", e); });
  return "Footballeros added: 1 group row, " + SLOTS.length + " schedule rows.";
}

function applyContentUpdates() {
  applyProjects();
  ensureSheet_("Members");

  const g = rows("Groups").filter(function (r) { return r.id === "lac"; })[0];
  if (!g) { Logger.log("No lac row in Groups — skipped the group update."); return; }
  g.badges = ["PERMITTED ORGANIZATION", "NONPROFIT", "YOUTH REC", "PRO"];
  g.programType = "Youth recreational cricket & Minor League Cricket";
  g.level = "Youth recreational to Minor League";
  g.description = "Nonprofit uniting Los Angeles across cultures and neighborhoods through cricket. Developed the natural-turf pitch at Hjelte and runs youth recreational coaching and community sessions ahead of the LA28 Games. Los Angeles Cricket also organizes Minor League Cricket at Hjelte for LA Lashings, and the Lashings squad runs free community clinics to introduce the game to new players of any age.";
  upsertRow("Groups", "id", g);
  touch();
  Logger.log("Content updated: projects replaced and the Los Angeles Cricket row refreshed.");
}


/* Create a sheet that setup() did not exist to make yet, with its header row. */
function ensureSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(SCHEMA[name]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, SCHEMA[name].length).setFontWeight("bold").setBackground("#E4EFE7");
  }
  return sh;
}

# PRD Update: Local Singer Profile Sharing

## Revised Product Direction

Vocal Warmup will **not require cloud-based public profiles or social profile hosting**.

Instead, the Singer's Profile will remain stored locally on the user's device.

When users want to share their profile, Vocal Warmup will generate a polished **PNG or JPG Singer Profile Card** containing the information they choose to include.

The generated image can then be:

- downloaded;
- posted on social media;
- sent through messaging applications;
- uploaded to Discord;
- added to portfolios;
- shared with vocal coaches;
- shared with other singers.

No account or hosted public profile is required.

---

# Singer's Profile

Each user maintains a local Singer's Profile.

Possible profile information includes:

- display name;
- profile photo or avatar;
- voice type;
- comfortable vocal range;
- confirmed vocal range;
- highest confirmed note;
- lowest confirmed note;
- favorite genres;
- vocal highlights;
- favorite songs;
- song repertoire;
- achievements;
- total practice time;
- current streak;
- number of practice sessions.

Example:

## Ralskies

**Voice Type**  
Baritone / Tenor

**Comfortable Range**  
A2 – E4

**Confirmed Range**  
G2 – G4

**Highest Confirmed Note**  
G4

**Lowest Confirmed Note**  
G2

### Vocal Highlights

- Strong mid-range
- Developing upper mix
- Musical theatre
- Cover vocalist

### Achievements

🏆 100 Practice Sessions  
🔥 30 Day Practice Streak  
🎵 Two Octave Range

---

# Singer Profile Card Generator

Users can generate an image representing their Singer's Profile.

The application should provide a dedicated:

**Share Profile**

or

**Generate Singer Card**

button.

The app renders the profile as a visual card entirely within the browser.

Example layout:

```text
┌────────────────────────────────────┐
│                                    │
│           [ PROFILE IMAGE ]        │
│                                    │
│             RALSKIES               │
│         Baritone / Tenor           │
│                                    │
│  CONFIRMED RANGE                   │
│            G2 ───── G4             │
│                                    │
│  COMFORTABLE RANGE                 │
│            A2 ───── E4             │
│                                    │
│  HIGHEST NOTE          G4          │
│  LOWEST NOTE           G2          │
│                                    │
│  🎵 Musical Theatre                │
│  🎙 Cover Artist                   │
│                                    │
│  🏆 24 Achievements                │
│  🔥 12 Day Streak                  │
│                                    │
│          Vocal Warmup              │
└────────────────────────────────────┘
```

---

# Profile Card Customization

Before generating the card, users choose what information is visible.

Example:

### Include on Card

- [x] Display Name
- [x] Profile Picture
- [x] Voice Type
- [x] Confirmed Vocal Range
- [x] Comfortable Range
- [x] Highest Note
- [x] Lowest Note
- [x] Achievements
- [x] Vocal Highlights
- [ ] Practice Hours
- [ ] Practice Frequency
- [ ] Current Streak
- [ ] Favorite Songs

This allows users to share vocal information without exposing analytics they consider private.

---

# Profile Card Styles

The application should provide several visual templates.

Examples:

### Minimal

Clean singer profile with range and voice type.

### Achievement

Emphasizes badges, practice milestones, and achievements.

### Vocal Range

Large visual representation of the user's range.

Example:

```text
G2                    G4
●─────────────────────●

        24 notes
        2 octaves
```

### Performer

Includes:

- singer name;
- picture;
- voice type;
- genres;
- favorite songs;
- vocal highlights.

### Progress

Shows:

- previous range;
- current range;
- practice hours;
- achievements;
- improvement statistics.

---

# Vocal Range Visualization

The generated card can display the user's range visually using a piano-style graphic.

Example:

```text
C2 D2 E2 F2 G2 A2 B2 C3 D3 E3 F3 G3 A3 B3 C4 D4 E4 F4 G4

            ██████████████████████████████████████████
            G2                                      G4
```

A more polished implementation may display a miniature piano keyboard with highlighted notes.

---

# Achievement Card Generator

Individual achievements should also be exportable as images.

For example:

```text
┌─────────────────────────────────┐
│                                 │
│              🏆                 │
│                                 │
│          NEW VOCAL NOTE         │
│                                 │
│              G4                 │
│                                 │
│     Confirmed Vocal Range       │
│           G2 – G4               │
│                                 │
│       August 27, 2026           │
│                                 │
│          Vocal Warmup           │
└─────────────────────────────────┘
```

This creates an easy way for users to share milestones without building a social network into the application.

---

# Range Progress Card

Users should also be able to generate progress cards.

Example:

```text
VOCAL RANGE PROGRESS

May
A2 ──────── E4

August
G2 ───────────── G4

+4 semitones gained

32 Practice Sessions
8.4 Hours Practiced
```

The system should avoid presenting range growth as the sole indicator of vocal improvement.

---

# Session Result Card

After completing a warmup, the session summary may contain:

**Share Result**

This generates an optional image.

Example:

```text
TODAY'S VOCAL WARMUP

14 min 32 sec

Pitch Accuracy
87%

Range Practiced
A2 – F4

Best Note
D4 — 94%

🔥 6 Day Streak
```

---

# Image Generation Architecture

Profile images should be generated entirely on the client.

Recommended architecture:

```text
Singer Profile Data
        ↓
Profile Card Component
        ↓
Browser Rendering
        ↓
Canvas / SVG
        ↓
PNG or JPG
        ↓
User Device
```

Potential technologies include:

- HTML Canvas API;
- SVG;
- html-to-image;
- modern-screenshot;
- DOM-to-image style libraries.

SVG-based rendering may provide the best consistency before exporting to PNG.

---

# Export Formats

Initial support:

### PNG

Recommended default.

Benefits:

- lossless;
- good text quality;
- transparency support;
- ideal for profile cards.

### JPG

Optional.

Useful when users want smaller files.

Future support:

- WebP;
- SVG;
- PDF profile sheet.

---

# Export Sizes

Recommended presets:

### Square

**1080 × 1080**

Useful for:

- Instagram;
- Discord;
- profile posts.

### Story

**1080 × 1920**

Useful for:

- Instagram Stories;
- Facebook Stories;
- TikTok.

### Landscape

**1200 × 630**

Useful for:

- Twitter/X;
- Facebook;
- link posts.

### Compact Card

**1200 × 800**

Useful for:

- Discord;
- messaging;
- portfolios.

---

# Privacy Model

Vocal Warmup should now follow a strongly local-first model.

## Stored Locally

- Singer's Profile
- practice history;
- routines;
- achievements;
- vocal range;
- detailed pitch data;
- song repertoire;
- profile picture;
- generated profile cards;
- optional recordings.

## Never Automatically Uploaded

- microphone audio;
- recordings;
- pitch history;
- vocal range;
- profile details;
- practice statistics;
- generated profile cards.

The user determines where generated images are shared after they leave the application.

---

# Revised Account Requirement

An online account is **not required for the core product**.

The MVP should operate without:

- login;
- registration;
- authentication;
- cloud profiles;
- hosted user pages;
- follower systems;
- friend systems;
- server-side profile storage.

The user simply opens the application and begins practicing.

---

# Local Persistence

Use **IndexedDB** for persistent user information.

Store locally:

```text
SingerProfile
Exercises
Routines
PracticeSessions
Achievements
Songs
Settings
Analytics
```

The browser becomes the primary local database.

---

# Optional Backup

Because information is local, users should eventually be able to manually create a backup.

Example:

**Settings → Data → Export Backup**

Produces:

`vocal-warmup-backup.json`

The user can later select:

**Import Backup**

This allows users to move data between devices without requiring an account.

---

# Revised Product Architecture

```text
                     VOCAL WARMUP
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       Practice         Progress        Profile
          │                │                │
          ▼                ▼                ▼
     Pitch Engine      Analytics      Singer Profile
          │                │                │
          └────────────────┼────────────────┘
                           │
                       IndexedDB
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
             JSON Backup       Image Generator
                                     │
                                PNG / JPG
                                     │
                                User Shares
```

There is no server required in the normal flow.

---

# Revised MVP Scope

## P0

### Vocal Engine

- microphone access;
- real-time pitch detection;
- target note detection;
- cents sharp/flat;
- pitch confidence.

### Practice

- exercises;
- timers;
- guided warmups;
- custom routines;
- transposition.

### Progress

- practice history;
- practice time analytics;
- frequency analytics;
- range history;
- achievements.

### Singer's Profile

- display name;
- optional picture;
- voice type;
- confirmed range;
- comfortable range;
- vocal highlights;
- favorite songs;
- achievements.

### Sharing

- Singer Profile Card generator;
- PNG export;
- selectable profile information;
- square profile card template.

### Local Storage

- IndexedDB;
- no account required;
- no raw audio uploading.

---

# P1

- multiple profile card themes;
- JPG export;
- Story-sized cards;
- achievement cards;
- range progression cards;
- session result cards;
- JSON backup/export;
- JSON data import;
- additional analytics.

---

# P2

- custom card colors;
- custom backgrounds;
- custom fonts;
- custom profile layouts;
- QR codes linking to external singer pages;
- portfolio-ready profile sheets;
- printable singer resume/profile;
- share directly through the Web Share API.

---

# Updated Product Differentiator

Vocal Warmup becomes a **private, local-first vocal training environment** rather than another account-driven platform.

Users can train, track their progress, build a detailed representation of their voice, and export that information whenever they want.

The application does not need to know where they post it.

The core loop becomes:

```text
Sing
 ↓
Analyze
 ↓
Practice
 ↓
Improve
 ↓
Track
 ↓
Unlock
 ↓
Generate Singer Card
 ↓
Share Anywhere
```

This keeps Vocal Warmup focused on what it is actually meant to do:

**help singers understand and develop their voice.**

Sharing becomes an output of the training system rather than an entire social network bolted onto it.
# Product Requirements Document: Vocal Warmup Web App

**Working Title:** Vocal Warmup  
**Product Type:** Responsive Web App / Progressive Web App  
**Platform:** Desktop and mobile browsers  
**Primary Principle:** Local-first vocal training with real-time pitch feedback and privacy-preserving audio analysis  
**Status:** Initial PRD / MVP Definition

---

## 1. Product Overview

Vocal Warmup is a web-based vocal training application inspired by the guided learning experience of apps such as Simply Piano and Vocalista.

The application helps singers perform structured vocal warmups while receiving real-time visual feedback about their pitch, vocal range, consistency, and practice habits.

Unlike many vocal training applications, Vocal Warmup should prioritize **privacy and local processing**. Microphone audio should be analyzed directly inside the user's browser whenever technically possible.

Raw recordings should not need to leave the user's device.

The application combines:

- Real-time pitch tracking
- Guided vocal exercises
- Practice routines
- Timers
- Vocal-range tracking
- Achievement systems
- Practice analytics
- Singer profiles
- Optional social/profile sharing

The goal is to make vocal practice feel less like staring at a tuner and more like progressing through a training program.

---

# 2. Problem Statement

Singers practicing alone frequently lack immediate feedback.

A singer may know the note they are supposed to sing but have difficulty determining:

- whether they are actually hitting the note;
- whether they are sharp or flat;
- how consistently they can hold a pitch;
- whether their vocal range is improving;
- how often they practice;
- which notes are becoming easier;
- how much time they spend warming up;
- what exercises work best for them.

Traditional tuner applications solve only part of the problem.

Vocal training apps may provide exercises, but many lock useful features behind mobile applications, require accounts, provide limited analytics, or process recordings remotely.

Vocal Warmup aims to combine **guided practice, pitch detection, progression tracking, and singer-specific analytics** in one browser-based experience.

---

# 3. Product Vision

Create a personal vocal training companion that answers:

> "What should I practice, am I singing it correctly, and am I improving?"

A user should be able to open the website, select a routine, enable their microphone, and immediately begin singing.

During the exercise, the application should visually guide the singer toward each expected pitch.

Afterward, the application should show meaningful information about the session and update the singer's long-term progress.

---

# 4. Product Principles

## 4.1 Local First

Raw microphone audio should remain on the user's device by default.

Audio analysis should happen inside the browser using browser APIs and client-side algorithms.

Cloud storage should only be required for features that genuinely require synchronization or sharing.

---

## 4.2 Immediate Feedback

Feedback must happen fast enough that singers can adjust their voice while singing.

The interface should prioritize:

- current note;
- expected note;
- cents sharp/flat;
- pitch stability;
- exercise progression.

---

## 4.3 Encourage, Don't Punish

The product should encourage improvement rather than turn singing into a red error-screen simulator devised by an unusually bitter piano teacher.

Small pitch deviations should be shown constructively.

Examples:

- Perfect
- On pitch
- Slightly sharp
- Slightly flat
- Almost there

Users should not feel that every vibrato cycle represents catastrophic failure.

---

## 4.4 Progress Should Be Visible

Practicing should produce measurable progression through:

- streaks;
- total practice time;
- session frequency;
- vocal range;
- note accuracy;
- achievements;
- routine completion.

---

## 4.5 Singer Identity

The user's profile should represent them as a singer rather than just another account.

Profiles can contain:

- vocal range;
- comfortable range;
- highest confirmed note;
- lowest confirmed note;
- voice type;
- favorite songs;
- song highlights;
- vocal strengths;
- achievements;
- practice milestones.

---

# 5. Target Users

## Primary Users

### Beginner Singers

Users learning basic pitch control who need strong visual guidance.

### Intermediate Singers

Users who already sing but want structured warmups and measurable progress.

### Cover Artists / Content Creators

Singers preparing vocals for songs, recordings, performances, and online content.

### Musical Theatre Singers

Users who may regularly practice:

- range;
- belts;
- sustained notes;
- agility;
- transitions;
- head/chest/mix coordination.

### Casual Singers

Users who simply want a quick guided warmup before karaoke, rehearsal, church, performances, or recording.

---

# 6. Goals

The product should:

1. Detect the user's sung pitch in real time.
2. Compare detected pitch against exercise target notes.
3. Guide the singer through structured warmups.
4. Track vocal range progression.
5. Allow users to create custom warmup routines.
6. Measure practice time and frequency.
7. Reward vocal milestones.
8. Display long-term vocal analytics.
9. Provide a shareable Singer's Profile.
10. Keep raw voice processing local whenever possible.

---

# 7. Non-Goals for MVP

The initial version does **not** need to:

- diagnose vocal health conditions;
- replace a professional vocal coach;
- automatically classify vocal fach with medical-level certainty;
- generate AI vocal feedback from uploaded recordings;
- provide full DAW functionality;
- provide professional studio recording;
- perform automatic vocal tuning;
- host public audio recordings;
- act as a social media platform;
- identify whether singing technique is healthy solely from pitch.

These could become future research areas but should not block the core product.

---

# 8. Core User Flow

## First-Time User

1. User opens Vocal Warmup.
2. User creates an account or continues locally.
3. User grants microphone permission.
4. Application performs microphone calibration.
5. User completes an optional vocal range test.
6. Application creates an initial Singer's Profile.
7. User chooses a recommended warmup.
8. Warmup begins.
9. Pitch tracker displays real-time feedback.
10. Session completes.
11. Results are displayed.
12. Statistics and achievements are updated.

---

# 9. Main Navigation

Recommended primary navigation:

### Home
Today's practice overview.

### Practice
Start exercises and warmups.

### Routines
Create and manage warmup routines.

### Progress
Analytics, graphs, range, frequency, and achievements.

### Profile
Singer's Profile and sharing options.

---

# 10. Home Dashboard

The dashboard should answer:

> "What should I do today?"

Display:

- current streak;
- minutes practiced this week;
- recommended warmup;
- last practice session;
- current vocal range;
- newest achievement;
- weekly practice goal;
- quick start button.

Example:

**Today's Warmup**

12 minutes  
Range: G2–E4  
Focus: Resonance + Range

**Start Warmup**

Additional dashboard cards:

- 4 Day Streak
- 73 Minutes This Week
- Highest Note: A4
- 5 Sessions This Week

---

# 11. Real-Time Pitch Tracker

The pitch tracker is the central feature.

## Input

Microphone input obtained using:

`navigator.mediaDevices.getUserMedia()`

Audio should flow into the Web Audio API for processing.

---

## Pitch Detection

The application should continuously estimate:

- frequency in Hz;
- musical note;
- octave;
- cents deviation;
- confidence;
- amplitude.

Example output:

**Detected**

A4  
440.3 Hz  
+1 cent

---

## Target Pitch

During guided exercises, the application also knows the expected note.

Example:

**Target:** A4  
**You:** G#4

Visual feedback should indicate direction.

Example:

`FLAT ← | TARGET | → SHARP`

---

# 12. Pitch Visualization

The pitch interface should support multiple visual modes.

## Tuner Mode

Shows the currently detected note.

Example:

`♭ ← -18 cents | C4 | +18 cents → ♯`

---

## Guided Note Mode

Shows the user's pitch against the note they are expected to sing.

Example:

```text
Target: E4

           ───────── E4 ─────────

Your voice:       ●
```

The dot moves vertically according to pitch.

---

## Pitch Timeline

Display pitch movement over time.

```text
E4 ───────────── TARGET
        ~~~~~~~~
D#4
```

The user's sung pitch becomes a moving line.

This allows singers to see:

- scooping;
- falling flat;
- overshooting;
- vibrato;
- pitch instability.

---

# 13. Pitch Accuracy

Pitch accuracy should allow tolerance.

Suggested defaults:

**Excellent:** ±10 cents  
**Good:** ±20 cents  
**Acceptable:** ±35 cents  
**Off Pitch:** >35 cents

Tolerance may later be configurable.

The algorithm must avoid treating natural vibrato as repeated incorrect notes.

---

# 14. Pitch Detection Requirements

Target:

- Detection latency: **<100 ms preferred**
- Update frequency: **20–60 updates per second**
- Effective vocal frequency range: approximately **65 Hz–1400 Hz**
- Confidence filtering to ignore noise
- Ignore silence
- Noise gate support
- Smoothing between detected frames

Potential algorithms:

- YIN
- Fast YIN
- McLeod Pitch Method
- pYIN
- autocorrelation

A WebAssembly implementation may be considered if JavaScript performance becomes insufficient.

---

# 15. Local Audio Processing

Raw microphone audio should not leave the browser during normal exercises.

Recommended pipeline:

```text
Microphone
     ↓
getUserMedia
     ↓
Web Audio API
     ↓
AudioWorklet
     ↓
Pitch Detection
     ↓
Pitch Data
     ↓
Exercise Engine
     ↓
UI + Local Analytics
```

Only derived information needs to be stored.

Example:

```json
{
  "timestamp": 1540,
  "frequency": 440.2,
  "note": "A4",
  "cents": 1.1,
  "confidence": 0.96
}
```

Raw audio does not need to be transmitted.

---

# 16. Optional Recording

Users may optionally record practice sessions.

Recording must be explicitly enabled.

The UI should clearly indicate:

**Recording locally**

Recordings may be stored using:

- IndexedDB;
- browser storage;
- local file export.

Recording should be separate from pitch tracking.

The microphone may be analyzed without creating a permanent recording.

---

# 17. Privacy Modes

Provide clear privacy states.

### Private

Everything remains local.

### Sync

Practice statistics sync to the user's account.

Raw audio remains local.

### Share Profile

Selected Singer's Profile information becomes accessible through a profile link.

Users control individual fields.

Example:

```text
Share:

[x] Vocal Range
[x] Achievements
[x] Favorite Songs
[x] Voice Type
[ ] Practice Frequency
[ ] Practice Minutes
[ ] Highest Belt Note
```

---

# 18. Guided Vocal Exercises

The application should include built-in exercises.

Initial categories:

### General Warmup

- humming;
- lip trills;
- five-note scales;
- sirens;
- octave slides.

### Range

- ascending scale;
- descending scale;
- octave extension.

### Pitch Accuracy

- single note matching;
- intervals;
- sustained pitch;
- repeated notes.

### Agility

- five-note runs;
- arpeggios;
- faster scales.

### Resonance

Exercises focused on:

- humming;
- nasal consonants;
- vowels.

---

# 19. Exercise Definition System

Exercises should be represented as structured data rather than individually hard-coded.

Example:

```json
{
  "name": "Five Note Scale",
  "pattern": [0, 2, 4, 5, 7, 5, 4, 2, 0],
  "tempo": 90,
  "direction": "ascending",
  "transposeAfterRound": 1
}
```

This allows the exercise engine to reuse patterns in different keys.

---

# 20. Dynamic Transposition

Exercises should automatically transpose.

Example:

```text
C → C# → D → D# → E → F
```

The user may configure:

- starting note;
- ending note;
- step direction;
- semitone or whole-tone progression.

Example:

**Start:** C3  
**End:** G4  
**Step:** +1 semitone

---

# 21. Vocal Range Safety

Exercises should respect the user's configured range.

If the Singer's Profile lists:

**Comfortable Range:** G2–E4

the application should avoid automatically pushing exercises dramatically beyond that range.

The user may manually expand the target.

The app should never imply that a higher note automatically means better singing.

---

# 22. Warmup Timer

Each session includes a timer.

Display:

- current exercise time;
- total session time;
- remaining routine time.

Example:

```text
05:42

Exercise
Five Note Scale

1:18 remaining
```

Users may set:

- exercise duration;
- rest duration;
- routine duration.

---

# 23. Practice Routines

Users can combine exercises into reusable routines.

Example:

## Recording Day Warmup

1. Lip Trill — 2 min
2. Humming — 2 min
3. Five Note Scale — 4 min
4. Octave Slides — 3 min
5. Pitch Accuracy — 3 min

**Total:** 14 minutes

---

# 24. Routine Builder

Users should be able to:

- add exercise;
- remove exercise;
- reorder exercise;
- set duration;
- set key;
- set starting pitch;
- set ending pitch;
- set BPM;
- change transposition;
- set rest intervals.

Potential UI:

```text
Recording Warmup

☰ Lip Trills            2:00
☰ Five Note Scale       4:00
☰ Octave Slides         3:00
☰ Sustained Notes       3:00

+ Add Exercise

Total: 12:00
```

Drag-and-drop ordering should be supported.

---

# 25. Routine Templates

Include preset routines such as:

- Quick 5-Minute Warmup
- Standard 10-Minute Warmup
- Recording Warmup
- Morning Gentle Warmup
- Range Development
- Pitch Accuracy
- Musical Theatre Warmup
- High Note Preparation
- Low Note Warmup

Users may duplicate and modify templates.

---

# 26. Session Summary

After completing a routine:

```text
Warmup Complete

Duration
14:32

Pitch Accuracy
87%

Notes Practiced
G2 – F4

Best Sustained Note
D4 — 94%

New Highest Note
F4

🔥 4 Day Streak
```

The summary should feel rewarding without pretending vocal training is an RPG boss battle. Although, frankly, E5 sometimes qualifies.

---

# 27. Achievements

Achievements encourage consistent practice.

Categories:

## Range Achievements

Examples:

- Reached C4
- Reached E4
- Reached G4
- New Highest Note
- New Lowest Note
- 2-Octave Range
- 3-Octave Range

---

## Practice Achievements

Examples:

- First Warmup
- 1 Hour Practiced
- 10 Hours Practiced
- 50 Sessions
- 100 Sessions

---

## Consistency Achievements

Examples:

- 3 Day Streak
- 7 Day Streak
- 30 Day Streak
- Practiced 4 Weeks in a Row

---

## Accuracy Achievements

Examples:

- Perfect Note
- 90% Accuracy Exercise
- 95% Accuracy Exercise
- Hold a Note for 5 Seconds
- Hold a Note for 10 Seconds

---

# 28. Confirming New Range Notes

A single accidental squeak should not award:

> Congratulations, you have unlocked C6.

A new highest or lowest note should require verification.

Possible rule:

A note counts as **Confirmed** when:

- confidence exceeds threshold;
- pitch remains within ±30 cents;
- note is sustained for at least 500–1000 ms;
- note appears multiple times across sessions.

Range can therefore distinguish:

### Detected Range

Every valid note detected.

### Confirmed Range

Notes demonstrated consistently.

### Comfortable Range

Range manually selected or determined through repeated stable singing.

This distinction is extremely important.

---

# 29. Progress Analytics

Create a dedicated **Progress** section.

Primary tabs:

- Overview
- Range
- Practice
- Accuracy
- Achievements

---

# 30. Practice Frequency Graph

Display sessions over time.

Example:

```text
Sessions

Mon ███
Tue █
Wed ████
Thu ██
Fri ███
Sat █████
Sun ██
```

Filters:

- 7 days;
- 30 days;
- 3 months;
- 1 year;
- all time.

---

# 31. Practice Time Graph

Track minutes spent practicing.

Metrics:

- today;
- this week;
- this month;
- average session duration;
- longest session;
- total lifetime practice.

---

# 32. Vocal Range Graph

Plot range progression.

Example:

```text
        Highest Note
G4 |                   ●
F4 |             ●─────
E4 |       ●─────
D4 | ●─────
   +-----------------------
     May Jun Jul Aug

C3 | ●────────────────
B2 |       ●──────────
A2 |             ●────
        Lowest Note
```

This allows users to visualize range growth over months.

---

# 33. Note Heatmap

Display which notes the singer practices most frequently.

Example:

```text
C3 ░
D3 ██
E3 ████
F3 █████
G3 ███████
A3 ███████
B3 █████
C4 ████████
D4 █████
E4 ███
F4 ██
```

This could eventually become one of the application's strongest analytics features.

---

# 34. Pitch Accuracy Analytics

Track:

- average cents error;
- percentage within ±10 cents;
- percentage within ±20 cents;
- sustained note stability;
- accuracy by note;
- accuracy by exercise.

Example:

```text
Most Accurate

C4    96%
D4    94%
G3    92%

Needs Practice

F#4   71%
G4    63%
```

---

# 35. Singer's Profile

Every user may create a Singer's Profile.

Example:

# Ralskies

**Voice:** Baritone / Tenor  
**Comfortable Range:** A2–E4  
**Confirmed Range:** G2–G4  
**Highest Note:** G4  
**Lowest Note:** G2

### Vocal Highlights

- Strong mid-range
- Comfortable chest voice
- Developing upper mix
- Musical theatre / cover vocalist

### Favorite Songs

- Song A
- Song B
- Song C

### Achievements

🏆 100 Practice Sessions  
🔥 30 Day Streak  
🎵 Two Octave Range

---

# 36. Song Highlights

Users may add songs to their Singer's Profile.

Each song may contain:

- song title;
- artist/show;
- key;
- lowest note;
- highest note;
- performance status;
- personal notes.

Example:

## Song Name

**Original Key:** D Major  
**Song Range:** A2–F#4  
**My Key:** C Major  
**My Range:** G2–E4

Tags:

- Comfortable
- Performance Ready
- Learning
- Challenging
- Dream Song

---

# 37. Public Singer Profiles

Profiles should be shareable through a URL.

Example:

`app.example.com/singer/ralskies`

Public profiles may contain:

- profile picture;
- display name;
- bio;
- voice classification;
- confirmed vocal range;
- comfortable range;
- achievements;
- favorite songs;
- song highlights;
- practice stats if enabled.

Raw audio should **not** automatically become public.

---

# 38. Profile Comparison

Future versions may allow singers to compare profiles.

Example:

```text
Singer A          Singer B

G2 – G4           C3 – C5

2 octaves         2 octaves

Baritone          Mezzo-Soprano
```

This should remain informational rather than competitive.

---

# 39. Following / Friends

Future versions may support:

- following singers;
- friends;
- viewing achievements;
- sharing routines;
- sharing song preparation;
- reacting to achievements.

The MVP only requires shareable profiles.

A full social network should not be built until the core practice experience works extremely well, because humanity has already produced a sufficient number of social networks.

---

# 40. Account Architecture

The product should support two states.

## Local User

No account required.

Stores:

- routines;
- sessions;
- achievements;
- settings;
- profile;
- pitch analytics.

Using:

**IndexedDB**

---

## Cloud Account

Optional account enables:

- synchronization between devices;
- public profile;
- shared routines;
- profile links;
- backup.

Raw audio should remain local unless the user explicitly uploads something.

---

# 41. Recommended Data Separation

### Local Only

```text
Raw microphone stream
Audio recordings
Detailed pitch frames
Temporary waveform information
```

### Can Be Synced

```text
Session duration
Average accuracy
Highest confirmed note
Lowest confirmed note
Achievements
Routine definitions
Singer profile
Practice dates
Song information
```

This architecture dramatically reduces privacy concerns.

---

# 42. Proposed Technical Architecture

## Frontend

Recommended:

- React
- TypeScript
- Vite
- Tailwind CSS
- Progressive Web App support

Potential framework alternative:

- Next.js if server-side profile sharing becomes central.

---

# 43. Browser Audio Stack

Recommended:

```text
MediaDevices API
        ↓
Web Audio API
        ↓
AudioWorklet
        ↓
Pitch Detector
        ↓
Exercise Evaluation Engine
        ↓
React State
        ↓
UI
```

Avoid processing intensive audio directly on the main UI thread.

Use an **AudioWorklet** where possible.

---

# 44. Client Storage

Use:

### IndexedDB

Store:

- sessions;
- routines;
- achievements;
- songs;
- analytics;
- detailed pitch summaries.

Libraries such as Dexie may simplify IndexedDB management.

---

# 45. Backend

Backend should remain minimal for MVP.

Potential services:

- Supabase
- Firebase
- custom API

Recommended responsibilities:

```text
Authentication
Profiles
Profile sharing
User settings
Routine synchronization
Aggregated practice statistics
```

Backend should not receive microphone streams.

---

# 46. Analytics Architecture

After every session, detailed local pitch frames should be converted into summary statistics.

Example:

```json
{
  "sessionId": "abc123",
  "date": "2026-08-27",
  "durationSeconds": 742,
  "averageAccuracy": 86.4,
  "highestDetected": "F4",
  "highestConfirmed": "E4",
  "lowestDetected": "G2",
  "lowestConfirmed": "A2",
  "notes": {
    "C4": {
      "attempts": 28,
      "accuracy": 92
    }
  }
}
```

Only this summarized information needs to be synced.

---

# 47. Core Data Models

## User

```text
id
displayName
username
profilePicture
bio
voiceType
createdAt
```

---

## SingerProfile

```text
userId
highestDetectedNote
highestConfirmedNote
lowestDetectedNote
lowestConfirmedNote
comfortableLow
comfortableHigh
voiceClassification
favoriteGenres
profileVisibility
```

---

## Exercise

```text
id
name
category
pattern
defaultTempo
defaultDuration
difficulty
instructions
```

---

## Routine

```text
id
userId
name
description
exerciseIds
estimatedDuration
createdAt
updatedAt
```

---

## PracticeSession

```text
id
userId
routineId
startedAt
endedAt
duration
averageAccuracy
highestNote
lowestNote
notesAttempted
```

---

## Achievement

```text
id
name
description
category
icon
requirement
```

---

## UserAchievement

```text
userId
achievementId
earnedAt
metadata
```

---

## Song

```text
id
userId
title
artist
originalKey
userKey
lowestNote
highestNote
status
notes
```

---

# 48. Microphone Calibration

Before the first session:

```text
Microphone Setup

1. Stay quiet for 3 seconds.
2. Sing a comfortable note.
3. Adjust microphone sensitivity.
```

Calibration determines:

- ambient noise level;
- minimum amplitude threshold;
- microphone sensitivity;
- pitch detection confidence.

Users should be able to rerun calibration.

---

# 49. Practice Screen

Recommended layout:

```text
┌─────────────────────────────────────┐
│ Five Note Scale           03:24     │
│                                     │
│ Target                         E4    │
│                                     │
│               ●                     │
│ ──────────────────────────────────  │
│                 E4                  │
│                                     │
│ YOU                                 │
│ D#4                    -18 cents     │
│                                     │
│ ███████████░░ Pitch Stability       │
│                                     │
│ Previous                  Next      │
└─────────────────────────────────────┘
```

On mobile, the note target and pitch visualization should dominate the screen.

---

# 50. Accessibility

Support:

- high contrast;
- reduced motion;
- screen readers where practical;
- keyboard navigation;
- large pitch labels;
- color-independent sharp/flat indicators.

Do not rely exclusively on red/green to indicate pitch accuracy.

---

# 51. Responsive Design

The application should support:

- smartphones;
- tablets;
- laptops;
- desktops.

Mobile should be treated as a primary experience rather than a compressed desktop layout.

A PWA installation option should allow Vocal Warmup to behave similarly to a native application.

---

# 52. Offline Support

Core warmup functionality should eventually work offline.

Once application assets and exercises are cached:

Users should still be able to:

- track pitch;
- perform exercises;
- record sessions;
- access routines;
- view local analytics.

Cloud synchronization can occur once connectivity returns.

---

# 53. Permissions

Microphone permission should only be requested when needed.

Before triggering the browser permission dialog, explain:

> Vocal Warmup uses your microphone to detect pitch. Audio is processed locally on your device and is not uploaded during normal practice.

Buttons:

**Enable Microphone**

**Learn About Privacy**

---

# 54. Security and Privacy Requirements

The application must:

- use HTTPS;
- never silently activate the microphone;
- display microphone state;
- stop microphone capture after exercises;
- require explicit recording consent;
- provide delete-session controls;
- provide delete-all-local-data controls;
- allow profile privacy configuration.

Users should be able to inspect what information is synchronized.

---

# 55. MVP Feature Scope

## P0: Required

### Pitch

- microphone access;
- real-time pitch detection;
- note detection;
- cents sharp/flat;
- pitch confidence;
- target-note comparison.

### Exercises

- guided notes;
- five-note scale;
- sustained notes;
- ascending/descending exercises;
- transposition.

### Practice

- session timer;
- exercise timer;
- routine system;
- custom routines.

### Progress

- practice history;
- total practice time;
- practice frequency;
- vocal range;
- achievements.

### Storage

- IndexedDB;
- local-first practice history.

### Profile

- Singer's Profile;
- vocal range;
- achievements;
- song list;
- song ranges.

---

# 56. P1: Post-MVP

- user accounts;
- cross-device syncing;
- public profile sharing;
- routine sharing;
- advanced analytics;
- note heatmaps;
- practice streaks;
- PWA offline installation;
- range test;
- calibration wizard.

---

# 57. P2: Future Features

- friends/followers;
- profile comparisons;
- collaborative routines;
- vocal coach accounts;
- teacher/student dashboards;
- MIDI keyboard input;
- interval training;
- ear training;
- harmony exercises;
- generated warmups based on range;
- automatic routine recommendations;
- song-range database;
- preparation routines based on songs;
- audio playback analysis;
- AI-generated session summaries.

---

# 58. Future Song-Based Warmup

A major future feature could allow:

```text
What are you singing today?

Song: Example Song
Key: D Major
Range: A2 – F#4
```

Vocal Warmup could automatically generate:

**Recommended 12-Minute Warmup**

- 2 min resonance
- 3 min mid-range scales
- 3 min F#4 preparation
- 2 min interval training
- 2 min song-range exercises

This connects warmups directly with what the singer actually intends to perform.

---

# 59. Future Smart Recommendations

The system could identify patterns.

Example:

> Your pitch accuracy around F4 has improved 12% this month.

Or:

> G4 has been inconsistent during your last five sessions. Today's routine includes additional exercises around E4–G4.

These recommendations can initially be calculated locally without requiring an AI model.

---

# 60. Success Metrics

Primary product metrics:

### Engagement

- weekly active singers;
- practices per week;
- average session length;
- routine completion rate.

### Retention

- 7-day retention;
- 30-day retention;
- returning singers.

### Training

- average practice frequency;
- accuracy improvement;
- range progression;
- achievement completion.

### Product

- microphone setup success rate;
- pitch detection failure rate;
- exercise abandonment rate.

---

# 61. Technical Success Criteria

The MVP should achieve:

- microphone startup <2 seconds after permission;
- pitch feedback latency preferably below 100 ms;
- stable note detection across common microphones;
- no server dependency for pitch detection;
- no mandatory account for practice;
- local persistence between browser sessions;
- responsive operation on modern mobile devices.

---

# 62. MVP Acceptance Criteria

The MVP is considered successful when a user can:

1. Open the application.
2. Enable their microphone.
3. Sing a note.
4. See the detected musical note.
5. See whether they are sharp or flat.
6. Start a guided exercise.
7. Follow changing target notes.
8. Complete a timed warmup.
9. Create a custom routine.
10. Save that routine.
11. Complete multiple practice sessions.
12. View practice history.
13. View practice-time graphs.
14. View practice-frequency graphs.
15. See their detected and confirmed vocal range.
16. Unlock achievements.
17. Maintain a Singer's Profile.
18. Add songs and their vocal ranges.
19. Use all core practice functionality without sending raw audio to a server.

---

# 63. Recommended MVP Development Order

## Phase 1: Pitch Engine

Build:

```text
Microphone
→ AudioWorklet
→ Pitch Detection
→ Note Conversion
→ Cents Calculation
→ Visual Tuner
```

Nothing else matters if this feels unreliable.

---

## Phase 2: Exercise Engine

Build:

```text
Exercise Pattern
→ Target Notes
→ Timing
→ Transposition
→ Pitch Comparison
```

Then implement the first guided five-note exercise.

---

## Phase 3: Practice Sessions

Add:

- timer;
- session state;
- accuracy calculation;
- session summary.

---

## Phase 4: Local Database

Implement IndexedDB for:

- sessions;
- routines;
- profile;
- achievements;
- analytics.

---

## Phase 5: Routine Builder

Allow multiple exercises to form custom warmups.

---

## Phase 6: Analytics

Add:

- practice time;
- frequency;
- range history;
- accuracy;
- note distribution.

---

## Phase 7: Achievements

Create milestones based on persisted practice data.

---

## Phase 8: Singer's Profile

Create the complete private local profile.

---

## Phase 9: Accounts and Sharing

Only after the local product is stable should the application add:

```text
Authentication
Profile syncing
Public profile URLs
Routine sharing
```

---

# 64. Proposed Product Structure

```text
Vocal Warmup
│
├── Home
│   ├── Today's Routine
│   ├── Streak
│   ├── Weekly Minutes
│   └── Recent Achievement
│
├── Practice
│   ├── Quick Warmup
│   ├── Exercises
│   ├── Pitch Trainer
│   └── Range Test
│
├── Routines
│   ├── My Routines
│   ├── Templates
│   └── Routine Builder
│
├── Progress
│   ├── Overview
│   ├── Practice Time
│   ├── Frequency
│   ├── Range
│   ├── Accuracy
│   ├── Notes
│   └── Achievements
│
└── Singer Profile
    ├── Vocal Range
    ├── Voice Type
    ├── Highlights
    ├── Songs
    ├── Achievements
    └── Sharing
```

---

# 65. Key Product Differentiator

The strongest version of Vocal Warmup is not simply:

> "A tuner with exercises."

Its differentiator should be:

> **A private, personalized vocal training system that learns your singing history and visually shows how your voice develops over time.**

The combination of:

**real-time pitch guidance + routines + local processing + vocal-range history + song tracking + Singer's Profile**

creates something considerably more useful than an ordinary tuner or static warmup application.

Most importantly, users build a persistent record of themselves as singers.

Instead of simply showing:

**You sang A4.**

Vocal Warmup eventually understands:

> You've practiced A4 63 times. It entered your confirmed range three months ago, your accuracy has increased from 61% to 89%, and it appears in three songs you're currently preparing.

That progression system should become the heart of the product.
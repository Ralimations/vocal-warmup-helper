# Vocal Warmup
## Product Requirements Document

**Version:** 1.0  
**Status:** Functional MVP Specification  
**Product Type:** Local-first vocal training web application  
**Primary Platform:** Desktop and mobile web browsers  
**Backend:** None for V1  
**Future Backend:** Supported by architecture, but explicitly out of scope  
**Primary Design Inspiration:** Guided learning applications such as Simply Piano and modern vocal training applications

---

# 1. Executive Summary

**Vocal Warmup** is a privacy-first web application for singers that combines:

- real-time pitch detection;
- guided vocal exercises;
- custom warmup routines;
- practice timers;
- vocal-range tracking;
- achievements;
- historical analytics;
- song tracking;
- singer profiles;
- locally generated profile and achievement cards.

The application listens to a user's microphone and analyzes their voice directly within the browser.

For V1:

**Raw audio never needs to leave the user's device.**

All application data is stored locally using IndexedDB.

Users do not need:

- an account;
- a login;
- a subscription;
- a backend connection;
- cloud storage.

The product should still be architected so that optional cloud features can be introduced in the future without redesigning the core application.

---

# 2. Product Vision

Vocal Warmup should feel like a **personal training dashboard for a singer's voice**.

Instead of simply displaying:

> You are singing A4.

The application should eventually be capable of telling the singer:

> A4 is part of your confirmed range. You practiced it in six sessions this month, and your pitch accuracy on that note improved from 74% to 89%.

The product therefore combines three major systems:

### Practice

What should the singer practice?

### Guidance

Is the singer performing the exercise correctly?

### Progress

How is the singer developing over time?

---

# 3. Core Product Principles

## 3.1 Local First

The application should provide its complete core experience without requiring a server.

The user's:

- recordings;
- detailed pitch data;
- routines;
- practice history;
- profile;
- achievements;
- settings;
- vocal analytics

remain stored on their own device.

---

## 3.2 Privacy by Architecture

Privacy should not merely be a checkbox in Settings.

The system should fundamentally be designed so that microphone audio does not need to be transmitted elsewhere.

The default architecture is:

```text
Microphone
    ↓
Browser
    ↓
Audio Processing
    ↓
Pitch Detection
    ↓
Practice Engine
    ↓
Local Analytics
    ↓
IndexedDB
```

Not:

```text
Microphone
    ↓
Mystery Server Somewhere
```

---

# 4. Product Goals

V1 should allow a singer to:

1. Open the application.
2. Configure their singer profile.
3. Grant microphone access.
4. View their detected pitch in real time.
5. Determine whether they are sharp or flat.
6. Follow guided vocal exercises.
7. Hear reference notes.
8. Complete timed warmups.
9. Create custom practice routines.
10. Record optional practice audio locally.
11. Track their vocal range.
12. Track their practice frequency.
13. Track their practice duration.
14. Track pitch accuracy.
15. Unlock achievements.
16. Add songs they are preparing.
17. Track the range of those songs.
18. View historical progress.
19. Generate a shareable Singer Profile image.
20. Export their local application data.

---

# 5. Non-Goals for V1

V1 will not include:

- user registration;
- login;
- social accounts;
- cloud synchronization;
- hosted singer profiles;
- friend systems;
- followers;
- online leaderboards;
- cloud storage;
- server-side pitch detection;
- server-side audio analysis;
- streaming;
- vocal-health diagnosis;
- automatic professional voice classification;
- automatic AI vocal coaching;
- subscriptions;
- payments.

These may be investigated in later versions.

---

# 6. High-Level Product Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                     VOCAL WARMUP                         │
│                                                          │
│               Next.js + React + TypeScript               │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   DASHBOARD        PRACTICE        ROUTINES              │
│                                                          │
│   ANALYTICS        SONGS           PROFILE               │
│                                                          │
│   ACHIEVEMENTS     SETTINGS                              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER                         │
│                                                          │
│   Audio Engine         Exercise Engine                   │
│   Practice Engine      Achievement Engine                │
│   Range Engine         Analytics Engine                  │
│   Song Engine          Profile Engine                    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                 LOCAL INFRASTRUCTURE                     │
│                                                          │
│   Web Audio API        AudioWorklet                      │
│   MediaRecorder        IndexedDB                         │
│   Dexie                Browser File APIs                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

No network request is required for normal practice functionality.

---

# 7. Technology Stack

## 7.1 Application Framework

### Next.js

Use the modern **App Router** architecture.

Responsibilities:

- application routing;
- page layouts;
- shared UI;
- component organization;
- static assets;
- future expansion into server functionality if required.

V1 should deliberately avoid:

- API routes;
- database connections;
- authentication middleware;
- server-dependent product features.

The framework is primarily being used as the frontend application architecture.

---

# 8. React

React should power the interactive UI.

React is responsible for:

- dashboard rendering;
- practice screens;
- routine editor;
- analytics;
- forms;
- profile editor;
- settings;
- achievement interfaces.

React should **not** perform the low-level audio processing itself.

The audio engine must remain independent of React.

---

# 9. TypeScript

The entire application should use TypeScript.

Strict TypeScript should be enabled.

Recommended:

```text
strict: true
noImplicitAny: true
strictNullChecks: true
```

Major entities should have explicit types.

Examples:

```text
PitchFrame
PracticeSession
Exercise
Routine
Achievement
SingerProfile
Song
VocalRange
AppSettings
```

Avoid unrestricted `any`.

---

# 10. Styling

Use:

### Tailwind CSS

for:

- responsive layouts;
- spacing;
- typography;
- visual states;
- breakpoints;
- dashboard composition.

Use:

### shadcn/ui

for reusable UI primitives such as:

- buttons;
- cards;
- dialogs;
- tabs;
- dropdowns;
- sliders;
- switches;
- tooltips;
- progress bars;
- sheets;
- drawers;
- form controls.

The product should still maintain its own visual identity rather than looking like an untouched component-demo website.

---

# 11. Icons

Recommended:

### Lucide React

Use a consistent icon set for:

- microphone;
- timer;
- practice;
- achievements;
- analytics;
- songs;
- profile;
- settings;
- recording.

Avoid mixing several unrelated icon libraries.

---

# 12. Client State Management

Use:

### Zustand

Zustand should manage **ephemeral application state**.

Examples:

```text
microphone active
practice running
current exercise
current target note
current detected pitch
timer state
routine position
selected exercise
recording status
```

Example conceptual state:

```text
PracticeStore

status
currentRoutine
currentExerciseIndex
currentTargetNote
detectedPitch
elapsedTime
isPaused
microphoneStatus
recordingStatus
```

---

# 13. Persistent State

Persistent application information should **not** primarily live in Zustand.

Persistent data belongs in IndexedDB.

Examples:

```text
Singer Profile
Routines
Practice Sessions
Songs
Achievements
Historical Analytics
Settings
```

This separation prevents state management from becoming a gigantic universal bucket.

---

# 14. Local Database

Use:

### IndexedDB

with:

### Dexie

IndexedDB provides browser-based persistent structured storage.

Dexie provides a cleaner application layer for:

- tables;
- indexes;
- queries;
- migrations;
- transactions;
- TypeScript models.

---

# 15. Local Database Tables

Recommended V1 database:

```text
VocalWarmupDB

profiles
exercises
routines
routineExercises
practiceSessions
sessionExerciseResults
noteStatistics
rangeHistory
achievements
userAchievements
songs
settings
recordings
```

---

# 16. Database Versioning

Database migrations must be supported from the beginning.

Conceptually:

```text
DB Version 1
    ↓
DB Version 2
    ↓
DB Version 3
```

Updates to the web application must not unexpectedly destroy existing user data.

---

# 17. Data Repository Layer

UI components should not directly call Dexie everywhere.

Use repositories.

Example:

```text
PracticeSessionRepository
RoutineRepository
ProfileRepository
AchievementRepository
SongRepository
SettingsRepository
```

Example architecture:

```text
UI Component
      ↓
Service / Engine
      ↓
Repository Interface
      ↓
IndexedDB Repository
      ↓
Dexie
```

This is one of the most important future-proofing decisions.

---

# 18. Future Backend Compatibility

Repository interfaces should allow future implementations such as:

```text
PracticeSessionRepository

        ├── IndexedDBPracticeSessionRepository
        │
        └── FutureCloudPracticeSessionRepository
```

V1 only implements:

```text
IndexedDBPracticeSessionRepository
```

No cloud repository needs to exist yet.

This prevents future synchronization work from infecting the rest of the codebase.

---

# 19. Audio Technology

Use:

### MediaDevices API

for microphone access.

### Web Audio API

for audio graph management.

### AudioWorklet

for real-time audio analysis.

### MediaRecorder

for optional local practice recordings.

---

# 20. Audio Architecture

```text
Microphone
    ↓
MediaStream
    ↓
AudioContext
    ↓
MediaStreamAudioSourceNode
    ↓
AudioWorklet
    ↓
Pitch Detection
    ↓
PitchFrame
    ↓
Pitch Smoothing
    ↓
Practice Evaluation
    ↓
UI
```

The processing pipeline must exist separately from React rendering.

---

# 21. Audio Engine Modules

Recommended module structure:

```text
AudioEngine
MicrophoneManager
PitchDetector
PitchSmoother
NoteConverter
AmplitudeAnalyzer
AudioRecorder
ReferenceTonePlayer
MetronomeEngine
```

---

# 22. Microphone Manager

Responsibilities:

- request microphone access;
- list available microphones where supported;
- select microphone;
- initialize MediaStream;
- stop MediaStream;
- monitor permission failure;
- expose microphone state.

States:

```text
idle
requesting
active
denied
unavailable
error
```

---

# 23. Privacy Prompt

Before the browser permission dialog appears, display:

> Vocal Warmup uses your microphone to detect your pitch. Voice analysis happens directly on your device.

Buttons:

```text
Enable Microphone

Not Now
```

Microphone access must never begin silently.

---

# 24. Pitch Detection Engine

Initial algorithm:

### YIN

The architecture should make the algorithm replaceable.

Example:

```text
IPitchDetector

detect(samples, sampleRate)
      ↓
PitchDetectionResult
```

Future detectors may include:

- Fast YIN;
- McLeod Pitch Method;
- WebAssembly-based algorithms.

The rest of the application should not care which algorithm is being used.

---

# 25. Pitch Detection Output

Every processed frame should produce something similar to:

```text
PitchFrame

timestamp
frequency
midiNumber
noteName
octave
cents
confidence
amplitude
```

Example:

```text
frequency: 440.2
midiNumber: 69
noteName: "A"
octave: 4
cents: +1
confidence: 0.97
amplitude: 0.63
```

---

# 26. Frequency-to-Note Conversion

Use:

```text
MIDI = 69 + 12 × log2(frequency / 440)
```

Then convert MIDI number to:

```text
note
octave
cents deviation
```

Default reference tuning:

```text
A4 = 440 Hz
```

Users should eventually be able to change reference tuning.

---

# 27. Pitch Smoothing

Raw pitch detection will naturally fluctuate.

PitchSmoother should reduce UI instability through:

- confidence rejection;
- noise gate;
- median filtering;
- moving averages;
- hysteresis;
- minimum-note-duration thresholds.

The detected note should not flicker rapidly between:

```text
E4
F4
E4
F4
E4
```

because the singer happened to exist near a semitone boundary.

---

# 28. Detection Confidence

Low-confidence detections should not count toward:

- accuracy;
- range;
- achievements;
- note statistics.

Suggested conceptual states:

```text
< 0.60
Ignore

0.60 – 0.80
Uncertain

> 0.80
Reliable
```

Actual thresholds should be calibrated through testing.

---

# 29. Silence Detection

The application should distinguish between:

```text
singing

ambient noise

silence
```

No note should be displayed when microphone amplitude falls below the configured threshold.

---

# 30. Microphone Calibration

Add a calibration workflow.

### Step 1

Measure ambient sound.

Prompt:

> Stay quiet for three seconds.

### Step 2

Prompt:

> Sing a comfortable sustained note.

### Step 3

Determine:

- noise floor;
- microphone sensitivity;
- minimum amplitude;
- detection confidence.

Users can rerun calibration from Settings.

---

# 31. Reference Tone Engine

Reference pitches should be generated locally.

V1 can initially use:

### OscillatorNode

Support:

- sine;
- triangle;
- simple piano-like synthesized tone.

Settings:

```text
reference volume
reference instrument
tone duration
```

Future versions may use sampled instruments.

---

# 32. Metronome

Add an internal metronome.

Features:

- BPM control;
- start;
- stop;
- accent first beat;
- volume control.

Recommended range:

```text
40–240 BPM
```

Metronome timing should use the Web Audio clock where possible rather than relying solely on `setInterval()`.

---

# 33. Standalone Pitch Tracker

Users should be able to open:

## Pitch Tracker

without starting a routine.

Display:

```text
Detected Note

        E4

     329.8 Hz

        +4¢

   Slightly Sharp
```

Include:

- pitch meter;
- frequency;
- note;
- octave;
- cents;
- optional pitch history;
- microphone confidence.

---

# 34. Pitch Meter

Visual scale:

```text
-50        -25         0         +25        +50

───────────────●────────────────────────────
```

Labels:

```text
Flat        In Tune        Sharp
```

The UI must use more than just color.

---

# 35. Guided Practice Mode

Practice Mode should be visually minimal.

Primary information:

```text
Exercise

Target Note

Detected Note

Pitch Direction

Pitch Timeline

Timer

Routine Progress

Controls
```

Distractions should be reduced compared with the dashboard.

---

# 36. Practice Screen Layout

Example:

```text
┌─────────────────────────────────────────┐
│ Five Note Scale            Exercise 3/6 │
│                                         │
│                TARGET                   │
│                                         │
│                  E4                     │
│                                         │
│          ─────────────────              │
│                 ●                       │
│                                         │
│               YOU: E4                   │
│               +7 cents                  │
│                                         │
│    ~~~~~~~ pitch history ~~~~~~~~~      │
│                                         │
│  03:22                     02:38        │
│  elapsed                  remaining     │
│                                         │
│      Previous    Pause    Next          │
└─────────────────────────────────────────┘
```

---

# 37. Pitch Accuracy Evaluation

Suggested initial tolerances:

```text
Excellent
±10 cents

Good
±20 cents

Acceptable
±35 cents

Off Pitch
>35 cents
```

Values should eventually become configurable.

---

# 38. Vibrato Handling

Natural vibrato must not destroy accuracy statistics.

Accuracy calculations should examine:

- median pitch;
- average cents deviation;
- duration around target;
- stability window.

The system should avoid scoring every oscillation as a separate mistake.

---

# 39. Exercise Engine

Exercises must be data-driven.

Do not hard-code every exercise into a separate React component.

Exercise model:

```text
Exercise

id
name
slug
description
instructions
category
difficulty
pattern
defaultTempo
defaultDuration
supportsPitchTracking
supportsTransposition
referenceToneEnabled
createdAt
updatedAt
```

---

# 40. Exercise Categories

Initial categories:

### Preparation

- posture;
- breathing.

### Gentle Warmup

- humming;
- lip trills;
- tongue trills.

### Pitch

- match the note;
- sustained pitch.

### Scale

- five-note scale;
- major scale;
- arpeggio.

### Range

- ascending scales;
- descending scales;
- octave slides;
- sirens.

### Cooldown

- descending slides;
- gentle humming.

---

# 41. Exercise Pattern Representation

Pitch exercises should use relative semitone values.

Example:

```text
Five Note Major Exercise

[
  0,
  2,
  4,
  5,
  7,
  5,
  4,
  2,
  0
]
```

Starting from C:

```text
C D E F G F E D C
```

Starting from D:

```text
D E F# G A G F# E D
```

One exercise can therefore work in every key.

---

# 42. Exercise Definition Example

Conceptually:

```text
{
  id: "five-note-major",
  name: "Five Note Scale",
  category: "scale",

  pattern: [
    0, 2, 4, 5, 7, 5, 4, 2, 0
  ],

  tempo: 90,

  transposition: {
    enabled: true,
    step: 1
  }
}
```

---

# 43. Transposition Engine

Users can specify:

```text
Start Note
C3

End Note
G4

Step
+1 semitone

Direction
Ascending
```

The engine determines the keys automatically.

Example:

```text
C
C#
D
D#
E
F
F#
G
```

---

# 44. Range-Aware Exercises

Exercises should optionally respect the user's profile.

Example:

```text
Comfortable Range
A2 – E4
```

A default routine should avoid unexpectedly beginning at:

```text
C6
```

because software should not attempt to assassinate its user.

Users may manually override exercise ranges.

---

# 45. Practice Routine Model

A Routine contains ordered exercise instances.

```text
Routine

id
name
description
exerciseItems[]
estimatedDuration
createdAt
updatedAt
isBuiltIn
```

---

# 46. Routine Exercise Model

A routine should store overrides independently of the base exercise.

```text
RoutineExercise

exerciseId
order

duration
tempo
startNote
endNote
transpositionStep
referenceVolume
restAfter
```

This allows:

```text
Five Note Scale
```

to be used differently in multiple routines.

---

# 47. Routine Builder

Users can:

- create routine;
- rename routine;
- duplicate routine;
- delete routine;
- add exercise;
- remove exercise;
- reorder exercises;
- configure exercise;
- configure rest duration;
- save routine.

Drag-and-drop should eventually be supported.

---

# 48. Built-In Routine Templates

Provide:

### Quick Warmup

5 minutes

### General Warmup

10 minutes

### Recording Warmup

15 minutes

### Pitch Accuracy

10 minutes

### Range Development

15 minutes

### Musical Theatre

15 minutes

### Gentle Morning Warmup

10 minutes

### Cooldown

5 minutes

---

# 49. Practice Session Engine

Starting a routine creates an in-memory:

```text
ActivePracticeSession
```

It contains:

```text
sessionId
routineId
startedAt
elapsedTime
currentExerciseIndex
exerciseResults
pitchSamples
highestDetectedPitch
lowestDetectedPitch
```

---

# 50. Avoid Excessive Database Writes

Do not write every individual pitch frame directly into IndexedDB.

One session could generate thousands of frames.

Instead:

```text
Pitch Frames
     ↓
Memory Buffer
     ↓
Session Analyzer
     ↓
Aggregated Statistics
     ↓
IndexedDB
```

---

# 51. Practice Session Summary

Stored result:

```text
PracticeSession

id
routineId
startedAt
completedAt
durationSeconds
completedExercises
totalExercises
averagePitchAccuracy
averageCentsError
highestDetectedNote
lowestDetectedNote
highestConfirmedNote
lowestConfirmedNote
```

---

# 52. Exercise Result

Each completed exercise stores:

```text
SessionExerciseResult

sessionId
exerciseId
duration
accuracy
averageCentsError
highestNote
lowestNote
notesAttempted
notesSuccessful
```

---

# 53. Session Summary Screen

After practice:

```text
WARMUP COMPLETE

Duration
14:32

Exercises
6 / 6

Pitch Accuracy
89%

Range Practiced
A2 – F4

Best Note
D4
96%

New Achievement
🔥 Seven Day Streak
```

---

# 54. Timer System

Support:

### Session Timer

Total practice time.

### Exercise Timer

Current exercise duration.

### Rest Timer

Time between exercises.

Controls:

```text
Pause

Resume

Previous

Next

Stop
```

---

# 55. Range Tracking

Maintain three separate ranges.

## Detected Range

Everything reliably detected.

## Confirmed Range

Notes demonstrated with sufficient stability.

## Comfortable Range

Manually specified by the singer.

---

# 56. Note Confirmation

One loud accidental squeak must not permanently unlock a new highest note.

Suggested confirmation requirements:

```text
confidence >= threshold

amplitude >= threshold

pitch deviation <= threshold

duration >= threshold

successful occurrences >= requirement
```

Example initial target:

```text
confidence ≥ 0.85

within ±30 cents

sustained ≥ 750 ms
```

Exact values require real-device testing.

---

# 57. Range History

Store milestones:

```text
RangeHistory

date
lowestConfirmedNote
highestConfirmedNote
sourceSessionId
```

This allows longitudinal graphs.

---

# 58. Achievements

Achievement categories:

### Practice

First Practice  
10 Sessions  
25 Sessions  
50 Sessions  
100 Sessions

### Time

1 Hour  
5 Hours  
10 Hours  
25 Hours  
50 Hours

### Consistency

3 Day Streak  
7 Day Streak  
14 Day Streak  
30 Day Streak

### Range

First Range  
One Octave  
Two Octaves  
New Highest Note  
New Lowest Note

### Accuracy

90% Exercise  
95% Exercise  
Stable Pitch  
Five Second Hold  
Ten Second Hold

---

# 59. Achievement Definition

```text
Achievement

id
name
description
category
icon
condition
rarity
```

---

# 60. Achievement Engine

Flow:

```text
Session Completed
       ↓
Analytics Calculated
       ↓
Achievement Engine
       ↓
Evaluate Conditions
       ↓
Unlock Achievement
       ↓
Store UserAchievement
```

Achievements should be deterministic.

They should not depend on UI components.

---

# 61. Dashboard

Dashboard provides:

### Welcome Header

```text
Good Evening, Ral

Ready to warm up?
```

### Quick Practice

Primary CTA:

```text
Start Warmup
```

### Today's Routine

Routine progress.

### Current Streak

Practice consistency.

### Practice Time

Week/month totals.

### Pitch Accuracy

Current average.

### Vocal Range

Confirmed and comfortable ranges.

### Recent Achievement

Most recently unlocked achievement.

### Weekly Activity

Graph.

### Recent Sessions

Latest practices.

---

# 62. Dashboard Layout

Desktop concept:

```text
┌──────────┬─────────────────────────────────────┐
│ Sidebar  │ Header                              │
│          ├─────────────────────────────────────┤
│Dashboard │ Quick Practice │ Vocal Range        │
│Practice  ├────────────────┼────────────────────┤
│Routines  │ Today's Routine│ Weekly Practice    │
│Analytics ├────────────────┼────────────────────┤
│Songs     │ Streak         │ Accuracy           │
│Profile   ├────────────────┴────────────────────┤
│Settings  │ Recent Achievements                 │
└──────────┴─────────────────────────────────────┘
```

---

# 63. Mobile Dashboard

Mobile should use:

```text
Header

Quick Start

Today's Routine

Practice Summary

Vocal Range

Achievements

Bottom Navigation
```

Avoid simply shrinking the desktop sidebar.

---

# 64. Analytics

Primary categories:

```text
Overview

Practice

Accuracy

Range

Notes
```

Use:

### Recharts

for standard analytical graphs.

---

# 65. Practice Analytics

Track:

- sessions per day;
- sessions per week;
- sessions per month;
- total minutes;
- average session duration;
- longest session;
- total lifetime practice.

---

# 66. Practice Frequency Graph

Potential visualization:

```text
Minutes

60 ┤             █
50 ┤             █
40 ┤       █     █
30 ┤ █     █     █
20 ┤ █  █  █     █
10 ┤ █  █  █  █  █
 0 └────────────────────
    M  T  W  T  F  S  S
```

---

# 67. Practice Calendar

Add GitHub-style practice activity.

```text
     Mon Tue Wed Thu Fri Sat Sun

W1    ●   ●   ●       ●
W2    ●   ●       ●   ●   ●
W3    ●   ●   ●   ●
W4        ●   ●   ●   ●
```

Intensity may represent:

```text
session duration
```

rather than simply yes/no.

---

# 68. Range Analytics

Display:

```text
highest confirmed note

lowest confirmed note

range in semitones

approximate octaves

range change over time
```

---

# 69. Range Graph

```text
G4 ┤                         ●
F4 ┤                 ●───────
E4 ┤         ●───────
D4 ┤ ●───────
   └──────────────────────────
      May   Jun   Jul   Aug
```

---

# 70. Note Analytics

Track statistics per note.

Example:

```text
NoteStatistics

note
attemptCount
successfulCount
averageAccuracy
averageCentsError
totalDuration
lastPracticed
```

---

# 71. Note Heatmap

Example:

```text
G2   ██
A2   ███
B2   ████
C3   ██████
D3   ████████
E3   ███████
F3   ██████
G3   █████████
A3   ████████
B3   ███████
C4   █████████
D4   ███████
E4   █████
F4   ███
G4   ██
```

This helps identify what part of the user's voice receives the most training.

---

# 72. Accuracy Analytics

Display:

```text
Overall Accuracy

92%

Average Error

7.4 cents
```

Then by note:

```text
C4     96%
D4     94%
E4     91%
F4     86%
G4     73%
```

---

# 73. Singer Profile

Singer Profile represents the user's vocal identity.

Fields:

```text
displayName
profileImage
bio
voiceType
comfortableRange
confirmedRange
favoriteGenres
vocalHighlights
favoriteSongs
```

All fields remain local.

---

# 74. Voice Type

Voice type must be manually selected.

Possible options:

```text
Soprano
Mezzo-Soprano
Contralto
Countertenor
Tenor
Baritone
Bass
Other
Unsure
```

The application must not automatically claim a user's voice type purely based on detected range.

---

# 75. Vocal Highlights

Users can manually add tags such as:

```text
Strong Midrange
Developing Mix
Belting
Head Voice
Falsetto
Musical Theatre
Pop
Rock
Classical
Cover Artist
```

---

# 76. Song Library

Users can track songs they are preparing.

Song:

```text
id
title
artist
show
originalKey
userKey
lowestNote
highestNote
status
notes
favorite
```

---

# 77. Song Statuses

Examples:

```text
Want to Learn

Learning

Practicing

Performance Ready

Recorded

Archived
```

---

# 78. Song Range Comparison

Display:

```text
YOUR COMFORTABLE RANGE

A2 ───────────────────── E4

SONG RANGE

      C3 ───────────── F4
```

The app may warn:

```text
This song extends 1 semitone above your
currently configured comfortable range.
```

This is informational rather than medical guidance.

---

# 79. Singer Profile Card Generator

Users can generate a shareable image.

No hosted profile is needed.

Flow:

```text
Singer Profile
     ↓
Card Template
     ↓
Preview
     ↓
Canvas / SVG Rendering
     ↓
PNG
```

---

# 80. Singer Card Content

Selectable information:

```text
Display Name

Profile Picture

Voice Type

Confirmed Range

Comfortable Range

Highest Note

Lowest Note

Practice Hours

Current Streak

Achievements

Favorite Genres

Vocal Highlights
```

---

# 81. Singer Card Templates

Initial templates:

### Minimal

Profile + vocal range.

### Performer

Profile + genres + songs.

### Range

Large range visualization.

### Achievement

Focuses on milestones.

---

# 82. Image Export

Default format:

### PNG

Recommended sizes:

```text
Square
1080 × 1080

Story
1080 × 1920

Landscape
1200 × 630
```

JPG can be introduced later.

---

# 83. Achievement Card

Achievements may also be exported.

Example:

```text
NEW VOCAL MILESTONE

        G4

Highest Confirmed Note

Confirmed Range

G2 – G4

August 2026
```

---

# 84. Local Recording

Recording must be optional.

Pitch tracking does not require permanent recording.

Controls:

```text
Record Session

Stop Recording

Playback

Delete
```

---

# 85. Recording Architecture

```text
Microphone
    ↓
MediaRecorder
    ↓
Audio Blob
    ↓
IndexedDB
```

Do not automatically enable recordings.

---

# 86. Recording Storage Management

Audio files can become large.

Settings should display:

```text
Local Storage Used

245 MB
```

Users should be able to:

```text
Delete individual recording

Delete all recordings

Clear session audio

Clear all app data
```

---

# 87. Backup System

Because there is no backend, users need manual backup.

Settings:

```text
Export Data

Import Data
```

Export:

```text
vocal-warmup-backup.json
```

---

# 88. Backup Contents

Backup should include:

```text
profile

routines

practice sessions

achievements

songs

settings

analytics
```

Audio recordings should be excluded by default because of file size.

---

# 89. Backup Metadata

Include:

```text
schemaVersion
appVersion
exportDate
```

This allows future compatibility.

---

# 90. Import Validation

Imported backups must be validated using:

### Zod

Invalid or incompatible files should display an error rather than corrupting the database.

---

# 91. Settings

Settings sections:

### Audio

Microphone  
Input level  
Calibration  
Guide volume  
Metronome volume

### Pitch

A4 reference  
Pitch tolerance  
Pitch smoothing

### Practice

Default routine  
Countdown  
Rest timer

### Appearance

Theme  
Reduced motion

### Privacy

Recording behavior  
Data information

### Data

Export  
Import  
Delete recordings  
Delete all data

---

# 92. Themes

Initial:

```text
System

Dark

Light
```

A dark interface is recommended as the product's primary visual direction.

---

# 93. Responsive Design

Required breakpoints:

### Mobile

320px+

### Tablet

768px+

### Desktop

1024px+

### Wide Desktop

1440px+

---

# 94. Accessibility

Support:

- keyboard navigation;
- semantic HTML;
- visible focus states;
- text alternatives;
- high contrast;
- reduced animation;
- labels for controls;
- non-color pitch indicators.

Do not communicate:

```text
correct = green
incorrect = red
```

without text/symbol reinforcement.

---

# 95. Security Requirements

Even without a backend, security matters.

V1 should use:

```text
HTTPS

Content Security Policy

Permissions Policy

safe dependency management

input validation

file import validation
```

---

# 96. Microphone Security

Requirements:

- request microphone explicitly;
- display active microphone state;
- stop tracks when practice stops;
- stop tracks when audio feature unmounts;
- do not activate microphone on page load;
- do not transmit microphone audio.

---

# 97. Recording Privacy

When recording:

Display persistent indicator:

```text
● Recording Locally
```

Users must understand that:

```text
Pitch analysis ≠ audio recording
```

---

# 98. Error Handling

Major expected errors:

```text
Microphone denied

No microphone

AudioContext failed

Pitch detector failed

IndexedDB unavailable

Storage full

Backup invalid

Recording failed

Unsupported browser
```

Every error should have a user-readable explanation.

---

# 99. Browser Support

Target current versions of:

```text
Chrome

Edge

Safari

Firefox
```

Chrome/Edge should be primary development targets initially because microphone/audio behavior is generally easiest to test there.

Compatibility testing should follow once the pitch engine becomes stable.

---

# 100. Application Folder Structure

Recommended:

```text
vocal-warmup/
│
├── app/
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   │
│   ├── practice/
│   │   └── page.tsx
│   │
│   ├── routines/
│   │   └── page.tsx
│   │
│   ├── exercises/
│   │   └── page.tsx
│   │
│   ├── analytics/
│   │   └── page.tsx
│   │
│   ├── achievements/
│   │   └── page.tsx
│   │
│   ├── songs/
│   │   └── page.tsx
│   │
│   ├── profile/
│   │   └── page.tsx
│   │
│   └── settings/
│       └── page.tsx
│
├── components/
│   │
│   ├── ui/
│   │
│   ├── layout/
│   │
│   ├── pitch/
│   │
│   ├── practice/
│   │
│   ├── routine/
│   │
│   ├── analytics/
│   │
│   ├── achievements/
│   │
│   ├── songs/
│   │
│   └── profile/
│
├── features/
│   │
│   ├── audio/
│   │   ├── AudioEngine.ts
│   │   ├── MicrophoneManager.ts
│   │   ├── PitchDetector.ts
│   │   ├── PitchSmoother.ts
│   │   ├── NoteConverter.ts
│   │   ├── ReferenceTonePlayer.ts
│   │   ├── AudioRecorder.ts
│   │   └── worklets/
│   │       └── pitch.worklet.ts
│   │
│   ├── practice/
│   │   ├── PracticeEngine.ts
│   │   ├── SessionAnalyzer.ts
│   │   └── TimerEngine.ts
│   │
│   ├── exercises/
│   │   ├── ExerciseEngine.ts
│   │   └── TranspositionEngine.ts
│   │
│   ├── routines/
│   │   └── RoutineEngine.ts
│   │
│   ├── analytics/
│   │   ├── AnalyticsEngine.ts
│   │   ├── AccuracyEngine.ts
│   │   ├── RangeEngine.ts
│   │   └── NoteStatisticsEngine.ts
│   │
│   ├── achievements/
│   │   └── AchievementEngine.ts
│   │
│   ├── profile/
│   │   └── ProfileCardRenderer.ts
│   │
│   └── backup/
│       ├── BackupExporter.ts
│       └── BackupImporter.ts
│
├── db/
│   │
│   ├── database.ts
│   ├── schema.ts
│   ├── migrations.ts
│   │
│   └── repositories/
│       ├── PracticeSessionRepository.ts
│       ├── RoutineRepository.ts
│       ├── ProfileRepository.ts
│       ├── AchievementRepository.ts
│       ├── SongRepository.ts
│       └── SettingsRepository.ts
│
├── stores/
│   ├── practiceStore.ts
│   ├── audioStore.ts
│   └── uiStore.ts
│
├── hooks/
│   ├── useMicrophone.ts
│   ├── usePitch.ts
│   ├── usePracticeSession.ts
│   └── useLocalStorageEstimate.ts
│
├── lib/
│   ├── music/
│   │   ├── notes.ts
│   │   ├── frequencies.ts
│   │   └── intervals.ts
│   │
│   ├── validation/
│   └── utils/
│
├── types/
│   ├── audio.ts
│   ├── exercise.ts
│   ├── practice.ts
│   ├── routine.ts
│   ├── profile.ts
│   └── analytics.ts
│
├── data/
│   ├── exercises.ts
│   ├── routineTemplates.ts
│   └── achievements.ts
│
├── public/
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

# 101. Architectural Dependency Rule

Dependencies should flow approximately:

```text
UI
 ↓
Application / Feature Services
 ↓
Domain Logic
 ↓
Repository Interfaces
 ↓
Local Infrastructure
```

Avoid:

```text
React Component
 ↓
Dexie Query
 ↓
AudioContext
 ↓
Achievement Calculation
 ↓
Random localStorage
```

inside one file.

---

# 102. Testing Stack

Recommended:

### Vitest

For unit testing.

### React Testing Library

For component behavior.

### Playwright

For browser-level testing.

---

# 103. Critical Unit Tests

Test:

```text
frequency → note conversion

cents calculation

transposition

exercise pattern generation

accuracy calculation

range confirmation

streak calculation

achievement conditions

analytics aggregation

backup validation
```

---

# 104. Pitch Algorithm Tests

Use known synthetic frequencies.

Example:

```text
440 Hz
→ A4

261.63 Hz
→ C4

329.63 Hz
→ E4
```

This provides deterministic tests without needing an actual singer every time the test suite runs.

Mercifully, CI/CD servers do not sing.

---

# 105. Integration Tests

Test:

```text
start routine

advance exercise

complete session

save session

update analytics

unlock achievement
```

---

# 106. End-to-End Tests

Playwright should verify:

```text
dashboard loads

routine can be created

routine persists

profile can be edited

song can be created

backup can be exported

settings persist
```

Microphone features may require mocked media streams in automated environments.

---

# 107. Performance Requirements

Target:

### Dashboard initial render

<2 seconds under normal conditions.

### Microphone startup

<2 seconds after permission where possible.

### Pitch visualization

Smooth enough for immediate feedback.

### Pitch UI updates

Approximately:

```text
20–30 FPS
```

The audio engine itself may process samples at much higher frequency.

---

# 108. Avoid React Rendering Every Audio Frame

Audio processing may occur thousands of times per second.

Do not do:

```text
audio sample
→ React setState
→ render
```

for each sample.

Instead:

```text
AudioWorklet

       ↓

Pitch processing

       ↓

Throttled UI updates

       ↓

React
```

---

# 109. MVP Feature Priority

## P0: Core Engine

Must work before everything else.

- microphone input;
- pitch detection;
- note conversion;
- cents calculation;
- tuner UI;
- reference tone.

---

# 110. P0: Practice

- exercise engine;
- target notes;
- transposition;
- guided practice;
- timers;
- session completion.

---

# 111. P0: Persistence

- IndexedDB;
- Dexie;
- routines;
- practice sessions;
- profile;
- settings.

---

# 112. P0: Basic Progress

- total sessions;
- practice minutes;
- streak;
- confirmed range;
- basic achievements.

---

# 113. P1

After the core is stable:

- advanced dashboard;
- analytics graphs;
- song tracking;
- note statistics;
- routine builder;
- Singer Profile card;
- backup/import;
- local recordings.

---

# 114. P2

Later local improvements:

- PWA installation;
- offline caching;
- better instrument samples;
- advanced pitch visualizer;
- custom themes;
- custom profile-card themes;
- configurable accuracy tolerance;
- advanced range tests.

---

# 115. Future Cloud Extension

A future release may optionally support:

```text
Accounts

Cloud backup

Cross-device synchronization

Routine sharing

Teacher/student functionality
```

These features are intentionally outside V1.

---

# 116. Future Architecture

The architecture should eventually permit:

```text
                         APPLICATION

                              │

                     Repository Layer

                   ┌──────────┴──────────┐
                   │                     │

              Local Repository      Cloud Repository

                   │                     │

                IndexedDB          Future Backend
```

V1 implements only the left side.

---

# 117. Future Synchronization Strategy

If cloud synchronization is introduced:

The browser remains authoritative for:

```text
raw audio

pitch processing

temporary pitch frames

recordings by default
```

Potential sync data:

```text
profile

routines

session summaries

achievements

songs

settings
```

---

# 118. AI Features: Future Only

Potential future features:

- smart routine recommendations;
- pattern detection;
- weakness identification;
- exercise recommendations;
- song preparation plans;
- natural-language session summaries.

These should consume summarized metrics rather than raw voice audio whenever possible.

---

# 119. Potential MIDI Support

Future versions may accept MIDI input.

Possible use:

```text
MIDI keyboard
      ↓
Reference pitches
      ↓
Exercise engine
```

This would be useful for vocal teachers and advanced singers.

---

# 120. Future Teacher Mode

Possible future product:

```text
Teacher creates routine

Singer imports routine

Singer practices locally

Singer exports progress summary
```

This could even function without mandatory cloud infrastructure.

---

# 121. Future PWA

The application should eventually become installable.

Users could:

```text
Install Vocal Warmup

Open from home screen

Practice offline

Sync later if cloud features eventually exist
```

---

# 122. Definition of MVP Complete

The product reaches Functional MVP when a user can:

- open Vocal Warmup;
- enable microphone;
- sing;
- see their detected note;
- see cents deviation;
- hear reference notes;
- start an exercise;
- follow target notes;
- complete a routine;
- create a routine;
- save that routine;
- view past sessions;
- see total practice time;
- see practice frequency;
- maintain a vocal range;
- unlock achievements;
- maintain a Singer Profile;
- close the browser;
- reopen the application;
- retain their data.

All without:

```text
login

backend

cloud database

server
```

---

# 123. Recommended Implementation Order

## Phase 1

Foundation

```text
Next.js
TypeScript
Tailwind
shadcn/ui
routing
layout
```

---

## Phase 2

Pitch prototype

```text
microphone
AudioContext
AudioWorklet
YIN
note conversion
pitch meter
```

This is the first major technical milestone.

---

## Phase 3

Exercise engine

```text
reference tones
patterns
target notes
transposition
tempo
```

---

## Phase 4

Practice engine

```text
routine execution
timers
pause/resume
exercise navigation
session state
```

---

## Phase 5

Local persistence

```text
Dexie
IndexedDB
repositories
database migrations
```

---

## Phase 6

Session processing

```text
accuracy
range
note statistics
session summaries
```

---

## Phase 7

Dashboard

```text
practice totals
range
streak
recent sessions
quick-start
```

---

## Phase 8

Routine Builder

```text
create
edit
duplicate
reorder
delete
```

---

## Phase 9

Analytics

```text
practice frequency
practice duration
accuracy
range history
note statistics
```

---

## Phase 10

Achievements

```text
achievement definitions
condition engine
unlock events
achievement gallery
```

---

## Phase 11

Singer Profile

```text
profile editor
range
voice type
highlights
songs
```

---

## Phase 12

Sharing

```text
profile card generator
PNG export
achievement card export
```

---

## Phase 13

Backup

```text
JSON export
JSON import
validation
version migration
```

---

## Phase 14

Polish

```text
responsive design

accessibility

performance

error states

browser testing

PWA preparation
```

---

# 124. Final V1 Stack

```text
APPLICATION
Next.js
React
TypeScript

UI
Tailwind CSS
shadcn/ui
Lucide React

STATE
Zustand

AUDIO
MediaDevices API
Web Audio API
AudioWorklet
MediaRecorder API
YIN Pitch Detection

LOCAL DATABASE
IndexedDB
Dexie

VALIDATION
Zod

ANALYTICS UI
Recharts

TESTING
Vitest
React Testing Library
Playwright

SOURCE CONTROL
Git
GitHub

DEPLOYMENT
Static/Frontend Hosting

BACKEND
NONE
```

---

# 125. Product Positioning

Vocal Warmup should not be positioned merely as:

> A web tuner.

It should be positioned as:

> **A private, local-first vocal training application that provides real-time pitch guidance, structured warmups, practice routines, achievements, and long-term vocal development analytics.**

Its strongest differentiating idea is not merely that it detects pitch.

It is that the software builds a structured history of the singer's development while allowing the user's actual voice to remain on their device.

The central product experience should therefore always remain:

```text
PRACTICE
   ↓
FEEDBACK
   ↓
UNDERSTANDING
   ↓
PROGRESS
```

Everything else exists to support that loop.
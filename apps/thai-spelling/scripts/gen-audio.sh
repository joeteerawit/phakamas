#!/bin/sh
# Generate the placeholder mp3 for every AudioClip of every registered Lesson with a Thai neural voice
# (edge-tts, Premwadee), read slowly and clearly. Spelling clips centre each part (ลอ, อิ, งอ, ลิง)
# in an equal 1.2 s slot, so the UI can highlight part i at i * duration / parts.
# Clips that already have an mp3 are kept (Lessons share word clips); FORCE=1 regenerates them all.
# shortcut: edge-tts calls Microsoft's online service and its terms for this use are unclear,
# replace with teacher recordings before launch (AUD-001).
# Usage (from apps/thai-spelling, needs edge-tts on PATH, node >= 23 and ffmpeg): [FORCE=1] sh scripts/gen-audio.sh
set -eu
command -v edge-tts >/dev/null || { echo "edge-tts is not on PATH" >&2; exit 1; }
OUT=public/assets/audio
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# The service sometimes returns no audio for valid text, so retry before giving up.
speak() {
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    edge-tts -v th-TH-PremwadeeNeural --rate=-25% --text="$1" --write-media "$2" </dev/null 2>/dev/null && return 0
    sleep 5
  done
  echo "no audio for: $1" >&2
  return 1
}

# Trim edge silence and add a short lead-in so a tap never clips the first sound.
TRIM='silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,adelay=150:all=1'

# id|text|spelling (spelling = ลอ-อิ-งอ-ลิง for spelling clips, empty otherwise), read from the
# Lesson data, once per id (node >= 23 strips the TS types itself).
CLIPS=$(node --input-type=module -e "
import { allLessons } from './src/lessons/index.ts'
import { audioClips } from './src/lessons/audio-clips.ts'
const words = allLessons.flatMap((lesson) => lesson.spotting.sets.flat())
const spelling = new Map(words.map((w) => [w.spellingAudio.id, w.spelling.join('-')]))
const clips = new Map(allLessons.flatMap(audioClips).map((c) => [c.id, c]))
for (const c of clips.values()) console.log([c.id, c.text, spelling.get(c.id) ?? ''].join('|'))
")

echo "$CLIPS" | while IFS='|' read -r id text spelling; do
  [ -n "${FORCE:-}" ] || [ ! -f "$OUT/$id.mp3" ] || continue
  mkdir -p "$OUT/$(dirname "$id")"
  if [ -n "$spelling" ]; then
    list="$TMP/list.txt"
    : > "$list"
    i=0
    for part in $(echo "$spelling" | tr '-' ' '); do
      speak "$part" "$TMP/part.mp3"
      ffmpeg -nostdin -loglevel error -y -i "$TMP/part.mp3" -af "$TRIM,apad=whole_dur=1.2" -ar 44100 -ac 1 "$TMP/part-$i.wav"
      echo "file '$TMP/part-$i.wav'" >> "$list"
      i=$((i + 1))
    done
    ffmpeg -nostdin -loglevel error -y -f concat -safe 0 -i "$list" -c copy "$TMP/clip.wav"
  else
    speak "$text" "$TMP/clip.mp3"
    ffmpeg -nostdin -loglevel error -y -i "$TMP/clip.mp3" -af "$TRIM,apad=pad_dur=0.2" -ar 44100 -ac 1 "$TMP/clip.wav"
  fi
  ffmpeg -nostdin -loglevel error -y -i "$TMP/clip.wav" -codec:a libmp3lame -q:a 4 "$OUT/$id.mp3"
  echo "$OUT/$id.mp3 <- $text" >&2
done

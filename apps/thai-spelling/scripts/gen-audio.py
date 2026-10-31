#!/usr/bin/env python3
"""Regenerate placeholder mp3s for every AudioClip in the Lesson data.

PLACEHOLDER ONLY: replace with real teacher recordings before launch (AUD-001).

Setup (once, in a venv outside the repo; needs node >= 23 and ffmpeg on PATH):
    python3.12 -m venv ~/.venvs/phakamas-tts
    ~/.venvs/phakamas-tts/bin/pip install pythaitts
Run (from anywhere):
    ~/.venvs/phakamas-tts/bin/python apps/thai-spelling/scripts/gen-audio.py
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from pythaitts import TTS

APP = Path(__file__).resolve().parent.parent
OUT = APP / "public" / "assets" / "audio"

# Engine: FastThaiG2P (default). To switch to KhanomTan v1.1 replace with
#   TTS(pretrained="khanomtan", version="1.1")   (also: pip install coqui-tts)
ENGINE = TTS(pretrained="fastthaig2p")

# Node strips the TS types itself, so the Lesson data stays the single source.
# shortcut: only mae-kong is listed, add a lesson here when a second one ships.
EXPORT = """
import { maeKong } from './src/lessons/mae-kong.ts'
import { audioClips } from './src/lessons/audio-clips.ts'
console.log(JSON.stringify(audioClips(maeKong)))
"""


def main() -> None:
    clips = json.loads(
        subprocess.run(
            ["node", "--input-type=module", "-e", EXPORT],
            cwd=APP, check=True, capture_output=True, text=True,
        ).stdout
    )
    with tempfile.TemporaryDirectory() as tmp:
        for clip in clips:
            wav = Path(tmp) / "clip.wav"
            mp3 = OUT / f"{clip['id']}.mp3"
            mp3.parent.mkdir(parents=True, exist_ok=True)
            ENGINE.tts(clip["text"], filename=str(wav))
            subprocess.run(
                ["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav),
                 "-codec:a", "libmp3lame", "-q:a", "4", str(mp3)],
                check=True,
            )
            print(f"{mp3.relative_to(APP)}  <- {clip['text']}", file=sys.stderr)


if __name__ == "__main__":
    main()

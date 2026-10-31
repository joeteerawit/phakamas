import { expect, test } from '@playwright/test'
import { audioClips } from '../src/lessons/audio-clips.ts'
import { maeKong } from '../src/lessons/mae-kong.ts'

test('the built site serves a placeholder mp3 for every audio ID', async ({ request }) => {
  for (const clip of audioClips(maeKong)) {
    const response = await request.get(`/assets/audio/${clip.id}.mp3`)
    expect(response.status(), clip.id).toBe(200)
    expect(response.headers()['content-type'], clip.id).toBe('audio/mpeg')
  }
})

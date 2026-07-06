# Crunchyroll No Hardsubs

A tiny Tampermonkey userscript that lets you watch Crunchyroll **without forced (burned-in) subtitles**.

Some Crunchyroll titles ship with the subtitles baked into the video ("hardsubs") and give you **no option to turn them off** in the player. This script fixes that by loading the subtitle‑free stream instead — whenever Crunchyroll actually has one.

<table>
  <tr>
    <td align="center"><b>Default — burned‑in subtitles</b></td>
    <td align="center"><b>With the script — clean stream</b></td>
  </tr>
  <tr>
    <td><img src="Frieren%20with%20subs.png" width="400" alt="Crunchyroll playing Frieren with burned-in subtitles"></td>
    <td><img src="Frieren%20without%20subs.png" width="400" alt="The same scene with no subtitles after enabling the script"></td>
  </tr>
</table>

## Install

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge, Firefox) or Violentmonkey.
2. Open **[crunchyroll-no-hardsubs.user.js](crunchyroll-no-hardsubs.user.js)** → **Raw**, and confirm the install prompt.
3. Reload your Crunchyroll episode. The burned‑in subtitles are gone.

Enable or disable it any time from the Tampermonkey menu. Changes take effect on the next episode or a page reload.

## How it works

When you open an episode, Crunchyroll asks its playback API which video to play. The response contains **both** a clean, subtitle‑free stream (`url`) **and** per‑language versions with subtitles burned into the picture (`hardSubs`). For "forced subtitle" titles the player always picks a `hardSubs` version and hides the off switch.

This script intercepts that response and repoints every `hardSubs` entry at the clean stream, so whichever one the player chooses, you get video with no burned‑in text. It only touches the video track — nothing else about your account or playback changes.

## Limitations

- **Only works when a clean stream exists.** Some titles are *only* published with burned‑in subtitles; for those there is nothing to switch to, and the script deliberately does nothing (it won't break playback).
- Web player only (`www.crunchyroll.com`). It can't affect the native apps on phones, TVs, or consoles.
- If Crunchyroll changes how its player fetches streams, the script may need an update.

## License

[MIT](LICENSE)

// ==UserScript==
// @name         Crunchyroll No Hardsubs
// @namespace    https://github.com/LoeweGuckmal
// @supportUrl   https://github.com/LoeweGuckmal/crunchyroll-no-hardsubs/issues
// @version      1.0.0
// @description  Watch Crunchyroll without forced (burned-in) subtitles: loads the subtitle-free "clean" stream whenever Crunchyroll has one, even for titles whose player offers no subtitle off switch.
// @author       LoeweG
// @license      MIT
// @match        https://www.crunchyroll.com/*
// @grant        unsafeWindow
// @run-at       document-start
// @noframes
// ==/UserScript==
//
// How it works: Crunchyroll's playback API (…/playback/v3/<id>/web/<browser>/play)
// returns both a subtitle-free manifest (top-level `url`, valid when
// `burnedInLocale` is empty) and per-language `hardSubs` manifests with the
// subtitles burned into the video frames. For "forced subtitle" titles the
// player always picks a hardSubs variant and offers no way to turn it off.
// This script intercepts that JSON response and repoints every hardSubs entry
// at the clean manifest, so whichever variant the player selects, it plays
// video without burned-in text. Titles that have no clean stream are left
// untouched. Enable/disable the script from the Tampermonkey menu; a change
// takes effect on the next episode or page reload.
//
/* eslint-disable no-undef */
(function () {
	'use strict';

	const TAG = '[cr-no-hardsubs]';
	const log = (...a) => console.log(TAG, ...a);

	function neutralizeHardsubs(data) {
		if (!data || typeof data !== 'object' || !data.hardSubs || typeof data.hardSubs !== 'object') return null;
		const keys = Object.keys(data.hardSubs);
		if (!keys.length) return null;
		// The top-level `url` is subtitle-free only when nothing is burned into it.
		const cleanUrl = !data.burnedInLocale && typeof data.url === 'string' ? data.url : null;
		if (!cleanUrl) return null;
		let changed = false;
		for (const k of keys) {
			const hs = data.hardSubs[k];
			if (hs && typeof hs.url === 'string' && hs.url !== cleanUrl) {
				hs.url = cleanUrl;
				changed = true;
			}
		}
		return changed ? data : null;
	}

	// The player runs in the page realm; under Tampermonkey's sandbox we must
	// override the page's fetch (unsafeWindow), not the sandbox copy, or the
	// player won't go through our wrapper.
	const PAGE = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;
	if (PAGE.__crNoHardsubsHook) return;
	const origFetch = PAGE.fetch;
	if (typeof origFetch !== 'function') return;
	PAGE.__crNoHardsubsHook = true;
	const R = PAGE.Response || Response;
	const H = PAGE.Headers || Headers;
	// Matches the playback "play" endpoint (…/playback/v3/<id>/web/<browser>/play)
	// but not the manifest URLs it returns (…/manifest.mpd?…).
	const isPlay = (u) => typeof u === 'string' && u.indexOf('/playback/') !== -1 && /\/play(?:[?#]|$)/.test(u);

	PAGE.fetch = function (input, init) {
		let url = '';
		try { url = typeof input === 'string' ? input : (input && input.url) || ''; } catch {}
		const promise = origFetch.apply(this, arguments);
		if (!isPlay(url)) return promise;
		return promise.then((resp) => {
			if (!resp || !resp.ok) return resp;
			return resp.clone().json().then((data) => {
				const fixed = neutralizeHardsubs(data);
				if (!fixed) return resp;
				log('repointed hardSubs → clean manifest');
				const headers = new H(resp.headers);
				try { headers.delete('content-length'); } catch {}
				return new R(JSON.stringify(fixed), {
					status: resp.status,
					statusText: resp.statusText,
					headers,
				});
			}).catch(() => resp);
		});
	};
	log('hook installed');
})();

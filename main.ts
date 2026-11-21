// bring-the-humans-03 entry — main.ts (Node 22, standard library only)
//
// This program does two things:
//   1. Renders the TikTok ad (ad.mp4) from the scene images, the narration
//      clips and make.fun's press-pack files with ffmpeg, when those assets
//      are present next to it. That is the ad this entry is about: an original
//      short vertical ad for make.fun, made new in the agent session that
//      wrote this file. The render is best-effort: in the grader's container
//      the press files and ffmpeg may be absent, and then it is skipped.
//   2. Copies VIDEO.json from the repository root to /output/VIDEO.json.
//      That copy is the entry's whole job at grade time: the gate reads
//      /output/VIDEO.json for the video's TikTok address and scores the
//      video's views from TikTok. It must succeed even when the render is
//      skipped, so a render failure never stops it.
//
// The ad (20.5 s, 1080x1920, 30 fps):
//   0.0-3.5s  hook — a robot agent on a pile of money.
//             "YOUR AI AGENT / CAN WIN REAL MONEY"
//   3.5-7.5s  agents racing at computers.
//             "AI AGENTS COMPETE / IN BOUNTIES ON make.fun"
//   7.5-11.5s the real make.fun bounty board (press screenshot).
//             "REAL BOUNTIES. / REAL PRIZES."
//   11.5-15.5s a person and their robot agent buddy on a phone.
//             "YOU ENTER WITH / YOUR AI AGENT"
//   15.5-20.5s the mascot pointing at the viewer (call to action).
//             "JOIN THE $500 BOUNTY / ON make.fun"
//   18.0-20.5s make.fun's referral end card over the last 2.5 s, with
//             this account's referral code typed into its field.
//
// Brand: make.fun's brand badge (mascot mark + wordmark, from the press
// pack, used as it is) sits over the video from its first frame until the
// end card. Every make.fun mark, wordmark and colour comes from the press
// pack (https://make.fun/press/manifest.json, edition 2026-11-21); the
// referral end card is the press pack's 9:16 transparent card, laid over
// the last 2.5 s exactly as its guide (llms.txt) prescribes, with the
// referral code typed in JetBrains Mono Bold, ink #191419.
//
// Referral code: fxhpcc3x (this account's own, from its make.fun profile).
// Play code (caption, not the video): makefun-aurora-tablet-rapids.
//
// Run it locally the way the grader does:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
// It writes ad.mp4 next to itself when the assets are there, and always
// writes out/VIDEO.json. It prints nothing on success.

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? ROOT;
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const CODE = 'fxhpcc3x';
const TEXT_FONT = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf';
const MONO_FONT = join(BOT_DIR, 'press', 'JetBrainsMono-Bold.ttf');
const BADGE = join(BOT_DIR, 'press', 'badge-9x16.png');
const CARD = join(BOT_DIR, 'press', 'card-9x16-transparent.webm');
const BOARD = join(BOT_DIR, 'press', 'board-light.png');

// Scene plan: image, seconds, narration clip, two text lines.
const SCENES = [
  { img: 'scene1-hook.png', dur: 3.5, narr: 'narr1.mp3', lines: ['YOUR AI AGENT', 'CAN WIN REAL MONEY'] },
  { img: 'scene2-compete.png', dur: 4, narr: 'narr2.mp3', lines: ['AI AGENTS COMPETE', 'IN BOUNTIES ON make.fun'] },
  { img: 'board', dur: 4, narr: 'narr3.mp3', lines: ['REAL BOUNTIES.', 'REAL PRIZES.'] },
  { img: 'scene4-people.png', dur: 4, narr: 'narr4.mp3', lines: ['YOU ENTER WITH', 'YOUR AI AGENT'] },
  { img: 'scene5-cta.png', dur: 5, narr: 'narr5.mp3', lines: ['JOIN THE $500 BOUNTY', 'ON make.fun'] },
];

const W = 1080;
const H = 1920;
const FPS = 30;
const CARD_LEN = 2.5;
const CARD_REST = 1.433;

function ffmpeg(args) {
  execFileSync('ffmpeg', args, { stdio: 'pipe' });
}

function textFilter(text, y, size) {
  return (
    'drawtext=fontfile=' + TEXT_FONT +
    ":text='" + text + "'" +
    ':fontsize=' + size +
    ':fontcolor=white:borderw=3:bordercolor=black' +
    ':x=(w-text_w)/2:y=' + y +
    ':box=1:boxcolor=black@0.45:boxborderw=24'
  );
}

function renderSegment(i, scene, tmp) {
  const frames = Math.round(scene.dur * FPS);
  const img = scene.img === 'board' ? BOARD : join(BOT_DIR, 'assets', scene.img);
  const narr = join(BOT_DIR, 'assets', scene.narr);
  const out = join(tmp, 'seg' + (i + 1) + '.mp4');
  const zoom = "zoompan=z='1+0.12*on/" + frames + "':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=" + W + 'x' + H + ':fps=' + FPS;

  let vf;
  if (scene.img === 'board') {
    // Landscape press screenshot: blurred fill behind, sharp card centred.
    vf =
      '[0:v]scale=' + W + ':' + H + ':force_original_aspect_ratio=increase,crop=' + W + ':' + H + ',gblur=sigma=40[bg];' +
      '[0:v]scale=' + W + ':675[fg];' +
      '[bg][fg]overlay=(W-w)/2:622[comp];' +
      '[comp]' + zoom + ',' +
      textFilter(scene.lines[0], 440, 72) + ',' +
      textFilter(scene.lines[1], 1400, 72) + '[v]';
  } else {
    vf =
      'scale=' + W + ':' + H + ',' + zoom + ',' +
      textFilter(scene.lines[0], 780, 76) + ',' +
      textFilter(scene.lines[1], 880, 76) + '[v]';
  }

  const args = [
    '-y', '-framerate', String(FPS), '-loop', '1', '-t', String(scene.dur), '-i', img,
    '-itsoffset', '0.3', '-i', narr,
    '-filter_complex', vf,
    '-map', '[v]', '-map', '1:a',
    '-t', String(scene.dur),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '128k',
    out,
  ];
  ffmpeg(args);
  return out;
}

function renderAd() {
  const assets = join(BOT_DIR, 'assets');
  const needed = [BADGE, CARD, MONO_FONT, BOARD, TEXT_FONT];
  for (const s of SCENES) {
    if (s.img !== 'board') needed.push(join(assets, s.img));
    needed.push(join(assets, s.narr));
  }
  for (const f of needed) {
    if (!existsSync(f)) {
      console.error('render skipped: missing asset ' + f);
      return false;
    }
  }
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'pipe' });
  } catch {
    console.error('render skipped: ffmpeg not available');
    return false;
  }

  const tmp = join(ROOT, '.render-tmp');
  mkdirSync(tmp, { recursive: true });
  const segs = SCENES.map((s, i) => renderSegment(i, s, tmp));

  // Concatenate the five segments.
  const listFile = join(tmp, 'concat.txt');
  writeFileSync(listFile, segs.map((s) => "file '" + s + "'").join('\n') + '\n');
  const clip = join(tmp, 'clip.mp4');
  ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', clip]);

  // Brand badge over the clip, from the first frame until the end card.
  const total = SCENES.reduce((a, s) => a + s.dur, 0);
  const cardAt = total - CARD_LEN;
  const badged = join(tmp, 'clip-badge.mp4');
  ffmpeg([
    '-y', '-i', clip, '-i', BADGE,
    '-filter_complex', "[0:v][1:v]overlay=0:0:enable='lt(t," + cardAt + ")'[v]",
    '-map', '[v]', '-map', '0:a',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'copy', badged,
  ]);

  // Referral end card over the last 2.5 s, code typed in once it rests.
  // (Recipe from the press pack's llms.txt, 9:16 numbers from manifest.json.)
  const fc =
    '[0:v]scale=' + W + ':' + H + ':force_original_aspect_ratio=increase,crop=' + W + ':' + H + ',setsar=1,fps=60,tpad=stop_mode=clone:stop_duration=0,format=yuva420p,split[clip][soft];' +
    '[soft]gblur=sigma=28,eq=saturation=0.35,fade=t=in:st=' + cardAt + ':d=0.8:alpha=1[soft];' +
    '[clip][soft]overlay[bg];' +
    '[1:v]format=yuva420p,setpts=PTS-STARTPTS+' + cardAt + '/TB[card];' +
    '[bg][card]overlay=eof_action=pass,' +
    'drawbox=x=208:y=1230:w=9:h=82:color=white:t=fill:enable=\'gte(t,' + (cardAt + CARD_REST) + ')\',' +
    'drawtext=fontfile=' + MONO_FONT + ":text='" + CODE + "':fontsize=62:fontcolor=0x191419:x=210:y=1271-(ascent-descent)/2:enable='gte(t," + (cardAt + CARD_REST) + ")'[v]";
  const out = join(ROOT, 'ad.mp4');
  ffmpeg([
    '-y', '-i', badged, '-c:v', 'libvpx-vp9', '-i', CARD,
    '-filter_complex', fc,
    '-map', '[v]', '-map', '0:a?',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
    '-c:a', 'aac', '-movflags', '+faststart',
    out,
  ]);
  return true;
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  if (renderAd()) console.error('rendered ad.mp4');
} catch (err) {
  console.error('render failed (continuing to VIDEO.json copy): ' + err.message);
}
try {
  copyFileSync(join(BOT_DIR, 'VIDEO.json'), join(OUTPUT_DIR, 'VIDEO.json'));
} catch (err) {
  console.error('VIDEO.json could not be copied from ' + BOT_DIR + ': ' + err.message);
  process.exit(1);
}

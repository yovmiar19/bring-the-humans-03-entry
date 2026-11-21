# bring-the-humans-03 — TikTok ad for make.fun

An original short vertical video ad for [make.fun](https://make.fun), made by
my AI agent for the **bring-the-humans-03** bounty ($500 pot, top 20 paid).
The video is the entry: places go by its real TikTok views, most first.

## The ad

20.5 seconds, 1080x1920, H.264 + AAC. A friendly robot agent wins real
money, AI agents race in bounties, the real make.fun bounty board shows real
prizes, a person enters with their AI agent buddy, and the mascot calls the
viewer to join the $500 bounty — then make.fun's referral end card with my
referral code.

- **Hook (0–3.5s):** "YOUR AI AGENT CAN WIN REAL MONEY"
- **What make.fun is (3.5–7.5s):** "AI AGENTS COMPETE IN BOUNTIES ON make.fun"
- **Proof (7.5–11.5s):** the real bounty board — "REAL BOUNTIES. REAL PRIZES."
- **How you join (11.5–15.5s):** "YOU ENTER WITH YOUR AI AGENT"
- **Call to action (15.5–18s):** "JOIN THE $500 BOUNTY ON make.fun"
- **End card (18–20.5s):** make.fun's referral end card, code `fxhpcc3x`

make.fun's brand badge (mascot mark + wordmark, from the press pack, used as
it is) sits over the video from its first frame until the end card. The video
also has a voiceover narration explaining make.fun.

## How it was made

`main.ts` (Node 22, standard library only) renders the ad with ffmpeg from
the scene images in `assets/`, the narration clips, and make.fun's press-pack
files (brand badge, referral end card, board screenshot), then copies
`VIDEO.json` to the output directory. Run it the way the grader does:

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

It writes `ad.mp4` next to itself when the assets are there, and always
writes `out/VIDEO.json`. The press-pack files are fetched from
https://make.fun/press/manifest.json when the ad is made; this repository
holds no copy of them.

## The video

`VIDEO.json` names the video's full address on TikTok. The caption to post
with it:

> Made by my AI agent for a $500 bounty on make.fun, where AI agents compete for real money: make.fun/bounty/bring-the-humans-03
>
> Play code: makefun-hilltop-pansy-carrot
>
> #makefun #AIagent #bounty #fyp

Referral code on the end card: `fxhpcc3x` (https://make.fun/r/fxhpcc3x).

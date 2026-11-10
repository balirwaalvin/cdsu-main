/* CDSU Mail — emoji picker for the composer.
   M.emoji.open(anchor, host, onPick) shows a searchable, categorised picker next to `anchor`, inside `host`
   (so it disappears with the composer). onPick(emoji) runs for each choice; the picker stays open so several
   can be added in a row. Recently used emojis are remembered in this browser. Loaded after mail.js. */
(function () {
  "use strict";
  const M = window.CDSU_MAIL;
  if (!M) return;
  const { esc } = M;

  // One emoji per line: "emoji name|extra search words"
  const DATA = [
    ["Smileys", `
😀 grinning face|smile happy
😃 big smile|happy joy
😄 smiling eyes|happy laugh
😁 beaming face|grin
😆 laughing|happy haha
😅 sweat smile|relief phew
😂 tears of joy|laugh lol funny
🤣 rolling on the floor laughing|rofl lol
🙂 slight smile|ok fine
😉 wink|joke
😊 blushing smile|happy pleased thanks
😇 halo|innocent angel
🥰 smiling with hearts|love adore
😍 heart eyes|love
🤩 star struck|wow amazing excited
😘 blowing a kiss|love
😋 yum|tasty delicious
😎 sunglasses|cool
🤓 nerd|geek study glasses
🧐 monocle|inspect curious
🤗 hug|hugging welcome
🤔 thinking|hmm consider question
🤨 raised eyebrow|doubt skeptical
😐 neutral face|meh
😑 expressionless|blank
😶 no mouth|speechless quiet
🙄 eye roll|whatever
😏 smirk|sly
😬 grimace|awkward oops
😌 relieved|calm content
😔 pensive|sad thoughtful
😪 sleepy|tired
😴 sleeping|zzz tired
😷 face mask|sick ill
🤒 thermometer|sick fever
🤧 sneezing|cold flu
🥳 party face|celebrate birthday
🥺 pleading|please puppy eyes
😢 crying|sad tear
😭 sobbing|cry sad
😱 screaming|shock scared
😤 huffing|frustrated determined
😠 angry|mad
😳 flushed|embarrassed surprised
🤯 mind blown|shocked wow
😮 open mouth|surprised wow
🥲 smile with tear|grateful touched
🤐 zipper mouth|secret quiet
🤫 shushing|quiet secret
🤭 hand over mouth|giggle oops
🙃 upside down|silly
😵‍💫 dizzy face|confused overwhelmed`],
    ["People", `
👍 thumbs up|like yes ok approve agree good
👎 thumbs down|dislike no disagree
👌 ok hand|okay perfect fine
✌️ victory hand|peace
🤞 fingers crossed|luck hope
🤝 handshake|deal agreement partnership meeting
👏 clapping|applause congratulations well done bravo
🙌 raised hands|celebrate hooray praise
👐 open hands|welcome
🤲 palms up|prayer offer
🙏 folded hands|please thank you thanks pray grateful
✋ raised hand|stop high five hi
👋 waving hand|hello hi bye goodbye
🤙 call me|phone shaka
💪 flexed biceps|strong strength power
👉 pointing right|this next
👈 pointing left|this back
👆 pointing up|above this
👇 pointing down|below this
☝️ index pointing up|one first attention
✍️ writing hand|write sign note
🫡 salute|respect yes sir
🫶 heart hands|love support
👀 eyes|look see watching
🧠 brain|smart think idea
🗣️ speaking head|talk speak announce
👤 person silhouette|user profile
👥 people silhouettes|team group users
🧑‍🎓 student|graduate school university
🧑‍🏫 teacher|lecturer tutor school
🧑‍💼 office worker|business professional staff
🧑‍💻 technologist|developer computer laptop
🧑‍⚕️ health worker|doctor nurse
🧑‍⚖️ judge|law justice
🧑‍🤝‍🧑 people holding hands|together community
👨‍👩‍👧 family|parents children
🙋 raising hand|question me volunteer
🤷 shrug|dunno whatever
🤦 facepalm|oops doh
💁 tipping hand|information help
🙇 bowing|sorry respect thanks
🏃 running|hurry fast
🚶 walking|walk`],
    ["Hearts", `
❤️ red heart|love
🧡 orange heart|love
💛 yellow heart|love friendship
💚 green heart|love
💙 blue heart|love trust
💜 purple heart|love
🤎 brown heart|love
🖤 black heart|love
🤍 white heart|love
💖 sparkling heart|love
💕 two hearts|love
💞 revolving hearts|love
💓 beating heart|love
💗 growing heart|love
💝 heart with ribbon|gift love
💯 hundred points|perfect score 100 agree
💥 collision|boom
💫 dizzy star|sparkle
💬 speech balloon|chat comment message
💭 thought balloon|think idea
💤 zzz|sleep`],
    ["Celebrate", `
🎉 party popper|celebrate congratulations congrats tada
🎊 confetti ball|celebrate party
🥂 clinking glasses|cheers toast celebrate
🍾 champagne|celebrate pop
🎂 birthday cake|birthday celebrate
🎁 gift|present wrapped birthday
🎈 balloon|party birthday
🏆 trophy|winner award champion prize
🥇 gold medal|first winner
🥈 silver medal|second
🥉 bronze medal|third
🏅 sports medal|award achievement
🎖️ military medal|honour award
🎓 graduation cap|graduate graduation degree university
🌟 glowing star|star excellent
⭐ star|favourite excellent
✨ sparkles|new shiny magic
🔥 fire|hot lit trending
🚀 rocket|launch fast start
🎯 bullseye|target goal
🎶 musical notes|music song
🎤 microphone|speech sing talk
🎬 clapper board|film action
🎨 artist palette|art design creative
🎟️ admission tickets|event ticket
📸 camera with flash|photo picture`],
    ["Work", `
📧 e-mail|email mail
✉️ envelope|letter mail
📨 incoming envelope|inbox received
📩 envelope with arrow|send mail
📬 mailbox with mail|post
📮 postbox|post mail
📝 memo|note write minutes
📄 page|document file
📑 bookmark tabs|documents
📋 clipboard|list checklist agenda
📁 file folder|folder
📂 open folder|files
🗂️ card dividers|files organise
📅 calendar|date schedule
📆 tear-off calendar|date deadline
🗓️ spiral calendar|plan schedule
⏰ alarm clock|time deadline reminder
⏳ hourglass|wait time pending
⌛ hourglass done|time up
🕒 three o'clock|time
📌 pushpin|pin important
📍 round pushpin|location place venue
📎 paperclip|attachment attach
🖊️ pen|write sign
✏️ pencil|write edit
🔍 magnifying glass|search find
💡 light bulb|idea tip
📊 bar chart|statistics report data
📈 chart increasing|growth progress up
📉 chart decreasing|down decline
💼 briefcase|work business office
🏢 office building|work company
🏛️ classical building|government institution ministry
🏫 school|education
💻 laptop|computer
🖥️ desktop computer|computer screen
📱 mobile phone|phone call smartphone
☎️ telephone|call phone
🖨️ printer|print
📚 books|study read library
📖 open book|read study
🔖 bookmark|save
🧾 receipt|invoice payment
💳 credit card|payment card
💰 money bag|money funds
💵 banknote|money cash
🔑 key|password access
🔒 locked|secure private
🔓 unlocked|open
🔗 link|url chain
🛠️ tools|fix build settings
⚙️ gear|settings
📢 loudspeaker|announcement news
📣 megaphone|announce
🔔 bell|notification reminder
📰 newspaper|news press
🗳️ ballot box|vote election
⚖️ balance scale|law justice fair`],
    ["Nature", `
☀️ sun|sunny weather bright
🌤️ sun behind cloud|weather
⛅ partly cloudy|weather
☁️ cloud|weather
🌧️ rain|weather
⛈️ thunderstorm|weather storm
🌈 rainbow|colour hope
❄️ snowflake|cold winter
🌍 globe Africa Europe|world earth global international
🌎 globe Americas|world earth
🌏 globe Asia Australia|world earth
🌱 seedling|grow growth start new
🌳 tree|nature environment
🌴 palm tree|holiday tropical
🌻 sunflower|flower
🌹 rose|flower love
🌸 cherry blossom|flower spring
💐 bouquet|flowers thanks congratulations
🍀 four leaf clover|luck
🍁 maple leaf|autumn
🦁 lion|brave
🐘 elephant|africa
🦒 giraffe|africa
🦓 zebra|africa
🐦 bird|tweet
🦋 butterfly|change
🐝 honeybee|busy work
🐶 dog|puppy pet
🐱 cat|kitten pet`],
    ["Food & travel", `
☕ hot beverage|coffee tea break
🍵 teacup|tea
🥤 cup with straw|drink
🍽️ fork and knife with plate|meal dinner lunch
🍕 pizza|food
🍔 hamburger|food
🍚 cooked rice|food meal
🍲 pot of food|stew meal
🥗 green salad|healthy
🍰 shortcake|cake dessert
🍪 cookie|biscuit snack
🍎 red apple|fruit teacher
🍌 banana|fruit
🥭 mango|fruit
🍉 watermelon|fruit summer
✈️ airplane|flight travel trip
🚗 car|drive travel
🚌 bus|travel transport
🚆 train|travel transport
🚲 bicycle|bike cycle
🏠 house|home
🏨 hotel|stay accommodation
🗺️ world map|travel map
🧭 compass|direction guide
⛰️ mountain|hike
🏖️ beach|holiday vacation
🏁 chequered flag|finish done race
🚩 triangular flag|flag warning`],
    ["Symbols", `
✅ check mark button|done yes complete approved correct
✔️ check mark|done yes
☑️ ballot box with check|done tick
❌ cross mark|no wrong cancel
❎ cross mark button|no
⚠️ warning|caution alert attention
⛔ no entry|stop forbidden
🚫 prohibited|no forbidden
❗ exclamation mark|important attention
❓ question mark|question help
‼️ double exclamation|urgent
⁉️ exclamation question|what
➕ plus|add
➖ minus|subtract
➡️ right arrow|next forward
⬅️ left arrow|back previous
⬆️ up arrow|up
⬇️ down arrow|down
🔄 counterclockwise arrows|repeat refresh update
🔁 repeat|again loop
🆕 new button|new
🆓 free button|free
🆗 ok button|ok
🔝 top arrow|top
🔜 soon arrow|soon coming
ℹ️ information|info help
🔴 red circle|red
🟠 orange circle|orange
🟡 yellow circle|yellow
🟢 green circle|green ok go
🔵 blue circle|blue
⚪ white circle|white
⚫ black circle|black
🔶 large orange diamond|orange
🔷 large blue diamond|blue
#️⃣ number sign|hash
1️⃣ keycap one|number one first
2️⃣ keycap two|number two second
3️⃣ keycap three|number three third
©️ copyright|c
®️ registered|r
™️ trade mark|tm
🇺🇬 flag Uganda|uganda
🇰🇪 flag Kenya|kenya
🇹🇿 flag Tanzania|tanzania
🇷🇼 flag Rwanda|rwanda
🇧🇮 flag Burundi|burundi
🇸🇸 flag South Sudan|south sudan
🇨🇩 flag Congo Kinshasa|drc congo
🇪🇹 flag Ethiopia|ethiopia
🇳🇬 flag Nigeria|nigeria
🇿🇦 flag South Africa|south africa
🇬🇧 flag United Kingdom|uk britain
🇺🇸 flag United States|usa america
🇪🇺 flag European Union|eu europe
🇺🇳 flag United Nations|un`]
  ];

  const CATS = DATA.map(([name, body]) => ({
    name,
    items: body.trim().split("\n").map((line) => {
      const i = line.indexOf(" ");
      const [label, extra = ""] = line.slice(i + 1).split("|");
      return { e: line.slice(0, i), label, find: `${label} ${extra}`.toLowerCase() };
    })
  }));
  const ALL = CATS.flatMap((c) => c.items);
  const BY_EMOJI = new Map(ALL.map((x) => [x.e, x]));

  const RECENT_KEY = "cdsu-mail-emoji-recent", RECENT_MAX = 24;
  const recent = () => {
    try { return (JSON.parse(localStorage.getItem(RECENT_KEY)) || []).filter((e) => BY_EMOJI.has(e)); } catch (_) { return []; }
  };
  const remember = (e) => {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify([e, ...recent().filter((x) => x !== e)].slice(0, RECENT_MAX))); } catch (_) { /* private mode */ }
  };

  const COLS = 8;
  let P = null; // the open picker: { el, anchor, onPick, onClose }

  const btn = (x) => `<button type="button" class="emoji-btn" data-emoji="${esc(x.e)}" title="${esc(x.label)}" aria-label="${esc(x.label)}">${x.e}</button>`;
  const section = (id, name, items) => items.length
    ? `<section class="emoji-sec" data-sec="${id}"><h4>${esc(name)}</h4><div class="emoji-grid">${items.map(btn).join("")}</div></section>`
    : "";

  function fill(q) {
    const list = P.el.querySelector(".emoji-list");
    const tabs = P.el.querySelector(".emoji-tabs");
    q = q.trim().toLowerCase();
    if (q) {
      const words = q.split(/\s+/);
      const hits = ALL.filter((x) => words.every((w) => x.find.includes(w)));
      list.innerHTML = hits.length ? section("results", "Results", hits) : `<p class="emoji-none">No emoji found for “${esc(q)}”.</p>`;
      tabs.hidden = true;
    } else {
      const r = recent().map((e) => BY_EMOJI.get(e));
      list.innerHTML = section("recent", "Recently used", r) + CATS.map((c, i) => section(i, c.name, c.items)).join("");
      tabs.hidden = false;
      tabs.querySelector('[data-tab="recent"]').hidden = !r.length;
      list.scrollTop = 0;
      markTab();
    }
  }

  function markTab() {
    const list = P.el.querySelector(".emoji-list");
    let current = null;
    list.querySelectorAll(".emoji-sec").forEach((s) => { if (s.offsetTop - list.offsetTop <= list.scrollTop + 8) current = s.dataset.sec; });
    if (current === null) current = list.querySelector(".emoji-sec")?.dataset.sec;
    P.el.querySelectorAll("[data-tab]").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === current)));
  }

  function place() {
    if (!P) return;
    const r = P.anchor.getBoundingClientRect(), el = P.el, gap = 6, pad = 8;
    const w = el.offsetWidth, h = el.offsetHeight;
    let top = r.bottom + gap;
    if (top + h > innerHeight - pad) top = Math.max(pad, r.top - h - gap);
    el.style.top = `${top}px`;
    el.style.left = `${Math.min(Math.max(pad, r.left), innerWidth - w - pad)}px`;
  }

  function open(anchor, host, onPick, onClose) {
    if (P) {
      const again = P.anchor === anchor && anchor.isConnected;
      close();
      if (again) return; // second click on the button closes it
    }
    const el = document.createElement("div");
    el.className = "emoji-pop";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Insert emoji");
    el.innerHTML = `
      <input type="search" class="emoji-search" placeholder="Search emoji" aria-label="Search emoji" autocomplete="off" spellcheck="false">
      <div class="emoji-tabs" role="tablist" aria-label="Emoji categories">
        <button type="button" role="tab" data-tab="recent" title="Recently used" aria-label="Recently used">🕘</button>
        ${CATS.map((c, i) => `<button type="button" role="tab" data-tab="${i}" title="${esc(c.name)}" aria-label="${esc(c.name)}">${c.items[0].e}</button>`).join("")}
      </div>
      <div class="emoji-list"></div>`;
    host.appendChild(el);
    P = { el, anchor, onPick, onClose };
    anchor.setAttribute("aria-expanded", "true");
    fill("");
    place();

    const search = el.querySelector(".emoji-search");
    const list = el.querySelector(".emoji-list");
    search.addEventListener("input", () => fill(search.value));
    list.addEventListener("scroll", markTab, { passive: true });
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-emoji]");
      if (b) {
        remember(b.dataset.emoji);
        P.onPick(b.dataset.emoji);
        return;
      }
      const t = e.target.closest("[data-tab]");
      if (t) {
        const s = list.querySelector(`[data-sec="${t.dataset.tab}"]`);
        if (s) list.scrollTop = s.offsetTop - list.offsetTop;
        markTab();
      }
    });
    el.addEventListener("keydown", onKey);
    setTimeout(() => {
      document.addEventListener("pointerdown", outside, true);
      addEventListener("resize", place);
    });
    search.focus();
  }

  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); return; }
    const btns = [...P.el.querySelectorAll(".emoji-list .emoji-btn")];
    const i = btns.indexOf(document.activeElement);
    if (e.target.classList.contains("emoji-search")) {
      if (e.key === "Enter" && btns[0]) { e.preventDefault(); btns[0].click(); }
      if (e.key === "ArrowDown" && btns[0]) { e.preventDefault(); btns[0].focus(); }
      return;
    }
    if (i < 0) return;
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLS, ArrowUp: -COLS }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = i + step;
    if (next < 0) P.el.querySelector(".emoji-search").focus();
    else btns[Math.min(next, btns.length - 1)].focus();
  }

  function outside(e) {
    if (P && !P.el.contains(e.target) && !P.anchor.contains(e.target)) close();
  }

  // returnFocus: hand focus back to where the emoji will go (used for Escape)
  function close(returnFocus) {
    if (!P) return;
    const { el, anchor, onClose } = P;
    P = null;
    el.remove();
    anchor.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", outside, true);
    removeEventListener("resize", place);
    if (onClose) onClose(returnFocus === true);
  }

  M.emoji = { open, close, isOpen: () => Boolean(P) };
})();

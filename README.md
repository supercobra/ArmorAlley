# Armor Alley: Web Prototype

Copyright (c) 2013, Scott Schiller

http://www.schillmania.com/armor-alley/

[Original article about building "V1.0"](http://www.schillmania.com/content/entries/2013/armor-alley-web-prototype/) (from 2013)

Demo, features and walk-through of "extreme" mode (55 minutes): https://youtu.be/9BQ62c7u2JM 

Code provided under the [Attribution-NonCommercial 3.0 Unported (CC BY-NC 3.0) License](http://creativecommons.org/licenses/by-nc/3.0/)

-----

## Changelog / Revision History

Previous release: V1.5.20180201

Original release: V1.0.20131031


### V1.6.20220101: Massive update for 2022, based on work from 2020 + 2021

![Armor Alley: Home Screen](https://user-images.githubusercontent.com/174437/148264540-d92c7440-8170-4413-b143-e113717ead8f.png)

![Armor Alley: Gameplay. A tank has just been taken out by the mid-level landing pad.](https://user-images.githubusercontent.com/174437/148266111-7ca11fe3-a3ea-46d7-8e7c-5a70c98ed00b.jpg)

**Video overview**

 • Demo, features and walk-through of "extreme" mode (55 minutes): https://youtu.be/9BQ62c7u2JM 

**Performance improvements**

 • The game should be smoother, targeting 30FPS. It is OK full-screen @ 1080p and windowed @ 4K in Chrome on a 2018 Mac Mini, 3.2 GHz 6-core i7 w/Intel UHD Graphics 630 1536 MB.

 • More GPU-accelerated rendering, reduced DOM nodes by removing when off-screen (e.g., static terrain items)

 • All sprites should be on the GPU and moved using transforms, reducing paint operations

 • All transforms (CSS + JS) for positioning + animation are 3d, with the goal of GPU acceleration - e.g., translate3d(), rotate3d(), scale3d()

 • DOM nodes are not appended at object create time - now deferred until the object is on-screen for the first time.

 • All "sub-sprites" should now be GPU-accelerated via CSS animations, transforms and transitions

 • Sound: Only create `Audio()` when actively playing sounds, and destroy when they finish playing. Browsers are starting to limit the number of `Audio()` instances.

 • Sound: Queue and play sounds all at once with each animation frame callback, vs. prior ad-hoc behaviour.

 • Refactored game tip scroller to only show two nodes at a time, 1024px width vs. 102,400px. Front-end tech / Chrome Dev Tools demo: https://youtu.be/eVW0WgTdK3A

 • Performance: Don't update known static radar items: turret, base, bunkers (bunker, end bunker, super bunker) unless marked as "stale" during resize / world scaling

 • Performance: CSS / `contentVisibility` to reduce / optimize rendering costs

 • Animation loop: improved timing, target 30 fps. Request next frame right away. Exit early if next frame arrives too quickly.

 • Turret "scan" is now a CSS animation; previously, animated via JS.

 • Smart missiles and helicopter trailers are now GPU-accelerated.

 • Performance: Battlefield and radar units are now positioned via transform: translate3d() - no more legacy CSS shenanigans using `bottom: 0px`.

 • Memory leak fixes: DOM nodes, audio events, and a few others.

**Sound**

 • Over 100 sound assets now in use

 • New and updated sound effects: Infantry and engineer gunfire, injury and death, credit +/-, helicopter and turret guns, shell casings on turrets,
bullets hitting the ground, turret being disabled and enabled (restored.)

**UX / UI**

 • Proper "game options" modal with radio buttons and checkboxes for various UX/UI and gameplay features

 • "It was a dark and stormy night" - option for snow on the battlefield. (May be slow on some computers.)

 • Bunkers, balloons and super-bunkers now use graphics from the Macintosh (68K) version of Armor Alley; a bit more orange, and less garish yellow.

 • Dune ][-style credit / debit UI and sounds

 • Toast-style game notifications

 • Health status bars when units are being hit or repaired

 • New and improved smoke / particle effects, more explosions and shrapnel, more fun!

 • Order queue: Refactored UI to show letters (e.g., MTVIE), with superscript numbers as appropriate.

 • Missiles smoke more, and in extreme mode, have a burst of thrust (as in the original game) as they near expiry

 • Pseudo-3D effect on shrapnel: Increase size slightly with vertical position on screen

 • Ground units are "behind" most terrain elements like trees, bushes etc.

**Bug fixes**

 • Bombing floating balloons no longer causes an explosion on the ground

 • Improved bomb and shrapnel alignment / collision positioning with balloons, tanks, bunkers, and super-bunkers

 • Fixed bug with quickly-respawning balloons (shooting balloon while infantry are passing under bunker, for example.)

 • Fixed UI bug where the "incoming missile" white line would not always disappear.

 • Game end: Improve alignment of view and base

 • Adjusted initial position of game, centering view on the helicopter + base

 • Helicopter / super-bunker: Improve vertical alignment if helicopter crashes on superbunker "roof."

 • Fixed radar item for Super Bunkers, now shows correct friendly / enemy status.

 • Cloud "wind" accelerates / decelerates more smoothly

 • Clouds no longer "bounce" when they drift off the end of the world, but get a nice bit of wind to bring them back into view.

 • Slight vertical alignment tweaks on gunfire and balloons in radar view.

 • Improved orientation of heat-seeking smart missiles (and rubber chickens and bananas) as they track their target

 • Tweaked movement and velocity of smart missiles, making them potentially faster / more random

 • Enemy helicopter will now turn to face targets. Sometimes it would fire the other way. ;)

 • Improved helicopter motion when approaching landing pad - "bounce" has largely been eliminated.

 • Improved off-screen / on-screen DOM pruning, restoration of 3D transforms when re-appending DOM elements

 • Fixed end-game bug, sometimes ground units (e.g. van) did not appear at base when blowing up.

 • Adjusted collision detection: if helicopter is hiding "in" a friendly super-bunker, bombs should hit the roof of the super bunker and not the helicopter.

**Gameplay**

 • New weapon: Heat-seeking bananas

 • Ground unit "Traffic Control" option: Vehicles try to leave space between, and avoid overlapping each other. Tanks will now "park" behind friendly tanks, avoiding a pile-up. Tanks normally only stop to fire. Vans and missile launchers will now wait for each other, too. Tanks will not stop for vans or missile launchers, giving tanks a greater chance of ending up at the front of a convoy - a preferable offensive position.

 • Units can now be "recycled" if they cross the battlefield, you are rewarded 2x cost in credits

 • Engineers can now steal all funds from enemy bunker

 • Engineers can now repair (but not rebuid) friendly bunkers

 • Bullets now ricochet off non-friendly super-bunkers

 • Shrapnel will ricochet off certain units (tank, super-bunker)

 • "Incoming missile" doesn't show in extreme mode when the radar is jammed.

 • End base, extreme mode: if a defense missile is destroyed, respawn another within 0.5 seconds.

 • Missile launchers trigger when closer to the helicopter, more likely now to be on-screen

 • Helicopter respawn: Delay if certain ground units are obstructing the landing pad.

 • Enemy helicopter AI: Default 10% of dropping bombs when targeting a tank, subject to game difficulty (hard: 15%, extreme: 25%.)

 • Bombs can now collide with smart missiles and take them out

 • Tank gunfire only hits bunkers if tanks are shooting at a helicopter, or another tank (bug fix: previously, tanks could destroy a bunker trying to hit an infantry on the other side.)

 • Super bunkers that are un-manned are "neutral" and dangerous to both sides, and will be shown as hostile on the radar. (This includes when tanks disarm a bunker by firing at it.)

 • Bomb trajectory now includes the helicopter's Y-axis velocity, and they now rotate along with their trajectory.

 • Helicopters now rise up from the landing pad on game start and respawn, like the original game.

 • Helicopter gunfire takes tilt / angle into account.

 • Helicopter "shake" starts when health is under 70%, gets worse with damage. This affects gunfire trajectory.

 • Your missile launchers only fire at the enemy helicopter when the convoy is "unassisted", e.g., there is no friendly helicopter or turret nearby.

 • Extreme mode: If you shoot down the enemy base's smart missiles while near the base, it will launch new ones that are faster and more difficult to dodge.

 • While on a landing pad, your gunfire may go over infantry's heads most of the time.

 • Don't assume the top of the battlefield is always safe; watch out for balloons!

 • Parachute infantry now fall at slightly different rates, and may be affected more by wind

 • A few additional, inspirational [ game paused in background ] messages

**Technical notes: development / code**

 • Migrated core JavaScript to ES6 syntax, retaining functional + prototypal inheritance style. Slightly less verbose.

 • As part of ES6 migration, dropped legacy IE 8 + 9 code and checks: ancient event handlers, lack of transform, `requestAnimationFrame()` polyfill etc.

 • Lots of cleanup: Exit early, reduced `if/else` nesting. Dropped all `setTimeout()` calls, moved to a frame-based approach: `setFrameTimeout()`.

 • `aa.js` (core game code) is massive at ~450 KB, and seems like a good candidate to be broken up into ES6 modules. TBD.

### V1.51.20181124

**Performance tweaks**

 • More motion / animation is now on the GPU via `transform`, vs. `style.left` / `style.top`.

 • Main animation loop calls `requestAnimationFrame()` first, before anything else (like VSYNC.)

 • Drop legacy SM2 flash options.

 • Turret scan is now driven by CSS animation vs. JS setting an angle transform every frame.

**Sound**

 • New base explosion, tweaked other explosion sound effects.

 • New "heavy mechanics" bunker chain (repair) sound.

### V1.5.20180201

**Big feature updates!**

 • Game "mostly" now works on mobile devices. Touch-based events for helicopter control, UI for helicopter weapons and inventory / ordering. Tested on iPhone X. Others should work reasonably-well. Hopefully.

 • Inventory order queueing! 🎉 (Finally.) e.g., 3 tanks in a row. Queueing deducts funds immediately. No added UI or cancel ability (yet.)

 • Battlefield view is now bigger on screen. Stats UI is dead, long live stats.
  
 • Performance improvements. tl;dr: JavaScript tweaks, putting most all sprites onto the GPU. Replaced most common animated .GIF backgrounds with 3d-transform, GPU-accelerated CSS animation-driven sprites. 😅

**Sound**
 
 • No sound for any Safari (desktop or mobile) for now, including version 11.0. Multiple sounds kill performance on desktop, and "auto-play" is effectively blocked on mobile. https://bugs.webkit.org/show_bug.cgi?id=116145

 • New + improved helicopter machine gun sounds. 9 different samples, played at random.

 • New sound effects: "bomb hatch" (helicopter bomb release), tank gunfire, bunker chain/balloon repair, helicopter gunfire hit.

 • "Medals clanking" sound for bunker chain/balloon repair. (BY-NC 3.0.) https://freesound.org/people/Gareth_H/sounds/365799/

 • New tank gunfire sound: "Tank Fire Mixed.wav" by Cyberkineticfilms/freesound.org (CC0, "No Rights Reserved". 🙇)

 • Hat tip: "Bolo" "tank self hit" sound effect, Copyright (C) Steuart Cheshire 1993. My favourite Mac game of all time. ❤️

**UX / UI**
  
 • "Radar jammed" TV static-like overlay with transform sprite.

 • Parachute infantry swing in the air thanks to CSS animations, and move more smoothly when the wind picks up.

 • Jam radar all the time when an enemy van is within range on hard + extreme game types. (previously, jamming could switch on/off at random intervals.)

 • Slightly faster helicopter bombing rate - more responsive.
  
 • Chain refactor. Use fixed height, animate via transform, fall with gravity when balloon and/or bunker are lost.

 • Balloons are yellow-ish on radar, and now transform-rotated to elliptical shapes. Bunkers / base color and border tweaks, friendly vs. enemy now look different.

 • Inventory and helicopter ammo, etc., become greyed out when unaffordable / unavailable.

 • Target / "tracking" animation on Smart Missile targets.

 • Smart Missiles can now re-target on the next frame after the original target dies. If a new target can not be immediately acquired, the Smart Missile dies as previously.

 • Radar items, clouds and some other sprites move more smoothly simply by dropping `parseInt()`.

 • "C" / rubber chicken use causes UI to switch to rubber chicken mode.

 • Possible bugfix: If paused and enemy order timer fires, re-start timer. This probably fixes enemy inventory building sometimes breaking.


**Miscellany**

 • Note re: Firefox `will-change` memory consumption warning that might show in console.

 • URL feature flags: `noTranslate3d` and `noRadarGPU`. `frameRate=[60|*]` for testing of `requestAnimationFrame()` timing. camelCase others. Let Opera (now webkit-based) have transforms.

 • +`makeTransformSprite()`, a sort of sub-sprite for CSS transform-based animations (GPU-accelerated animated .GIF alternatives.)

 • `z-index: -1` can be harmful for performance / compositing.

 • iPhone X notch handling based on orientation and whatnot.

-----

## License

(ISC license applies to original game images and related assets, used with permission)

Armor Alley (original MS-DOS version)
http://en.wikipedia.org/wiki/Armor_alley

Copyright (c) 1990, Information Access Technologies

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
OF THIS SOFTWARE.

-----

## Acknowledgements and Credits

Many thanks are due to the original game author for granting permission
to use the Armor Alley images and related assets under an ISC license.
http://opensource.org/licenses/ISC

As the original sound effects could not be re-licensed, modern
(and higher-fidelity) sound effects were found on http://freesound.org

Thanks go to numerous individuals for making their work available.
The majority of these sounds have been published under a Creative Commons
Attribution license, or other as specified. Details at each link.

## Sounds

[01587 helicopter.wav](http://freesound.org/people/Robinhood76/sounds/94867/) by Robinhood76

[Click](http://freesound.org/people/lebcraftlp/sounds/192279/) by lebcraftlp

[Cloth Flaps](http://freesound.org/people/Sauron974/sounds/188733/) by Sauron974

[DarkDetonation01.wav](http://freesound.org/people/M-RED/sounds/183870/) by M-RED

[Debris Sifting Dry.aif](http://freesound.org/people/kantouth/sounds/115113/) by kantouth

[explosion.mp3](http://freesound.org/people/sarge4267/sounds/102719/) by sarge4267

[explosion3.wav](http://freesound.org/people/sarge4267/sounds/102733/) by sarge4267

[explosion 4.aif](http://freesound.org/people/harpoyume/sounds/86032/) by harpoyume

[Gunshot 1.wav](http://freesound.org/people/Adam_N/sounds/164667/) by Adam_N

[GunShot.03.wav](http://freesound.org/people/stintx/sounds/107620/) by stintx

[Warfare_gunshots_machine_gun_burst_001.wav](http://freesound.org/people/soundscalpel.com/sounds/110622/) by soundscalpel.com

[oddworld_bomb.wav](http://freesound.org/people/Oddworld/sounds/75330/) by Oddworld

[D6.wav](http://freesound.org/people/RealRhodesSounds/sounds/4194/) by RealRhodesSounds

[snapping-chain](http://freesound.org/people/CosmicEmbers/sounds/161650/) by CosmicEmbers

[Stapler_Hands_05.wav](http://freesound.org/people/Simon_Lacelle/sounds/67352/) by Simon Lacelle

[static.wav](http://freesound.org/people/g_lowing/sounds/84432/) by g_lowing

[vhs hum](http://freesound.org/people/jacobzeier/sounds/166178/) by jocobzeier

[Metal Click Sound](http://freesound.org/people/mkoenig/sounds/81175/) by mkoenig

[impact_water_splash_bomb_throw_flesh_01.wav](http://freesound.org/people/m_O_m/sounds/108758/) by m_O_m

[Faulty Flourescent Light Start & Hum.wav](http://freesound.org/people/EverydaySounds/sounds/125064/) by EverydaySounds

[Wilhem Scream Sample (1951)](http://archive.org/details/WilhelmScreamSample) - archive.org

[imppact wrench bounce.wav](http://freesound.org/people/andrewgnau2/sounds/71534/) by andrewgnau2

[Socket Wrench](http://freesound.org/people/TheGertz/sounds/131200/) by TheGertz

[Socket Wrench](http://freesound.org/people/xxqmanxx/sounds/147018/) by xxqmanxx

[alligator wrench 01.wav](http://freesound.org/people/klankbeeld/sounds/198299/) by klankbeeld

[Violin C-5 Pizzicato Non-Vibrato](http://freesound.org/people/Carlos_Vaquero/sounds/153616/) by Carlos Vaquero

[Violin G-4 Pizzicato Non-Vibrato](http://freesound.org/people/Carlos_Vaquero/sounds/153611/) by Carlos Vaquero

[Pop_9.aif](http://freesound.org/people/SunnySideSound/sounds/67095/) by SunnySideSound

[Pop SFX](http://freesound.org/people/runirasmussen/sounds/178446/) by runirasmussen

[Crash & Glass.wav](http://freesound.org/people/Rock%20Savage/sounds/59263/) by Rock Savage

[splats.wav](http://freesound.org/people/FreqMan/sounds/42962/) by FreqMan

[Door Closing.wav](http://freesound.org/people/ceberation/sounds/235513/) by ceberation

[Metal-Clanging.mp3](http://freesound.org/people/Tiger_v15/sounds/211015/) by Tiger_v15

[Metal_Hit_02.wav](http://freesound.org/people/dheming/sounds/197398/) by dheming

[bolo-hit-tank-self.wav](https://en.wikipedia.org/wiki/Bolo_(1987_video_game)) from "[Bolo](http://bolo.net/)", Copyright (C) Steuart Cheshire 1993. A subtle tribute to my favourite Mac game of all-time, hands down. <3

(See also: [Orona](https://github.com/stephank/orona) Coffeescript partial port, WinBolo source code [on Google Code via archive.org](http://web.archive.org/web/20170105114652/https://code.google.com/archive/p/winbolo/) and [on GitHub](https://github.com/kippandrew/winbolo))

[Tank fire Mixed.wav](https://freesound.org/people/Cyberkineticfilms/sounds/127845/) by Cyberkineticfilms (CC0 License, “No Rights Reserved”)

[Medals Clanking](https://freesound.org/people/Gareth_H/sounds/365799/) by Gareth_H (BY-NC 3.0)

[Gun/Canon » Auto Assault Rifle/Gun Burst (Outdoor/Close) (Mixed)](https://freesound.org/people/EFlexTheSoundDesigner/sounds/393671/) by EFlexTheSoundDesigner (BY-NC 3.0)

[Tank fire Mixed.wav](https://freesound.org/people/Cyberkineticfilms/sounds/127845/) by Cyberkineticfilms (CC0 License, “No Rights Reserved”)

[Metal Heavy Mechanics](https://freesound.org/people/jorickhoofd/sounds/160048/) by jorickhoofd (CC-BY 3.0)

[Gun/Canon » Auto Assault Rifle/Gun Burst (Outdoor/Close) (Mixed)](https://freesound.org/people/EFlexTheSoundDesigner/sounds/393671/) by EFlexTheSoundDesigner (BY-NC 3.0)

[`Gun_AR15_Machine_Gun_3_Single_Shot` and `Gun_Machine_Gun_M60E_Burst_1`](http://creativesounddesign.com/the-recordist-free-sound-effects/) by The Recordist

[Body Hits_Concrete.wav](https://freesound.org/people/mlsulli/sounds/234853/) by mlsulli (CC0)

[Gun Shells Hitting Ground](https://freesound.org/search/?g=1&q=shell%20hitting%20ground&f=%20username:%22filmmakersmanual%22) (2,3,12,16,36,37) by FilmmakersManual (CC0)

[Heavy machine gun.wav](https://freesound.org/people/CGEffex/sounds/101961/) by CGEffex (CC BY 3.0)

[Chairs Break, Crash, pieces move.wav](https://freesound.org/people/issalcake/sounds/115919/) by issalcake (CC0)

[Bullet - Metal Hit (2-4)](https://freesound.org/search/?g=1&q=bullet%20metal%20hit&f=%20username:%22filmmakersmanual%22) by FilmmakersManual (CC0)

[Bullet - Concrete Hit (2-4)](https://freesound.org/search/?q=bullet+concrete+hit&f=username%3A%22filmmakersmanual%22) by FilmmakersManual (CC0)

[Incoming Ricochets 2.wav](https://freesound.org/people/rakurka/sounds/109957/) by rakurka (CC BY 3.0)

[Rick O'Shay » selected ricochets (no bang) from craigsmith's freesound 486071.wav](https://freesound.org/people/Timbre/sounds/486343/) by Timbre (CC BY-NC 3.0)

[aparicion .wav](https://freesound.org/people/citeyo1/sounds/430302/) by citeyo1 (CC0)

[HQ Explosion](https://freesound.org/people/Quaker540/sounds/245372/) by Quaker540 (CC0)

[Explosion Near.wav](https://freesound.org/people/Bykgames/sounds/414345/) by Bykgames (CC BY-NC 3.0)

[musical saw ascending UFO](https://freesound.org/people/JohnsonBrandEditing/sounds/173948/) by JohnsonBrandEditing (CC0)

## Images

Gear SVG by Fabián Alexis (CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=49940470)
https://github.com/fabianalexisinostroza/Antu

## Fonts ("Typefaces" :P)

[FA Sysfont C](https://fontsarena.com/sysfont-by-alina-sava/) by Alina Sava (SIL Open Font License 1.1)

[JetBrains Mono](https://www.jetbrains.com/lp/mono/) webfont, JetBrains. [SIL Open Font License 1.1](https://www.jetbrains.com/lp/mono/#license)

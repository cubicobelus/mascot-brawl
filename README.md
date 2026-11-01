# Mascot Brawl (working title)

A platform fighter in your browser with college football mascots. Knock the other mascot off the
stage: the more damage they have, the farther they fly. Plain HTML and JavaScript on a canvas, no build step,
no dependencies.

## Play

Download the repo and open `index.html` in a browser.

## Controls

| | Player 1 | Player 2 |
|---|---|---|
| Move | A / D | Left / Right |
| Jump (twice in the air for most) | W | Up |
| Down (drop through, fast fall) | S | Down |
| Attack | F | K or Numpad 1 |
| Special | G | L or Numpad 2 |

Attack and special both change with the direction held. Attack: neutral, sideways, up, down (a spike in the
air). Special: four moves unique to each mascot; up special is the way back to the stage. Landing and taking hits
fills the **Heisman meter**; when it is full, press attack and special together for that mascot's super move.
**C** on the select screen switches player 2 between CPU and human. **P** pauses, **Esc** goes back to the select
screen.

## Mascots

The first wave is every SEC and Big 12 mascot. Playable so far: **Hairy Dawg** (Georgia), **Mike the Tiger** (LSU)
and **Bevo** (Texas). The rest show as coming soon.

## License

MIT, see [LICENSE](LICENSE).

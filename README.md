# Mascot Brawl (working title)

A platform fighter in your browser with college football style animal mascots. Knock the other mascot off the
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

Attack changes with the direction held: neutral, sideways, up, down (a spike in the air). Each special is unique
and can be used once per jump, so it doubles as a way back to the stage. **C** on the select screen switches
player 2 between CPU and human. **P** pauses, **Esc** goes back to the select screen.

## Mascots

- **Bulldog**: heavy hitter, slow, hard to launch. Special: Ground Pound.
- **Duck**: light and quick, three jumps. Special: Wing Dash.
- **Longhorn**: long sideways charge, big reach. Special: Stampede.
- **Tiger**: all-rounder. Special: Pounce.

## License

MIT, see [LICENSE](LICENSE).

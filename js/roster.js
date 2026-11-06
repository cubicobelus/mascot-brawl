'use strict';
// The first wave: every SEC and Big 12 mascot. kind picks the drawing; a slot whose id has no kit in KITS
// shows as "coming soon" on the select screen.

const ROSTER = [
  // SEC
  { id: 'alabama', conf: 'SEC', school: 'Alabama', team: 'Crimson Tide', mascot: 'Big Al', weight: 'Heavy', color: '#9e1b32', trim: '#ffffff', kind: 'elephant', skin: '#a8a8b3' },
  { id: 'arkansas', conf: 'SEC', school: 'Arkansas', team: 'Razorbacks', mascot: 'Big Red', weight: 'Heavy', color: '#9d2235', trim: '#ffffff', kind: 'hog', skin: '#8a5a48' },
  { id: 'auburn', conf: 'SEC', school: 'Auburn', team: 'Tigers', mascot: 'Aubie', weight: 'Medium', color: '#0c2340', trim: '#e87722', kind: 'tiger', skin: '#e87722' },
  { id: 'florida', conf: 'SEC', school: 'Florida', team: 'Gators', mascot: 'Albert', weight: 'Heavy', color: '#0021a5', trim: '#fa4616', kind: 'gator', skin: '#4a9a3a' },
  { id: 'georgia', conf: 'SEC', school: 'Georgia', team: 'Bulldogs', mascot: 'Hairy Dawg', weight: 'Medium', color: '#ba0c2f', trim: '#1a1a1a', kind: 'bulldog', skin: '#d8c3a5' },
  { id: 'kentucky', conf: 'SEC', school: 'Kentucky', team: 'Wildcats', mascot: 'The Wildcat', weight: 'Light', color: '#0033a0', trim: '#ffffff', kind: 'cat', skin: '#3f6fe0' },
  { id: 'lsu', conf: 'SEC', school: 'LSU', team: 'Tigers', mascot: 'Mike the Tiger', weight: 'Heavy', color: '#461d7c', trim: '#fdd023', kind: 'tiger', skin: '#f39b2b' },
  { id: 'olemiss', conf: 'SEC', school: 'Ole Miss', team: 'Rebels', mascot: 'Tony the Landshark', weight: 'Medium', color: '#ce1126', trim: '#14213d', kind: 'shark', skin: '#7a8aa0' },
  { id: 'missstate', conf: 'SEC', school: 'Mississippi State', team: 'Bulldogs', mascot: 'Bully', weight: 'Heavy', color: '#5d1725', trim: '#ffffff', kind: 'bulldog', skin: '#d8c3a5' },
  { id: 'missouri', conf: 'SEC', school: 'Missouri', team: 'Tigers', mascot: 'Truman', weight: 'Medium', color: '#f1b82d', trim: '#000000', kind: 'tiger', skin: '#e8a020' },
  { id: 'oklahoma', conf: 'SEC', school: 'Oklahoma', team: 'Sooners', mascot: 'Sooner Schooner', weight: 'Heavy', color: '#841617', trim: '#fdf9d8', kind: 'horse', skin: '#c9a27a' },
  { id: 'southcarolina', conf: 'SEC', school: 'South Carolina', team: 'Gamecocks', mascot: 'Cocky', weight: 'Light', color: '#73000a', trim: '#000000', kind: 'rooster', skin: '#b3141f' },
  { id: 'tennessee', conf: 'SEC', school: 'Tennessee', team: 'Volunteers', mascot: 'Smokey', weight: 'Medium', color: '#ff8200', trim: '#ffffff', kind: 'hound', skin: '#8a9bb5' },
  { id: 'texas', conf: 'SEC', school: 'Texas', team: 'Longhorns', mascot: 'Bevo', weight: 'Heavy', color: '#bf5700', trim: '#ffffff', kind: 'longhorn', skin: '#bf5700' },
  { id: 'texasam', conf: 'SEC', school: 'Texas A&M', team: 'Aggies', mascot: 'Reveille', weight: 'Light', color: '#500000', trim: '#ffffff', kind: 'hound', skin: '#8a5a30' },
  { id: 'vanderbilt', conf: 'SEC', school: 'Vanderbilt', team: 'Commodores', mascot: 'Mr. Commodore', weight: 'Medium', color: '#1a1a1a', trim: '#cfae70', kind: 'captain', skin: '#e0b48a' },
  // Big 12
  { id: 'arizona', conf: 'Big 12', school: 'Arizona', team: 'Wildcats', mascot: 'Wilbur', weight: 'Light', color: '#cc0033', trim: '#003366', kind: 'cat', skin: '#e05a6a' },
  { id: 'arizonastate', conf: 'Big 12', school: 'Arizona State', team: 'Sun Devils', mascot: 'Sparky', weight: 'Medium', color: '#8c1d40', trim: '#ffc627', kind: 'devil', skin: '#d03030' },
  { id: 'baylor', conf: 'Big 12', school: 'Baylor', team: 'Bears', mascot: 'Bruiser', weight: 'Heavy', color: '#154734', trim: '#ffb81c', kind: 'bear', skin: '#7a5230' },
  { id: 'byu', conf: 'Big 12', school: 'BYU', team: 'Cougars', mascot: 'Cosmo', weight: 'Light', color: '#002e5d', trim: '#ffffff', kind: 'cat', skin: '#c49a64' },
  { id: 'cincinnati', conf: 'Big 12', school: 'Cincinnati', team: 'Bearcats', mascot: 'The Bearcat', weight: 'Medium', color: '#e00122', trim: '#1a1a1a', kind: 'cat', skin: '#d8333f' },
  { id: 'colorado', conf: 'Big 12', school: 'Colorado', team: 'Buffaloes', mascot: 'Ralphie', weight: 'Heavy', color: '#1a1a1a', trim: '#cfb87c', kind: 'bison', skin: '#4a3a2a' },
  { id: 'houston', conf: 'Big 12', school: 'Houston', team: 'Cougars', mascot: 'Shasta', weight: 'Light', color: '#c8102e', trim: '#ffffff', kind: 'cat', skin: '#d8b090' },
  { id: 'iowastate', conf: 'Big 12', school: 'Iowa State', team: 'Cyclones', mascot: 'Cy', weight: 'Light', color: '#c8102e', trim: '#f1be48', kind: 'cardinal', skin: '#c8102e' },
  { id: 'kansas', conf: 'Big 12', school: 'Kansas', team: 'Jayhawks', mascot: 'Big Jay', weight: 'Light', color: '#0051ba', trim: '#e8000d', kind: 'jayhawk', skin: '#2a6ad8' },
  { id: 'kansasstate', conf: 'Big 12', school: 'Kansas State', team: 'Wildcats', mascot: 'Willie', weight: 'Medium', color: '#512888', trim: '#ffffff', kind: 'cat', skin: '#7a4fb8' },
  { id: 'okstate', conf: 'Big 12', school: 'Oklahoma State', team: 'Cowboys', mascot: 'Pistol Pete', weight: 'Medium', color: '#ff7300', trim: '#1a1a1a', kind: 'cowboy', skin: '#e0b48a', ammo: 6 },
  { id: 'tcu', conf: 'Big 12', school: 'TCU', team: 'Horned Frogs', mascot: 'SuperFrog', weight: 'Light', color: '#4d1979', trim: '#a3a9ac', kind: 'frog', skin: '#6ab04c' },
  { id: 'texastech', conf: 'Big 12', school: 'Texas Tech', team: 'Red Raiders', mascot: 'Raider Red', weight: 'Medium', color: '#cc0000', trim: '#1a1a1a', kind: 'cowboy', skin: '#e0b48a' },
  { id: 'ucf', conf: 'Big 12', school: 'UCF', team: 'Knights', mascot: 'Knightro', weight: 'Medium', color: '#1a1a1a', trim: '#ffc904', kind: 'knight', skin: '#e0b48a' },
  { id: 'utah', conf: 'Big 12', school: 'Utah', team: 'Utes', mascot: 'Swoop', weight: 'Light', color: '#cc0000', trim: '#ffffff', kind: 'hawk', skin: '#a02323' },
  { id: 'westvirginia', conf: 'Big 12', school: 'West Virginia', team: 'Mountaineers', mascot: 'The Mountaineer', weight: 'Heavy', color: '#002855', trim: '#eaaa00', kind: 'frontier', skin: '#e0b48a' },
];

# ジェム登録状況の調査

## 通常ジェム対応（2026-11-06）

通常ジェム8件を追加: Holy Strike / Holy Hammers / Shield of Light / Divine Blast / Mana-Infused Staff / Hallow Support / Blessed Call Support / Excommunicate Support。

既存5件を修正: Sweep → Holy Sweep、Lesser Multiple Projectiles Support → Multiple Projectiles Support、通常Barrageの英語名、通常Bladefallの英語名、Dark Pact → Dark Bargain（日本語名は取得確認できた既存表記を維持）。Holy StrikeとHallowは初期エリアで入手するため、クエスト報酬に誤登録せずnullとした。

変容ジェム・Vaalスキル・覚醒サポートは依頼により追加対象外。通常ジェムとしてはExceptionalタグ付きの特殊ジェムとPactスキルも対象外とした。以下の候補一覧と件数は修正前の調査記録。

追加・名称変更した日本語Regexは、登録ジェム一覧で対象だけに一致することを確認。

確認日: 2026-11-05。実装データ520件と、PoEDBの英語名を大文字小文字を無視して照合。

出典: https://poedb.tw/us/Skill_Gems / https://poedb.tw/us/Support_Gems

スキル一覧の見出しは563件だが、一覧内でConvocationが重複しており、一意のリンクは562件。サポートは262件。英語名が一致しない候補はスキル279件、サポート88件。

これは現在の一覧との名称差分であり、すべてが追加対象ではない。旧名称、廃止済み項目、入手不可項目、対応バージョンの違いを個別に確認する必要がある。既存実装は一覧データをそのまま表示しており、変容・覚醒・Vaalを除外する表示フィルターは見当たらない。

Barrage / Bladefallは同じ日本語名の既存レコードがあり英語名の整合確認が必要。Multiple Projectiles Supportは既存のLesser Multiple Projectiles Supportとの名称変更候補。Holy Sweepは既存Sweepとの関係確認が必要。

狂乱の餌付けサポートは前回追加済み。本調査ではジェムデータは追加変更していない。

## 変容スキル: 214件

- Cleave of Rage
- Glacial Hammer of Shattering
- Ground Slam of Earthshaking
- Heavy Strike of Trarthus
- Molten Strike of the Zenith
- Perforate of Duality
- Perforate of Bloodshed
- Shield Crush of the Chieftain
- Smite of Divine Judgement
- Holy Flame Totem of Ire
- Leap Slam of Groundbreaking
- Absolution of Inspiring
- Chain Hook of Angling
- Chain Hook of Trarthus
- Earthshatter of Fragility
- Earthshatter of Prominence
- Exsanguinate of Transmission
- Infernal Blow of Immolation
- Searing Bond of Detonation
- Static Strike of Gathering Lightning
- Sunder of Earthbreaking
- Sunder of Trarthus
- Holy Sweep of Hammerfalls
- Volcanic Fissure of Snaking
- Animate Guardian of Smiting
- Bladestorm of Uncertainty
- Boneshatter of Complex Trauma
- Boneshatter of Carnage
- Consecrated Path of Endurance
- Divine Blast of Radiance
- Dominating Blow of Inspiring
- Earthquake of Amplification
- Holy Hammers of Spirals
- Ice Crash of Cadence
- Rage Vortex of Berserking
- Reap of Butchery
- Shockwave Totem of Authority
- Tectonic Slam of Cataclysm
- Frozen Legion of Rallying
- Summon Flame Golem of Hordes
- Summon Flame Golem of the Meteor
- Summon Stone Golem of Hordes
- Summon Stone Golem of Safeguarding
- Burning Arrow of Vigour
- Caustic Arrow of Poison
- Double Strike of Impaling
- Double Strike of Momentum
- Dual Strike of Ambidexterity
- Ethereal Knives of Lingering Blades
- Ethereal Knives of the Massacre
- Explosive Trap of Shrapnel
- Explosive Trap of Magnitude
- Frost Blades of Katabasis
- Galvanic Arrow of Energy
- Galvanic Arrow of Surging
- Ice Shot of Penetration
- Spectral Throw of Materialising
- Spectral Throw of Trarthus
- Split Arrow of Splitting
- Splitting Steel of Ammunition
- Viper Strike of the Mamba
- Animate Weapon of Self Reflection
- Animate Weapon of Ranged Arms
- Bear Trap of Skewers
- Detonate Dead of Scavenging
- Detonate Dead of Chain Reaction
- Puncture of Shanking
- Shrapnel Ballista of Steel
- Blink Arrow of Bombarding Clones
- Blink Arrow of Prismatic Clones
- Flicker Strike of Power
- Mirror Arrow of Bombarding Clones
- Mirror Arrow of Prismatic Clones
- Barrage of Volley Fire
- Blade Trap of Greatswords
- Blade Trap of Laceration
- Blade Vortex of the Scythe
- Elemental Hit of the Spectrum
- Fire Trap of Blasting
- Lacerate of Butchering
- Lacerate of Haemorrhage
- Lightning Arrow of Electrocution
- Lightning Strike of Arcing
- Poisonous Concoction of Bouncing
- Rain of Arrows of Artillery
- Rain of Arrows of Saturation
- Reave of Refraction
- Shattering Steel of Ammunition
- Siege Ballista of Splintering
- Siege Ballista of Trarthus
- Spectral Helix of Trarthus
- Toxic Rain of Sporeburst
- Toxic Rain of Withering
- Volatile Dead of Confinement
- Volatile Dead of Seething
- Blade Blast of Unloading
- Blade Blast of Dagger Detonation
- Frenzy of Onslaught
- Artillery Ballista of Cross Strafe
- Artillery Ballista of Focus Fire
- Blade Flurry of Incision
- Bladefall of Volleys
- Bladefall of Impaling
- Blast Rain of Trarthus
- Charged Dash of Projection
- Cremation of Exhuming
- Cremation of the Volcano
- Cyclone of Tumult
- Explosive Concoction of Destruction
- Flamethrower Trap of Stability
- Ice Trap of Hollowness
- Lancing Steel of Spraying
- Scourge Arrow of Menace
- Seismic Trap of Swells
- Spectral Shield Throw of Shattering
- Spectral Shield Throw of Trarthus
- Storm Rain of the Conduit
- Storm Rain of the Fence
- Tornado Shot of Cloudburst
- Wild Strike of Extremes
- Summon Ice Golem of Hordes
- Summon Ice Golem of Shattering
- Tornado of Elemental Turbulence
- Blight of Contagion
- Blight of Atrophy
- Kinetic Bolt of Fragmentation
- Lightning Tendrils of Eccentricity
- Lightning Tendrils of Escalation
- Purifying Flame of Revelations
- Raise Zombie of Slamming
- Raise Zombie of Falling
- Spark of the Nova
- Spark of Unpredictability
- Contagion of Subsiding
- Contagion of Transference
- Frost Bomb of Instability
- Frost Bomb of Forthcoming
- Frost Wall of Encroachment
- Frostblink of Wintry Blast
- Orb of Storms of Squalls
- Summon Holy Relic of Conviction
- Summon Raging Spirit of Enormity
- Bodyswap of Sacrifice
- Flame Dash of Return
- Siphoning Trap of Pain
- Summon Skeletons of Archers
- Summon Skeletons of Mages
- Arc of Surging
- Arc of Oscillating
- Creeping Frost of Floes
- Essence Drain of Desperation
- Essence Drain of Wickedness
- Flame Surge of Combusting
- Ice Nova of Frostbolts
- Ice Nova of Deep Freeze
- Ice Spear of Splitting
- Icicle Mine of Fanning
- Icicle Mine of Sabotage
- Incinerate of Expanse
- Incinerate of Venting
- Kinetic Fusillade of Detonation
- Lightning Trap of Sparking
- Power Siphon of the Archmage
- Scorching Ray of Immolation
- Storm Brand of Indecision
- Storm Burst of Repulsion
- Storm Call of Trarthus
- Cold Snap of Power
- Forbidden Rite of Soul Sacrifice
- Galvanic Field of Intensity
- Righteous Fire of Arcane Devotion
- Wave of Conviction of Trarthus
- Bane of Condemnation
- Armageddon Brand of Volatility
- Armageddon Brand of Recall
- Ball Lightning of Orbiting
- Ball Lightning of Static
- Crackling Lance of Branching
- Crackling Lance of Disintegration
- Dark Bargain of Trarthus
- Discharge of Misery
- Divine Ire of Holy Lightning
- Divine Ire of Disintegration
- Eye of Winter of Finality
- Eye of Winter of Transience
- Firestorm of Meteors
- Firestorm of Pelting
- Flameblast of Celerity
- Flameblast of Contraction
- Glacial Cascade of the Fissure
- Hexblast of Contradiction
- Hexblast of Havoc
- Kinetic Blast of Clustering
- Kinetic Rain of Impact
- Lightning Conduit of the Heavens
- Lightning Spire Trap of Zapping
- Lightning Spire Trap of Overloading
- Penance Brand of Dissipation
- Penance Brand of Conduction
- Pyroclast Mine of Sabotage
- Raise Spectre of Transience
- Shock Nova of Procession
- Soulrend of Reaping
- Soulrend of the Spiral
- Stormbind of Teleportation
- Summon Reaper of Revenants
- Summon Reaper of Eviscerating
- Vortex of Projection
- Summon Carrion Golem of Hordes
- Summon Carrion Golem of Scavenging
- Summon Chaos Golem of Hordes
- Summon Chaos Golem of the Maelström
- Summon Lightning Golem of Hordes
- Void Sphere of Rending

## その他のスキル（名称変更候補を含む）: 9件

- Holy Strike
- Holy Sweep
- Shield of Light
- Divine Blast
- Holy Hammers
- Barrage
- Bladefall
- Mana-Infused Staff
- Dark Bargain

## Vaalスキル: 52件

- Vaal Cleave
- Vaal Glacial Hammer
- Vaal Ground Slam
- Vaal Molten Strike
- Vaal Smite
- Vaal Rejuvenation Totem
- Vaal Absolution
- Vaal Volcanic Fissure
- Vaal Molten Shell
- Vaal Impurity of Fire
- Vaal Ancestral Warchief
- Vaal Domination
- Vaal Earthquake
- Vaal Reap
- Vaal Immortal Call
- Vaal Burning Arrow
- Vaal Caustic Arrow
- Vaal Double Strike
- Vaal Ice Shot
- Vaal Spectral Throw
- Vaal Animate Weapon
- Vaal Detonate Dead
- Vaal Flicker Strike
- Vaal Blade Vortex
- Vaal Lightning Arrow
- Vaal Lightning Strike
- Vaal Rain of Arrows
- Vaal Reave
- Vaal Venom Gyre
- Vaal Arctic Armour
- Vaal Grace
- Vaal Haste
- Vaal Impurity of Ice
- Vaal Blade Flurry
- Vaal Cyclone
- Vaal Blight
- Vaal Fireball
- Vaal Spark
- Vaal Clarity
- Vaal Lightning Warp
- Vaal Summon Skeletons
- Vaal Arc
- Vaal Ice Nova
- Vaal Lightning Trap
- Vaal Power Siphon
- Vaal Storm Call
- Vaal Cold Snap
- Vaal Righteous Fire
- Vaal Discipline
- Vaal Impurity of Lightning
- Vaal Firestorm
- Vaal Flameblast

## Pactスキル: 4件

- Pact of Beidat
- Pact of Ghorr
- Pact of K'Tash
- Pact of Lycia

## その他のサポート（名称変更候補を含む）: 50件

- Hallow Support
- Blessed Call Support
- Excommunicate Support
- Annihilation Support
- Bloodsoaked Banner Support
- Bonespire Support
- Crystalfall Support
- Divine Sentinel Support
- Fissure Support
- Greater Ancestral Call Support
- Greater Multistrike Support
- Overheat Support
- Pyre Support
- Transfusion Support
- Vaal Temptation Support
- Void Shockwave Support
- Multiple Projectiles Support
- Cast on Ward Break Support
- Companionship Support
- Cull the Weak Support
- Greater Chain Support
- Greater Fork Support
- Invention Support
- Lethal Dose Support
- Machinations Support
- Pacifism Support
- Unholy Trinity Support
- Voidstorm Support
- Exemplar Support
- Congregation Support
- Cooldown Recovery Support
- Coursing Current Support
- Eldritch Blasphemy Support
- Foulgrasp Support
- Frostmage Support
- Gluttony Support
- Greater Devour Support
- Greater Kinetic Instability Support
- Greater Spell Cascade Support
- Greater Spell Echo Support
- Greater Unleash Support
- Hexpass Support
- Hextoad Support
- Hiveborn Support
- Invert the Rules Support
- Communion Support
- Overloaded Intensity Support
- Scornful Herald Support
- Vaal Sacrifice Support
- Eclipse Support

## 覚醒サポート: 38件

- Awakened Added Fire Damage Support
- Awakened Ancestral Call Support
- Awakened Brutality Support
- Awakened Burning Damage Support
- Awakened Elemental Damage with Attacks Support
- Awakened Empower Support
- Awakened Fire Penetration Support
- Awakened Generosity Support
- Awakened Melee Physical Damage Support
- Awakened Melee Splash Support
- Awakened Multistrike Support
- Awakened Added Cold Damage Support
- Awakened Arrow Nova Support
- Awakened Cast On Critical Strike Support
- Awakened Chain Support
- Awakened Cold Penetration Support
- Awakened Deadly Ailments Support
- Awakened Enhance Support
- Awakened Fork Support
- Awakened Greater Multiple Projectiles Support
- Awakened Swift Affliction Support
- Awakened Vicious Projectiles Support
- Awakened Void Manipulation Support
- Awakened Added Chaos Damage Support
- Awakened Added Lightning Damage Support
- Awakened Blasphemy Support
- Awakened Cast While Channelling Support
- Awakened Controlled Destruction Support
- Awakened Elemental Focus Support
- Awakened Enlighten Support
- Awakened Hextouch Support
- Awakened Increased Area of Effect Support
- Awakened Lightning Penetration Support
- Awakened Minion Damage Support
- Awakened Spell Cascade Support
- Awakened Spell Echo Support
- Awakened Unbound Ailments Support
- Awakened Unleash Support

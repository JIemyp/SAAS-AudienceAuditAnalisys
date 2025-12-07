# CANVAS EXTENDED V2 — Повна специфікація

## ЩО ЦЕ

Найглибший аналіз кожного TOP pain в контексті конкретного сегмента.
Генерується ОКРЕМО для кожної пари: pain + segment.

Якщо є 42 top pains → 42 окремих Canvas Extended.


## ВХІДНІ ДАНІ

Для кожного виклику промпта потрібно зібрати:

### 1. PRODUCT CONTEXT (з onboarding)
- brandName
- productService
- problemSolved
- uniqueMechanism
- priceSegment

### 2. SEGMENT (з segments_initial)
- name
- description
- sociodemographics

### 3. SEGMENT DETAILS (з segment_details WHERE segment_id = X)
- needs[]
- core_values[]
- awareness_level
- objections[]

### 4. JOBS (з jobs WHERE segment_id = X)
- functional_jobs[]
- emotional_jobs[]
- social_jobs[]

### 5. TRIGGERS (з triggers WHERE segment_id = X)
- triggers[] (кожен має: name, description, psychological_basis, trigger_moment)

### 6. PAIN (з pains_initial WHERE id = Y)
- name
- description
- deep_triggers[]
- examples[]

### 7. CANVAS (з canvas WHERE pain_id = Y)
- emotional_aspects
- behavioral_patterns
- buying_signals


---

## СИСТЕМНИЙ ПРОМПТ

```
You are a world-class consumer psychologist and conversion copywriter with 20+ years
of experience studying buyer behavior for premium health products.

Your task: Create a comprehensive psychological profile and messaging framework
for ONE specific pain point within ONE specific audience segment.

This analysis will be used to write high-converting landing pages, ads, and email sequences.

Be specific. Be psychological. Be practical.
```


---

## USER ПРОМПТ

```
# Product Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Problem Solved: ${onboarding.problemSolved}
Unique Mechanism: ${onboarding.uniqueMechanism}
Price Segment: ${onboarding.priceSegment}


# Target Segment

Name: ${segment.name}
Description: ${segment.description}
Demographics: ${segment.sociodemographics}

## Segment Psychology

Needs:
${segment_details.needs.map(n => `- ${n.name}: ${n.description}`).join('\n')}

Core Values:
${segment_details.core_values.map(v => `- ${v.name}: ${v.description}`).join('\n')}

Awareness Level: ${segment_details.awareness_level}

Key Objections:
${segment_details.objections.map(o => `- ${o.objection}: ${o.root_cause}`).join('\n')}


## Jobs to Be Done

Functional:
${jobs.functional_jobs.map(j => `- ${j.job}: ${j.why_it_matters}`).join('\n')}

Emotional:
${jobs.emotional_jobs.map(j => `- ${j.job}: ${j.why_it_matters}`).join('\n')}

Social:
${jobs.social_jobs.map(j => `- ${j.job}: ${j.why_it_matters}`).join('\n')}


## Purchase Triggers

${triggers.triggers.map(t => `
Trigger: ${t.name}
Description: ${t.description}
Psychological Basis: ${t.psychological_basis}
Trigger Moment: ${t.trigger_moment}
`).join('\n')}


# Pain Point to Analyze

Name: ${pain.name}
Description: ${pain.description}

Deep Triggers:
${pain.deep_triggers.map(t => `- ${t}`).join('\n')}

Real Examples (quotes/scenarios):
${pain.examples.map(e => `- "${e}"`).join('\n')}


## Canvas Analysis (already completed)

Emotional Aspects:
- Emotions: ${canvas.emotional_aspects.emotions}
- Intensity: ${canvas.emotional_aspects.intensity}
- Self-image Impact: ${canvas.emotional_aspects.self_image_impact}
- Fears: ${canvas.emotional_aspects.fears}
- Blocked Desires: ${canvas.emotional_aspects.blocked_desires}

Behavioral Patterns:
- Coping Mechanisms: ${canvas.behavioral_patterns.coping_mechanisms}
- Workarounds: ${canvas.behavioral_patterns.workarounds}
- Search Behavior: ${canvas.behavioral_patterns.search_behavior}
- Avoidance: ${canvas.behavioral_patterns.avoidance}

Buying Signals:
- Readiness Indicators: ${canvas.buying_signals.readiness_indicators}
- Resonant Phrases: ${canvas.buying_signals.resonant_phrases}
- Proof Needed: ${canvas.buying_signals.proof_needed}
- Final Objections: ${canvas.buying_signals.final_objections}


# Your Task

Create a DEEP psychological analysis with practical messaging applications.

## 1. CUSTOMER JOURNEY MAP

Describe the emotional journey from problem awareness to purchase decision.
Be specific to THIS segment and THIS pain.

Structure:
- UNAWARE STAGE: What is their life like before they recognize the problem?
- PROBLEM AWARE: What moment makes them realize something is wrong?
- SOLUTION SEEKING: Where do they look? What do they try first?
- EVALUATION: How do they compare options? What criteria matter most?
- DECISION TRIGGER: What specific moment/event pushes them to buy?
- POST-PURCHASE: First 7 days experience. What confirms or challenges their decision?

For each stage, include:
- Their internal dialogue (actual thoughts)
- Emotional state
- Actions they take
- What they need to hear


## 2. EMOTIONAL INTENSITY MAP

Map the emotional peaks and valleys of their journey.

Structure:
- PEAKS (moments of hope/excitement): What creates positive emotion?
- VALLEYS (moments of despair/frustration): What triggers negative emotion?
- TURNING POINTS: What shifts them from negative to positive?

For each, provide:
- The trigger (what causes this emotional state)
- The internal dialogue
- How long this state typically lasts
- What breaks the pattern


## 3. NARRATIVE ANGLES

Create 3 distinct narrative angles for reaching this segment about this pain.
Each angle is a different "story" that resonates with a subset of this segment.

For each angle provide:

ANGLE NAME: [Memorable name like "The Exhausted Warrior" or "The Secret Struggler"]

WHO THIS IS:
[Specific sub-persona within the segment - be detailed about their situation]

THEIR STORY:
[2-3 sentences describing their journey with this pain - written as narrative]

CORE BELIEF:
[The limiting belief they hold that keeps them stuck]

BREAKTHROUGH MOMENT:
[What would need to happen for them to try your product]

KEY MESSAGE:
[The one sentence that would stop them scrolling]

PROOF THEY NEED:
[Specific type of evidence that would convince them]

OBJECTION TO ADDRESS:
[Their main "yes, but..." and how to handle it]


## 4. MESSAGING FRAMEWORK

Practical copy elements for this pain + segment combination.

HEADLINES (5 options):
[Headlines that would grab attention on a landing page or ad]
- Must speak directly to this pain
- Must resonate with this segment's psychology
- Range from direct to curiosity-based

OPENING HOOKS (3 options):
[First paragraph of landing page or email]
- Must create immediate recognition ("this is about me")
- Must not feel salesy

BRIDGE STATEMENTS (3 options):
[How to transition from problem to solution]
- Validates their experience
- Creates hope without hype

PROOF FRAMING:
[How to present evidence in a way this segment trusts]
- What type of proof (studies, testimonials, mechanism explanation)?
- How to format it?
- What language to use?

OBJECTION HANDLERS (for each objection in segment_details):
[Objection]: ${objection}
[Handler]: [How to address this without being defensive]

CALL TO ACTION OPTIONS (3):
[CTAs that match their awareness level and buying signals]
- Must feel like the logical next step
- Must reduce perceived risk


## 5. VOICE & TONE GUIDELINES

How to speak to this segment about this pain.

DO:
[5 specific things about language, tone, approach]

DON'T:
[5 specific things to avoid]

WORDS THAT RESONATE:
[10 words/phrases that feel right to this segment]

WORDS TO AVOID:
[10 words/phrases that trigger skepticism or feel off]
```

---

## JSON RESPONSE FORMAT

```json
{
  "customer_journey": {
    "unaware_stage": {
      "life_context": "...",
      "internal_dialogue": "...",
      "emotional_state": "...",
      "duration": "..."
    },
    "problem_aware": {
      "trigger_moment": "...",
      "internal_dialogue": "...",
      "emotional_state": "...",
      "actions": ["..."]
    },
    "solution_seeking": {
      "where_they_look": ["..."],
      "what_they_try": ["..."],
      "internal_dialogue": "...",
      "frustrations": ["..."]
    },
    "evaluation": {
      "criteria": ["..."],
      "comparison_behavior": "...",
      "internal_dialogue": "...",
      "dealbreakers": ["..."]
    },
    "decision_trigger": {
      "trigger_moment": "...",
      "internal_dialogue": "...",
      "what_they_need_to_hear": "...",
      "final_hesitation": "..."
    },
    "post_purchase": {
      "first_week": "...",
      "confirmation_moments": ["..."],
      "doubt_moments": ["..."],
      "advocacy_trigger": "..."
    }
  },

  "emotional_map": {
    "peaks": [
      {
        "moment": "...",
        "trigger": "...",
        "internal_dialogue": "...",
        "intensity": 1-10,
        "duration": "..."
      }
    ],
    "valleys": [
      {
        "moment": "...",
        "trigger": "...",
        "internal_dialogue": "...",
        "intensity": 1-10,
        "duration": "..."
      }
    ],
    "turning_points": [
      {
        "from_state": "...",
        "to_state": "...",
        "catalyst": "...",
        "internal_shift": "..."
      }
    ]
  },

  "narrative_angles": [
    {
      "angle_name": "...",
      "who_this_is": "...",
      "their_story": "...",
      "core_belief": "...",
      "breakthrough_moment": "...",
      "key_message": "...",
      "proof_they_need": "...",
      "objection_to_address": "..."
    }
  ],

  "messaging_framework": {
    "headlines": ["...", "...", "...", "...", "..."],
    "opening_hooks": ["...", "...", "..."],
    "bridge_statements": ["...", "...", "..."],
    "proof_framing": {
      "type": "...",
      "format": "...",
      "language": "..."
    },
    "objection_handlers": [
      {
        "objection": "...",
        "handler": "..."
      }
    ],
    "cta_options": ["...", "...", "..."]
  },

  "voice_and_tone": {
    "do": ["...", "...", "...", "...", "..."],
    "dont": ["...", "...", "...", "...", "..."],
    "words_that_resonate": ["...", "...", "..."],
    "words_to_avoid": ["...", "...", "..."]
  }
}
```


---

## ПРИКЛАД ЯКІСНОЇ ВІДПОВІДІ

Для Pain: "Supplement Fatigue" + Segment: "Chronic Illness Warriors"

```json
{
  "customer_journey": {
    "unaware_stage": {
      "life_context": "Managing daily symptoms has become their normal. They pop 8-12 supplements each morning without questioning if any of them work.",
      "internal_dialogue": "This is just what I have to do. Everyone with IBS takes stuff.",
      "emotional_state": "Resigned acceptance, low-grade chronic frustration",
      "duration": "Often years"
    },
    "problem_aware": {
      "trigger_moment": "A moment of clarity - counting pills, calculating monthly costs ($200+), or a friend asking 'does all that stuff actually work?'",
      "internal_dialogue": "Wait... do I even know if these are helping? What if I'm just wasting money?",
      "emotional_state": "Sudden doubt, mild panic, curiosity mixed with dread",
      "actions": ["Googles 'how to know if supplements work'", "Counts pills", "Reviews bank statements"]
    },
    "solution_seeking": {
      "where_they_look": ["Reddit r/Supplements", "PubMed abstracts", "Functional medicine blogs", "YouTube experts like Dr. Rhonda Patrick"],
      "what_they_try": ["Elimination protocols - stopping supplements one by one", "Cheaper alternatives", "Whole food approaches"],
      "internal_dialogue": "There has to be a smarter way. I'm tired of being a guinea pig.",
      "frustrations": ["Contradictory information everywhere", "Studies that don't match real-world experience", "Doctors who dismiss supplements entirely"]
    },
    "evaluation": {
      "criteria": ["Bioavailability proof", "Third-party testing", "Mechanism of action explanation", "Not just another powder"],
      "comparison_behavior": "Creates spreadsheets, reads Amazon reviews obsessively, looks for red flags",
      "internal_dialogue": "I've been burned before. I need to be SURE this time.",
      "dealbreakers": ["Proprietary blends", "MLM associations", "Claims without citations", "Too-good-to-be-true promises"]
    },
    "decision_trigger": {
      "trigger_moment": "Seeing someone with similar condition report specific, measurable improvement (not vague 'I feel better')",
      "internal_dialogue": "They have the same issues I do. If it worked for them...",
      "what_they_need_to_hear": "Here's exactly what changed and in what timeframe",
      "final_hesitation": "What if my body is different and this is just another $100 wasted"
    },
    "post_purchase": {
      "first_week": "Hypervigilant tracking. Noting every sensation. Looking for confirmation it's working.",
      "confirmation_moments": ["First morning without bloating", "Stable energy past 3pm", "Regular bowel movement"],
      "doubt_moments": ["Day 3-4 with no obvious change", "Reading a negative review", "Partner asking 'is that stuff working?'"],
      "advocacy_trigger": "When someone complains about the same issues and they can say 'I actually found something'"
    }
  },

  "emotional_map": {
    "peaks": [
      {
        "moment": "Discovering the product and reading the science page",
        "trigger": "Clear mechanism explanation that matches their understanding of their condition",
        "internal_dialogue": "Finally, someone who actually understands how this works",
        "intensity": 7,
        "duration": "30-60 minutes of excited research"
      },
      {
        "moment": "First noticeable physical improvement",
        "trigger": "Waking up without bloating or brain fog",
        "internal_dialogue": "Wait... is this actually working? Don't get excited yet... but maybe?",
        "intensity": 9,
        "duration": "Cautious optimism for 2-3 days"
      }
    ],
    "valleys": [
      {
        "moment": "Day 4-5 with no change",
        "trigger": "Expected immediate results based on past supplement promises",
        "internal_dialogue": "Here we go again. Another thing that doesn't work for me.",
        "intensity": 6,
        "duration": "1-2 days"
      },
      {
        "moment": "Calculating total spent on supplements that didn't work",
        "trigger": "Bank statement or organizing supplement cabinet",
        "internal_dialogue": "I'm such an idiot. Why do I keep falling for this?",
        "intensity": 8,
        "duration": "Hours to days of regret"
      }
    ],
    "turning_points": [
      {
        "from_state": "Skeptical browsing",
        "to_state": "Genuine interest",
        "catalyst": "Seeing the frozen format and understanding why it matters for bioavailability",
        "internal_shift": "From 'probably another gimmick' to 'actually this makes scientific sense'"
      }
    ]
  },

  "narrative_angles": [
    {
      "angle_name": "The Exhausted Experimenter",
      "who_this_is": "Someone who has tried 15+ gut health products in the last 3 years. Has a cabinet full of half-empty bottles. Knows more about probiotics than their doctor. Has become cynical but can't stop searching.",
      "their_story": "They started with basic probiotics, moved to multi-strain, tried soil-based, experimented with prebiotics, did elimination diets, tried L-glutamine, collagen, digestive enzymes. Some helped a little. None solved the problem. They've spent thousands and still wake up bloated.",
      "core_belief": "My gut is just broken. Maybe nothing can fix it.",
      "breakthrough_moment": "Understanding that the FORM of delivery (frozen vs dried) might be why everything else failed - it's not about the ingredient, it's about whether it arrives alive and active.",
      "key_message": "What if every supplement you've tried was already dead before you swallowed it?",
      "proof_they_need": "Bioavailability comparison studies. Before/after biomarker tests. Explanation of why frozen matters at the cellular level.",
      "objection_to_address": "I've heard 'revolutionary' claims before. Why is this actually different?"
    },
    {
      "angle_name": "The Secret Struggler",
      "who_this_is": "High-performer who manages symptoms silently. Colleagues don't know they spend 20 minutes in the bathroom before every meeting. They've optimized everything in their life except this one thing they can't control.",
      "their_story": "They run marathons, eat clean, meditate daily, sleep 8 hours. On paper, they're the healthiest person in the office. But their gut has a mind of its own. They've learned to manage around it - knowing where every bathroom is, never eating before important events, carrying emergency supplies. They're exhausted by the mental load of managing this secret.",
      "core_belief": "I'm doing everything right. Why won't my body cooperate?",
      "breakthrough_moment": "Realizing that all their 'optimization' was working around the problem, not solving it. And that gut health might be the missing foundation.",
      "key_message": "You've optimized everything except the one thing that controls everything else.",
      "proof_they_need": "Testimonials from other high-performers. Connection to cognitive function and energy. Data they can track.",
      "objection_to_address": "I already eat well and take care of myself. How is this different from what I'm already doing?"
    },
    {
      "angle_name": "The Research-Paralyzed",
      "who_this_is": "Someone who has 47 browser tabs open about gut health. Has bookmarked 12 products but hasn't bought any. Knows too much and it's made them unable to decide. Every product has negative reviews. Every study has a counter-study.",
      "their_story": "They started researching gut health solutions 6 months ago. They've read everything. They know about microbiome diversity, SIBO, leaky gut, the gut-brain axis. But the more they learn, the more confused they get. Every product seems to have a fatal flaw. They're stuck in analysis paralysis while their symptoms continue.",
      "core_belief": "I need to find the PERFECT solution before I try anything.",
      "breakthrough_moment": "Seeing a clear, scientific explanation that addresses all their concerns in one place. Transparency that shows the company isn't hiding anything.",
      "key_message": "You've done enough research. Here's everything you need to make the decision.",
      "proof_they_need": "Complete transparency - third-party testing, full ingredient disclosure, mechanism of action, expected timeline, money-back guarantee.",
      "objection_to_address": "What am I missing? What's the catch?"
    }
  ],

  "messaging_framework": {
    "headlines": [
      "Your supplements aren't failing you. They're arriving dead.",
      "15 gut health products later, here's what actually worked.",
      "The $200/month supplement stack that wasn't doing anything (and what replaced it)",
      "Finally: Gut health that survives past your stomach acid.",
      "What if the problem isn't your gut—it's how you've been treating it?"
    ],
    "opening_hooks": [
      "Open your supplement cabinet. Count the bottles. Now count how many are actually making a measurable difference. If you're like most people we talk to, that number is painfully close to zero.",
      "There's a specific type of person who finds us. They've tried everything. They know more about probiotics than their gastroenterologist. And they're exhausted. If that's you, you're in the right place.",
      "You've been told your gut issues are 'just stress' or 'maybe try more fiber.' You've tried 6 different probiotics. You've eliminated gluten, dairy, and joy from your diet. And you still wake up bloated. Here's why nothing has worked—and what's different about this."
    ],
    "bridge_statements": [
      "The problem isn't that you haven't tried hard enough. The problem is that most gut health products are fundamentally broken—dead before they reach your intestines. What if you could finally try something that arrives alive?",
      "We built this for people exactly like you. The skeptics. The ones who've been burned before. The ones who read every study and still can't find something that works. Because we were those people too.",
      "You don't need another supplement. You need a solution that actually survives the journey. That's why we did something no one else was willing to do."
    ],
    "proof_framing": {
      "type": "Mechanism-first, then validation. This audience wants to understand WHY before they trust.",
      "format": "Start with the science of bioavailability. Show the difference between frozen vs dried at cellular level. Then layer in third-party testing. Finish with testimonials from 'people like them' - specific, skeptical, detailed.",
      "language": "Technical but accessible. Assume intelligence. No dumbing down. Use terms like 'bioavailability' and 'bioactive compounds' but explain them clearly."
    },
    "objection_handlers": [
      {
        "objection": "I've tried probiotics before and they didn't work",
        "handler": "Most probiotics are freeze-dried, which kills up to 90% of the organisms. You weren't taking what you thought you were taking. Our flash-frozen format preserves bioactivity—here's the data comparing absorption rates."
      },
      {
        "objection": "This is too expensive",
        "handler": "Let's do the math: You're currently spending $150-200/month on supplements with 10-20% bioavailability. You're paying for dead ingredients. This replaces your entire stack with one product that actually arrives active. The real question is: how much have you already spent on things that didn't work?"
      },
      {
        "objection": "How do I know this will work for ME?",
        "handler": "You don't—and anyone who promises you certainty is lying. What we can offer: the science behind why this approach is different, detailed testimonials from people with similar conditions, and a 90-day guarantee. Try it. Track your results. If nothing changes, get your money back."
      }
    ],
    "cta_options": [
      "Start your 90-day trial (full refund if nothing changes)",
      "See the bioavailability data",
      "Read stories from skeptics who tried it"
    ]
  },

  "voice_and_tone": {
    "do": [
      "Acknowledge their expertise—they know a lot already",
      "Lead with mechanism and science, not hype",
      "Be specific with numbers, timelines, and measurable outcomes",
      "Validate their skepticism as intelligent, not problematic",
      "Show transparency about what you don't know"
    ],
    "dont": [
      "Promise miracle cures or overnight results",
      "Use vague wellness language ('boost your health', 'feel amazing')",
      "Dismiss or ignore the products they've tried before",
      "Be defensive about questions or skepticism",
      "Oversimplify the science—they'll catch it"
    ],
    "words_that_resonate": [
      "bioavailability",
      "mechanism of action",
      "third-party tested",
      "measurable results",
      "transparent",
      "finally",
      "root cause",
      "cellular level",
      "evidence-based",
      "no proprietary blends"
    ],
    "words_to_avoid": [
      "revolutionary",
      "miracle",
      "cure",
      "guaranteed results",
      "doctor recommended",
      "natural",
      "detox",
      "cleanse",
      "superfood",
      "ancient wisdom"
    ]
  }
}
```


---

## ЯК ВИКОРИСТОВУВАТИ РЕЗУЛЬТАТ

Цей output дає:
1. **Customer Journey** → для email sequences, retargeting flow
2. **Emotional Map** → для timing ads (коли показувати що)
3. **Narrative Angles** → 3 різних ad campaigns для одного сегмента
4. **Messaging Framework** → конкретні тексти для landing pages
5. **Voice & Tone** → guidelines для всіх матеріалів цього сегмента

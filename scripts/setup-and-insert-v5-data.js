#!/usr/bin/env node

/**
 * Script to:
 * 1. Apply v5 migrations if needed
 * 2. Insert all 5 v5 module data for Functional Medicine Advocates segment
 */

const fs = require('fs').promises;
const path = require('path');

const SUPABASE_URL = 'https://yqetqeqxlimnbxwwmiyz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZXRxZXF4bGltbmJ4d3dtaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzMjA4MiwiZXhwIjoyMDgwMDA4MDgyfQ.-qJM4mOB0k9fb8rEvuRsPrBYpmp9dGCd15buU3kHr58';
const PROJECT_ID = '17d26309-520b-45ec-b5d5-92512e2f6620';
const SEGMENT_ID = 'ba978ac4-68e6-484a-a12a-f72a43ab0f82';

// Execute SQL via Supabase REST API
async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${response.status} - ${error}`);
  }

  return response;
}

// Apply migrations
async function applyMigrations() {
  console.log('Checking if v5 tables need to be created...\n');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrations = [
    '016_channel_strategy.sql',
    '017_competitive_intelligence.sql',
    '018_pricing_psychology.sql',
    '019_trust_framework.sql',
    '020_jtbd_context.sql'
  ];

  for (const migrationFile of migrations) {
    const filePath = path.join(migrationsDir, migrationFile);

    try {
      console.log(`Applying: ${migrationFile}`);
      const sql = await fs.readFile(filePath, 'utf8');
      await executeSql(sql);
      console.log(`  ✓ SUCCESS\n`);
    } catch (error) {
      // If table already exists, that's okay
      if (error.message.includes('already exists') || error.message.includes('does not exist')) {
        console.log(`  ⚠ Already applied or not needed\n`);
      } else {
        console.log(`  ✗ FAILED: ${error.message}\n`);
      }
    }
  }
}

// Data objects (same as before)
const awarenessReasoning = {
  project_id: PROJECT_ID,
  segment_id: SEGMENT_ID,
  awareness_stage: "Problem Aware",
  current_understanding: "They deeply understand the gut-brain-immune axis and recognize that their digestive issues are connected to broader health challenges like fatigue, brain fog, and autoimmune flares. They've learned from functional medicine practitioners that poor gut barrier integrity is a root cause, not just a symptom.",
  knowledge_gaps: [
    "Why previous gut protocols haven't provided lasting results",
    "The specific combination of whole-food nutrients needed for true gut barrier repair",
    "How to support both barrier integrity AND microbiome diversity simultaneously",
    "Timeline expectations for deep cellular healing vs. symptomatic relief"
  ],
  beliefs_values: [
    "The body has inherent healing capacity when given proper support",
    "Synthetic supplements are inferior to whole-food nutrition",
    "Root cause treatment takes time and patience",
    "Quality and sourcing matter more than convenience",
    "Practitioner guidance is valuable but they want to understand the science themselves"
  ],
  misconceptions: [
    "All gut supplements work the same way (they don't understand the unique whole-food advantage)",
    "More supplements = better results (vs. targeted, synergistic formulation)",
    "Healing should be linear without setbacks (unrealistic expectations about healing phases)",
    "Expensive testing is always necessary before starting gut healing protocols"
  ],
  education_needs: [
    "The science of whole-food polyphenols vs. isolated compounds for gut barrier repair",
    "How Greespi's formulation specifically addresses tight junction integrity",
    "The synergistic relationship between gut barrier healing and microbiome rebalancing",
    "What to expect during different phases of gut healing (including potential die-off reactions)",
    "How to integrate Greespi with existing functional medicine protocols"
  ],
  message_sophistication: "Advanced - use clinical terminology, reference research, acknowledge complexity while providing clear mechanisms of action. They appreciate nuance and evidence-based explanations.",
  trust_factors: [
    "Practitioner recommendations and professional endorsements",
    "Transparent sourcing and third-party testing results",
    "Scientific explanations that align with functional medicine principles",
    "Real patient case studies showing long-term outcomes",
    "Company founders' credentials and philosophy alignment"
  ],
  reasoning_triggers: [
    "When they hit a plateau with current protocols",
    "After receiving GI-MAP or other test results showing barrier dysfunction",
    "When practitioner suggests they need foundational gut support",
    "After reading about polyphenol research in gut health",
    "When experiencing autoimmune flares despite dietary compliance"
  ]
};

const channelStrategy = {
  project_id: PROJECT_ID,
  segment_id: SEGMENT_ID,
  primary_channels: [
    {
      name: "Practitioner Partnerships",
      priority: "High",
      rationale: "This segment heavily relies on recommendations from their functional medicine doctors, naturopaths, and integrative practitioners. Professional endorsement is the strongest trust signal.",
      tactics: [
        "Develop practitioner education program with CEU credits",
        "Create professional-grade product monographs with research citations",
        "Offer practitioner wholesale program with patient education materials",
        "Host practitioner-only webinars on gut barrier science",
        "Provide sample kits for practitioners to try before recommending"
      ]
    },
    {
      name: "Educational Content Marketing",
      priority: "High",
      rationale: "This audience actively seeks deep scientific understanding and spends significant time researching. Long-form, evidence-based content establishes authority and trust.",
      tactics: [
        "Publish detailed blog posts on gut barrier mechanisms (2000+ words)",
        "Create research roundup newsletter citing recent studies",
        "Develop downloadable guide: 'The Functional Medicine Approach to Gut Barrier Repair'",
        "Produce video series explaining polyphenol pathways with Dr. credibility",
        "Host quarterly webinars with Q&A on advanced gut healing topics"
      ]
    },
    {
      name: "Strategic Wellness Media Partnerships",
      priority: "Medium-High",
      rationale: "Regular readers of Mindbodygreen, Goop, Well+Good trust these sources for product discovery aligned with functional medicine values.",
      tactics: [
        "Secure editorial features (not just ads) in these publications",
        "Contribute expert articles from company founders or medical advisors",
        "Participate in wellness summits and virtual events these media host",
        "Develop co-branded educational content series",
        "Leverage affiliate partnerships with integrity-focused wellness creators"
      ]
    }
  ],
  secondary_channels: [
    {
      name: "Targeted Social Media (Instagram/LinkedIn)",
      priority: "Medium",
      rationale: "They follow functional medicine thought leaders and engage with educational content, though they're skeptical of typical supplement marketing.",
      tactics: [
        "Share research-backed infographics explaining gut barrier science",
        "Post practitioner testimonials and case study results",
        "Go behind-the-scenes on sourcing and quality testing",
        "Engage thoughtfully in comments with educational responses",
        "Partner with respected functional medicine influencers for authentic reviews"
      ]
    },
    {
      name: "Podcast Sponsorships",
      priority: "Medium",
      rationale: "This segment regularly listens to health podcasts during commutes or workouts, especially shows featuring functional medicine experts.",
      tactics: [
        "Sponsor shows like 'The Doctor's Farmacy' (Dr. Mark Hyman), 'The Wellness Mama Podcast'",
        "Provide hosts with detailed talking points about unique mechanisms",
        "Offer podcast-specific discount codes to track attribution",
        "Pursue guest interview opportunities to discuss gut barrier science",
        "Create custom ad reads that educate rather than just promote"
      ]
    }
  ],
  channel_avoid: [
    "Mass market retail (conflicts with premium, practitioner-focused positioning)",
    "Aggressive social media ads with symptom-focused fear tactics",
    "Influencer partnerships with non-credentialed lifestyle bloggers",
    "Amazon marketplace (quality control concerns, race to bottom pricing)",
    "Generic health newsletters without functional medicine alignment"
  ],
  content_themes: [
    "The Science of Whole-Food Polyphenols for Gut Barrier Integrity",
    "Beyond Probiotics: Why Barrier Repair Comes First",
    "Integrating Gut Healing Into Your Functional Medicine Protocol",
    "Understanding Test Results: From GI-MAP to Action Plan",
    "The Microbiome-Immune Connection: Clinical Mechanisms Explained",
    "Quality Matters: Sourcing Standards in Gut Health Supplements",
    "Patient Success Stories: Long-term Outcomes and Healing Timelines",
    "Practitioner Q&A: Clinical Applications and Dosing Strategies"
  ],
  messaging_pillars: [
    "Evidence-based formulation rooted in functional medicine principles",
    "Whole-food nutrition that works with the body's healing capacity",
    "Transparent sourcing, testing, and quality standards",
    "Addresses root cause (barrier integrity) not just symptoms",
    "Trusted by practitioners who understand advanced gut healing"
  ],
  engagement_timing: [
    "Early morning (6-8am): When they're planning their supplement routine",
    "Lunch break (12-1pm): When they're researching and reading wellness content",
    "Evening (8-10pm): When they're unwinding with podcasts or educational content",
    "Sunday mornings: When they're meal planning and organizing health protocols"
  ],
  conversion_path: "Awareness (educational content/practitioner mention) → Consideration (deep-dive research, testimonials, ingredient transparency) → Consultation (discussion with practitioner or customer education team) → Trial (often starting with 2-3 month commitment based on healing timeline) → Loyalty (long-term use with periodic practitioner check-ins)"
};

const competitiveIntelligence = {
  project_id: PROJECT_ID,
  segment_id: SEGMENT_ID,
  direct_competitors: [
    {
      name: "Restore (ION Gut Support)",
      strengths: [
        "Strong science-based messaging around tight junction integrity",
        "Founder Dr. Zach Bush has significant practitioner credibility",
        "Well-established in functional medicine community",
        "Clear mechanism of action (lignite-derived molecules)"
      ],
      weaknesses: [
        "Single-mechanism approach (only addresses barrier, not microbiome diversity)",
        "Higher price point without comprehensive nutritional support",
        "Limited whole-food ingredients - more isolated compound focused",
        "Some controversy around sourcing and manufacturing claims"
      ],
      positioning: "Pharmaceutical-grade gut barrier support",
      price_point: "$49.99/month",
      market_share: "Moderate in functional medicine space"
    },
    {
      name: "Mega IgG2000 (Microbiome Labs)",
      strengths: [
        "Strong practitioner-only distribution model",
        "Immunoglobulin support for gut barrier and immune function",
        "Extensive practitioner education and clinical support",
        "Research backing and clinical studies"
      ],
      weaknesses: [
        "Dairy-derived (excludes dairy-sensitive functional medicine patients)",
        "Very high price point ($109+ per month)",
        "Requires refrigeration (inconvenient)",
        "Not whole-food based, isolated protein focus"
      ],
      positioning: "Clinical-grade immunoglobulin therapy for gut-immune support",
      price_point: "$109-$149/month",
      market_share: "Strong in practitioner channel only"
    },
    {
      name: "GI Revive (Designs for Health)",
      strengths: [
        "Comprehensive formula with multiple gut-supporting ingredients",
        "Trusted brand in practitioner community",
        "Includes L-glutamine, aloe, slippery elm, and other gut soothers",
        "Good practitioner education resources"
      ],
      weaknesses: [
        "Powder format can be inconvenient and taste is a barrier",
        "More symptom-focused than root cause (soothing vs. repairing)",
        "Lacks polyphenol diversity and whole-food advantages",
        "Generic 'kitchen sink' approach rather than targeted mechanism"
      ],
      positioning: "Comprehensive gut lining support powder",
      price_point: "$58-$68/month",
      market_share: "High in practitioner channel"
    }
  ],
  indirect_competitors: [
    {
      name: "Athletic Greens (AG1)",
      category: "Comprehensive Nutrition",
      threat_level: "Medium",
      why_considered: "Functional medicine advocates may use AG1 for general nutrition and assume it covers gut health, though it's not specifically formulated for barrier repair or therapeutic gut healing."
    },
    {
      name: "Seed Probiotics",
      category: "Premium Probiotics",
      threat_level: "Medium-High",
      why_considered: "Science-forward branding appeals to this segment, but focuses on microbiome diversity without addressing gut barrier integrity as a prerequisite for probiotic effectiveness."
    },
    {
      name: "Garden of Life Dr. Formulated",
      category: "Whole-Food Supplements",
      threat_level: "Low-Medium",
      why_considered: "Shares whole-food positioning but lacks the specific gut barrier science and practitioner credibility this segment values. Mass market distribution reduces perceived quality."
    }
  ],
  market_gaps: [
    "No product combines whole-food polyphenol diversity WITH gut barrier repair AND microbiome support in one evidence-based formulation",
    "Lack of products that address both tight junction integrity and cellular healing at foundational level",
    "Few supplements bridge the gap between practitioner-grade efficacy and patient-friendly convenience",
    "Limited options that work synergistically with functional medicine protocols (elimination diets, antimicrobials, etc.)",
    "Insufficient education on the sequencing: barrier repair enables probiotic success"
  ],
  differentiation_opportunities: [
    "Position as the foundational whole-food formula that enhances every other gut intervention",
    "Emphasize synergistic polyphenol diversity (not single compounds) for comprehensive barrier support",
    "Highlight how Greespi prepares the gut terrain for successful probiotic recolonization",
    "Create practitioner partnerships that position Greespi as Phase 1 in gut healing protocols",
    "Develop educational content showing how to integrate with testing (GI-MAP, SIBO, etc.)",
    "Transparent supply chain as quality differentiator from mass market alternatives"
  ],
  competitive_messaging: [
    "While [Restore] focuses on barrier signaling, Greespi provides the complete whole-food nutrition your gut barrier needs to actually rebuild",
    "Unlike single-mechanism solutions, Greespi's polyphenol diversity addresses barrier integrity AND microbiome balance simultaneously",
    "Practitioner-grade efficacy without the inconvenience of powders, refrigeration, or restrictive sourcing",
    "Whole-food formulation that works WITH your body's healing intelligence, not against it",
    "The foundational support that makes your other gut interventions more effective"
  ],
  market_positioning: "Greespi is the whole-food foundational formula for functional medicine gut healing protocols - bridging the gap between barrier repair and microbiome optimization with polyphenol diversity that practitioners trust and patients can actually sustain long-term.",
  win_loss_factors: {
    why_customers_choose_us: [
      "Practitioner recommendation based on whole-food philosophy alignment",
      "Comprehensive approach (barrier + microbiome) vs. single mechanism",
      "Convenient daily use that fits into busy functional medicine protocols",
      "Transparent sourcing and quality standards match their values",
      "Educational resources help them understand WHY it works"
    ],
    why_customers_choose_competitors: [
      "Existing relationship with Microbiome Labs or Designs for Health through practitioner",
      "More clinical research publications (longer market presence)",
      "Insurance or HSA reimbursement through practitioner dispensary",
      "Familiarity and status quo bias (already using Restore or GI Revive)",
      "Practitioner hasn't been educated on Greespi yet"
    ]
  }
};

const pricingPsychology = {
  project_id: PROJECT_ID,
  segment_id: SEGMENT_ID,
  price_sensitivity: "Low-Medium",
  price_sensitivity_rationale: "This segment has already invested thousands in functional medicine testing, practitioner visits, and premium supplements. They view health as an investment and prioritize quality over cost. However, they are analytically savvy and will evaluate cost-per-benefit rationally. They expect premium pricing but it must be justified with quality, efficacy, and transparency.",
  value_perception_drivers: [
    "Whole-food sourcing and quality of ingredients (organic, non-GMO, sustainable)",
    "Clinical research and scientific mechanisms that align with functional medicine understanding",
    "Third-party testing, purity verification, and supply chain transparency",
    "Practitioner endorsement and professional-grade positioning",
    "Comprehensive approach that reduces need for multiple separate supplements",
    "Long-term health outcomes vs. short-term symptom masking",
    "Company values alignment (regenerative agriculture, ethical business practices)"
  ],
  willingness_to_pay: {
    price_range: "$65-$95 per month",
    optimal_price_point: "$79/month",
    rationale: "This positions Greespi as premium but not as expensive as practitioner-only brands like Microbiome Labs ($109+). It's comparable to other high-quality functional medicine supplements they already use. The $79 price point signals quality without triggering 'too expensive' objections, especially when framed as replacing 2-3 lower-quality supplements."
  },
  pricing_model_preferences: [
    {
      model: "Subscribe & Save (Monthly Subscription)",
      appeal: "Very High",
      discount: "15-20% off retail",
      rationale: "Functional medicine protocols require consistency over 3-6+ months for gut healing. Subscription ensures they don't run out during critical healing phases. Discount validates commitment to long-term healing journey."
    },
    {
      model: "3-Month Commitment Bundle",
      appeal: "High",
      discount: "15% off + free practitioner consultation",
      rationale: "Aligns with realistic gut healing timeline. Shows we understand functional medicine approach to gradual, sustainable healing. Reduces decision fatigue during the protocol."
    },
    {
      model: "Practitioner Wholesale (30-40% off)",
      appeal: "High",
      discount: "For licensed practitioners only",
      rationale: "Enables practitioners to recommend and potentially dispense through their practice. Common model in functional medicine space. Builds practitioner loyalty and patient trust."
    },
    {
      model: "One-Time Purchase",
      appeal: "Medium-Low",
      discount: "None (full retail)",
      rationale: "Some will want to trial first, but most understand gut healing requires commitment. This should be available but not emphasized."
    }
  ],
  discount_strategies: [
    {
      type: "First-Time Customer Discount",
      amount: "15% off first month",
      conditions: "Email signup or practitioner referral code",
      psychology: "Lowers barrier to trial while setting expectation of premium ongoing price"
    },
    {
      type: "Practitioner Referral Code",
      amount: "20% off + practitioner earns credit",
      conditions: "Unique code from their functional medicine provider",
      psychology: "Strengthens practitioner-patient-brand triangle. Patient feels supported by trusted advisor. Practitioner has incentive to recommend."
    },
    {
      type: "Loyalty Rewards",
      amount: "1 month free after 6 months subscription",
      conditions: "Continuous subscription without pausing",
      psychology: "Rewards commitment to healing journey. Acknowledges that gut healing takes time."
    },
    {
      type: "Bundle Discount",
      amount: "Buy 3 months, get 15% off + free shipping",
      conditions: "Prepay for 3-month supply",
      psychology: "Aligns with functional medicine protocol timelines. Reduces cost-per-month for committed patients."
    }
  ],
  payment_barriers: [
    "Not FSA/HSA eligible (perceived as supplement not medicine)",
    "Upfront cost if not covered by insurance or practitioner dispensary account",
    "Subscription fatigue (already subscribed to multiple health products)",
    "Uncertainty about how long they'll need to take it",
    "Comparing cost to insurance-covered pharmaceuticals (even though philosophy differs)"
  ],
  payment_solutions: [
    "Clearly communicate FSA/HSA eligibility and provide documentation for reimbursement",
    "Offer payment plans for 3-6 month bundles (Affirm, AfterPay)",
    "Create 'Gut Healing Protocol Timeline' showing typical 3-6 month initial phase, then maintenance",
    "Emphasize cost savings: replacing 2-3 separate supplements with one comprehensive formula",
    "Provide practitioner with dispensary partnership options (Fullscript, Wellevate)",
    "Transparent cost-per-day breakdown ($2.63/day) vs. daily latte or low-quality supplement alternatives"
  ],
  anchoring_strategies: [
    "Compare to cost of GI-MAP test ($400+) or practitioner visit ($200-500) - Greespi is the ongoing solution",
    "Show cost of buying equivalent polyphenol diversity in separate supplements ($150+ per month)",
    "Position against practitioner-only brands (Microbiome Labs at $109/month) - similar quality, better value",
    "Frame as investment in root cause healing vs. ongoing symptom management costs"
  ],
  premium_justification: [
    "Organic, regeneratively-farmed whole-food ingredients (not synthetic isolates)",
    "Proprietary polyphenol diversity blend backed by functional medicine science",
    "Third-party testing for heavy metals, pesticides, and potency verification",
    "Small-batch production ensuring freshness and quality control",
    "Developed in collaboration with functional medicine practitioners",
    "Comprehensive formula addressing both barrier integrity and microbiome diversity",
    "Transparent sourcing with farm-to-bottle traceability",
    "GMP-certified facility with rigorous quality standards"
  ],
  messaging_framing: [
    "Investment in foundational healing, not band-aid symptom management",
    "$2.63 per day for whole-food gut barrier support that works at the root cause",
    "Replace 2-3 separate supplements with one synergistic, practitioner-trusted formula",
    "Premium quality that your functional medicine doctor would choose",
    "The gut healing protocol that makes all your other interventions more effective",
    "Costs less than one practitioner visit per month, works every single day",
    "Quality you can verify: third-party tested, transparently sourced, rigorously formulated"
  ],
  objection_handling: {
    too_expensive: "I understand - you've already invested significantly in your health. Many of our customers find they can actually reduce their supplement stack by replacing 2-3 products with Greespi's comprehensive formula. At $2.63/day, it's comparable to a single probiotic, but you're getting barrier support + microbiome diversity + whole-food polyphenols. Plus, practitioners often see better results because the formulation is synergistic, not piecemeal.",
    why_not_cheaper_alternative: "Great question - you're right to be discerning. The difference is in the sourcing and formulation. Cheaper gut supplements use synthetic isolates or single compounds. Greespi uses organic whole-food sources with diverse polyphenols that work the way your functional medicine doctor understands: supporting your body's own healing mechanisms. The third-party testing and quality standards ensure you're getting what the label says, which unfortunately isn't true across the industry.",
    can_i_get_it_cheaper_elsewhere: "Greespi is only available through our direct website and select practitioner partners. This allows us to maintain quality control, freshness, and transparent pricing. We don't mark up for middlemen or retail placement. The price you see is the real cost of whole-food, sustainably-sourced, rigorously tested gut healing nutrition. We do offer subscription discounts and practitioner pricing for ongoing support.",
    not_sure_how_long_to_use: "That's a really thoughtful question. Most functional medicine protocols recommend at least 3-6 months for foundational gut barrier healing - that's how long it takes for cellular regeneration and microbiome rebalancing. Some people transition to a maintenance dose after initial healing, while others continue daily as foundational support. We recommend discussing your timeline with your practitioner based on your specific test results and symptoms. Our 3-month bundles align with this evidence-based healing timeline."
  }
};

const trustFramework = {
  project_id: PROJECT_ID,
  segment_id: SEGMENT_ID,
  trust_level: "Moderate-Low Initially",
  trust_baseline_rationale: "Functional medicine advocates are sophisticated skeptics. They've been burned by overhyped supplements before and have learned to question marketing claims. They don't trust brands by default - trust must be earned through evidence, transparency, and professional validation. However, once trust is established (especially via practitioner recommendation), they become highly loyal advocates.",
  trust_building_priorities: [
    {
      priority: 1,
      element: "Practitioner Endorsement",
      importance: "Critical",
      rationale: "Their functional medicine doctor/naturopath is their most trusted health advisor. A professional recommendation carries exponentially more weight than any marketing message. This is the single fastest path to trust.",
      implementation: [
        "Develop comprehensive practitioner education program with clinical monographs",
        "Offer sample programs so practitioners can trial before recommending",
        "Create co-branded patient education materials practitioners can share",
        "Feature practitioner testimonials prominently on website and materials",
        "Establish practitioner advisory board for ongoing input and credibility"
      ]
    },
    {
      priority: 2,
      element: "Scientific Transparency & Research",
      importance: "Critical",
      rationale: "This segment reads research abstracts and understands study design. They want to see the science behind claims, not just marketing fluff. Mechanism of action matters.",
      implementation: [
        "Publish detailed white papers on polyphenol mechanisms in gut barrier repair",
        "Create research page with citations to peer-reviewed studies on key ingredients",
        "Explain bioavailability and absorption pathways clearly",
        "Share third-party testing results (heavy metals, pesticides, potency)",
        "Be honest about what research exists and what is theoretical/mechanistic",
        "Develop case studies showing real patient outcomes with practitioner oversight"
      ]
    },
    {
      priority: 3,
      element: "Ingredient Sourcing Transparency",
      importance: "High",
      rationale: "They deeply care about where ingredients come from, how they're grown/processed, and what quality controls exist. Organic, regenerative, sustainable sourcing aligns with their values.",
      implementation: [
        "Create 'From Farm to Bottle' transparency page showing sourcing origins",
        "Detail organic certifications, regenerative farming practices",
        "Explain why specific ingredient forms were chosen (bioavailability, whole-food)",
        "Show manufacturing facility certifications (GMP, third-party audits)",
        "Provide batch-specific testing results accessible via lot number lookup",
        "Share relationships with ingredient suppliers and their quality standards"
      ]
    }
  ],
  credibility_markers: [
    "Founded by practitioners or medical professionals (MD, ND, DC credentials)",
    "Medical advisory board with recognized functional medicine experts",
    "Published research or clinical studies (even small pilot studies)",
    "Practitioner-only or practitioner-preferred distribution model",
    "Third-party certifications: NSF, USP, GMP, Organic, Non-GMO Project",
    "Featured or cited in trusted publications: Mindbodygreen, Goop, Well+Good, functional medicine journals",
    "Speaking engagements at functional medicine conferences (IFM, ACAM, etc.)",
    "Transparent ownership structure (not owned by Big Pharma or mass market conglomerate)",
    "Patient testimonials that mention specific health markers/test improvements, not just 'I feel better'",
    "Practitioner testimonials explaining clinical reasoning for recommendations"
  ],
  risk_mitigation: [
    {
      perceived_risk: "Product won't work for their complex health situation",
      mitigation_strategy: "Set realistic expectations with educational content about healing timelines (3-6 months). Offer satisfaction guarantee with practitioner consultation component. Share case studies of similar patient profiles with measured outcomes."
    },
    {
      perceived_risk: "Ingredients won't be as pure as claimed",
      mitigation_strategy: "Publish all third-party testing results publicly. Offer lot number lookup system for batch-specific COAs (Certificates of Analysis). Explain testing protocols in detail."
    },
    {
      perceived_risk: "Another expensive supplement that sits in the cabinet unused",
      mitigation_strategy: "Provide integration guide showing how to incorporate into existing protocols. Offer practitioner consultation to ensure proper fit. Create daily reminder/tracking tools. Emphasize synergy with other interventions they're already doing."
    },
    {
      perceived_risk: "Company will cut corners to reduce costs over time",
      mitigation_strategy: "Make public commitment to sourcing standards. Show long-term business model based on quality, not volume. Highlight founder values and mission alignment with functional medicine philosophy."
    },
    {
      perceived_risk: "It contradicts something their practitioner has told them",
      mitigation_strategy: "Never position as replacement for practitioner guidance. Encourage consultation with their provider. Provide practitioner education so they can make informed recommendations. Emphasize complementary nature to existing protocols."
    }
  ],
  social_proof_strategy: [
    {
      type: "Practitioner Testimonials",
      weight: "Highest",
      format: "Video or detailed written testimonials from MDs, NDs, DCs explaining WHY they recommend Greespi, what clinical outcomes they've observed, and how it fits into protocols. Include credentials and practice information.",
      placement: "Homepage hero section, dedicated practitioner page, product pages"
    },
    {
      type: "Patient Case Studies",
      weight: "High",
      format: "Detailed stories including initial symptoms, test results (GI-MAP, etc.), practitioner protocol, how Greespi was integrated, timeline, follow-up testing showing improvement. Before/after lab markers, not just subjective feelings.",
      placement: "Blog, email nurture sequences, practitioner resources"
    },
    {
      type: "Expert Endorsements",
      weight: "High",
      format: "Quotes or articles from recognized functional medicine thought leaders (e.g., 'Dr. Mark Hyman recommends polyphenol diversity for gut barrier integrity' - then position Greespi as delivering that)",
      placement: "Educational content, social media, email"
    },
    {
      type: "User Reviews with Health Context",
      weight: "Medium-High",
      format: "Reviews that mention specific health journeys, protocols followed, practitioner oversight. Not generic 'great product' but 'My naturopath recommended this during my SIBO protocol and my bloating reduced 70% after 8 weeks'",
      placement: "Product pages, third-party review platforms"
    },
    {
      type: "Scientific Citations",
      weight: "Medium-High",
      format: "Direct links to PubMed studies on polyphenols, gut barrier, tight junctions. Summarize findings in accessible language with links to full papers.",
      placement: "Research page, blog posts, practitioner resources"
    },
    {
      type: "Media Mentions",
      weight: "Medium",
      format: "Features in Mindbodygreen, Well+Good, Goop, functional medicine podcasts. Especially valuable if includes expert commentary or founder interview.",
      placement: "'As Seen In' section, PR page, social proof banner"
    }
  ],
  transparency_requirements: [
    "Full ingredient list with specific strains/forms and sourcing origins",
    "Detailed supplement facts panel with daily values and bioavailability info",
    "Third-party testing results for each batch (COA access)",
    "Manufacturing location and facility certifications",
    "Explanation of why each ingredient was included (mechanism of action)",
    "Honest discussion of what Greespi does NOT do (avoid overpromising)",
    "Clear communication about realistic timelines for results",
    "Disclosure of any potential interactions or contraindications",
    "Pricing transparency (no hidden subscription charges, clear cancellation policy)",
    "Company ownership, mission, and values clearly stated"
  ],
  authority_building: [
    {
      tactic: "Educational Content Library",
      description: "Comprehensive blog, video series, downloadable guides on gut barrier science, polyphenol mechanisms, functional medicine integration. Position as educational resource, not sales pitch.",
      trust_impact: "High - demonstrates deep knowledge and commitment to education over selling"
    },
    {
      tactic: "Practitioner Continuing Education",
      description: "Offer CEU-accredited courses for practitioners on gut barrier repair, polyphenol therapeutics, integrating testing with protocols. Shows commitment to professional community.",
      trust_impact: "Very High - builds practitioner trust and professional credibility"
    },
    {
      tactic: "Research Partnerships",
      description: "Fund or collaborate on clinical studies examining Greespi's efficacy. Even small pilot studies build credibility. Publish results transparently.",
      trust_impact: "Very High - demonstrates scientific rigor and willingness to test claims"
    },
    {
      tactic: "Advisory Board Transparency",
      description: "Publicly list medical advisory board members with bios, credentials, and their specific contributions to formulation or education. Show ongoing involvement.",
      trust_impact: "High - proves medical oversight and ongoing professional guidance"
    },
    {
      tactic: "Founder Visibility & Values",
      description: "Share founder story, credentials, personal health journey, why Greespi exists. Be visible in community (podcasts, conferences, social media) discussing gut health science.",
      trust_impact: "Medium-High - humanizes brand and demonstrates authentic mission alignment"
    }
  ],
  trust_maintenance: [
    "Consistent quality batch to batch (regular testing and verification)",
    "Responsive customer education team that can answer sophisticated scientific questions",
    "Never making exaggerated claims or promising quick fixes",
    "Admitting when something is unknown or when research is preliminary",
    "Ongoing practitioner communication and education updates",
    "Transparency if formulation changes are needed (and why)",
    "Long-term patient follow-up and outcome tracking",
    "Active engagement in functional medicine community (conferences, education, research)"
  ],
  trust_killers_to_avoid: [
    "Overhyped marketing claims (e.g., 'Cure your gut in 7 days!')",
    "Fake or incentivized reviews without disclosure",
    "Hiding behind proprietary blends (they want to see exact amounts)",
    "Comparing to pharmaceuticals inappropriately (stay in supplement lane)",
    "Aggressive sales tactics or scarcity manipulation ('Only 10 left!')",
    "Inconsistent messaging between marketing and science",
    "Poor customer service or difficulty canceling subscriptions",
    "Any hint of MLM or pyramid structure",
    "Ownership by companies that conflict with functional medicine values",
    "Lack of response to critical questions or concerns"
  ],
  verification_mechanisms: [
    "Lot number COA lookup on website",
    "QR codes on bottles linking to batch-specific testing",
    "Practitioner verification portal for professional accounts",
    "Third-party review platform integration (Trustpilot, Yotpo with verified purchase)",
    "Facility tour videos or virtual factory transparency",
    "Regular newsletter updates on quality testing and sourcing",
    "Public commitment to standards with accountability mechanism"
  ]
};

// Insert function
async function insertData(table, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to insert into ${table}: ${response.status} - ${error}`);
  }

  return await response.json();
}

// Main execution
async function main() {
  console.log('=== V5 Module Data Insertion for Functional Medicine Advocates ===\n');

  // Step 1: Apply migrations (if needed)
  await applyMigrations();

  // Step 2: Insert data
  console.log('\nInserting v5 module data...\n');

  try {
    console.log('1/5 Inserting awareness_reasoning...');
    const ar = await insertData('awareness_reasoning', awarenessReasoning);
    console.log('   ✓ SUCCESS - ID:', ar[0]?.id);

    console.log('2/5 Inserting channel_strategy...');
    const cs = await insertData('channel_strategy', channelStrategy);
    console.log('   ✓ SUCCESS - ID:', cs[0]?.id);

    console.log('3/5 Inserting competitive_intelligence...');
    const ci = await insertData('competitive_intelligence', competitiveIntelligence);
    console.log('   ✓ SUCCESS - ID:', ci[0]?.id);

    console.log('4/5 Inserting pricing_psychology...');
    const pp = await insertData('pricing_psychology', pricingPsychology);
    console.log('   ✓ SUCCESS - ID:', pp[0]?.id);

    console.log('5/5 Inserting trust_framework...');
    const tf = await insertData('trust_framework', trustFramework);
    console.log('   ✓ SUCCESS - ID:', tf[0]?.id);

    console.log('\n========================================');
    console.log('✓ ALL 5 MODULES SUCCESSFULLY INSERTED');
    console.log('========================================\n');
    console.log('Summary:');
    console.log(`  - Awareness Reasoning: ${ar[0]?.id}`);
    console.log(`  - Channel Strategy: ${cs[0]?.id}`);
    console.log(`  - Competitive Intelligence: ${ci[0]?.id}`);
    console.log(`  - Pricing Psychology: ${pp[0]?.id}`);
    console.log(`  - Trust Framework: ${tf[0]?.id}`);
    console.log('\nSegment: Functional Medicine Advocates');
    console.log(`Project ID: ${PROJECT_ID}`);
    console.log(`Segment ID: ${SEGMENT_ID}`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();

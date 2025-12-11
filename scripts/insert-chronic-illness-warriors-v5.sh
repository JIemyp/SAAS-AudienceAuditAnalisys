#!/bin/bash

# Configuration
PROJECT_ID="17d26309-520b-45ec-b5d5-92512e2f6620"
SEGMENT_ID="b2cbef7c-c10d-4039-a5ec-49b6d3d69b74"
SUPABASE_URL="https://yqetqeqxlimnbxwwmiyz.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZXRxZXF4bGltbmJ4d3dtaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzMjA4MiwiZXhwIjoyMDgwMDA4MDgyfQ.-qJM4mOB0k9fb8rEvuRsPrBYpmp9dGCd15buU3kHr58"

echo "========================================="
echo "Inserting v5 Module Data for Chronic Illness Warriors"
echo "========================================="
echo ""

# 1. CHANNEL STRATEGY
echo "1/5 Inserting Channel Strategy..."
curl -X POST "${SUPABASE_URL}/rest/v1/channel_strategy" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "'"${PROJECT_ID}"'",
    "segment_id": "'"${SEGMENT_ID}"'",
    "primary_platforms": [
      "Reddit (r/IBS, r/IBD, r/autoimmune, r/ChronicIllness)",
      "Facebook support groups (IBS Support Group, Autoimmune Warriors, FODMAP Diet Support)",
      "Instagram health influencers and patient advocates",
      "YouTube (educational content from functional medicine doctors)",
      "Patient community forums (IBSGroup.org, HealingWell)"
    ],
    "content_preferences": [
      "Long-form educational content with scientific backing",
      "Real patient testimonials with before/after stories",
      "Ingredient breakdowns and safety explanations",
      "Doctor/practitioner endorsements and expert interviews",
      "Transparent discussion of limitations and realistic expectations",
      "Step-by-step guides on how to use safely",
      "Community discussions and peer experiences"
    ],
    "trusted_sources": [
      "Functional medicine doctors and naturopaths",
      "Registered dietitians specializing in IBS/FODMAP",
      "Patient advocacy organizations",
      "Peer-reviewed research and clinical studies",
      "Long-time community members with proven track records",
      "Integrative health practitioners",
      "Evidence-based health websites (Monash University FODMAP, NIH)"
    ],
    "communities": [
      "r/IBS (300K+ members, active daily discussions)",
      "r/FODMAPS (50K+ members, recipe sharing and product reviews)",
      "Facebook: IBS Support Group (150K+ members)",
      "Facebook: Low FODMAP Diet Support Group (80K+ members)",
      "IBSGroup.org forums (established 1987, highly trusted)",
      "HealingWell Digestive Disorders Forum",
      "Instagram: #IBSWarrior, #ChronicIllnessWarrior, #GutHealth communities"
    ],
    "search_patterns": [
      "\"FODMAP-friendly greens powder\"",
      "\"no bloating superfood supplement\"",
      "\"safe algae supplement for IBS\"",
      "\"gut-friendly spirulina alternative\"",
      "\"clean label greens no additives\"",
      "\"hypoallergenic microalgae\"",
      "Product name + \"IBS safe\"",
      "Product name + \"reviews autoimmune\"",
      "\"best supplements for food sensitivities\""
    ],
    "advertising_response": {
      "effective": [
        "Educational content ads with scientific backing",
        "Patient testimonial videos",
        "Comparison charts (vs common trigger ingredients)",
        "Risk-free trial offers with money-back guarantees",
        "Retargeting with educational content series",
        "Native ads in health communities (non-promotional tone)"
      ],
      "ineffective": [
        "Generic \"miracle cure\" language",
        "Pushy sales tactics",
        "Before/after images without context",
        "Celebrity endorsements without medical backing",
        "Aggressive retargeting without value",
        "Popup ads and interruptions"
      ],
      "best_timing": "Evening hours (7-10pm) when managing symptoms and researching solutions",
      "messaging_style": "Empathetic, science-based, transparent about limitations, community-focused"
    },
    "reasoning": "Chronic illness warriors are highly active in online patient communities where they share experiences, vet products, and support each other. They trust peer recommendations combined with professional endorsements. Their search behavior is research-intensive and cautious. They respond to educational, transparent content that respects their intelligence and validates their struggles. Fast-talking sales pitches are immediate red flags."
  }'
echo ""
echo ""

# 2. COMPETITIVE INTELLIGENCE
echo "2/5 Inserting Competitive Intelligence..."
curl -X POST "${SUPABASE_URL}/rest/v1/competitive_intelligence" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "'"${PROJECT_ID}"'",
    "segment_id": "'"${SEGMENT_ID}"'",
    "alternatives_tried": [
      {
        "product": "Athletic Greens (AG1)",
        "experience": "Caused severe bloating and digestive distress",
        "why_failed": "Contains inulin, prebiotics, and multiple trigger ingredients",
        "spent": "$600-1200/year before discontinuing"
      },
      {
        "product": "Amazing Grass / Organifi",
        "experience": "Upset stomach, unclear ingredient sourcing",
        "why_failed": "Too many ingredients, unclear FODMAP status, added sweeteners",
        "spent": "$300-500/year"
      },
      {
        "product": "Spirulina tablets (various brands)",
        "experience": "Hit-or-miss quality, contamination concerns",
        "why_failed": "Inconsistent sourcing, heavy metal contamination reports, fishy taste",
        "spent": "$200-400/year"
      },
      {
        "product": "Low FODMAP protein powders",
        "experience": "Limited nutritional variety beyond protein",
        "why_failed": "Doesnt address micronutrient needs, often has artificial ingredients",
        "spent": "$400-800/year"
      },
      {
        "product": "Elimination diet + whole foods only",
        "experience": "Nutritionally restrictive, extremely time-consuming",
        "why_failed": "Difficult to get adequate micronutrients, unsustainable long-term",
        "spent": "$0 but massive time/energy cost"
      }
    ],
    "current_workarounds": [
      "Taking individual vitamin supplements (expensive, pill burden)",
      "Buying organic baby spinach in small quantities (limited shelf life, nutrient loss)",
      "Rotating safe vegetables (time-consuming meal prep, nutrient gaps)",
      "Working with functional medicine doctors ($200-500/visit)",
      "Expensive compounded supplements from naturopaths",
      "Avoiding greens supplements entirely (missing out on benefits)"
    ],
    "vs_competitors": {
      "vs_athletic_greens": {
        "greespi_advantage": "Single-ingredient FODMAP-friendly formula, no bloating triggers, clean label",
        "ag1_advantage": "Established brand, comprehensive formula (but triggers symptoms)",
        "key_differentiator": "Greespi wont send you to the bathroom in pain"
      },
      "vs_spirulina_brands": {
        "greespi_advantage": "Frozen freshness, no fishy taste, verified clean sourcing, better bioavailability",
        "spirulina_advantage": "Lower price point, familiar product",
        "key_differentiator": "You can actually taste and feel the freshness difference"
      },
      "vs_whole_foods_only": {
        "greespi_advantage": "Consistent nutrient density, longer shelf life, easier digestion, no prep time",
        "whole_foods_advantage": "Perceived as most natural, no processing concerns",
        "key_differentiator": "Concentrated nutrition without the digestive burden of bulk fiber"
      }
    },
    "switching_barriers": [
      "Fear of wasting money on another product that triggers symptoms (burned too many times)",
      "Skepticism about new-to-them ingredients (microalgae unfamiliarity)",
      "Frozen format seems inconvenient (need freezer space, different from pills/powders)",
      "Price point higher than basic spirulina (but lower than AG1)",
      "Need to see proof it works for people like them (patient testimonials critical)",
      "Uncertainty about how to integrate into existing routine"
    ],
    "evaluation_process": {
      "stage_1": "Discover through Reddit/Facebook community recommendation",
      "stage_2": "Deep research: read all reviews, check ingredient list, verify FODMAP status",
      "stage_3": "Cross-reference with trusted practitioners or community veterans",
      "stage_4": "Look for negative reviews and how company responds",
      "stage_5": "Check return policy and money-back guarantee",
      "stage_6": "Join email list or follow on social media for 1-2 weeks (observe transparency)",
      "stage_7": "Purchase smallest quantity available with expectation to test carefully",
      "timeline": "2-6 weeks from discovery to first purchase",
      "decision_factors": ["Ingredient safety > Community proof > Professional endorsement > Price > Convenience"]
    },
    "category_beliefs": [
      "Most supplement companies dont understand chronic illness and dont care",
      "Green powders are marketing hype full of fillers and trigger ingredients",
      "If it seems too good to be true, it will hurt me",
      "Frozen = fresher and less processed (positive association)",
      "Single-ingredient products are safer than complex blends",
      "FODMAP-friendly labeling shows the company actually gets it",
      "Patient communities know more than marketing claims",
      "You have to be your own health advocate - verify everything"
    ],
    "reasoning": "This segment has been repeatedly burned by products that promise the world but trigger severe symptoms. Theyve spent thousands on solutions that failed. Their evaluation process is exhaustive because the cost of getting it wrong is days of pain and setback. They trust peer experiences over marketing, and they need to see that a company truly understands their specific challenges. The FODMAP-friendly, clean-label positioning directly addresses their core fear: another expensive mistake that makes them sick."
  }'
echo ""
echo ""

# 3. PRICING PSYCHOLOGY
echo "3/5 Inserting Pricing Psychology..."
curl -X POST "${SUPABASE_URL}/rest/v1/pricing_psychology" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "'"${PROJECT_ID}"'",
    "segment_id": "'"${SEGMENT_ID}"'",
    "budget_context": {
      "annual_supplement_spend": "$2000-5000",
      "medical_expenses": "$5000-15000/year (functional medicine, specialists, tests)",
      "failed_product_graveyard": "$3000-8000 lifetime on products that didnt work",
      "financial_strain": "High - many unable to work full-time due to chronic illness",
      "mindset": "Will spend on solutions that work, but extremely price-sensitive to wasting money on failures"
    },
    "price_perception": {
      "acceptable_range": "$45-75/month for a proven solution",
      "premium_justification_needed_above": "$75/month",
      "too_cheap_raises_suspicion": "Below $30/month - seems like low quality or corners cut",
      "comparison_anchors": [
        "Athletic Greens: $99/month (too expensive and doesnt work for them)",
        "Spirulina tablets: $20-35/month (cheap but quality concerns)",
        "Functional medicine supplements: $100-300/month (trusted but expensive)",
        "Single vitamin supplements: $50-100/month total (pill burden, incomplete)"
      ],
      "sweet_spot": "$49-59/month - premium enough to signal quality, affordable enough to try",
      "perceived_value_drivers": [
        "FODMAP-friendly = priceless (avoids days of pain)",
        "Frozen freshness = higher quality justifies higher price",
        "Clean label = worth paying more to avoid triggers",
        "Works for chronic illness = willing to pay premium"
      ]
    },
    "value_anchors": [
      "Cost per symptom-free day (if Greespi prevents 5 bad days/month = invaluable)",
      "Savings from reducing other supplements (consolidation value)",
      "Avoiding functional medicine visit costs ($200-500 saved)",
      "Time saved from not being sick (hours of productivity)",
      "Mental peace of having a safe, reliable option"
    ],
    "willingness_to_pay_signals": [
      "Currently spending $100-300/month on various supplements that partially work",
      "Have paid $99/month for AG1 before it triggered symptoms",
      "Regularly pay $200-500 for functional medicine consultations",
      "Buy organic, specialty foods at 2-3x normal grocery costs",
      "Invested in expensive testing (food sensitivity, microbiome, etc.)"
    ],
    "payment_psychology": {
      "subscription_preference": "Cautious but open - prefer month-to-month initially, no long-term commitment",
      "subscription_concerns": "Fear of being locked into something that stops working or triggers symptoms",
      "one_time_purchase_appeal": "High - want to test first before committing",
      "ideal_progression": "One-time trial → monthly subscription after 2-3 months → quarterly once confident",
      "discount_motivation": "Moderate - more motivated by safety and proof than savings",
      "payment_friction": "Will tolerate higher price for easy cancellation and flexible terms"
    },
    "roi_calculation": {
      "hard_roi": [
        "Reduce supplement pill burden from 15-20/day to 10-15/day",
        "Replace 2-3 current supplements ($30-60/month savings potential)",
        "Avoid 1-2 sick days per month (time value: priceless for chronic illness)"
      ],
      "soft_roi": [
        "Mental peace of having a safe green supplement option",
        "Confidence in ingredient transparency",
        "Community of other chronic illness warriors using same product",
        "Less cognitive load researching and vetting alternatives"
      ],
      "breakeven_logic": "If Greespi costs $55/month but prevents even 1-2 symptom flares, its worth 10x the price"
    },
    "pricing_objections": [
      {
        "objection": "Thats expensive for a green supplement",
        "underlying_concern": "Ive wasted so much money on expensive supplements that failed",
        "reframe": "Compare to AG1 at $99/month that triggers symptoms vs Greespi at $55 that actually works for sensitive guts"
      },
      {
        "objection": "I can buy spirulina for $20/month",
        "underlying_concern": "Why pay more when cheaper options exist?",
        "reframe": "How many times have you tried cheap spirulina only to deal with contamination, fishy taste, or quality issues? Frozen microalgae is a different category of freshness and purity."
      },
      {
        "objection": "What if it doesnt work for me?",
        "underlying_concern": "I cant afford another expensive mistake",
        "reframe": "60-day money-back guarantee, no questions asked. Plus, you can start with a single box to test."
      },
      {
        "objection": "I need to check with my doctor first",
        "underlying_concern": "Safety and potential interactions",
        "reframe": "Absolutely - we encourage sharing our full ingredient transparency report and third-party testing with your healthcare provider. Many functional medicine doctors already recommend us."
      }
    ],
    "discount_sensitivity": {
      "effectiveness": "Moderate - discounts helpful for trial conversion but not primary motivator",
      "effective_offers": [
        "First box 20% off to reduce trial risk",
        "Buy 3 months, get 4th free (rewards commitment after successful trial)",
        "Practitioner referral discount (validates professional endorsement)"
      ],
      "ineffective_offers": [
        "Flash sales and urgency tactics (triggers skepticism)",
        "Bulk discounts before theyve tried it (too much commitment risk)",
        "Percentage off without context (cheapens premium positioning)"
      ],
      "best_approach": "Risk-reduction offers (money-back guarantee, trial size) > price discounts"
    },
    "budget_triggers": {
      "increase_willingness": [
        "Symptom flare that costs them days of productivity",
        "Seeing community members success stories",
        "Practitioner recommendation during consultation",
        "Failed attempt with another expensive product (AG1, etc.)",
        "Tax refund or bonus (seasonal opportunity)"
      ],
      "decrease_willingness": [
        "Medical bill unexpectedly high that month",
        "Multiple new supplements prescribed by doctor",
        "Lost income due to health setback",
        "Skepticism from negative product experience elsewhere"
      ]
    },
    "reasoning": "Chronic illness warriors have complex pricing psychology shaped by thousands spent on failed solutions and ongoing financial strain from medical costs. Theyre not cheap - theyll pay premium prices for solutions that work - but theyre extremely risk-averse about wasting money. The key is reducing perceived risk (guarantees, trials, community proof) rather than competing on price. They calculate ROI in terms of symptom-free days and quality of life, not just dollars. A $55/month product that prevents 2 days of IBS flares is infinitely more valuable than a $20/month product that triggers symptoms."
  }'
echo ""
echo ""

# 4. TRUST FRAMEWORK
echo "4/5 Inserting Trust Framework..."
curl -X POST "${SUPABASE_URL}/rest/v1/trust_framework" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "'"${PROJECT_ID}"'",
    "segment_id": "'"${SEGMENT_ID}"'",
    "trust_baseline": {
      "default_stance": "Highly skeptical - assume products will fail or harm until proven otherwise",
      "trust_deficit_causes": [
        "Repeated failures with hyped supplements that triggered severe symptoms",
        "Dismissed by conventional doctors (your IBS is just stress)",
        "Misleading marketing from wellness industry",
        "Products that claimed FODMAP-friendly but werent",
        "Influencer recommendations that turned out to be paid promotions"
      ],
      "earning_trust_requires": [
        "Transparent ingredient sourcing and third-party testing",
        "Honest community testimonials from verified chronic illness patients",
        "Professional endorsements from functional medicine doctors",
        "Responsive customer service that understands chronic illness",
        "Money-back guarantee with easy returns (no questions asked)",
        "Consistent product quality batch after batch"
      ],
      "trust_timeline": "3-6 months from first purchase to becoming loyal advocate (if product consistently works)"
    },
    "proof_requirements": {
      "minimum_viable_proof": [
        "Full ingredient list with sourcing transparency",
        "Third-party testing for heavy metals and contaminants (COA available)",
        "FODMAP-friendly certification or detailed explanation",
        "At least 20-30 detailed patient testimonials (not just 5-star ratings)",
        "Responsive FAQ addressing chronic illness concerns"
      ],
      "strong_proof": [
        "Everything above PLUS:",
        "Functional medicine doctor partnerships or endorsements",
        "Clinical study or pilot data (even small scale)",
        "Active presence in patient communities (not just advertising)",
        "Registered dietitian (RD) on team or advisory board",
        "Transparent batch testing results published regularly"
      ],
      "gold_standard_proof": [
        "Everything above PLUS:",
        "Published peer-reviewed research on microalgae for gut health",
        "Long-term patient case studies (6+ months)",
        "Independent third-party verification (e.g., Monash FODMAP certification)",
        "Partnership with major patient advocacy organizations",
        "Founder or team member with lived chronic illness experience"
      ],
      "proof_format_preferences": [
        "Video testimonials with full patient story (before/after, timeline)",
        "Written testimonials with specific details (not vague feel better language)",
        "PDF downloadable ingredient reports and testing certificates",
        "Instagram posts from real patients showing product use",
        "Practitioner interviews explaining why they recommend it"
      ]
    },
    "authority_figures": {
      "high_trust": [
        {
          "type": "Functional medicine doctors",
          "why_trusted": "Actually listen and understand root causes, holistic approach",
          "influence": "Recommendation from their own FM doctor = instant credibility"
        },
        {
          "type": "Registered dietitians (RD) specializing in IBS/FODMAP",
          "why_trusted": "Evidence-based, understand dietary triggers deeply",
          "influence": "RD endorsement critical for food/supplement products"
        },
        {
          "type": "Long-time patient community leaders",
          "why_trusted": "Lived experience, proven track record, no financial incentive",
          "influence": "Reddit/Facebook moderators and veteran members have massive influence"
        },
        {
          "type": "Patient advocacy organizations",
          "why_trusted": "Mission-driven, patient-focused, not profit-motivated",
          "influence": "Partnership or endorsement = major trust signal"
        }
      ],
      "moderate_trust": [
        {
          "type": "Health influencers with chronic illness",
          "why_trusted": "Relatable lived experience",
          "influence": "Effective if transparent about sponsorships and genuinely use product"
        },
        {
          "type": "Naturopathic doctors (ND)",
          "why_trusted": "Holistic approach, natural solutions",
          "influence": "Trusted but less than MDs or RDs due to credential variability"
        }
      ],
      "low_trust": [
        {
          "type": "Conventional gastroenterologists",
          "why_distrust": "Often dismissive of food sensitivities, only offer meds",
          "influence": "Minimal - many in this segment have bad experiences"
        },
        {
          "type": "General wellness influencers without chronic illness",
          "why_distrust": "Dont understand the reality of chronic illness, often promote unsuitable products",
          "influence": "Low to negative - can actually damage credibility"
        },
        {
          "type": "Celebrity endorsements",
          "why_distrust": "Clearly paid, no lived experience, out of touch",
          "influence": "Ineffective and can trigger eye-rolling"
        }
      ]
    },
    "risk_perception": {
      "primary_risks": [
        {
          "risk": "Product triggers symptom flare",
          "severity": "Critical - can mean 2-7 days of severe pain, disability, lost work",
          "mitigation_needed": "FODMAP-friendly guarantee, clear allergen info, start low and slow guidance"
        },
        {
          "risk": "Wasting money on another failed product",
          "severity": "High - financial strain from medical costs already",
          "mitigation_needed": "Money-back guarantee, trial size option, transparent pricing"
        },
        {
          "risk": "Contamination or quality issues",
          "severity": "High - immune systems often compromised",
          "mitigation_needed": "Third-party testing, batch-specific COAs, frozen freshness guarantee"
        },
        {
          "risk": "Product works initially then stops",
          "severity": "Moderate - common experience with supplements",
          "mitigation_needed": "Consistent quality control, batch transparency, community monitoring"
        }
      ],
      "risk_tolerance": "Very low - will err on side of caution every time",
      "safety_first_mindset": "Even if product is 90% likely to work, the 10% chance of a flare is terrifying"
    },
    "social_proof": {
      "most_influential": [
        "Reddit post from verified chronic illness patient with detailed experience (100+ upvotes)",
        "Facebook group discussion where 5+ members vouch for product independently",
        "Before/after testimonial with timeline and specific symptom improvements",
        "Practitioner recommendation shared in patient community"
      ],
      "moderately_influential": [
        "Instagram posts from chronic illness influencers (if transparent about sponsorship)",
        "Product reviews on independent sites (Trustpilot, etc.) with verified purchases",
        "Email testimonials on company website (if detailed and authentic)"
      ],
      "minimally_influential": [
        "Generic 5-star ratings without details",
        "Testimonials that sound scripted or too good to be true",
        "Influencer posts that are clearly sponsored ads"
      ],
      "negative_proof_red_flags": [
        "Only positive reviews (where are the critical ones?)",
        "Company deleting or hiding negative feedback",
        "Defensive responses to criticism",
        "No patient testimonials, only practitioner quotes"
      ]
    },
    "transparency_needs": {
      "required_transparency": [
        "Full ingredient list with % composition and sourcing location",
        "Third-party testing results (heavy metals, microcystin, contaminants)",
        "FODMAP content explanation (why its low FODMAP)",
        "Allergen information (gluten, dairy, soy, etc.)",
        "Processing methods (how frozen cubes are made)",
        "Pricing breakdown (no hidden fees, clear subscription terms)"
      ],
      "appreciated_transparency": [
        "Founder story and mission (why you created this)",
        "Challenges and limitations (what Greespi is NOT good for)",
        "Supply chain details (farm to freezer journey)",
        "Customer feedback and how youve improved product",
        "Batch-to-batch quality variations (honest about natural product variability)"
      ],
      "trust_building_transparency": [
        "Admitting when you dont know something (vs making up an answer)",
        "Sharing both positive and critical customer feedback publicly",
        "Being upfront about who sponsors content or partnerships",
        "Explaining price increases or changes openly",
        "Acknowledging chronic illness community expertise (not talking down)"
      ]
    },
    "trust_killers": [
      "Miracle cure or too good to be true claims",
      "Pushy sales tactics or urgency manipulation",
      "Hiding or deleting negative reviews",
      "Unclear or changing ingredient lists",
      "Poor customer service or unresponsive support",
      "MLM or affiliate structure that incentivizes false claims",
      "Using chronic illness for emotional manipulation without understanding",
      "Defensive or dismissive responses to valid concerns",
      "Lack of transparency on sourcing or testing",
      "Overpromising results without nuance"
    ],
    "credibility_markers": {
      "visual_trust_signals": [
        "Professional website with detailed product information",
        "Clear photos of actual product (not stock imagery)",
        "Team photos and bios (real people, not stock photos)",
        "Certificates and testing results prominently displayed",
        "Active social media with real engagement (not bought followers)"
      ],
      "behavioral_trust_signals": [
        "Responsive customer service (replies within 24 hours)",
        "Helpful, educational content (not just sales pitches)",
        "Presence in patient communities without being spammy",
        "Honest answers to tough questions in comments/DMs",
        "Easy return process without interrogation"
      ],
      "structural_trust_signals": [
        "Money-back guarantee clearly stated",
        "Secure website with SSL, professional checkout",
        "Privacy policy and data protection",
        "Clear contact information and real address",
        "Professional email domain (not Gmail)"
      ]
    },
    "guarantee_expectations": {
      "minimum_acceptable": "30-day money-back guarantee with easy return process",
      "preferred": "60-90 day money-back guarantee, no questions asked, including shipping both ways",
      "gold_standard": "Everything above PLUS satisfaction guarantee (if not working after 60 days, full refund even if used)",
      "guarantee_psychology": "Not primarily about getting money back - its about knowing the company stands behind the product and wont fight you if it doesnt work",
      "return_process_critical": "If return process is difficult or confrontational, guarantee is worthless and damages trust"
    },
    "trust_journey": {
      "stage_1_awareness": {
        "trust_level": "0-10% - Default skepticism",
        "needs": "Immediate credibility markers (who are you, why should I care)",
        "actions": "Clean professional website, clear value prop, visible social proof"
      },
      "stage_2_consideration": {
        "trust_level": "10-30% - Cautious interest",
        "needs": "Deep ingredient transparency, community validation, professional endorsement",
        "actions": "Read all testimonials, check Reddit/Facebook, verify FODMAP claims, research microalgae"
      },
      "stage_3_evaluation": {
        "trust_level": "30-60% - Leaning toward trying",
        "needs": "Risk mitigation, guarantee clarity, responsive customer service test",
        "actions": "Email customer service with questions, check return policy, look for negative reviews, confirm testing results"
      },
      "stage_4_trial_purchase": {
        "trust_level": "60-70% - Willing to try carefully",
        "needs": "Easy purchase process, clear usage instructions, continued support",
        "actions": "Buy smallest quantity, test cautiously, monitor symptoms closely, document experience"
      },
      "stage_5_evaluation_period": {
        "trust_level": "70-85% if product works, drops to 0% if triggers symptoms",
        "needs": "Consistent product quality, responsive support if issues arise, community to share experience",
        "actions": "Use product for 30-60 days, track results, share feedback, consider subscription"
      },
      "stage_6_loyalty": {
        "trust_level": "85-100% - Becomes advocate",
        "needs": "Continued quality, feeling heard, community connection",
        "actions": "Subscribe, recommend to others in community, share testimonial, defend brand in discussions"
      },
      "trust_fragility": "Even at 100% trust, one quality issue or poor CS interaction can drop trust to 0% - chronic illness warriors have long memories"
    },
    "reasoning": "Trust for chronic illness warriors is earned molecule by molecule and can be lost in an instant. Theyve been burned too many times by products that promised relief and delivered pain. Their trust framework is built on radical transparency, community validation, professional endorsement, and proven results over time. They need to see that you understand their specific challenges (FODMAP, sensitivities, fear of triggers) and that youre not just another wellness company slapping chronic illness keywords into marketing. The frozen format, clean label, and FODMAP-friendly positioning directly address their core trust needs - but only if backed by consistent quality and authentic community engagement."
  }'
echo ""
echo ""

# 5. JTBD CONTEXT
echo "5/5 Inserting JTBD Context..."
curl -X POST "${SUPABASE_URL}/rest/v1/jtbd_context" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "'"${PROJECT_ID}"'",
    "segment_id": "'"${SEGMENT_ID}"'",
    "job_contexts": [
      {
        "job": "Get comprehensive micronutrients without triggering digestive symptoms",
        "context": "After years of restrictive elimination diets, I need nutrient density but everything seems to upset my gut",
        "desired_outcome": "Absorb beneficial micronutrients without bloating, gas, cramping, or symptom flares",
        "success_metrics": "Can take daily for 30+ days with zero digestive issues, blood work shows improved nutrient levels",
        "current_struggle": "Greens powders trigger IBS, whole vegetables cause bloating, pill fatigue from individual supplements"
      },
      {
        "job": "Find a safe, trustworthy supplement I can rely on long-term",
        "context": "Im exhausted from trial-and-error with products that fail or harm me - I need something consistent",
        "desired_outcome": "One less thing to research and worry about - a supplement I can trust month after month",
        "success_metrics": "Same quality batch to batch, no surprise reactions, become confident enough to subscribe",
        "current_struggle": "Constantly vetting new products, burned by bait-and-switch quality, skeptical of all marketing"
      },
      {
        "job": "Reduce my daily supplement pill burden without sacrificing nutrition",
        "context": "Taking 15-20 pills per day is overwhelming and expensive - I need consolidation",
        "desired_outcome": "Replace multiple supplements with one high-quality source of micronutrients",
        "success_metrics": "Reduce pill count by 3-5 daily while maintaining or improving nutrient status",
        "current_struggle": "Individual B vitamins, minerals, antioxidants add up - need comprehensive alternative"
      },
      {
        "job": "Support my compromised gut barrier and reduce inflammation",
        "context": "My functional medicine doctor says I have leaky gut and chronic inflammation - need gut repair support",
        "desired_outcome": "Strengthen intestinal lining, reduce systemic inflammation, improve digestive resilience",
        "success_metrics": "Fewer food reactions over time, reduced inflammation markers, improved gut symptoms",
        "current_struggle": "Gut-healing protocols are expensive and complex - need simple, effective support"
      },
      {
        "job": "Increase energy and reduce brain fog without stimulants",
        "context": "Chronic fatigue and cognitive dysfunction are debilitating - need natural energy support",
        "desired_outcome": "Sustained energy throughout the day, clearer thinking, reduced afternoon crashes",
        "success_metrics": "Can work/function 4-6 hours without exhaustion, mental clarity improves, less need for caffeine",
        "current_struggle": "Caffeine makes symptoms worse, energy supplements have additives, B12 shots are expensive"
      },
      {
        "job": "Feel like Im doing something proactive for my health",
        "context": "Chronic illness makes me feel powerless - I need agency and hope in my healing journey",
        "desired_outcome": "Take daily action that supports my body, feel proud of my self-care routine",
        "success_metrics": "Emotional sense of taking control, ritual that feels good, visible progress over time",
        "current_struggle": "Medical system often fails me - need to feel like Im advocating for my own wellness"
      }
    ],
    "job_priority_ranking": {
      "highest_priority": [
        {
          "job": "Get comprehensive micronutrients without triggering digestive symptoms",
          "why_critical": "This is the core functional need - if it triggers symptoms, nothing else matters",
          "urgency": "Constant daily struggle"
        },
        {
          "job": "Find a safe, trustworthy supplement I can rely on long-term",
          "why_critical": "Decision fatigue and product-vetting exhaustion is overwhelming",
          "urgency": "High - actively seeking reliable solutions"
        }
      ],
      "high_priority": [
        {
          "job": "Support my compromised gut barrier and reduce inflammation",
          "why_critical": "Root cause of many symptoms - gut healing is key to overall improvement",
          "urgency": "Moderate - important but requires patience"
        },
        {
          "job": "Reduce my daily supplement pill burden without sacrificing nutrition",
          "why_critical": "Quality of life issue - pill fatigue is real and demotivating",
          "urgency": "Moderate - would greatly improve daily experience"
        }
      ],
      "moderate_priority": [
        {
          "job": "Increase energy and reduce brain fog without stimulants",
          "why_critical": "Impacts ability to work and function, but not as urgent as symptom prevention",
          "urgency": "Moderate - chronic issue but managed with workarounds"
        },
        {
          "job": "Feel like Im doing something proactive for my health",
          "why_critical": "Emotional wellbeing and sense of agency matter for long-term healing",
          "urgency": "Low-moderate - important for mental health but not primary driver"
        }
      ]
    },
    "job_dependencies": {
      "foundational_job": "Get comprehensive micronutrients without triggering digestive symptoms",
      "why_foundational": "If this job fails, all other jobs become irrelevant - symptom prevention is table stakes",
      "dependency_chain": [
        "Must not trigger symptoms (Job 1) → enables consistent daily use → enables trust building (Job 2) → enables long-term gut healing (Job 4) → supports energy and cognition (Job 5) → creates sense of agency (Job 6) → justifies consolidating supplements (Job 3)",
        "If triggers symptoms at any point, entire chain collapses and trust is permanently lost"
      ],
      "complementary_jobs": [
        {
          "job_pair": "Jobs 1 + 4 (nutrient absorption + gut healing)",
          "synergy": "Microalgae nutrients directly support gut barrier repair while being gentle enough to absorb",
          "messaging": "Get the nutrition you need while healing your gut, not fighting it"
        },
        {
          "job_pair": "Jobs 2 + 6 (trust + agency)",
          "synergy": "Finding a trustworthy product gives sense of control in chaotic health journey",
          "messaging": "One reliable constant in your healing journey"
        },
        {
          "job_pair": "Jobs 3 + 5 (consolidation + energy)",
          "synergy": "Reducing pill burden while improving energy creates compounding motivation",
          "messaging": "Fewer pills, more energy - simplify your routine without sacrifice"
        }
      ],
      "competing_jobs": [
        {
          "job_pair": "Job 2 (trust/consistency) vs trying new solutions",
          "tension": "Want reliability but also desperate enough to keep searching for better options",
          "resolution": "Position as the last thing they need to try - end the exhausting search"
        },
        {
          "job_pair": "Job 6 (agency/proactive) vs medical skepticism",
          "tension": "Want to feel empowered but also scared of making things worse",
          "resolution": "Emphasize safety, FODMAP-friendly, and gradual approach - empowerment without recklessness"
        }
      ]
    },
    "reasoning": "The Jobs-to-be-Done for chronic illness warriors are deeply intertwined with their lived experience of pain, disappointment, and exhaustion. The functional job (get nutrients without symptoms) is non-negotiable and foundational - but its wrapped in emotional jobs around trust, agency, and hope. They hire Greespi not just for micronutrients, but to stop the endless cycle of trial-and-error suffering. The frozen format, FODMAP-friendly positioning, and clean label directly address Job 1 (symptom prevention). The transparency, guarantees, and community presence address Job 2 (trust). The comprehensive micronutrient profile addresses Job 3 (consolidation). The gut-supportive properties address Job 4 (healing). The energy lift addresses Job 5 (fatigue). And the entire experience of finding something that finally works addresses Job 6 (agency and hope). Understanding these job dependencies is critical - if you fail Job 1 even once, you lose the opportunity to fulfill any of the others."
  }'
echo ""
echo ""

echo "========================================="
echo "All 5 v5 module insertions completed!"
echo "========================================="

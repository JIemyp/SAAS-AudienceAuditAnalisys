#!/bin/bash

# Configuration
PROJECT_ID="17d26309-520b-45ec-b5d5-92512e2f6620"
SEGMENT_ID="563effd1-e5c1-47c8-aa35-c2e379d717a0"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZXRxZXF4bGltbmJ4d3dtaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzMjA4MiwiZXhwIjoyMDgwMDA4MDgyfQ.-qJM4mOB0k9fb8rEvuRsPrBYpmp9dGCd15buU3kHr58"
URL="https://yqetqeqxlimnbxwwmiyz.supabase.co"

echo "=================================================="
echo "Inserting V5 Modules for Recovery-Focused Athletes"
echo "=================================================="
echo ""

# 1. Channel Strategy
echo "1/5 Inserting Channel Strategy..."
curl -X POST "${URL}/rest/v1/channel_strategy" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "'"${PROJECT_ID}"'",
    "segment_id": "'"${SEGMENT_ID}"'",
    "primary_channels": [
      {
        "channel": "Instagram",
        "rationale": "Visual platform ideal for showcasing recovery routines, transformation stories, and educational content about sports recovery. Athletes actively seek recovery tips and product recommendations from credible sources.",
        "content_strategy": "Post-workout recovery sequences, athlete testimonials, science-backed recovery tips, product usage demonstrations, before/after performance metrics",
        "engagement_tactics": "Partner with recovery-focused fitness influencers, run recovery challenges, create shareable infographics on recovery science, host Q&A sessions with sports nutritionists",
        "kpis": ["Engagement rate >4%", "Story completion rate >70%", "Save rate >8%", "Share rate for educational content >5%"]
      },
      {
        "channel": "YouTube",
        "rationale": "Athletes consume long-form educational content to optimize training and recovery. YouTube allows in-depth explanation of recovery science and product benefits.",
        "content_strategy": "Recovery protocol deep-dives, athlete interviews, product comparison reviews, recovery science explained, training day vlogs featuring Greespi",
        "engagement_tactics": "Collaborate with sports science channels, create recovery playlist series, optimize for search terms like recovery supplements athletes, encourage comment discussions",
        "kpis": ["Average view duration >60%", "Subscriber conversion rate >2%", "Click-through to product page >12%"]
      },
      {
        "channel": "Sports Nutrition Forums & Reddit",
        "rationale": "Athletes research supplements extensively before purchase. Active participation in r/AdvancedFitness, r/Athletes, and sports nutrition communities builds credibility.",
        "content_strategy": "Answer recovery-related questions, share peer-reviewed research on GRAS ingredients, provide objective product comparisons, share athlete success stories",
        "engagement_tactics": "Host AMA sessions, contribute to recovery protocol discussions, provide value-first engagement without hard selling, build reputation as trusted resource",
        "kpis": ["Positive mention rate >85%", "Click-through from forum discussions >8%", "Community trust score improvement"]
      },
      {
        "channel": "Email Marketing (Segmented)",
        "rationale": "Athletes who opt-in are highly engaged and ready for detailed educational content and personalized recovery recommendations.",
        "content_strategy": "Weekly recovery tips, training phase-specific advice, exclusive athlete stories, early access to research findings, personalized supplement timing recommendations",
        "engagement_tactics": "Segment by training intensity and sport type, A/B test recovery protocol variations, provide downloadable recovery tracking templates, offer consultation calls for high-value customers",
        "kpis": ["Open rate >35%", "Click-through rate >15%", "Conversion to purchase >8%", "Repeat purchase rate >40%"]
      }
    ],
    "secondary_channels": [
      {
        "channel": "TikTok",
        "rationale": "Growing platform for quick recovery tips and reaching younger competitive athletes",
        "usage": "Short-form recovery hacks, myth-busting content, athlete transformations, trending sound integrations"
      },
      {
        "channel": "Strava / Training Apps",
        "rationale": "Athletes track workouts here - opportunity for contextual recovery recommendations",
        "usage": "Sponsored posts in athlete feeds, partner with coaching platforms, integrate recovery reminders"
      },
      {
        "channel": "Athletic Events & Expos",
        "rationale": "Direct access to target audience in high-intent environments",
        "usage": "Product sampling at marathons/triathlons, sponsor recovery zones, booth presence at fitness expos"
      }
    ],
    "channel_mix_rationale": "Multi-channel approach addresses athletes at different decision-making stages: awareness (Instagram/TikTok), education (YouTube/Forums), and conversion (Email/Events). Emphasis on credibility-building through education rather than hard selling, matching how serious athletes research supplements.",
    "integration_strategy": "Cross-channel storytelling: Instagram drives to YouTube deep-dives, YouTube includes forum discussion links, forum credibility builds email list, email nurtures to purchase. Consistent messaging around GRAS certification, clean energy, and recovery science across all channels.",
    "measurement_framework": {
      "attribution_model": "Multi-touch attribution with higher weight on educational touchpoints (YouTube, Forums)",
      "key_metrics": [
        "Channel-specific conversion rates",
        "Customer acquisition cost per channel",
        "Lifetime value by acquisition channel",
        "Cross-channel engagement patterns"
      ],
      "optimization_approach": "Monthly channel performance review, quarterly budget reallocation based on CAC:LTV ratio, continuous A/B testing of content formats and messaging"
    }
  }'
echo ""
echo "✓ Channel Strategy inserted"
echo ""

# 2. Competitive Intelligence
echo "2/5 Inserting Competitive Intelligence..."
curl -X POST "${URL}/rest/v1/competitive_intelligence" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "'"${PROJECT_ID}"'",
    "segment_id": "'"${SEGMENT_ID}"'",
    "primary_competitors": [
      {
        "name": "Momentous",
        "positioning": "NSF Certified for Sport, trusted by elite athletes and teams",
        "strengths": ["NSF Certified for Sport (banned substance testing)", "Partnerships with professional teams", "Strong credibility with competitive athletes", "Comprehensive recovery product line"],
        "weaknesses": ["Premium pricing may limit accessibility", "Complex product lineup can overwhelm newcomers", "Less emphasis on natural/clean ingredients"],
        "market_share_estimate": "15-20% of serious athlete recovery segment",
        "key_differentiators": "Greespi advantages: GRAS certification provides clean ingredient transparency, single focused product vs overwhelming product line, more accessible pricing, natural energy component differentiates from pure recovery focus"
      },
      {
        "name": "Thorne",
        "positioning": "Science-backed, pharmaceutical-grade supplements trusted by athletes",
        "strengths": ["Rigorous third-party testing", "Strong scientific credibility", "Trusted by Olympic athletes", "Comprehensive educational resources"],
        "weaknesses": ["Higher price point", "Clinical/medical branding may feel less athlete-focused", "Limited athlete community engagement"],
        "market_share_estimate": "12-18% of serious athlete supplement market",
        "key_differentiators": "Greespi advantages: More approachable athlete-focused branding, competitive pricing, recovery + energy dual benefit, stronger social proof from relatable athletes vs elite-only focus"
      },
      {
        "name": "Kaged",
        "positioning": "Transparent, tested supplements for serious training",
        "strengths": ["Third-party tested", "Transparent ingredient sourcing", "Strong bodybuilding/strength athlete following", "Competitive pricing"],
        "weaknesses": ["Less focus on endurance athletes", "Brand identity tilts toward aesthetics over performance", "Recovery products not primary focus"],
        "market_share_estimate": "8-12% among strength athletes",
        "key_differentiators": "Greespi advantages: Better positioning for endurance/mixed-sport athletes, GRAS certification vs generic third-party testing, specialized recovery focus, cleaner ingredient profile"
      }
    ],
    "market_gaps": [
      "Recovery supplements specifically designed for multi-sport athletes (not just strength or endurance)",
      "Clean, GRAS-certified recovery options that also provide natural energy",
      "Mid-tier pricing between budget supplements and premium elite brands",
      "Recovery products with strong environmental/sustainability story",
      "Supplements with clear, simple usage protocols for time-strapped athletes"
    ],
    "competitive_advantages": [
      "GRAS certification provides unique clean ingredient story compared to generic third-party testing",
      "Dual benefit of recovery + clean energy addresses two athlete pain points simultaneously",
      "Accessible pricing makes serious supplementation available beyond elite athletes",
      "Simpler product line reduces decision fatigue compared to competitors with 50+ SKUs",
      "Focus on relatable athlete stories vs only elite/professional athletes creates broader appeal"
    ],
    "positioning_strategy": "Position Greespi as The Clean Recovery Choice for Serious Athletes - combining the credibility of GRAS certification with athlete-focused benefits (recovery + energy) at accessible pricing. Own the middle ground between budget supplements (questionable quality) and ultra-premium elite brands (inaccessible for most). Emphasize simplicity and transparency over complexity.",
    "messaging_framework": {
      "primary_message": "Recover cleaner, train harder",
      "supporting_pillars": [
        "GRAS Certified: Know exactly what goes into your body",
        "Recovery + Energy: Two athlete needs, one solution",
        "Trusted by serious athletes, accessible to all",
        "Simple, effective, transparent"
      ],
      "proof_points": [
        "GRAS certification details and what it means",
        "Athlete testimonials across different sports",
        "Third-party testing results",
        "Ingredient sourcing transparency"
      ]
    },
    "threat_analysis": {
      "emerging_competitors": ["Personalized supplement startups using DNA testing", "Recovery-focused beverage brands expanding into supplements"],
      "market_shifts": ["Increasing athlete demand for sustainability", "Growing skepticism of synthetic ingredients", "Rise of holistic recovery approaches"],
      "mitigation_strategies": ["Emphasize GRAS natural positioning", "Develop sustainability narrative", "Create holistic recovery content beyond just supplementation"]
    }
  }'
echo ""
echo "✓ Competitive Intelligence inserted"
echo ""

# 3. Pricing Psychology
echo "3/5 Inserting Pricing Psychology..."
curl -X POST "${URL}/rest/v1/pricing_psychology" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "'"${PROJECT_ID}"'",
    "segment_id": "'"${SEGMENT_ID}"'",
    "value_perception": {
      "current_spending": "Recovery-focused athletes currently spend $80-200/month on supplements and recovery tools",
      "reference_points": [
        "Premium recovery supplements: $50-80/month",
        "Mid-tier supplements: $30-50/month",
        "Sports massage: $80-120/session",
        "Recovery tools (foam roller, percussion): $100-300 one-time"
      ],
      "perceived_value_drivers": [
        "GRAS certification signals quality and safety",
        "Time saved on recovery = more effective training time",
        "Injury prevention value (medical costs avoided)",
        "Performance improvement leading to competitive success",
        "Clean ingredients = long-term health protection"
      ],
      "willingness_to_pay": "$45-75/month for a trusted recovery supplement with clean energy benefits"
    },
    "pricing_strategy": {
      "recommended_price_point": "$59/month (30-day supply)",
      "price_positioning": "Premium-mid tier - above budget supplements, below elite brands like Momentous ($70-80) and Thorne ($65-90)",
      "rationale": "$59 sits in sweet spot: signals quality without elite-only inaccessibility, affordable for serious amateur athletes, leaves margin for subscription discounts and promotions",
      "anchoring_strategy": "Display comparison: Budget brands ($30-35) vs Elite brands ($70-80) vs Greespi ($59) - positioned as best value-to-quality ratio"
    },
    "psychological_triggers": [
      {
        "trigger": "Price Anchoring",
        "application": "Show original price $79, discounted to $59 for launch/subscription. Reference competitors at $70-80 to make $59 feel like a deal.",
        "expected_impact": "15-25% increase in conversion by making price feel lower than expected"
      },
      {
        "trigger": "Subscription Savings",
        "application": "One-time purchase: $59, Subscribe & Save: $53/month (10% off). Emphasize Save $72/year with subscription.",
        "expected_impact": "40-50% of customers choose subscription, dramatically improving LTV and retention"
      },
      {
        "trigger": "Cost Per Day Reframing",
        "application": "Frame as Just $1.97/day for optimal recovery - less than a sports drink, position as small daily investment for competitive edge",
        "expected_impact": "Reduces sticker shock, makes monthly price feel negligible compared to daily training investment"
      },
      {
        "trigger": "Loss Aversion",
        "application": "How much is a missed PR worth? or One injury costs more than a year of Greespi - emphasize what they lose without proper recovery",
        "expected_impact": "Emotional urgency drives purchase decision, especially for injury-prone athletes"
      },
      {
        "trigger": "Social Proof Bundling",
        "application": "Join 10,000+ athletes who recover cleaner - combine price display with community validation",
        "expected_impact": "Reduces perceived risk of trying new supplement at mid-premium price"
      },
      {
        "trigger": "Scarcity (Ethical)",
        "application": "Limited: First 500 subscribers get locked-in pricing or New customer bonus: Free recovery guide ($29 value)",
        "expected_impact": "Creates urgency without false scarcity, 8-12% conversion boost"
      }
    ],
    "tiered_pricing_model": {
      "tier_1": {
        "name": "Starter",
        "price": "$59/month",
        "description": "One-time purchase, 30-day supply",
        "target": "Trial customers, skeptical first-time buyers"
      },
      "tier_2": {
        "name": "Athlete",
        "price": "$53/month ($636/year)",
        "description": "Subscribe & Save 10%, cancel anytime, free shipping",
        "target": "Committed athletes, primary revenue driver",
        "psychological_frame": "Most Popular - Best Value"
      },
      "tier_3": {
        "name": "Performance",
        "price": "$149/quarter ($596/year)",
        "description": "90-day supply, save 15%, free recovery guide, priority support",
        "target": "High-commitment athletes, cash flow preference for upfront payment",
        "psychological_frame": "Best Savings - Serious Athletes"
      }
    },
    "discount_strategy": {
      "acceptable_discount_range": "10-25% depending on context",
      "strategic_discounts": [
        "First purchase: 15% off (acquisition)",
        "Subscription: 10% ongoing (retention)",
        "Referral: $15 credit for referrer and referee (growth)",
        "Bulk: 15% off 90-day supply (cash flow)",
        "Seasonal: 20% off during peak training seasons - Jan, May (volume)"
      ],
      "discount_guardrails": "Never discount below $44/month to maintain premium positioning. Avoid constant sales that train customers to wait for deals. Use limited-time frames and clear reasons for discounts."
    },
    "payment_psychology": {
      "preferred_payment_methods": ["Credit card (recurring)", "PayPal (trust)", "Shop Pay (convenience)"],
      "billing_optimization": "Charge on 1st of month (aligned with athlete monthly budgeting), send reminder 3 days before renewal with training tips (positive association)",
      "price_presentation": "Always show cost per day alongside monthly price. Use monthly pricing as default (vs annual upfront) to reduce barrier, with annual presented as savings opportunity."
    },
    "objection_handling": {
      "too_expensive": "Reframe: Compare to one massage ($100) or cost of injury ($500+). Frame as performance investment, not expense.",
      "cheaper_alternatives": "Emphasize GRAS certification quality difference. Show comparison: Would you trust your recovery to unknown ingredients to save $15/month?",
      "unsure_if_works": "Offer 30-day money-back guarantee. If it doesnt improve your recovery, full refund. Risk is on us.",
      "already_using_X": "Not replacement, but upgrade. What certification does your current supplement have? Often positions Greespi as quality step-up."
    }
  }'
echo ""
echo "✓ Pricing Psychology inserted"
echo ""

# 4. Trust Framework
echo "4/5 Inserting Trust Framework..."
curl -X POST "${URL}/rest/v1/trust_framework" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "'"${PROJECT_ID}"'",
    "segment_id": "'"${SEGMENT_ID}"'",
    "trust_barriers": [
      {
        "barrier": "Supplement industry skepticism",
        "severity": "High",
        "description": "Athletes are wary of unsubstantiated claims and unknown ingredients due to banned substance concerns and health risks",
        "impact": "Prevents initial trial, especially among competitive athletes subject to drug testing"
      },
      {
        "barrier": "Unfamiliar brand",
        "severity": "High",
        "description": "New brand without established reputation in athletic community faces credibility gap",
        "impact": "Athletes default to known brands even at higher prices"
      },
      {
        "barrier": "Efficacy uncertainty",
        "severity": "Medium",
        "description": "Will this actually improve my recovery or just another overhyped supplement?",
        "impact": "Delays purchase decision while athlete researches and seeks social proof"
      },
      {
        "barrier": "Investment risk",
        "severity": "Medium",
        "description": "At $59/month, athletes want confidence they wont waste money on ineffective product",
        "impact": "Requires stronger proof points before purchase commitment"
      },
      {
        "barrier": "Safety concerns",
        "severity": "High for competitive athletes",
        "description": "Fear of banned substances, contamination, or long-term health effects",
        "impact": "Absolute dealbreaker if not addressed - athletes wont risk career or health"
      }
    ],
    "trust_builders": [
      {
        "element": "GRAS Certification",
        "trust_impact": "Very High",
        "implementation": "Feature GRAS badge prominently on all materials. Create dedicated page explaining what GRAS means: FDA recognition, rigorous safety standards, clean ingredients. Use language: FDA-recognized GRAS certified ingredients you can trust.",
        "proof_required": "Link to GRAS certification documentation, explain certification process, show certified ingredient list"
      },
      {
        "element": "Third-Party Testing",
        "trust_impact": "High",
        "implementation": "Display third-party testing badges (NSF, Informed-Sport, or similar). Publish batch test results. Emphasize: Every batch tested for banned substances and purity.",
        "proof_required": "Link to actual test results, show testing partner logos, explain testing protocols"
      },
      {
        "element": "Athlete Testimonials",
        "trust_impact": "Very High",
        "implementation": "Feature diverse athletes across sports (not just elite): Sarah, Marathon Runner: Cut my recovery time in half. Include photos, full names, sports, specific results. Video testimonials for authenticity.",
        "proof_required": "Real athletes with verifiable identities, specific performance metrics, before/after data where possible"
      },
      {
        "element": "Scientific Backing",
        "trust_impact": "High",
        "implementation": "Cite peer-reviewed research on key ingredients. Create science-backed recovery content. Partner with sports nutritionists for credibility. Language: Backed by 15+ clinical studies on recovery optimization.",
        "proof_required": "Link to actual studies, work with credentialed experts, transparent about what research shows (and doesnt show)"
      },
      {
        "element": "Transparent Ingredient Sourcing",
        "trust_impact": "Medium-High",
        "implementation": "Show exactly where ingredients come from. Create ingredient source map. Full ingredient list with explanations: Why we chose each ingredient and what it does.",
        "proof_required": "Detailed ingredient sources, explain selection criteria, no proprietary blends hiding ingredients"
      },
      {
        "element": "Money-Back Guarantee",
        "trust_impact": "High",
        "implementation": "30-day money-back guarantee, no questions asked. If you dont feel better recovery, full refund. Make return process simple.",
        "proof_required": "Clear guarantee terms on product page, easy return process, honor guarantee promptly"
      },
      {
        "element": "Professional Endorsements",
        "trust_impact": "Very High",
        "implementation": "Partner with respected sports nutritionists, physical therapists, or coaches. Feature endorsements: Recommended by Dr. Jane Smith, Sports Nutritionist with Olympic athletes.",
        "proof_required": "Real credentialed professionals, genuine endorsements (not paid actors), explain why they recommend"
      },
      {
        "element": "Community Social Proof",
        "trust_impact": "Medium-High",
        "implementation": "Join 10,000+ athletes recovering cleaner. Display real-time recent purchases (with permission). Show user-generated content from actual customers.",
        "proof_required": "Actual customer count (verifiable), real UGC from customers, authentic reviews not fake testimonials"
      }
    ],
    "credibility_signals": {
      "certifications": ["GRAS Certified", "Third-Party Tested for Banned Substances", "GMP Certified Facility", "Non-GMO", "Gluten-Free"],
      "partnerships": ["Sports nutritionist partnerships", "Athletic event sponsorships", "University sports team partnerships"],
      "media_coverage": ["Featured in Runners World", "Outside Magazine review", "Podcast interviews on athlete-focused shows"],
      "awards": ["Best Recovery Supplement 2024", "Clean Sport Award", "Athletes Choice Award"],
      "transparency_initiatives": ["Publish full ingredient sources", "Share test results publicly", "Open formula (no proprietary blends)", "Behind-the-scenes manufacturing videos"]
    },
    "risk_reversal": {
      "primary_guarantee": "30-Day Money-Back Guarantee - If Greespi doesnt improve your recovery within 30 days, return it for a full refund. No questions asked.",
      "additional_risk_reducers": [
        "Free shipping both ways (no cost to try)",
        "Cancel subscription anytime (no lock-in)",
        "First order: Start with single bottle before committing to subscription",
        "Sample packs available for $15 (7-day trial)",
        "Live chat support for questions before purchase"
      ],
      "messaging": "We believe so strongly in Greespi that we take on all the risk. Try it for 30 days. If youre not recovering better, well refund every penny."
    },
    "authority_building": {
      "content_marketing": [
        "Publish recovery science blog posts written by sports nutritionists",
        "Create comprehensive recovery guides for different sports",
        "Host webinars with experts on recovery optimization",
        "Launch podcast interviewing athletes about recovery protocols"
      ],
      "educational_approach": "Position brand as recovery education resource first, product second. Build trust through valuable content before asking for purchase.",
      "expert_collaboration": "Partner with credentialed experts to co-create content, ensuring scientific accuracy and building credibility by association"
    },
    "transparency_commitments": [
      "Publish full ingredient list with amounts (no proprietary blends)",
      "Share manufacturing process and facility certifications",
      "Disclose all testing protocols and results",
      "Clear about what Greespi does AND doesnt do (honest limitations)",
      "Open about pricing breakdown (why it costs what it costs)",
      "Transparent shipping times and policies",
      "Honest about potential side effects or interactions"
    ],
    "trust_measurement": {
      "metrics": [
        "Trust score in customer surveys (target: 8+/10)",
        "Return rate (target: <5% indicating satisfaction)",
        "Net Promoter Score (target: 50+)",
        "Repeat purchase rate (target: 60%+)",
        "Average time from first visit to purchase (shorter = higher trust)"
      ],
      "feedback_loops": "Quarterly customer trust surveys, review monitoring, social listening for trust concerns, exit surveys for non-converters"
    }
  }'
echo ""
echo "✓ Trust Framework inserted"
echo ""

# 5. JTBD Context
echo "5/5 Inserting JTBD Context..."
curl -X POST "${URL}/rest/v1/jtbd_context" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "'"${PROJECT_ID}"'",
    "segment_id": "'"${SEGMENT_ID}"'",
    "functional_jobs": [
      {
        "job": "Reduce recovery time between training sessions",
        "context": "When I complete an intense training session and need to be ready for the next one",
        "desired_outcome": "Recover faster so I can maintain training volume without overtraining or injury",
        "success_criteria": ["Can train hard again within 24-48 hours", "Reduced muscle soreness", "Maintained energy levels across training week"],
        "current_solutions": ["Rest days", "Sleep optimization", "Generic recovery supplements", "Sports massage", "Ice baths"],
        "pain_points": ["Rest days reduce total training volume", "Generic supplements may not work", "Massage is expensive and time-consuming", "Ice baths are uncomfortable and inconvenient"]
      },
      {
        "job": "Optimize training effectiveness and performance gains",
        "context": "When I am investing hours in training and want maximum return on that time investment",
        "desired_outcome": "Get stronger/faster/better with less wasted effort, make every training session count",
        "success_criteria": ["Measurable performance improvements", "Consistent progress toward goals", "Efficient use of training time"],
        "current_solutions": ["Structured training plans", "Coaching", "Performance tracking apps", "Various supplements"],
        "pain_points": ["Hard to know if supplements actually work", "Expensive to try multiple products", "Conflicting advice on what helps recovery"]
      },
      {
        "job": "Prevent injuries while maintaining high training volume",
        "context": "When I am pushing my body hard and want to avoid setbacks from injury",
        "desired_outcome": "Stay healthy and consistent in training without forced breaks",
        "success_criteria": ["Zero training-interrupting injuries", "No chronic overuse issues", "Long-term athletic sustainability"],
        "current_solutions": ["Proper warmup/cooldown", "Strength training", "Physical therapy", "Recovery supplements", "Adequate rest"],
        "pain_points": ["Injuries derail months of progress", "Prevention is unclear - what actually works?", "Balancing training volume with injury risk is difficult"]
      },
      {
        "job": "Maintain energy for training, work, and life",
        "context": "When I am balancing serious training with work and life responsibilities",
        "desired_outcome": "Have enough energy to train hard AND perform well at work without exhaustion",
        "success_criteria": ["Sustained energy throughout day", "Quality training sessions despite work demands", "No chronic fatigue"],
        "current_solutions": ["Coffee/caffeine", "Energy drinks", "Pre-workout supplements", "Sleep optimization"],
        "pain_points": ["Caffeine crashes and jitters", "Energy drinks have questionable ingredients", "Balancing stimulants with sleep is tricky"]
      }
    ],
    "emotional_jobs": [
      {
        "job": "Feel confident I am doing everything possible to reach my potential",
        "importance": "High",
        "description": "Athletes want to know they are not leaving performance gains on the table - recovery optimization is part of comprehensive training approach",
        "emotional_drivers": ["Fear of wasted potential", "Desire for competitive edge", "Pride in taking training seriously"],
        "how_product_helps": "GRAS-certified recovery supplement signals serious, professional approach to training. Provides peace of mind that recovery is optimized."
      },
      {
        "job": "Belong to a community of serious, committed athletes",
        "importance": "Medium-High",
        "description": "Using products that serious athletes use reinforces identity and connection to athletic community",
        "emotional_drivers": ["Identity as serious athlete", "Connection with like-minded people", "Validation of athletic commitment"],
        "how_product_helps": "Join 10,000+ athletes recovering cleaner creates community belonging. Athlete testimonials show people like me use this."
      },
      {
        "job": "Feel in control of my body and performance",
        "importance": "High",
        "description": "Training hard requires trust in your body - recovery supplement should enhance that sense of control and reliability",
        "emotional_drivers": ["Autonomy over performance", "Predictability in training response", "Confidence in physical capability"],
        "how_product_helps": "Consistent recovery support creates predictable training response. Knowing exactly what goes in your body (GRAS transparency) enhances sense of control."
      },
      {
        "job": "Avoid regret from injury or burnout derailing my goals",
        "importance": "Very High",
        "description": "Fear of losing progress or missing competitive opportunities drives prevention-focused behavior",
        "emotional_drivers": ["Loss aversion", "Regret prevention", "Protection of investment (time, money, effort in training)"],
        "how_product_helps": "Proper recovery reduces injury risk, preventing the regret of forced breaks. Clean ingredients protect long-term health."
      }
    ],
    "social_jobs": [
      {
        "job": "Signal commitment and seriousness about athletics to others",
        "description": "What athletes use and how they train communicates their identity and commitment level to peers, coaches, and competitors",
        "social_context": "In athletic communities, supplement choices are visible and discussed. Using GRAS-certified products signals professionalism.",
        "desired_perception": "Be seen as a serious, dedicated athlete who invests in proper recovery and training optimization",
        "how_product_helps": "GRAS certification and clean energy positioning allows athletes to proudly share what they use. Brand builds credibility within athletic circles."
      },
      {
        "job": "Set an example for training partners or athletes I coach/mentor",
        "description": "Experienced athletes want to model good practices for others, including safe and effective supplementation",
        "social_context": "Athletes often influence training partners, teammates, or those they mentor. Want to recommend trustworthy products.",
        "desired_perception": "Be a trusted source of advice and model best practices in training and recovery",
        "how_product_helps": "Transparent, certified product they can confidently recommend. Educational approach allows them to explain why they chose it."
      }
    ],
    "jobs_prioritization": {
      "tier_1_critical": [
        "Reduce recovery time between training sessions (core functional job)",
        "Prevent injuries while maintaining high training volume (pain avoidance)",
        "Feel confident I am doing everything possible to reach potential (emotional driver)"
      ],
      "tier_2_important": [
        "Maintain energy for training, work, and life (quality of life)",
        "Optimize training effectiveness (performance enhancement)",
        "Feel in control of my body and performance (emotional confidence)"
      ],
      "tier_3_supporting": [
        "Belong to community of serious athletes (social connection)",
        "Signal commitment and seriousness to others (identity)"
      ]
    },
    "messaging_alignment": {
      "primary_message": "Recover faster, train harder, reach your potential - with clean, GRAS-certified ingredients you can trust",
      "job_specific_messages": {
        "recovery_time": "Cut recovery time in half - back to training in 24 hours, not 72",
        "injury_prevention": "Train harder without breaking down - recovery support that keeps you consistent",
        "energy_maintenance": "Clean energy that lasts - no crash, just sustained performance",
        "confidence": "Know exactly what goes in your body - GRAS certified for serious athletes",
        "performance_optimization": "Make every training session count - optimal recovery for maximum gains",
        "community": "Join 10,000+ athletes who recover cleaner and train smarter"
      }
    },
    "purchase_triggers": [
      {
        "trigger": "Injury scare or recovery setback",
        "urgency": "Very High",
        "messaging": "Dont let poor recovery derail your progress. Start recovering right today.",
        "offer": "Fast-acting recovery support - feel the difference in 3-5 days"
      },
      {
        "trigger": "Upcoming race or competition",
        "urgency": "High",
        "messaging": "Peak performance requires optimal recovery. Prepare your body for competition day.",
        "offer": "Subscribe now and get race-day ready - 30-day money-back guarantee"
      },
      {
        "trigger": "Training volume increase (new training block)",
        "urgency": "Medium-High",
        "messaging": "Increasing volume? Increase your recovery capacity too.",
        "offer": "Support your biggest training blocks with clean recovery"
      },
      {
        "trigger": "Frustration with current recovery approach",
        "urgency": "Medium",
        "messaging": "Still sore 48 hours later? Time to upgrade your recovery game.",
        "offer": "Try Greespi risk-free - if it doesnt work better than what youre doing, full refund"
      },
      {
        "trigger": "Research phase (educating self on recovery)",
        "urgency": "Low-Medium",
        "messaging": "Smart athletes research recovery. Heres what the science says about Greespi ingredients.",
        "offer": "Download our free Recovery Optimization Guide - learn what actually works"
      }
    ],
    "switching_barriers": {
      "current_habit": "Already using a different recovery supplement",
      "mitigation": "Position as upgrade, not replacement. Emphasize GRAS certification quality difference. Offer side-by-side comparison.",
      "switching_cost": "Financial cost of trying new product while potentially wasting current supply",
      "mitigation": "Small trial size ($15 for 7 days) or money-back guarantee eliminates financial risk. Can try while finishing current supply."
    }
  }'
echo ""
echo "✓ JTBD Context inserted"
echo ""

echo "=================================================="
echo "✓ All 5 V5 modules successfully inserted!"
echo "=================================================="

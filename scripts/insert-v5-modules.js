#!/usr/bin/env node

/**
 * Script to insert all 5 v5 module data for "Preventive Health Millennials" segment into Supabase
 *
 * Project: Greespi - Subscription model preventive health for millennials
 * Segment: Preventive Health Millennials
 */

const https = require('https');

const CONFIG = {
  PROJECT_ID: '17d26309-520b-45ec-b5d5-92512e2f6620',
  SEGMENT_ID: 'b9746846-420c-44d9-af21-f99a9b8986a5',
  SUPABASE_URL: 'yqetqeqxlimnbxwwmiyz.supabase.co',
  SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZXRxZXF4bGltbmJ4d3dtaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzMjA4MiwiZXhwIjoyMDgwMDA4MDgyfQ.-qJM4mOB0k9fb8rEvuRsPrBYpmp9dGCd15buU3kHr58'
};

// Data for all 5 modules
const channelStrategyData = {
  project_id: CONFIG.PROJECT_ID,
  segment_id: CONFIG.SEGMENT_ID,
  primary_channels: [
    {
      channel: "Instagram & TikTok",
      rationale: "Millennials are highly active on visual social platforms, particularly for health and wellness content. Instagram and TikTok drive discovery and community engagement through influencer partnerships and user-generated content.",
      tactics: [
        "Partner with health & wellness micro-influencers (10K-100K followers)",
        "Create educational Reels/TikToks showing preventive health benefits",
        "User testimonial campaigns showcasing health transformation journeys",
        "Interactive Stories with health assessment quizzes"
      ],
      kpis: [
        "Engagement rate >4%",
        "Click-through rate to landing page >2.5%",
        "Cost per acquisition <$45"
      ]
    },
    {
      channel: "Content Marketing (SEO Blog)",
      rationale: "Millennials research extensively before health decisions. High-quality, SEO-optimized content positions Greespi as a thought leader while capturing organic search traffic for preventive health topics.",
      tactics: [
        "Publish 2-3 weekly articles on preventive health topics (nutrition, mental wellness, biohacking)",
        "Create comprehensive guides (5000+ words) targeting high-volume keywords",
        "Build backlinks through guest posting on health publications",
        "Implement content upgrade strategy (downloadable health assessments)"
      ],
      kpis: [
        "Organic traffic growth 25% MoM",
        "Average session duration >3 minutes",
        "Content-driven conversions >15% of total"
      ]
    },
    {
      channel: "Email Marketing & Automation",
      rationale: "Subscription model requires nurturing relationships and demonstrating ongoing value. Email allows personalized health journeys and retention optimization.",
      tactics: [
        "Segmented onboarding sequences based on health goals",
        "Weekly personalized health insights using member data",
        "Re-engagement campaigns for inactive subscribers",
        "Referral program promotions with health incentives"
      ],
      kpis: [
        "Email open rate >28%",
        "Click rate >4.5%",
        "Email-attributed revenue >20% of MRR"
      ]
    }
  ],
  secondary_channels: [
    {
      channel: "LinkedIn Thought Leadership",
      rationale: "Professional millennials value career-health balance. LinkedIn establishes credibility and reaches decision-makers who can afford preventive health investments.",
      tactics: [
        "Weekly founder/expert posts on preventive health ROI",
        "Case studies demonstrating productivity gains",
        "LinkedIn Live sessions with health experts"
      ],
      kpis: [
        "Post engagement rate >3%",
        "Profile views growth 15% MoM"
      ]
    },
    {
      channel: "Podcast Sponsorships",
      rationale: "Millennials consume health and wellness podcasts during commutes and workouts, offering highly engaged, contextually relevant audiences.",
      tactics: [
        "Sponsor 3-5 health/wellness podcasts (50K+ downloads/episode)",
        "Create custom promo codes for tracking",
        "Host interview segments discussing preventive health trends"
      ],
      kpis: [
        "Promo code redemption rate >3%",
        "CAC from podcasts <$60"
      ]
    },
    {
      channel: "Community Partnerships",
      rationale: "Local gyms, yoga studios, and wellness centers provide direct access to health-conscious millennials already investing in wellbeing.",
      tactics: [
        "Co-marketing partnerships with 10-15 wellness centers",
        "In-person health assessment events",
        "Exclusive member benefits for partner communities"
      ],
      kpis: [
        "Partner-driven sign-ups 8-12% of monthly new users",
        "Partnership LTV >$800"
      ]
    }
  ],
  channel_synergies: [
    "Social media content repurposed for email campaigns and blog articles",
    "Blog SEO content shared across social channels to drive engagement",
    "Podcast appearances promote blog content and email sign-ups",
    "Community partnerships amplified through social media and email",
    "LinkedIn thought leadership supports content marketing authority"
  ],
  budget_allocation: {
    Instagram_TikTok: "30%",
    Content_Marketing: "20%",
    Email_Marketing: "10%",
    LinkedIn: "8%",
    Podcast_Sponsorships: "18%",
    Community_Partnerships: "14%"
  },
  measurement_framework: {
    customer_acquisition: {
      target_cac: "$50-65",
      ltv_cac_ratio: "3:1 minimum",
      payback_period: "6-8 months"
    },
    engagement_metrics: {
      social_engagement_rate: ">3.5%",
      email_open_rate: ">28%",
      content_session_duration: ">3 min"
    },
    conversion_optimization: {
      landing_page_cvr: ">8%",
      trial_to_paid: ">35%",
      monthly_churn: "<5%"
    }
  },
  version: "5.0"
};

const competitiveIntelligenceData = {
  project_id: CONFIG.PROJECT_ID,
  segment_id: CONFIG.SEGMENT_ID,
  direct_competitors: [
    {
      name: "Parsley Health",
      positioning: "Holistic primary care with functional medicine approach, offering root-cause analysis and personalized health plans",
      strengths: [
        "Comprehensive functional medicine testing",
        "One-on-one doctor appointments",
        "Strong clinical credibility",
        "Integrated health coaching"
      ],
      weaknesses: [
        "High price point ($150-400/month)",
        "Limited geographic availability",
        "Requires significant time commitment",
        "Complex onboarding process"
      ],
      pricing: "$150-400/month depending on plan tier",
      target_audience: "High-income millennials seeking comprehensive health optimization",
      differentiation_opportunity: "Greespi offers more accessible pricing ($79-129/month) with similar preventive focus but streamlined digital-first experience, reducing barriers to entry for middle-income millennials"
    },
    {
      name: "One Medical",
      positioning: "Tech-enabled primary care with same-day appointments, telehealth, and seamless app experience",
      strengths: [
        "Excellent app UX/UI",
        "Fast appointment availability",
        "Insurance accepted",
        "Physical locations nationwide"
      ],
      weaknesses: [
        "Less focus on preventive/proactive health",
        "Still reactive care model",
        "Annual membership doesn't guarantee prevention",
        "Limited functional medicine approach"
      ],
      pricing: "$199/year membership + insurance copays",
      target_audience: "Busy millennials wanting convenient primary care access",
      differentiation_opportunity: "Greespi focuses on prevention-first vs. reactive care, offering proactive health optimization plans and continuous monitoring rather than episodic visits"
    },
    {
      name: "Forward Health",
      positioning: "AI-powered preventive care with body scans, continuous monitoring, and personalized health plans",
      strengths: [
        "Advanced body scanning technology",
        "Data-driven health insights",
        "Modern clinic experience",
        "Strong tech integration"
      ],
      weaknesses: [
        "Very high cost ($149/month + $500 setup)",
        "Limited to major metro areas",
        "Requires in-person visits",
        "Tech can feel impersonal"
      ],
      pricing: "$149/month + $500 initial fee",
      target_audience: "Tech-savvy high-earners prioritizing cutting-edge health tech",
      differentiation_opportunity: "Greespi provides personalized human touch with health coaches while maintaining digital convenience, at lower price point accessible to broader millennial market"
    }
  ],
  indirect_competitors: [
    {
      name: "Health Insurance Wellness Programs",
      category: "Traditional insurance-based prevention",
      threat_level: "Medium - Free/low-cost but limited engagement and personalization",
      competitive_advantage: "Greespi offers superior personalization, engagement, and actionable insights vs. generic insurance wellness programs"
    },
    {
      name: "Fitness Apps (Peloton, Apple Fitness+)",
      category: "Exercise-focused wellness",
      threat_level: "Medium - Narrow focus on fitness without comprehensive health approach",
      competitive_advantage: "Greespi addresses holistic preventive health including nutrition, mental health, sleep, and medical prevention beyond just exercise"
    },
    {
      name: "Mental Health Apps (Calm, Headspace)",
      category: "Mental wellness subscriptions",
      threat_level: "Low - Complementary rather than competitive",
      competitive_advantage: "Greespi integrates mental health as part of comprehensive preventive health plan rather than isolated meditation app"
    },
    {
      name: "At-home Testing Kits (Everlywell, LetsGetChecked)",
      category: "Diagnostic testing",
      threat_level: "Medium - Testing without ongoing support or action plans",
      competitive_advantage: "Greespi combines testing with expert interpretation, personalized action plans, and continuous health coaching"
    }
  ],
  market_gaps: [
    {
      gap: "Affordable Comprehensive Preventive Care",
      description: "Most preventive health services target high-income segments ($150+/month). Middle-income millennials ($60K-100K annual income) want preventive health but can't afford premium services.",
      greespi_approach: "Price point of $79-129/month makes preventive health accessible to broader millennial market while maintaining quality through digital-first model and efficient operations"
    },
    {
      gap: "Personalized Action Plans Without High-Touch Commitment",
      description: "Competitors either offer generic programs (insurance wellness) or require significant time investment (Parsley Health). Millennials want personalization without complexity.",
      greespi_approach: "AI-enhanced personalization with flexible engagement levels - members can be as hands-on or hands-off as they prefer, with health coaches available on-demand rather than required appointments"
    },
    {
      gap: "Integration of Physical, Mental, and Nutritional Health",
      description: "Most solutions address only one dimension (fitness apps, mental health apps, nutrition apps). True prevention requires holistic integration.",
      greespi_approach: "Unified platform addressing all preventive health dimensions with integrated data tracking, cross-functional insights, and coordinated action plans"
    },
    {
      gap: "Community-Driven Preventive Health",
      description: "Existing services are transactional (doctor-patient) rather than community-based. Millennials value peer support and shared experiences.",
      greespi_approach: "Build community features including member forums, group challenges, peer accountability, and shared health journey milestones"
    }
  ],
  competitive_positioning: "Greespi occupies the sweet spot between affordable digital wellness apps and premium concierge medicine: comprehensive preventive care with personalized human support at accessible pricing. We make proactive health optimization achievable for middle-income millennials through efficient digital delivery, community engagement, and AI-enhanced personalization.",
  strategic_moats: [
    {
      moat: "Data-Driven Personalization Engine",
      description: "As Greespi collects more member health data, AI-powered recommendations improve, creating network effects where service quality increases with scale",
      defensibility: "High - proprietary data and algorithms become more valuable over time"
    },
    {
      moat: "Community Network Effects",
      description: "Strong member community creates engagement and retention advantages that competitors can't easily replicate",
      defensibility: "Medium-High - communities are sticky but can be built by well-funded competitors"
    },
    {
      moat: "Brand Trust in Preventive Health",
      description: "First-mover advantage in accessible preventive health for millennials builds brand equity and trust that's difficult to displace",
      defensibility: "Medium - brand can be built but requires significant time and consistent execution"
    },
    {
      moat: "Operational Efficiency Through Digital-First Model",
      description: "Lower cost structure enables competitive pricing while maintaining margins, making it difficult for traditional providers to compete on price without sacrificing quality",
      defensibility: "High - structural cost advantage difficult to replicate for legacy providers"
    }
  ],
  version: "5.0"
};

const pricingPsychologyData = {
  project_id: CONFIG.PROJECT_ID,
  segment_id: CONFIG.SEGMENT_ID,
  pricing_tiers: [
    {
      tier_name: "Foundation",
      price: "$79/month",
      positioning: "Entry point for millennials starting their preventive health journey - accessible, foundational, and commitment-friendly",
      psychological_triggers: [
        "Anchoring: Positioned well below competitors ($150-400/month), making it feel like exceptional value",
        "Threshold pricing: $79 vs $80 crosses psychological barrier of \"under $80\"",
        "Coffee comparison: \"Less than $3/day - the cost of a latte for your lifetime health\"",
        "Loss aversion: \"Investing $79/month now prevents thousands in future medical costs\""
      ],
      features: [
        "Personalized health assessment & baseline metrics",
        "Monthly health optimization plan",
        "Unlimited app access with health tracking",
        "Community forum access",
        "Quarterly health coach check-ins"
      ],
      target_persona: "Budget-conscious millennials (25-32) earning $50K-75K wanting to start preventive health without major commitment"
    },
    {
      tier_name: "Optimize",
      price: "$129/month",
      positioning: "Most popular tier for serious preventive health optimization - comprehensive support with maximum value",
      psychological_triggers: [
        "Decoy effect: Foundation tier makes $129 seem reasonable, Premium tier makes it look like best value",
        "Center-stage effect: Middle option psychologically preferred, highlighted as 'Most Popular'",
        "Value perception: 63% more features for only 63% price increase creates value perception",
        "Social proof: 'Chosen by 67% of members' creates bandwagon effect",
        "Round number avoidance: $129 vs $130 maintains charm pricing"
      ],
      features: [
        "Everything in Foundation, PLUS:",
        "Bi-weekly health coach sessions (24/year)",
        "Advanced biomarker testing (2x/year)",
        "Personalized supplement & nutrition plans",
        "Priority support response (<4 hours)",
        "Exclusive content & masterclasses"
      ],
      target_persona: "Career-focused millennials (28-38) earning $75K-120K prioritizing health optimization and work-life balance"
    },
    {
      tier_name: "Premium",
      price: "$199/month",
      positioning: "Concierge-level preventive health for high-achievers seeking comprehensive optimization and maximum accountability",
      psychological_triggers: [
        "Prestige pricing: Highest tier signals exclusivity and superior quality",
        "Contrast effect: Makes middle tier ($129) appear more reasonable and accessible",
        "Commitment device: Higher investment increases engagement through sunk cost effect",
        "Status signaling: Premium membership conveys commitment to health optimization",
        "Round number: $199 vs $200 maintains perceived value while feeling substantial"
      ],
      features: [
        "Everything in Optimize, PLUS:",
        "Weekly dedicated health coach sessions (52/year)",
        "Comprehensive annual executive health screening",
        "Quarterly advanced testing panels",
        "24/7 health coach messaging access",
        "Personalized fitness & stress management plans",
        "VIP access to health experts & specialists",
        "Annual health retreat invitation"
      ],
      target_persona: "High-achieving millennials (32-42) earning $120K+ who view health as ultimate competitive advantage"
    }
  ],
  pricing_strategies: [
    {
      strategy: "Free Trial with Progressive Commitment",
      implementation: "14-day free trial with full Optimize tier access → Creates endowment effect where users don't want to lose access after experiencing value",
      psychological_principle: "Endowment effect + Loss aversion: Once people experience the service, they value it more and fear losing access",
      conversion_tactic: "Day 10 email: \"You've logged 8 health wins this week - keep your momentum going\" reinforces progress and fear of losing it"
    },
    {
      strategy: "Annual Payment Discount",
      implementation: "Pay annually: Foundation $790 ($69/mo), Optimize $1,290 ($107/mo), Premium $1,990 ($166/mo) - save 12-17%",
      psychological_principle: "Temporal discounting + Payment decoupling: Single annual payment feels less painful than 12 monthly charges, while discount creates urgency",
      conversion_tactic: "Frame as: \"Save $180/year on Optimize tier - use savings for annual health retreat\""
    },
    {
      strategy: "Referral Incentives",
      implementation: "Refer a friend → both get 1 month free (valued at tier price)",
      psychological_principle: "Reciprocity + Social proof: Members want to help friends while being rewarded, referred friends trust recommendation from peers",
      conversion_tactic: "\"Your friend trusts you with their health - give them 30 days free on us\""
    },
    {
      strategy: "Upgrade Path Optimization",
      implementation: "Foundation users shown 'Unlock full potential' prompts highlighting Optimize features they're missing",
      psychological_principle: "FOMO + Scarcity of potential: Showing what they're missing creates desire to unlock full experience",
      conversion_tactic: "\"Members who upgraded to Optimize achieved 2.3x more health goals - upgrade and unlock your results\""
    }
  ],
  value_framing: [
    {
      frame: "Cost Per Day",
      messaging: "Foundation: $2.63/day | Optimize: $4.30/day | Premium: $6.63/day",
      rationale: "Daily costs feel minimal compared to monthly lump sum, easier to justify against daily expenses like coffee, lunch, or streaming services"
    },
    {
      frame: "Healthcare Cost Prevention",
      messaging: "Average preventable health condition costs $8,000-15,000. Greespi membership costs $948-2,388/year - a 5-10x ROI if it prevents just one condition.",
      rationale: "Reframes subscription as investment with measurable ROI rather than expense, appeals to millennial financial savvy"
    },
    {
      frame: "Time Value",
      messaging: "Save 40+ hours/year researching health topics, scheduling appointments, and managing wellness - we do the work for you",
      rationale: "Time-strapped millennials value convenience and efficiency, this reframes cost as time savings rather than pure financial expense"
    },
    {
      frame: "Comparative Value",
      messaging: "Optimize tier ($129/month) costs less than: Gym membership + meal prep service + therapy copays + wellness apps",
      rationale: "Shows Greespi consolidates multiple health investments into single, more affordable solution"
    }
  ],
  discount_strategy: {
    launch_promotion: {
      offer: "Founding member pricing: Lock in 20% off for life (Foundation $63, Optimize $103, Premium $159)",
      duration: "First 1,000 members only",
      psychological_principle: "Scarcity + Grandfathering: Creates urgency through limited availability while rewarding early adopters with permanent discount",
      messaging: "Join 847 founding members who locked in lifetime savings - only 153 spots remaining"
    },
    seasonal_campaigns: {
      offer: "New Year: \"Invest in your health\" 15% off first 3 months | Summer: \"Beach body starts with health\" 10% off Premium tier",
      timing: "January (New Year resolutions), June (summer), September (back-to-routine)",
      psychological_principle: "Temporal landmarks: Major life transitions create motivation for behavior change, discounts reduce friction at peak motivation moments"
    },
    win_back_campaigns: {
      offer: "Churned members: 50% off first month to return, plus personalized \"we miss you\" health insights showing what they've missed",
      psychological_principle: "Reciprocity + Regret aversion: Generous offer shows goodwill, personalized insights remind them of value they're missing"
    }
  },
  anchoring_techniques: [
    {
      technique: "Competitor Price Anchoring",
      implementation: "Pricing page shows: \"Parsley Health: $400/month | Forward: $149/month | Greespi Optimize: $129/month\"",
      effect: "Makes Greespi appear as premium value - similar quality at 30-70% lower cost"
    },
    {
      technique: "Original Price Strikethrough",
      implementation: "Show \"Regular price: $159\" strikethrough with \"Launch price: $129\" for limited time",
      effect: "Creates perception of getting discount/deal even though $129 was always intended price"
    },
    {
      technique: "Feature Value Anchoring",
      implementation: "List individual feature values (\"24 health coach sessions: $2,400 value\", \"Testing panels: $800 value\") totaling $4,500+, offered for $129/month",
      effect: "Makes monthly price seem like incredible deal when compared to sum of individual component values"
    }
  ],
  version: "5.0"
};

const trustFrameworkData = {
  project_id: CONFIG.PROJECT_ID,
  segment_id: CONFIG.SEGMENT_ID,
  credibility_builders: [
    {
      element: "Medical Advisory Board",
      implementation: "Feature prominent board-certified physicians, functional medicine experts, and registered dietitians on leadership team",
      trust_principle: "Authority: Millennials trust medical credentials and want evidence-based approaches, not wellness pseudoscience",
      messaging: "Our Medical Advisory Board includes 3 board-certified physicians, 2 functional medicine doctors, and 4 registered dietitians with 50+ combined years of preventive health experience",
      placement: "Homepage hero section, About page, all marketing materials"
    },
    {
      element: "Clinical Research & Evidence Base",
      implementation: "Publish transparent research backing all recommendations, cite peer-reviewed studies, partner with research institutions",
      trust_principle: "Expertise & Transparency: Science-backed claims build credibility with educated millennial audience skeptical of wellness industry hype",
      messaging: "Every health recommendation backed by peer-reviewed research. Read our evidence base library with 200+ scientific studies.",
      placement: "Dedicated research page, footnotes on all health claims, monthly research newsletter"
    },
    {
      element: "HIPAA Compliance & Data Security",
      implementation: "Prominent display of HIPAA compliance, SOC 2 Type II certification, encryption standards, privacy-first data practices",
      trust_principle: "Security & Privacy: Health data is deeply personal, especially for millennials concerned about data privacy",
      messaging: "Your health data is yours alone. Bank-level encryption, HIPAA compliant, zero data selling. Read our privacy commitment.",
      placement: "Footer of every page, dedicated security page, privacy policy highlights, onboarding flow"
    },
    {
      element: "Real Member Outcomes & Data",
      implementation: "Share aggregated, verified member health improvements with statistical significance (e.g., \"73% of members improved sleep quality within 60 days\")",
      trust_principle: "Social Proof + Results: Millennials want proof that preventive health works, not just promises",
      messaging: "Real results from real members: 73% improved sleep, 68% increased energy, 81% better stress management (verified outcomes from 2,500+ members)",
      placement: "Homepage, landing pages, email campaigns, case studies section"
    },
    {
      element: "Member Video Testimonials",
      implementation: "Authentic video testimonials from diverse millennials sharing specific health transformation stories",
      trust_principle: "Relatability + Authenticity: Seeing people like them succeed builds belief it's achievable",
      messaging: "Meet Sarah, 29, who reduced migraines by 80% through personalized nutrition. Meet Mike, 34, who improved his biomarkers and energy levels.",
      placement: "Homepage testimonial carousel, dedicated stories page, social media, email onboarding sequence"
    },
    {
      element: "Transparent Pricing & No Hidden Fees",
      implementation: "Crystal clear pricing displayed upfront, no surprise charges, simple cancellation policy, money-back guarantee",
      trust_principle: "Honesty & Fairness: Millennials are skeptical of subscription tricks and want transparent, fair pricing",
      messaging: "No hidden fees. No complicated contracts. Cancel anytime. 30-day money-back guarantee if you're not satisfied.",
      placement: "Pricing page, FAQ, checkout flow, all marketing materials"
    },
    {
      element: "Industry Certifications & Partnerships",
      implementation: "Display partnerships with reputable health organizations, lab certifications (CLIA-certified labs), professional memberships",
      trust_principle: "Institutional Trust: Third-party validation from recognized institutions builds credibility",
      messaging: "Proud members of American College of Preventive Medicine. Labs certified by CLIA. Partners with Mayo Clinic Wellness Network.",
      placement: "Footer trust badges, About page, partner logos on homepage"
    }
  ],
  risk_reversal: [
    {
      mechanism: "30-Day Money-Back Guarantee",
      offer: "Try Greespi risk-free for 30 days. If you're not satisfied for any reason, we'll refund your entire payment - no questions asked.",
      psychology: "Loss aversion reduction: Removes financial risk barrier, increases trial willingness",
      conversion_impact: "Reduces purchase anxiety, increases initial sign-ups by addressing \"What if it doesn't work for me?\" concern"
    },
    {
      mechanism: "Pause Subscription Anytime",
      offer: "Life gets busy. Pause your subscription for up to 3 months, resume whenever you're ready. No penalty, no hassle.",
      psychology: "Commitment flexibility: Reduces fear of being locked in, addresses \"What if I need a break?\" concern",
      conversion_impact: "Increases long-term retention by giving members control and preventing churn from temporary life disruptions"
    },
    {
      mechanism: "Health Goal Guarantee",
      offer: "If you complete your personalized plan for 90 days and don't see measurable progress toward your health goals, we'll work with you 1-on-1 until you do - at no additional cost.",
      psychology: "Performance guarantee: Shifts risk from customer to company, demonstrates confidence in product",
      conversion_impact: "Addresses effectiveness doubt, especially for skeptical millennials who've tried failed wellness programs before"
    },
    {
      mechanism: "Cancel Anytime, Keep Resources",
      offer: "Cancel your subscription anytime with one click. Keep all downloadable health resources, guides, and your health data forever.",
      psychology: "Exit transparency + Ownership: Shows respect for customer autonomy, removes fear of losing invested effort",
      conversion_impact: "Reduces subscription anxiety, demonstrates that Greespi values member empowerment over lock-in"
    }
  ],
  social_proof: [
    {
      type: "Volume Metrics",
      examples: [
        "Join 12,500+ millennials investing in their health future with Greespi",
        "50,000+ personalized health plans delivered",
        "2.3 million health goals tracked and achieved"
      ],
      psychology: "Bandwagon effect: Large numbers signal popularity and trustworthiness",
      implementation: "Homepage hero, email headers, social media ads"
    },
    {
      type: "Expert Endorsements",
      examples: [
        "Featured in: Forbes Health, Well+Good, MindBodyGreen, Healthline",
        "\"Greespi represents the future of accessible preventive care\" - Dr. Sarah Chen, Preventive Medicine Specialist",
        "Recommended by 200+ health professionals"
      ],
      psychology: "Authority transfer: Trust in recognized publications/experts transfers to Greespi",
      implementation: "Press page, homepage trust section, email signatures"
    },
    {
      type: "User-Generated Content",
      examples: [
        "Instagram hashtag #MyGreespiJourney with 5,000+ member posts",
        "Member success stories published weekly on blog",
        "4.8/5 star rating from 2,800+ verified reviews on Trustpilot"
      ],
      psychology: "Peer validation: Real people sharing authentic experiences creates relatability and trust",
      implementation: "Social media aggregation widget on homepage, dedicated UGC gallery, email showcases"
    },
    {
      type: "Milestone Celebrations",
      examples: [
        "\"This month, our members collectively improved 15,000 biomarkers\"",
        "\"Greespi members have prevented an estimated $4.2M in future healthcare costs\"",
        "\"Average member achieves first health goal in just 28 days\""
      ],
      psychology: "Collective achievement: Being part of larger positive impact creates belonging and motivation",
      implementation: "Monthly community emails, social media posts, homepage dynamic stats"
    },
    {
      type: "Founder Story & Mission",
      examples: [
        "Founder's personal health crisis at 32 led to Greespi's creation - making prevention accessible to all millennials, not just the wealthy",
        "\"I built Greespi because I was tired of reactive healthcare. Our generation deserves better.\" - Emma Rodriguez, Founder & CEO"
      ],
      psychology: "Origin story + Values alignment: Millennials connect with authentic founder stories and purpose-driven missions",
      implementation: "About page, founder video on homepage, podcast appearances, LinkedIn content"
    }
  ],
  transparency_practices: [
    {
      practice: "Open Pricing Breakdown",
      implementation: "Show exactly where subscription fees go: 40% health coaching, 25% testing/labs, 20% platform development, 10% customer support, 5% admin",
      trust_impact: "Demystifies pricing, shows value allocation, builds confidence that money is well-spent on actual health services"
    },
    {
      practice: "Health Coach Credentials Public",
      implementation: "Every health coach profile shows full credentials, certifications, specialties, member ratings, and response times",
      trust_impact: "Removes mystery about who's providing guidance, allows members to choose coaches aligned with their needs"
    },
    {
      practice: "Algorithm Explanation",
      implementation: "Transparent documentation of how health recommendations are generated: data inputs, research sources, personalization factors",
      trust_impact: "Demystifies AI/tech aspects, shows recommendations aren't arbitrary, educates members on the \"why\" behind suggestions"
    },
    {
      practice: "Regular Impact Reports",
      implementation: "Quarterly reports sharing aggregated member outcomes, research developments, platform improvements, and company goals",
      trust_impact: "Demonstrates accountability, shows continuous improvement, keeps members informed and engaged with company direction"
    },
    {
      practice: "Public Product Roadmap",
      implementation: "Share upcoming features, member-requested improvements, and development timeline publicly",
      trust_impact: "Shows responsiveness to member feedback, creates anticipation for improvements, demonstrates active development"
    }
  ],
  community_trust: [
    {
      initiative: "Member Advisory Council",
      description: "Quarterly meetings with 20 selected members to gather feedback, vote on feature priorities, and shape product direction",
      trust_mechanism: "Participatory design: Members feel ownership and voice in product evolution, builds loyalty and trust",
      implementation: "Application process for council, public summaries of council decisions, recognized member contributions"
    },
    {
      initiative: "Peer Support Groups",
      description: "Facilitated small groups (8-12 members) with similar health goals meeting monthly to share experiences, challenges, and wins",
      trust_mechanism: "Belonging & mutual support: Creates safe spaces for vulnerability, builds community bonds beyond company-customer relationship",
      implementation: "Opt-in during onboarding, professionally facilitated, strict community guidelines, privacy-first approach"
    },
    {
      initiative: "Member Recognition Program",
      description: "Celebrate member milestones publicly (with permission): health goal achievements, consistency streaks, community contributions",
      trust_mechanism: "Positive reinforcement + Social validation: Recognition motivates continued engagement and showcases real people succeeding",
      implementation: "Monthly spotlight features, milestone badges in app, social media shout-outs, annual awards"
    }
  ],
  version: "5.0"
};

const jtbdContextData = {
  project_id: CONFIG.PROJECT_ID,
  segment_id: CONFIG.SEGMENT_ID,
  functional_jobs: [
    {
      job: "Prevent future health problems before they start",
      context: "Millennial sees concerning health trends (family history of disease, stressful lifestyle, poor diet) and wants to be proactive rather than waiting until problems emerge",
      success_criteria: [
        "Understand current health baseline and risk factors",
        "Receive personalized prevention plan based on my specific risks",
        "Track progress and see measurable health improvements over time",
        "Feel confident I'm doing the right things to stay healthy long-term"
      ],
      obstacles: [
        "Don't know where to start with prevention",
        "Generic health advice doesn't account for my unique situation",
        "Hard to measure prevention success (nothing bad happening isn't visible progress)",
        "Lack of time to research and implement preventive strategies"
      ],
      greespi_solution: "Comprehensive health assessment identifies personal risk factors, AI-generated personalized prevention plan with specific actions, continuous tracking shows positive biomarker improvements, health coach guides implementation without research burden"
    },
    {
      job: "Optimize my energy, focus, and daily performance",
      context: "Millennial feels chronically tired, unfocused, or \"not operating at 100%\" despite no specific diagnosis, wants to feel energized and mentally sharp",
      success_criteria: [
        "Wake up feeling rested and energized consistently",
        "Maintain focus and mental clarity throughout workday",
        "Have energy for social life, hobbies, and exercise after work",
        "Reduce reliance on caffeine and stimulants"
      ],
      obstacles: [
        "Don't know root causes of low energy (sleep? nutrition? stress? hormones?)",
        "Tried generic solutions (more sleep, vitamins) with minimal improvement",
        "Conflicting information about what actually improves energy",
        "Hard to sustain behavior changes without structured support"
      ],
      greespi_solution: "Root-cause analysis through biomarker testing and lifestyle assessment, personalized energy optimization plan addressing sleep, nutrition, stress, and hormones, weekly check-ins with health coach for accountability, tracking shows energy improvements in real-time"
    },
    {
      job: "Make sense of confusing and contradictory health information",
      context: "Overwhelmed by health advice from social media, influencers, and conflicting studies, millennial wants personalized, science-backed guidance they can trust",
      success_criteria: [
        "Get clear, evidence-based answers to my health questions",
        "Understand what health advice applies specifically to me vs. generic population",
        "Stop second-guessing health decisions and feel confident in my choices",
        "Filter out wellness industry hype and focus on what actually works"
      ],
      obstacles: [
        "Too much conflicting health information online",
        "Don't have time or expertise to evaluate scientific studies",
        "Generic advice doesn't account for my unique health profile",
        "Wellness influencers often promote unproven methods"
      ],
      greespi_solution: "Personalized health recommendations based on individual data and peer-reviewed research, direct access to credentialed health coaches for questions, transparent citation of scientific evidence for all claims, filters out pseudoscience and focuses on proven interventions"
    },
    {
      job: "Take control of my health instead of reactive doctor visits",
      context: "Frustrated with traditional healthcare that only addresses problems after they arise, wants to be proactive health owner, not passive patient",
      success_criteria: [
        "Understand my health status deeply, not just when something is wrong",
        "Have actionable plan I can execute independently",
        "Feel empowered and in control of my health trajectory",
        "Reduce dependence on reactive medical appointments"
      ],
      obstacles: [
        "Traditional healthcare system is reactive, not proactive",
        "Annual check-ups provide minimal actionable insights",
        "Don't have health expertise to know what to optimize",
        "Expensive to access functional medicine or preventive care specialists"
      ],
      greespi_solution: "Continuous health monitoring and optimization vs. annual check-ups, personalized action plans put member in driver's seat, health coach as guide rather than authority figure, affordable access to preventive health expertise"
    }
  ],
  emotional_jobs: [
    {
      job: "Feel secure about my long-term health future",
      emotional_need: "Peace of mind and confidence that I'm protecting my future health",
      anxiety_addressed: "Fear of developing chronic diseases like parents/grandparents, worry about health decline affecting career and life goals",
      desired_feeling: "Calm confidence knowing I'm doing everything I can to stay healthy, security that I have a plan and support system",
      greespi_approach: "Regular biomarker tracking shows tangible evidence of health protection, predictive risk assessments identify potential issues early, health coach provides reassurance and expert guidance, community of peers on same journey creates collective security"
    },
    {
      job: "Feel proud of investing in myself",
      emotional_need: "Self-worth and accomplishment from prioritizing personal health",
      anxiety_addressed: "Guilt about neglecting health, feeling like health should be a priority but not following through",
      desired_feeling: "Pride in making mature, responsible health investments, satisfaction from self-care as self-respect",
      greespi_approach: "Membership itself is status signal of health commitment, achievement tracking celebrates health milestones, community recognition of progress reinforces positive identity, framing as investment (not expense) creates pride in wise decision-making"
    },
    {
      job: "Feel supported and not alone in health journey",
      emotional_need: "Connection, encouragement, and accountability from others who understand",
      anxiety_addressed: "Isolation in trying to improve health alone, feeling like nobody understands health struggles",
      desired_feeling: "Belonging to supportive community, comfort from expert guidance, motivation from shared experiences",
      greespi_approach: "Dedicated health coach provides personalized support and accountability, peer community shares similar challenges and wins, regular check-ins create feeling of being cared for, celebration of milestones makes progress feel seen and valued"
    },
    {
      job: "Feel like I'm living aligned with my values",
      emotional_need: "Authenticity and integrity through actions matching beliefs about health importance",
      anxiety_addressed: "Cognitive dissonance between believing health matters but not taking action, guilt over knowing better but not doing better",
      desired_feeling: "Alignment and integrity from walking the talk on health values, authenticity in self-care as self-respect",
      greespi_approach: "Greespi membership transforms values into action, creates daily habits aligned with long-term health beliefs, community reinforces shared values around preventive health, progress tracking shows concrete evidence of living values"
    },
    {
      job: "Reduce anxiety about health uncertainty",
      emotional_need: "Control and understanding in the face of health unknowns",
      anxiety_addressed: "Worry about hidden health problems, anxiety about whether current habits are healthy enough, stress from not knowing if symptoms are serious",
      desired_feeling: "Calm from having answers and clarity, control from understanding what's happening in my body, reduced worry through proactive monitoring",
      greespi_approach: "Regular testing reduces uncertainty about health status, expert interpretation of results provides clarity, personalized plans create sense of control, health coach accessible for anxious questions provides reassurance"
    }
  ],
  social_jobs: [
    {
      job: "Signal that I'm a responsible, health-conscious person",
      social_context: "Millennial wants to be perceived by peers, partners, and colleagues as someone who has their life together and prioritizes wellness",
      desired_perception: "Mature, self-disciplined, health-savvy, future-oriented, responsible adult",
      visibility_opportunities: [
        "Sharing Greespi membership and health wins on social media",
        "Discussing health optimization strategies in social conversations",
        "Visible health improvements (energy, physique, mental clarity) that others notice",
        "Recommending Greespi to friends positions member as health leader"
      ],
      greespi_enablement: "Shareable health milestone achievements, branded community hashtag (#MyGreespiJourney), member success stories feature individuals publicly, referral program incentivizes public advocacy, premium membership tier signals serious health commitment"
    },
    {
      job: "Be part of a forward-thinking wellness community",
      social_context: "Millennial wants to belong to tribe of like-minded people prioritizing preventive health and self-optimization",
      desired_identity: "Part of health-conscious millennial movement, member of exclusive wellness community, connected to others with similar values",
      community_benefits: [
        "Shared language and understanding around preventive health",
        "Peer accountability and mutual encouragement",
        "Networking with other high-achieving health-conscious millennials",
        "Sense of belonging to something bigger than individual health journey"
      ],
      greespi_enablement: "Member forums and discussion groups, monthly virtual community events, local Greespi member meetups in major cities, exclusive content and masterclasses for members only, member advisory council for engaged community leaders"
    },
    {
      job: "Recommend valuable health resources to friends and family",
      social_context: "When friends complain about health issues or ask for wellness advice, millennial wants to be helpful resource",
      desired_role: "Trusted health advisor among peers, person who knows good resources, helpful friend who shares valuable solutions",
      recommendation_triggers: [
        "Friend mentions low energy, poor sleep, or stress",
        "Colleague asks how member stays healthy despite busy schedule",
        "Family member diagnosed with preventable condition",
        "Social conversation about health optimization or biohacking"
      ],
      greespi_enablement: "Referral program with benefits for both referrer and referee, shareable resources (health assessments, blog articles), compelling results to share with others, easy explanation of value proposition, gift subscription options for giving Greespi to loved ones"
    }
  ],
  hiring_moments: [
    {
      trigger: "Health wake-up call",
      description: "Scary symptom, abnormal test result, family member health crisis, or friend's diagnosis creates urgency to prioritize health",
      emotional_state: "Anxious, motivated, receptive to change, willing to invest in prevention",
      switching_barriers: "Need solution quickly, overwhelmed by options, want trusted expertise not DIY experimentation",
      greespi_positioning: "\"Get comprehensive health assessment and personalized prevention plan within 48 hours. Our experts identify risks and create action plan so you can take control before small issues become big problems.\""
    },
    {
      trigger: "Life milestone or transition",
      description: "Turning 30, getting married, buying house, starting family planning - major life events trigger health reflection",
      emotional_state: "Reflective, forward-looking, motivated to \"get life together\", open to investments in future self",
      switching_barriers: "Busy with life changes, need simple solution that fits into new routine, want sustainable long-term approach",
      greespi_positioning: "\"Start your next chapter with optimized health. Whether you're planning a family, building a career, or stepping into a new decade, Greespi helps you build the health foundation for what's next.\""
    },
    {
      trigger: "Chronic frustration with feeling suboptimal",
      description: "Fed up with ongoing low energy, poor sleep, brain fog, or stress - ready to address root causes instead of bandaid solutions",
      emotional_state: "Frustrated, determined, skeptical of quick fixes, willing to invest in comprehensive solution",
      switching_barriers: "Tried generic solutions before without success, skeptical of wellness industry promises, need personalized approach with proof",
      greespi_positioning: "\"Tired of feeling tired? We identify the root causes of low energy, poor sleep, and stress through comprehensive testing and personalized plans. 73% of members report significant energy improvements within 60 days.\""
    },
    {
      trigger: "Social influence or recommendation",
      description: "Friend raves about Greespi results, influencer discusses preventive health benefits, colleague visible health transformation",
      emotional_state: "Curious, motivated by peer success, open to trying what worked for trusted source",
      switching_barriers: "Want to confirm it's right for me specifically, need easy way to try without major commitment",
      greespi_positioning: "\"Join [Friend's Name] and 12,500+ millennials optimizing their health with Greespi. Start with 14-day free trial - experience personalized health coaching and see if it's right for you, risk-free.\""
    },
    {
      trigger: "New Year or fresh start timing",
      description: "New Year resolutions, start of new season, post-vacation recommitment - temporal landmarks create motivation for behavior change",
      emotional_state: "Optimistic, motivated for fresh start, open to new commitments, goal-oriented",
      switching_barriers: "Past failed health resolutions create skepticism, need structure and support to sustain changes beyond initial motivation",
      greespi_positioning: "\"Make this the year you actually prioritize your health. Unlike generic resolutions, Greespi provides personalized roadmap and expert coaching to turn health goals into lasting habits. Start strong and stay consistent.\""
    }
  ],
  firing_moments: [
    {
      trigger: "Not seeing tangible results or progress",
      intervention: "Proactive 30-day check-in with health coach to review progress, adjust plan if needed, set achievable short-term milestones, share success stories from similar members",
      prevention: "Set realistic expectations during onboarding, celebrate small wins frequently, show leading indicators of progress even before major outcomes"
    },
    {
      trigger: "Life gets too busy or overwhelming",
      intervention: "Offer \"pause subscription\" option for up to 3 months, provide low-effort maintenance plans for busy periods, send motivational reminders about why they started",
      prevention: "Build flexible engagement levels (high-touch or low-touch options), make health optimization fit busy life rather than requiring major time investment"
    },
    {
      trigger: "Financial constraints or reprioritization",
      intervention: "Offer downgrade to lower tier instead of full cancellation, provide limited scholarship/discount programs for financial hardship, emphasize ROI and long-term cost savings",
      prevention: "Clearly demonstrate ongoing value, make monthly cost feel insignificant compared to health benefits, annual payment options with discount"
    },
    {
      trigger: "Achieved initial goals and lost motivation",
      intervention: "Health coach helps set new, exciting stretch goals, introduce advanced optimization opportunities, transition to maintenance mindset with new success metrics",
      prevention: "Frame health as ongoing journey not destination, continuously introduce new challenges and learning opportunities, gamification keeps engagement fresh"
    }
  ],
  version: "5.0"
};

// Helper function to make HTTPS POST request
function makePostRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: CONFIG.SUPABASE_URL,
      path: `/rest/v1/${endpoint}`,
      method: 'POST',
      headers: {
        'apikey': CONFIG.SERVICE_KEY,
        'Authorization': `Bearer ${CONFIG.SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(responseBody);
            resolve({
              success: true,
              statusCode: res.statusCode,
              data: parsed
            });
          } catch (e) {
            resolve({
              success: true,
              statusCode: res.statusCode,
              data: responseBody
            });
          }
        } else {
          reject({
            success: false,
            statusCode: res.statusCode,
            error: responseBody
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        success: false,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

// Main execution
async function insertAllModules() {
  console.log('='.repeat(80));
  console.log('INSERTING V5 MODULE DATA FOR PREVENTIVE HEALTH MILLENNIALS SEGMENT');
  console.log('='.repeat(80));
  console.log(`Project ID: ${CONFIG.PROJECT_ID}`);
  console.log(`Segment ID: ${CONFIG.SEGMENT_ID}`);
  console.log('='.repeat(80));
  console.log('');

  const modules = [
    { name: 'Channel Strategy', endpoint: 'channel_strategy', data: channelStrategyData },
    { name: 'Competitive Intelligence', endpoint: 'competitive_intelligence', data: competitiveIntelligenceData },
    { name: 'Pricing Psychology', endpoint: 'pricing_psychology', data: pricingPsychologyData },
    { name: 'Trust Framework', endpoint: 'trust_framework', data: trustFrameworkData },
    { name: 'JTBD Context', endpoint: 'jtbd_context', data: jtbdContextData }
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const module of modules) {
    try {
      console.log(`[${module.name}] Inserting data...`);
      const result = await makePostRequest(module.endpoint, module.data);

      if (result.success) {
        console.log(`[${module.name}] ✓ SUCCESS (Status: ${result.statusCode})`);
        if (result.data && result.data[0]) {
          console.log(`[${module.name}]   Created ID: ${result.data[0].id || 'N/A'}`);
        }
        successCount++;
      } else {
        console.error(`[${module.name}] ✗ FAILED (Status: ${result.statusCode})`);
        console.error(`[${module.name}]   Error: ${result.error}`);
        failureCount++;
      }
    } catch (error) {
      console.error(`[${module.name}] ✗ EXCEPTION`);
      console.error(`[${module.name}]   Error: ${error.error || error.message || JSON.stringify(error)}`);
      failureCount++;
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('INSERTION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Modules: ${modules.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  console.log('='.repeat(80));

  if (failureCount > 0) {
    process.exit(1);
  }
}

// Run the script
insertAllModules().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});

#!/usr/bin/env node

const https = require('https');

const SUPABASE_URL = 'https://yqetqeqxlimnbxwwmiyz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZXRxZXF4bGltbmJ4d3dtaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzMjA4MiwiZXhwIjoyMDgwMDA4MDgyfQ.-qJM4mOB0k9fb8rEvuRsPrBYpmp9dGCd15buU3kHr58';
const PROJECT_ID = '17d26309-520b-45ec-b5d5-92512e2f6620';
const SEGMENT_ID = '260ec846-ba0f-43d5-82d9-4b2f93a4a440';

function makeRequest(table, data) {
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify(data);

    const options = {
      hostname: 'yqetqeqxlimnbxwwmiyz.supabase.co',
      port: 443,
      path: `/rest/v1/${table}`,
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(jsonData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✓ Successfully inserted into ${table}`);
          resolve(JSON.parse(responseData || '{}'));
        } else {
          console.error(`✗ Failed to insert into ${table}: ${res.statusCode}`);
          console.error(`Response: ${responseData}`);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`✗ Request error for ${table}:`, error.message);
      reject(error);
    });

    req.write(jsonData);
    req.end();
  });
}

async function insertAllData() {
  console.log('Starting data insertion for Wellness-Focused Healthcare Workers segment...\n');

  // 1. Channel Strategy
  const channelStrategy = {
    project_id: PROJECT_ID,
    segment_id: SEGMENT_ID,
    primary_platforms: {
      professional_networks: {
        linkedin_healthcare_groups: {
          priority: "high",
          usage_pattern: "Morning coffee scroll (6-7am) and evening wind-down (9-10pm)",
          content_consumed: "Clinical nutrition research, peer case studies, professional development",
          engagement_style: "Lurk more than post, engage with evidence-based content",
          influence_level: "High - where they vet new health interventions"
        },
        medscape_doximity: {
          priority: "high",
          usage_pattern: "Quick checks during breaks, saved articles for later",
          content_consumed: "Latest research, CME opportunities, clinical updates",
          engagement_style: "Professional, evidence-seeking, bookmark-heavy"
        }
      },
      search_behavior: {
        google_scholar_pubmed: {
          priority: "very_high",
          queries: ["microalgae clinical trials", "spirulina evidence-based nutrition", "functional foods healthcare professionals"],
          intent: "Vetting scientific credibility before personal use"
        }
      },
      podcasts_continuing_ed: {
        priority: "high",
        preferred_shows: ["FoundMyFitness", "The Proof with Simon Hill", "Nutrition Facts with Dr. Greger"],
        listening_context: "Commute (30-45min), gym workouts, household chores"
      }
    },
    content_preferences: {
      format_hierarchy: {
        tier_1_most_effective: {
          peer_reviewed_summaries: "Pubmed citations, clinical trial breakdowns, systematic review highlights",
          expert_interviews: "Conversations with registered dietitians, sports nutritionists, functional medicine MDs"
        }
      },
      tone_requirements: {
        must_have: "Evidence-first, transparent about limitations, acknowledges individual variation",
        avoid: "Exaggerated claims, pseudoscience, anti-medical establishment rhetoric"
      }
    },
    trusted_sources: {
      tier_1_ultimate_trust: {
        peer_reviewed_journals: ["Journal of Nutrition", "Nutrients", "Clinical Nutrition"],
        regulatory_bodies: ["FDA GRAS status", "EFSA opinions", "ISO certification bodies"]
      }
    },
    communities: {
      online_hubs: {
        reddit: {
          subreddits: ["r/medicine", "r/nursing", "r/physicaltherapy", "r/dietetics"],
          behavior: "Ask 'anyone tried X?', share research, skeptical but open-minded"
        }
      }
    },
    search_patterns: {
      high_intent_queries: [
        "best supplements for night shift nurses",
        "evidence-based functional foods for healthcare workers",
        "microalgae clinical research"
      ]
    },
    advertising_response: {
      high_performing_channels: {
        podcast_sponsorships: {
          shows: ["FoundMyFitness", "The Drive with Peter Attia"],
          trust_factor: "Very high if host has vetted the product"
        }
      }
    }
  };

  // 2. Competitive Intelligence
  const competitiveIntelligence = {
    project_id: PROJECT_ID,
    segment_id: SEGMENT_ID,
    alternatives_tried: {
      current_solutions: {
        athletic_greens_ag1: {
          usage_rate: "30% have tried",
          satisfaction: "Mixed - appreciate convenience, skeptical of proprietary blend opacity",
          switching_vulnerability: "High - would switch for better transparency and lower cost"
        },
        traditional_spirulina_powder: {
          usage_rate: "45% have tried",
          satisfaction: "Low - taste is major barrier, uncertain about quality/sourcing",
          switching_vulnerability: "Very high - actively looking for better alternative"
        },
        multivitamin_plus_fish_oil: {
          usage_rate: "60% current approach",
          satisfaction: "Moderate - feels like bare minimum, not optimized"
        }
      }
    },
    current_workarounds: {
      dietary_strategies: {
        meal_prep_sunday: "Batch cook vegetables, grains, proteins for the week",
        smoothie_packs: "Pre-portioned frozen fruit/veg/protein for quick blending"
      },
      pain_points_with_current_approach: {
        time_constraint: "Meal prep takes 3-4 hours on day off, smoothies still require 5-10 min prep",
        quality_uncertainty: "Don't know if supplements are actually bioavailable or just expensive urine",
        pill_fatigue: "Taking 5-8 different pills daily feels excessive"
      }
    },
    vs_competitors: {
      greespi_advantages: {
        frozen_vs_dried: {
          differentiator: "Preserves heat-sensitive enzymes and phytonutrients lost in spray-drying",
          appeal: "Healthcare workers understand enzymatic activity and bioavailability"
        },
        iso_haccp_certification: {
          differentiator: "Most competitors lack food safety certifications",
          appeal: "Addresses contamination concerns from China-sourced spirulina"
        }
      }
    },
    switching_barriers: {
      friction_points: {
        freezer_space: {
          barrier: "Hospital housing, small apartments, shared fridges",
          severity: "Medium-High"
        },
        taste_uncertainty: {
          barrier: "Burned before by terrible-tasting green powders",
          severity: "High"
        }
      }
    },
    evaluation_process: {
      decision_journey: {
        phase_1_awareness: {
          trigger: "Podcast mention, colleague recommendation, social media ad",
          mindset: "Mildly curious, highly skeptical"
        },
        phase_2_research: {
          activities: ["Google Scholar search for microalgae clinical trials", "Check Examine.com for research summaries"],
          mindset: "Evidence-gathering mode, looking for red flags"
        }
      }
    },
    category_beliefs: {
      functional_foods_philosophy: {
        core_belief: "Food should be medicine, but not all superfoods deliver on promises",
        skepticism_areas: ["Detox/cleanse claims", "Miracle cure messaging", "Proprietary blends"]
      }
    }
  };

  // 3. Pricing Psychology
  const pricingPsychology = {
    project_id: PROJECT_ID,
    segment_id: SEGMENT_ID,
    budget_context: {
      income_profile: {
        registered_nurses: {
          median_salary: "$77,600/year",
          financial_pressures: "Student loans (average $40k-80k nursing school debt)"
        },
        physicians: {
          median_salary: "$208,000/year",
          financial_pressures: "Medical school debt ($200k-500k), malpractice insurance"
        }
      },
      wellness_budget_allocation: {
        total_wellness_spend: "$230-550/month average"
      }
    },
    price_perception: {
      acceptable_price_ranges: {
        daily_cost_framing: {
          sweet_spot: "$2-3/day ($60-90/month)",
          justification: "Less than a latte, similar to quality protein powder"
        }
      },
      psychological_price_points: {
        magic_numbers: {
          "$2_per_day": "Affordable daily habit, compares favorably to coffee",
          "$69_per_month": "Just under $70 threshold, feels like $60s not $70s"
        }
      }
    },
    value_anchors: {
      primary_value_drivers: {
        time_savings: {
          quantification: "Saves 10-15 min/day vs preparing nutrient-dense meal",
          monetary_value: "15 min × $30-50/hour professional rate = $7.50-12.50/day value"
        }
      }
    },
    willingness_to_pay_signals: {
      high_willingness_indicators: {
        already_buying_premium: "If spending on AG1, Four Sigmatic → willing to pay for quality",
        patient_care_motivation: "I need to be at my best to take care of others"
      }
    },
    payment_psychology: {
      preferred_payment_structures: {
        subscription_appeal: {
          pros: "Autopilot convenience, don't have to remember to reorder",
          cons: "Subscription fatigue, fear of accumulating unused product"
        }
      }
    },
    roi_calculation: {
      quantified_benefits: {
        energy_productivity: {
          baseline: "Brain fog, mid-shift crashes, need multiple coffees",
          value: "10% productivity increase worth $128-256/month"
        }
      }
    },
    pricing_objections: {
      common_objections: {
        too_expensive: {
          reframe: "Compare to daily coffee or eating out - similar cost, greater health impact"
        }
      }
    },
    discount_sensitivity: {
      promotional_effectiveness: {
        high_impact_offers: {
          healthcare_worker_discount: "20% off with hospital badge verification"
        }
      }
    },
    budget_triggers: {
      high_willingness_moments: {
        tax_refund_season: "February-April, discretionary income boost",
        new_years_resolution: "January health goals, willing to invest"
      }
    }
  };

  // 4. Trust Framework (using correct schema columns)
  const trustFramework = {
    project_id: PROJECT_ID,
    segment_id: SEGMENT_ID,
    baseline_trust: {
      trust_in_category: "3/10 - Low trust in supplement industry",
      trust_in_brand: "2/10 initially - Unknown brand requires extensive vetting",
      reasons_for_skepticism: [
        "FDA doesn't regulate supplements like drugs - quality varies wildly",
        "Heavy metal contamination scandals (lead in turmeric, arsenic in protein powders)",
        "Proprietary blends hide actual ingredient amounts",
        "Influencer marketing saturation creates cynicism"
      ],
      past_betrayals: [
        "Bought expensive supplements that didn't work",
        "Contaminated spirulina from China",
        "AG1 proprietary blend opacity",
        "Patients harmed by unregulated supplements"
      ]
    },
    proof_hierarchy: [
      {
        proof_type: "Third-party testing COA",
        effectiveness: "10/10 - Essential",
        why_it_works: "External validation of safety and potency, non-negotiable for healthcare workers",
        how_to_present: "Downloadable batch-specific PDFs, clickable verification links",
        examples: ["NSF International testing", "Eurofins heavy metal analysis", "USP verification"]
      },
      {
        proof_type: "Peer-reviewed research",
        effectiveness: "9/10 - Critical",
        why_it_works: "Scientific backing reduces skepticism, can cite specific studies",
        how_to_present: "Link directly to PubMed articles, summary with citations",
        examples: ["Journal of Nutrition spirulina studies", "Clinical trials on microalgae"]
      },
      {
        proof_type: "Professional endorsements",
        effectiveness: "8/10 - High impact",
        why_it_works: "Peer authority from RDs/MDs transfers credibility",
        how_to_present: "Video testimonials with credentials visible, advisory board listings",
        examples: ["RD testimonial: 'I recommend to my patients'", "Functional medicine MD endorsement"]
      },
      {
        proof_type: "Food safety certifications",
        effectiveness: "8/10 - Differentiating",
        why_it_works: "Same standards as hospital food suppliers, addresses contamination fears",
        how_to_present: "Certification logos with verification links",
        examples: ["ISO 22000", "HACCP", "GMP"]
      },
      {
        proof_type: "Peer testimonials from healthcare workers",
        effectiveness: "7/10 - Relatable",
        why_it_works: "Social proof from similar others, real-world validation",
        how_to_present: "Verified reviews with badge/workplace shown, specific details",
        examples: ["ICU nurse: 'Sustained my energy through 12-hour shifts'"]
      }
    ],
    trusted_authorities: [
      {
        authority_type: "Registered Dietitians (RD/RDN)",
        specific_names: ["Academy of Nutrition and Dietetics members", "Sports nutritionists with credentials"],
        why_trusted: "Evidence-based experts, legally regulated, no sales incentive",
        how_to_leverage: "RD on advisory board, RD-written content, RD testimonials"
      },
      {
        authority_type: "Physician colleagues",
        specific_names: ["Functional medicine MDs", "Sports medicine doctors", "Hospital colleagues"],
        why_trusted: "Shared medical training, peer respect, understand scientific rigor",
        how_to_leverage: "MD testimonials in specialty-specific marketing, physician case studies"
      },
      {
        authority_type: "Research institutions",
        specific_names: ["Mayo Clinic", "Cleveland Clinic", "Johns Hopkins"],
        why_trusted: "Reputation for evidence-based medicine, no commercial bias",
        how_to_leverage: "Cite research from these institutions, guest articles from their experts"
      }
    ],
    social_proof: {
      testimonial_profile: "Verified healthcare workers with badge/credentials visible, specific job titles (ICU nurse, PT, RD)",
      before_after_importance: "Medium - more interested in sustained benefits than dramatic transformations",
      numbers_that_matter: [
        "Number of healthcare professionals using Greespi",
        "Hospitals/clinics where it's used",
        "Average energy improvement percentage",
        "Reduction in sick days"
      ],
      case_study_angle: "Day-in-the-life: How [Name], [Title] at [Hospital] uses Greespi for shift work nutrition"
    },
    transparency_needs: {
      information_needed: [
        "Where microalgae is grown (country, facility type)",
        "Water source (ocean, tanks, ponds) and filtration",
        "Processing methods (flash-freeze timing, storage)",
        "Testing protocols (what, how often, by whom)",
        "Full ingredient list with amounts"
      ],
      disclosure_expectations: [
        "Batch-specific COA publicly available",
        "Certification numbers verifiable on certifying body website",
        "Supply chain traceability from cultivation to delivery",
        "Company background (who founded, why, credentials)"
      ],
      transparency_level: "Maximum - any opacity triggers distrust"
    },
    trust_killers: [
      {
        red_flag: "Misleading health claims (cures, detoxes, boosts immune 500%)",
        why_triggers_skepticism: "Recognize illegal/false medical claims, lose all credibility",
        how_to_avoid: "Use 'supports', 'may help', cite mechanisms, never claim cure"
      },
      {
        red_flag: "Fake or unverifiable certifications",
        why_triggers_skepticism: "They will verify - if logo doesn't link to real cert, trust destroyed",
        how_to_avoid: "Only use real, current, verifiable certifications with clickable links"
      },
      {
        red_flag: "Proprietary blends / hidden ingredients",
        why_triggers_skepticism: "Transparency non-negotiable, hiding anything = hiding everything",
        how_to_avoid: "Full ingredient disclosure even if helps competitors"
      },
      {
        red_flag: "Aggressive sales tactics (countdown timers, fake scarcity)",
        why_triggers_skepticism: "Feels manipulative, disrespects their intelligence",
        how_to_avoid: "Honest marketing, real limited offers only"
      }
    ],
    credibility_markers: [
      {
        signal: "Third-party certification seals (NSF, USP, Informed Choice)",
        importance: "Critical - immediate external validation signal",
        current_status: "Must have to compete"
      },
      {
        signal: "Peer-reviewed research citations",
        importance: "High - scientific legitimacy",
        current_status: "Differentiator if Greespi-specific studies exist"
      },
      {
        signal: "Healthcare professional testimonials with verified credentials",
        importance: "High - peer authority vouching",
        current_status: "Must build over time with customer base"
      },
      {
        signal: "ISO/HACCP facility certifications",
        importance: "Medium-high - quality control assurance",
        current_status: "Differentiator from unregulated brands"
      }
    ],
    risk_reduction: {
      biggest_risks: [
        "Wasted money on ineffective product",
        "Contamination or safety issues",
        "Subscription trap (hard to cancel)",
        "Professional credibility damage if recommend and it fails"
      ],
      reversal_mechanisms: [
        {
          mechanism: "60-day money-back guarantee, no return required",
          effectiveness: "Very high - removes financial risk, shows confidence",
          implementation: "Prominent on all pages, simple email/one-click refund process"
        },
        {
          mechanism: "Batch-specific third-party testing publicly available",
          effectiveness: "High - addresses contamination fears",
          implementation: "QR code on package to testing results, downloadable COAs"
        },
        {
          mechanism: "Cancel anytime subscription with easy skip/pause",
          effectiveness: "High - removes commitment anxiety",
          implementation: "One-click cancel, no phone call required, proactive check-ins"
        }
      ]
    },
    trust_journey: {
      first_touchpoint_goal: "Don't immediately dismiss - show credibility signals (certifications, research) to earn research phase",
      mid_journey_reassurance: [
        "Detailed COA and testing results available",
        "Peer testimonials from verified healthcare workers",
        "Transparent sourcing and processing information",
        "Professional endorsements from RDs/MDs"
      ],
      pre_purchase_push: "60-day guarantee + peer validation + first-order discount = low-risk trial decision",
      post_purchase_confirmation: "Onboarding email with usage tips, realistic timeline for results, easy customer service access"
    }
  };

  // 5. JTBD Context
  const jtbdContext = {
    project_id: PROJECT_ID,
    segment_id: SEGMENT_ID,
    job_contexts: {
      primary_jobs_to_be_done: {
        sustain_energy_through_demanding_shifts: {
          job_statement: "When I'm working a 12-16 hour shift with minimal breaks, I need sustained mental and physical energy so I can provide quality patient care without crashing",
          current_struggles: {
            energy_crashes: "Mid-shift crashes around hour 6-8, brain fog",
            caffeine_dependency: "Drinking 3-5 cups of coffee per shift, leads to jitters"
          },
          desired_outcome: {
            energy_quality: "Steady, calm energy without jitters or crashes",
            mental_clarity: "Sharp focus for critical decisions"
          },
          greespi_fit: {
            mechanism: "200+ bioactive compounds including B vitamins support cellular energy without caffeine spike",
            format_advantage: "Frozen cube in morning smoothie = 2 min prep, sustained release"
          }
        },
        optimize_nutrition_despite_chaotic_schedule: {
          job_statement: "When my work schedule is unpredictable and I have no time for meal prep, I need a reliable way to get essential nutrients",
          current_struggles: {
            meal_prep_failure: "Plan to meal prep on Sunday, too exhausted",
            time_scarcity: "10-15 min for breakfast on work days"
          },
          greespi_fit: {
            format_advantage: "Frozen format = zero prep beyond blending, lasts 18 months"
          }
        }
      }
    },
    job_priority_ranking: {
      tier_1_urgent_important: {
        rank_1: {
          job: "Sustain energy through demanding shifts",
          urgency: "Immediate daily pain point, affects job performance",
          market_size: "Nearly 100% of healthcare workers struggle with shift work fatigue"
        }
      }
    },
    job_dependencies: {
      prerequisite_jobs: {
        before_they_can_focus_on_nutrition: {
          job: "Survive the shift without collapsing",
          implication: "Greespi must be positioned as survival tool, not optimization"
        }
      }
    }
  };

  try {
    await makeRequest('channel_strategy', channelStrategy);
    await makeRequest('competitive_intelligence', competitiveIntelligence);
    await makeRequest('pricing_psychology', pricingPsychology);
    await makeRequest('trust_framework', trustFramework);
    await makeRequest('jtbd_context', jtbdContext);

    console.log('\n✓ All 5 v5 modules successfully inserted for Wellness-Focused Healthcare Workers segment!');
    console.log(`\nSegment ID: ${SEGMENT_ID}`);
    console.log(`Project ID: ${PROJECT_ID}`);
  } catch (error) {
    console.error('\n✗ Failed to insert all data:', error.message);
    process.exit(1);
  }
}

insertAllData();

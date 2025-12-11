#!/usr/bin/env node

const https = require('https');

const SUPABASE_URL = 'https://yqetqeqxlimnbxwwmiyz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZXRxZXF4bGltbmJ4d3dtaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzMjA4MiwiZXhwIjoyMDgwMDA4MDgyfQ.-qJM4mOB0k9fb8rEvuRsPrBYpmp9dGCd15buU3kHr58';
const PROJECT_ID = '17d26309-520b-45ec-b5d5-92512e2f6620';
const SEGMENT_ID = '260ec846-ba0f-43d5-82d9-4b2f93a4a440';

function makeRequest(table, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify(data);

    // For PATCH, we need to add query params
    const path = method === 'PATCH'
      ? `/rest/v1/${table}?project_id=eq.${PROJECT_ID}&segment_id=eq.${SEGMENT_ID}`
      : `/rest/v1/${table}`;

    const options = {
      hostname: 'yqetqeqxlimnbxwwmiyz.supabase.co',
      port: 443,
      path: path,
      method: method,
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
          console.log(`✓ Successfully ${method === 'PATCH' ? 'updated' : 'inserted'} into ${table}`);
          resolve(JSON.parse(responseData || '{}'));
        } else {
          console.error(`✗ Failed to ${method === 'PATCH' ? 'update' : 'insert'} into ${table}: ${res.statusCode}`);
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

async function insertRemainingData() {
  console.log('Inserting remaining v5 modules (trust_framework and jtbd_context)...\n');

  // Trust Framework
  const trustFramework = {
    project_id: PROJECT_ID,
    segment_id: SEGMENT_ID,
    baseline_trust: {
      trust_in_category: "3/10 - Low trust in supplement industry",
      trust_in_brand: "2/10 initially - Unknown brand requires extensive vetting",
      reasons_for_skepticism: [
        "FDA doesn't regulate supplements like drugs - quality varies wildly",
        "Heavy metal contamination scandals",
        "Proprietary blends hide ingredient amounts",
        "Influencer marketing saturation"
      ],
      past_betrayals: [
        "Bought expensive supplements that didn't work",
        "Contaminated spirulina from China",
        "AG1 proprietary blend opacity"
      ]
    },
    proof_hierarchy: [
      {
        proof_type: "Third-party testing COA",
        effectiveness: "10/10 - Essential",
        why_it_works: "External validation of safety and potency",
        how_to_present: "Downloadable batch-specific PDFs",
        examples: ["NSF International", "Eurofins testing", "USP verification"]
      },
      {
        proof_type: "Peer-reviewed research",
        effectiveness: "9/10 - Critical",
        why_it_works: "Scientific backing reduces skepticism",
        how_to_present: "Link to PubMed articles",
        examples: ["Journal of Nutrition studies", "Clinical trials"]
      },
      {
        proof_type: "Professional endorsements",
        effectiveness: "8/10 - High impact",
        why_it_works: "Peer authority from RDs/MDs",
        how_to_present: "Video testimonials with credentials",
        examples: ["RD testimonials", "MD endorsements"]
      }
    ],
    trusted_authorities: [
      {
        authority_type: "Registered Dietitians",
        specific_names: ["Academy of Nutrition and Dietetics", "Sports nutritionists"],
        why_trusted: "Evidence-based experts, regulated credentials",
        how_to_leverage: "RD on advisory board, RD-written content"
      },
      {
        authority_type: "Physician colleagues",
        specific_names: ["Functional medicine MDs", "Sports medicine doctors"],
        why_trusted: "Shared medical training, peer respect",
        how_to_leverage: "MD testimonials in specialty marketing"
      }
    ],
    social_proof: {
      testimonial_profile: "Verified healthcare workers with credentials visible",
      before_after_importance: "Medium - interested in sustained benefits",
      numbers_that_matter: ["Healthcare professionals using product", "Hospitals using it", "Energy improvement %"],
      case_study_angle: "Day-in-the-life of healthcare worker using Greespi"
    },
    transparency_needs: {
      information_needed: ["Where grown", "Water source", "Processing methods", "Testing protocols"],
      disclosure_expectations: ["Batch-specific COA", "Verifiable certifications", "Supply chain traceability"],
      transparency_level: "Maximum - any opacity triggers distrust"
    },
    trust_killers: [
      {
        red_flag: "Misleading health claims",
        why_triggers_skepticism: "Recognize illegal/false medical claims",
        how_to_avoid: "Use 'supports', 'may help', never claim cure"
      },
      {
        red_flag: "Fake certifications",
        why_triggers_skepticism: "They will verify",
        how_to_avoid: "Only real, verifiable certifications"
      }
    ],
    credibility_markers: [
      {
        signal: "Third-party certification seals",
        importance: "Critical",
        current_status: "Must have to compete"
      },
      {
        signal: "Peer-reviewed research",
        importance: "High",
        current_status: "Differentiator"
      }
    ],
    risk_reduction: {
      biggest_risks: ["Wasted money", "Contamination", "Subscription trap"],
      reversal_mechanisms: [
        {
          mechanism: "60-day money-back guarantee",
          effectiveness: "Very high",
          implementation: "Simple email/one-click refund"
        },
        {
          mechanism: "Third-party testing publicly available",
          effectiveness: "High",
          implementation: "QR code to testing results"
        }
      ]
    },
    trust_journey: {
      first_touchpoint_goal: "Show credibility signals to earn research phase",
      mid_journey_reassurance: ["COA available", "Peer testimonials", "Transparent sourcing"],
      pre_purchase_push: "60-day guarantee + peer validation + discount",
      post_purchase_confirmation: "Onboarding with usage tips"
    }
  };

  // JTBD Context
  const jtbdContext = {
    project_id: PROJECT_ID,
    segment_id: SEGMENT_ID,
    job_contexts: [
      {
        job_reference_id: "job-1",
        job_name: "Sustain energy through demanding shifts",
        hire_triggers: [
          {
            situation: "Working 12-16 hour shift with minimal breaks",
            frequency: "3-5 times per week",
            urgency: "High - immediate daily pain point",
            emotional_state: "Exhausted, desperate for solution"
          },
          {
            situation: "Mid-shift energy crash around hour 6-8",
            frequency: "Nearly every shift",
            urgency: "Critical - affects patient safety",
            emotional_state: "Frustrated, concerned about performance"
          }
        ],
        competing_solutions: [
          {
            alternative: "Multiple coffees (3-5 cups per shift)",
            why_chosen: "Fast, readily available, familiar",
            when_chosen: "Default current solution",
            job_completion_rate: "40% - causes jitters and crashes",
            your_advantage: "Greespi provides steady energy without caffeine jitters"
          },
          {
            alternative: "Energy drinks, vending machine snacks",
            why_chosen: "Convenient, quick sugar/caffeine hit",
            when_chosen: "Emergency situations",
            job_completion_rate: "30% - short spike then worse crash",
            your_advantage: "Sustained release nutrients, no crash"
          }
        ],
        success_metrics: {
          how_measured: ["Subjective energy levels throughout shift", "Need for caffeine", "Mental clarity"],
          immediate_progress: ["Alert feeling within 2 hours", "No mid-shift crash"],
          short_term_success: "Consistent energy through full shift for 2 weeks",
          long_term_success: "Reduced caffeine dependency, better recovery, sustained for months",
          acceptable_tradeoffs: ["2 min prep time acceptable for sustained energy", "Slightly higher cost than coffee acceptable for better results"]
        },
        obstacles: [
          {
            obstacle: "No time for breakfast preparation",
            blocks_progress: "Can't consume if takes too long to prepare",
            how_you_remove_it: "Frozen cube blends in 2 minutes, can bring in thermos"
          },
          {
            obstacle: "Skepticism about supplements working",
            blocks_progress: "Won't try if don't believe it works",
            how_you_remove_it: "Peer testimonials, research citations, 60-day guarantee"
          }
        ],
        hiring_anxieties: [
          {
            anxiety: "What if it doesn't work for me?",
            rooted_in: "Past supplement disappointments",
            how_to_address: "60-day guarantee, realistic expectations, peer testimonials showing individual variation"
          },
          {
            anxiety: "Is it safe? Contamination concerns?",
            rooted_in: "Knowledge of supplement industry issues",
            how_to_address: "Third-party testing, ISO/HACCP certification, batch-specific COAs"
          }
        ]
      },
      {
        job_reference_id: "job-2",
        job_name: "Optimize nutrition despite chaotic schedule",
        hire_triggers: [
          {
            situation: "Unpredictable work schedule, no time for meal prep",
            frequency: "Weekly - every week is chaotic",
            urgency: "Medium-high - chronic health concern",
            emotional_state: "Guilty about poor nutrition, worried about long-term health"
          }
        ],
        competing_solutions: [
          {
            alternative: "Meal prep on Sunday",
            why_chosen: "Ideal solution, know it works",
            when_chosen: "When have energy and time",
            job_completion_rate: "30% - too exhausted most weekends",
            your_advantage: "No prep required, lasts 18 months frozen"
          },
          {
            alternative: "Multivitamin + fish oil stack",
            why_chosen: "Quick, covers basics",
            when_chosen: "Current default",
            job_completion_rate: "50% - bare minimum, not optimized",
            your_advantage: "Whole food nutrition, broader compound profile"
          }
        ],
        success_metrics: {
          how_measured: ["Consistency of intake", "Reduced guilt", "Subjective health improvements"],
          immediate_progress: ["Easy daily consumption", "No prep burden"],
          short_term_success: "80%+ adherence for 1 month",
          long_term_success: "Improved bloodwork, sustained habit for 6+ months",
          acceptable_tradeoffs: ["Freezer space acceptable for convenience", "$2-3/day acceptable vs meal prep time"]
        },
        obstacles: [
          {
            obstacle: "Freezer space constraints",
            blocks_progress: "Can't store if no space",
            how_you_remove_it: "Compact packaging, workplace freezer programs"
          }
        ],
        hiring_anxieties: [
          {
            anxiety: "Will I actually use it or will it sit in freezer?",
            rooted_in: "Past failed wellness purchases",
            how_to_address: "Easy integration into existing routine, usage guides, onboarding support"
          }
        ]
      }
    ],
    job_priority_ranking: [
      {
        job_name: "Sustain energy through demanding shifts",
        priority: "1 - Highest",
        reasoning: "Immediate daily pain point affecting job performance and patient safety. Nearly 100% of healthcare workers struggle with shift work fatigue."
      },
      {
        job_name: "Optimize nutrition despite chaotic schedule",
        priority: "2 - High",
        reasoning: "Ongoing guilt and health consequences. 80%+ report inadequate nutrition due to time constraints."
      },
      {
        job_name: "Support recovery and prevent burnout",
        priority: "3 - Important but not urgent",
        reasoning: "Chronic issue determining career longevity. 30-50% experiencing burnout symptoms."
      }
    ],
    job_dependencies: [
      {
        primary_job: "Survive the shift without collapsing",
        enables_job: "Optimize nutrition",
        relationship: "Must address immediate survival needs before optimization - position Greespi as survival tool first"
      },
      {
        primary_job: "Validate that it works personally",
        enables_job: "Commit to subscription",
        relationship: "Need low-friction trial before subscription commitment - offer trial pricing and guarantee"
      }
    ]
  };

  try {
    await makeRequest('trust_framework', trustFramework, 'POST');
    await makeRequest('jtbd_context', jtbdContext, 'POST');

    console.log('\n✓ Successfully inserted trust_framework and jtbd_context!');
    console.log('\n✓ ALL 5 v5 modules now complete for Wellness-Focused Healthcare Workers segment!');
    console.log(`\nSegment ID: ${SEGMENT_ID}`);
    console.log(`Project ID: ${PROJECT_ID}`);
  } catch (error) {
    console.error('\n✗ Failed to insert data:', error.message);
    process.exit(1);
  }
}

insertRemainingData();

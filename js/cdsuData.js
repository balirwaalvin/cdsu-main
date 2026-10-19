// ============================================================================
// CDSU CENTRALIZED CONTENT, BRAND & CONFIGURATION STORE
// Designed for rapid editorial updates by Ms. Ijuka Agnes Barongo (Senior Executive)
// and seamless operational updates (Office Address, MoMo/Airtel Merchant Codes, Sponsors)
// ============================================================================

window.CDSU_DATA = {
  organization: {
    shortName: "CDSU",
    fullName: "The Career Development Society of Uganda",
    motto: "Building people first, for wealth to follow.",
    tagline: "Career Development: A Path to Wealth",
    bookIsbn: "978-9913-678-02-5",
    copyrightYear: "2026",
    publisher: "CDSU Publishers",
    editionNote: "1st Edition (2026) — Aligned with Uganda NDPIV, TVET Act 2025 & Competence-Based Curriculum",
    aboutSummary:
      "The Career Development Society of Uganda (CDSU) is a non-partisan and non-profit organization established following the need for a structured, data-driven Career Development Programme (CDP) to enhance Uganda's national leap to high middle-income status.",
    aboutExtended:
      "We are focused on raising a critical mass of citizens with productive skills, who passionately add holistic value to themselves and the country at large. Our intent is on 'building people first, for wealth to follow'—bridging the gap between education, TVET skills mastery, industry mentorship, and sustainable entrepreneurship.",
    vision:
      "To be the lead career development enterprise contributing to the production of balanced and wealthy citizens.",
    mission:
      "To complement government efforts in strengthening career pathways, aligning education and skills development with industry demands, and promoting innovation-driven wealth creation among the people of Uganda.",
    rulesToSuperCareer: [
      {
        number: "01",
        title: "Appreciate & Take on Informal Work Early",
        detail:
          "After self-awareness, practice your profession or career path even before formal qualification. Start early—volunteering and executing assignments well opens doors for repeat business."
      },
      {
        number: "02",
        title: "Acquire & Stack Practical Skills",
        detail:
          "In addition to your core profession, acquire vocational skills in digital literacy, AI & data analysis, and essential life skills."
      },
      {
        number: "03",
        title: "Build Rock-Solid Work Ethics",
        detail:
          "Demonstrate unwavering commitment. True work ethic is about delivering exceptional value, productivity, and integrity—not merely hours spent at a desk."
      },
      {
        number: "04",
        title: "Cultivate a Records & Learning Culture",
        detail:
          "Ride on data and financial records to analyze and make decisions. Implement, extract lessons, refine actions, and continuously upgrade."
      },
      {
        number: "05",
        title: "Tap into the Journey of Entrepreneurship",
        detail:
          "Careers provide cash flow, scarce skills, and social capital—when channeled into business and asset ownership, entrepreneurship becomes a game changer."
      }
    ],
    coreObjectives: [
      {
        id: "obj-1",
        title: "Increase Career Development Awareness",
        icon: "book-open",
        points: [
          "Developing and disseminating well-documented and researched career development publications, books, journals, and e-magazines across print and online platforms.",
          "Engaging in continuous training and sensitization outreaches among children and youth (ages 8–35), parents, and community educators (leaders, teachers, influencers)."
        ]
      },
      {
        id: "obj-2",
        title: "Build Education–Industry Linkages",
        icon: "briefcase",
        points: [
          "Establishing credible and formal education-industry networks that provide job-shadowing, mentorship, and apprenticeship platforms for specialized skills development.",
          "Aligning institutional training directly with evolving national and global labour-market needs."
        ]
      },
      {
        id: "obj-3",
        title: "Scale Viable Income-Generating Ventures",
        icon: "trending-up",
        points: [
          "Establishing and scaling well-grounded, viable, and varied income-generating ventures as model enterprises.",
          "Ensuring organizational self-sustenance and youth enterprise survival with the African Continental Free Trade Area (AfCFTA) in view."
        ]
      },
      {
        id: "obj-4",
        title: "Enhance Social Inclusion & Collective Economics",
        icon: "users",
        points: [
          "Promoting decent work and career empowerment for women, persons with disabilities (PWDs), refugees, and the long-term unemployed.",
          "Harnessing the principles of collective economics to pool resources and build shared prosperity."
        ]
      }
    ]
  },

  contact: {
    physicalAddress: "Plot 5007, Valley Drive, Bulamu Ward, Gayaza, Wakiso District - Uganda",
    addressNote: "Head Secretariat (Wakiso / Kampala Metropolitan Area)",
    phones: ["+256 746 265 724", "+256 759 746 364", "+256 791 662 188"],
    whatsappNumber: "+211 988 196 141",
    whatsappClean: "211988196141",
    primaryPhoneClean: "256746265724",
    emailPrimary: "info.cdsu@gmail.com",
    emailSecondary: "infor.cdsu@gmail.com"
  },

  payments: {
    bank: {
      bankName: "ABSA Bank",
      branch: "Wandegeya Branch, Uganda",
      accountName: "The Career Development Society of Uganda",
      ugxAccount: "6010048654",
      usdAccount: "6010048522"
    },
    // TODO(Treasurer): set merchantCode once MTN MoMo / Airtel Money codes are issued.
    // While null, the site shows "coming soon" and directs payers to bank transfer or a phone call.
    mobileMoney: {
      mtn: { provider: "MTN Mobile Money", merchantCode: null },
      airtel: { provider: "Airtel Money", merchantCode: null }
    }
  },

  cdpPhases: [
    {
      phaseCode: "Phase A",
      badge: "Step 01 • Theorizing Phase",
      title: "Comprehensive Career & Wealth Seminars",
      summary:
        "Participants gain a deep, structured understanding of careers, self-awareness, and wealth creation through customized, thought-provoking sessions anchored in the 8 chapters of our manual.",
      highlights: [
        "Guided by the reference book 'Career Development: A Path to Wealth'",
        "Covers Self-Awareness, Passion vs. Market Demand, Financial Literacy & AI Readiness",
        "Tailored for In-School Students, Out-of-School Youth, Parents & Employees"
      ],
      color: "crimson"
    },
    {
      phaseCode: "Phase B",
      badge: "Step 02 • Practice Phase",
      title: "Supervised Career Cluster Clubs & Mentorship",
      summary:
        "Learners transition from theory into supervised Career Cluster (Club) activities—offering hands-on practice to fine-tune their skills, talents, and project outputs.",
      highlights: [
        "6 Specialized Career Clusters (STEM, Business, Health/Education, TVET, Creative Arts, Sports/Security)",
        "Structured Mentorship & Job-Shadowing with practicing industry professionals",
        "Supports Competence-Based Curriculum student projects from P.7 to University"
      ],
      color: "gold"
    },
    {
      phaseCode: "Phase C",
      badge: "Step 03 • Exposure Phase",
      title: "Annual Career Skills-Exhibitions & Apprenticeships",
      summary:
        "Participants showcase raw talent, inventions, and prototypes at annual themed exhibitions—connecting directly with employers, funders, and apprenticeship registries.",
      highlights: [
        "Direct forum for talent recognition, recruitment & apprenticeship registration",
        "First-year incubation support for youth-led enterprises to survive and scale",
        "Cross-cohort benchmarking across subscribed schools and community clubs"
      ],
      color: "blue"
    }
  ],

  products: [
    {
      id: 1,
      title: "'Career Development: A Path to Wealth' Reference Book",
      category: "Flagship Publication",
      price: "UGX 50,000",
      description:
        "Our 8-chapter, 183-page practical manual and workbook (ISBN 978-9913-678-02-5) featuring Uganda policy frameworks, TVET & University guides, B.E.S.T entrepreneurship tools, and self-assessment annexures. Includes a unique Serial Number for CDP access.",
      ctaText: "Order Book / Verify Serial"
    },
    {
      id: 2,
      title: "Training of Trainers (T.O.T) & Counseling Dept Support",
      category: "Institutional Capacity",
      price: "UGX 50,000 / Trainee",
      description:
        "We support schools and colleges to establish vibrant Career Counseling Departments, train career teachers and community facilitators, and conduct seminars for parents and adults.",
      ctaText: "Enroll for T.O.T"
    },
    {
      id: 3,
      title: "Career-Club Based Youth Innovation Facilitation",
      category: "In-School & Community Clubs",
      price: "Subscribed Cohort",
      description:
        "Hands-on facilitation of school and out-of-school Career Clusters—helping learners turn Competence-Based Curriculum projects into viable micro-enterprises.",
      ctaText: "Register a Career Club"
    },
    {
      id: 4,
      title: "Skills & Talent Enhancing Platforms",
      category: "Exhibitions & Competitions",
      price: "Annual Event",
      description:
        "Regional and national Career Skills-Exhibitions, inter-club competitions, and peer founder networks that bring visibility to youth inventions and innovations.",
      ctaText: "Partner on Exhibitions"
    },
    {
      id: 5,
      title: "Job-Shadowing, Mentorship & Apprenticeship Linkages",
      category: "Industry Bridge",
      price: "Protégé Placement",
      description:
        "Formal linkages between training institutions and private-sector employers to give participants real-world practice, mentorship, and apprenticeship pathways.",
      ctaText: "Host or Join Apprenticeships"
    }
  ],

  // Institutions named in the book as contributors/reviewers. Sponsorship status is NOT confirmed
  // in the documents — set `status: "sponsor"` and fill `url` once each is confirmed by CDSU.
  // Only entries with status "sponsor" or "partner" are shown; logos can be added via `logo`.
  // Sponsors & Partners slide-through marquee (as requested by Executive).
  // Clicking an active sponsor/partner links directly to their official website.
  // Entries with status: "sponsor" or "partner" appear in the slide-through.
  sponsors: [
    { id: "seeta-uni", name: "Seeta University", note: "Confirmed Sponsor • Editorial Review", status: "sponsor", url: "https://seetauniversity.ac.ug", logo: null },
    { id: "uvtab", name: "UVTAB", note: "Confirmed Sponsor • TVET Assessment Board", status: "sponsor", url: "https://uvtab.go.ug", logo: null },
    { id: "enterprise-uganda", name: "Enterprise Uganda", note: "Development Partner • B.E.S.T Training", status: "partner", url: "https://enterprise.co.ug", logo: null },
    { id: "victoria-uni", name: "Victoria University", note: "Academic Review Partner", status: "partner", url: "https://vu.ac.ug", logo: null },
    { id: "avance-uni", name: "Avance International University", note: "Academic Leadership Partner", status: "partner", url: "https://aiu.ac.ug", logo: null },
    { id: "smack", name: "St. Mary's College Kisubi", note: "Careers Office Partner", status: "partner", url: "https://smack.sc.ug", logo: null },
    // Pipeline sponsors mentioned in executive briefing (change status to "sponsor" once confirmed):
    { id: "absa-bank", name: "ABSA Bank Uganda", note: "Official Banking Partner", status: "pipeline", url: "https://www.absa.co.ug", logo: null },
    { id: "prudential", name: "Prudential Uganda", note: "Prospective Sponsor", status: "pipeline", url: "https://www.prudential.ug", logo: null },
    { id: "nssf", name: "NSSF Uganda", note: "Prospective Sponsor", status: "pipeline", url: "https://www.nssfug.org", logo: null }
  ],

  endorsements: [
    {
      name: "Prof. Maggie Kigozi",
      title: "Key Message • Former Executive Director, Uganda Investment Authority",
      role: "Medical doctor, business consultant, educator & sportswoman",
      image: "assets/images/maggie_kigozi.jpg",
      quote:
        "Indeed, your career is the path to wealth – not only in material terms, but in purpose, fulfilment, and impact... I thank the CDSU for breaking down the pathway to lead the young people by 'building people first, for wealth to follow.' You are lucky to have this book which comprehensively gives you the rules to a super career.",
      secondaryQuote:
        "Business rewards those who build not just those who earn. Africa's next chapter belongs to the builders – those who create, innovate, and sustain industries that can employ millions."
    },
    {
      name: "Ms. Charity Barungi B.",
      title: "Careers Office, St. Mary's College Kisubi (SMACK)",
      role: "Co-Author & Senior Career Counselor",
      image: "assets/images/charity_barungi.jpg",
      quote:
        "Young people cannot go where they know not, or rely on chance to get a fulfilling life. Those who have gone ahead must hold a candle and pacify career anxiety. They say a word to a wise man is enough, but we say a word to a young man or woman changes life. This manual gives a clear footprint on how one can get to that desired place in the marketplace."
    },
    {
      name: "Prof. Kefa Natolooka",
      title: "Lead Academic Reviewer & Endorser",
      role: "Seasoned Academician, Lecturer & University Consultant in Uganda",
      image: null,
      quote:
        "Reviewed and endorsed as a timely, policy-aligned, and deeply practical career development manual that bridges Uganda's formal education system, TVET reforms, and enterprise creation."
    }
  ],

  authors: [
    {
      name: "Mr. Ivan Dan Gitta",
      role: "Concept Developer & Executive Director, CDSU",
      credentials: "MA Organizational Leadership & Management (Uganda Christian University) • PGD Health Systems Care (Manchester Univ, UK) • BA Education (Kyambogo Univ)",
      image: "assets/images/author_ivan_gitta.jpg",
      bio: "A professional teacher, lecturer, project/community developer, and change agent. He most recently served as Dean of Students at Star International University in Juba, South Sudan, with a distinguished track record in social transformation and education innovations in Uganda."
    },
    {
      name: "Dr. Kato Kimata Joshua (PhD)",
      role: "Co-Author • Substantive Vice Chancellor, Avance International University",
      credentials: "PhD & Masters in Education Planning & Management • BA Education (Kyambogo University)",
      image: "assets/images/author_kato_joshua.jpg",
      bio: "An education management researcher and scholar with over 12 years of university teaching, mentoring, and supervision. Contributed the vital frameworks on career-to-wealth conversion, social competence (EQ), work-life rhythm, and retirement readiness."
    },
    {
      name: "Dr. Simon Mwesigwa (PhD)",
      role: "Co-Author • Deputy Vice Chancellor (Admin), Destiny University",
      credentials: "PhD Theology (Northwestern Theological Seminary, Florida) • MBA (Makerere) • B.Ed (Kyambogo) • Dip. Theology (UCU)",
      image: "assets/images/author_simon_mwesigwa.jpg",
      bio: "A professional Trainer of Trainers with over 25 years of experience in Education Administration. Co-proprietor of Starford International University and Destiny University College in Juba, and central motivation for compiling this comprehensive manual."
    },
    {
      name: "Ms. Stella Naisanga",
      role: "Co-Author • Youth & Women Empowerment Specialist",
      credentials: "Degree in International Business Administration (KIU) • Diploma in ICT (Makerere) • Cert. Guidance & Counselling (Reachout Uganda)",
      image: "assets/images/author_stella_naisanga.jpg",
      bio: "A passionate educator and youth/women empowerment practitioner across Uganda and South Sudan. Contributed interactive question guides, classroom dialogues, and led the pretesting of the manual among young people."
    },
    {
      name: "Ms. Charity Barungi B.",
      role: "Co-Author • Education Officer & Counselor, SMACK",
      credentials: "MBA in Human Resource (Uganda Martyrs Univ) • B.Ed English Language & Literature (Makerere Univ)",
      image: "assets/images/author_charity_barungi.jpg",
      bio: "Career Counselor at St. Mary's College Kisubi (SMACK) who inspired the manual's conclusion, the emphasis on student projects under the Competence-Based Curriculum, and the practical school-transition decision guides."
    }
  ],

  reviewBoard: [
    { name: "Ms. Ijuka Agnes Barongo", role: "Senior Executive, CDSU & Communications Lead" },
    { name: "Prof. Kefa Natolooka", role: "Lead Academic Reviewer & University Consultant" },
    { name: "Dr. Ronald Mbago", role: "Reviewer • Seeta University" },
    { name: "Mr. Businge Conan Daniel", role: "Reviewer • Victoria University" },
    { name: "Mr. Kambaho Narasi Anyijuka", role: "Reviewer • Uganda Vocational & Technical Assessment Board (UVTAB)" },
    { name: "Mr. Boniface Ssebukalu", role: "Strategic Linkages & Pilot Phase Advisor" }
  ],

  bookChapters: [
    {
      number: "Chapter 01",
      pages: "Pages 1–24",
      title: "Background, Foundations, Career & Wealth Creation",
      summary:
        "Anchors career guidance in Uganda's NDPIV (2025/26–2029/30), NHRDP, ESSR25, and TVET Act 2025. Explores the history of careers, the 4 Career Traps (Education/Salary, Job, Mind, Time vs. Hard Work), and the 4-Stage Career-to-Wealth Pipeline.",
      keyTakeaways: [
        "Three outputs of a career: Cash Flow, Scarce Skills, and Social Capital",
        "Breaking the 'Cut the Rope of Excuses' and 'Accomplish, Move!' mindset traps",
        "Moving from position to asset ownership (businesses, land, equity, IP)"
      ]
    },
    {
      number: "Chapter 02",
      pages: "Pages 25–39",
      title: "The Environmental Factors in Career Choice",
      summary:
        "Examines the pivotal role of Parents/Guardians, the distinction between Role Models and Mentors (5 things you need from a mentor & 5 things a mentor needs from you: Responsibility, Accountability, Time, Tenacity, Versatility), School Interventions, and Faith/Community platforms for out-of-school youth.",
      keyTakeaways: [
        "Parental guide: Train early, talk WITH not AT children, encourage without imposing",
        "Interactive classroom dialogue: 'Mutesi the Deejay and Her Strict Mom'",
        "Mobilizing out-of-school youth via faith institutions, clubs, and community spaces"
      ]
    },
    {
      number: "Chapter 03",
      pages: "Pages 40–74",
      title: "Self-Awareness in Career Development",
      summary:
        "Deep dive into Personality Types (Introverts vs. Extroverts competitive formulas), Values, Strengths vs. Interests, the 5 Tests to separate Real Passion from Passing Interest, the 3-Zone Career Model, Social Competence (EQ), and Uganda's Education Pathways (PLE to University/TVET).",
      keyTakeaways: [
        "Career Acceleration Formula: Technical Skills × Social Competence × Visibility",
        "Are Certificates Important? The Career-to-Wealth Pyramid",
        "Balanced analysis: Studying Locally (UNEB) vs. Studying Abroad & School Selection Guide"
      ]
    },
    {
      number: "Chapter 04",
      pages: "Pages 75–91",
      title: "Everyone is Unique — A Case for TVET",
      summary:
        "Demystifies Technical and Vocational Education and Training (TVET) as a first-choice pathway. Features the Japan & JICA Kosen Case Study, the UVTAB progressive ladder (Artisan Level 1 to PhD), over 170 UVTAB-examined programs, and 585+ accredited TVET centers across Uganda.",
      keyTakeaways: [
        "In Uganda today, a learner can start with tools in their hands and end with a PhD in their mind",
        "Complete directory of UVTAB Certificate & Diploma programs across all sectors",
        "Regional breakdown of 585+ accredited TVET centers across Uganda"
      ]
    },
    {
      number: "Chapter 05",
      pages: "Pages 92–130",
      title: "Career Pathways, Entrepreneurship & Career Planning",
      summary:
        "Maps 8 major Career Clusters, positions Entrepreneurship as a professional career path with excerpts from Enterprise Uganda's B.E.S.T Training & Mr. Charles Ocici, explores Family Career Legacies, analyzes AI & the Future of Careers, and teaches SMARTER/PURE/CLEAR Career Planning plus CV, Resume & Interview mastery.",
      keyTakeaways: [
        "6 Sources of Business Finance & The 5Cs of Borrowing (Never borrow for a start-up!)",
        "AI-Resilient Careers & Human Advantage (Meta-skills, EQ, Character & Creativity)",
        "Practical templates for CVs vs. Resumes, Cover Letters, and acing Job Interviews"
      ]
    },
    {
      number: "Chapter 06",
      pages: "Pages 131–146",
      title: "Challenges & Overview of Financial Literacy",
      summary:
        "Addresses the 9 core barriers to career growth (Finances, Responsibilities, Comfort Zone, Norms & Extended Family Obligations) and delivers a practical Financial Literacy blueprint covering the Decision Matrix, the 10-30-50-10 Budgeting Rule, Money Personalities, and the 7 Key Startup Business Records.",
      keyTakeaways: [
        "The 10-30-50-10 Rule: 10% Tithe/Giving, 30% Savings/Investment, 50% Needs, 10% Wants",
        "Revenue is vanity, profit is sanity, and cash flow is survival—all three depend on records",
        "The 7 mandatory records every startup must keep daily and monthly"
      ]
    },
    {
      number: "Chapter 07",
      pages: "Pages 147–169",
      title: "Work, Change, Career Transition & Retirement",
      summary:
        "Explores the dignity of work, Work Ethics & Uganda's Occupational Safety and Health Act, redefining Work-Life Balance as Energy/Agency/Meaning, responding proactively to Change (Eagle Flight principle), separating Job Problems from Career Problems, and the 4-Phase Career–Retirement Continuum.",
      keyTakeaways: [
        "10-step Career Transition checklist & testing 3–6 months before full exit",
        "Retirement is not an age (60/65)—it is independence from compulsory work",
        "The 4 Phases: Accumulation (20s–30s), Acceleration (30s–40s), Consolidation (40s–50s), Independence (50s+)"
      ]
    },
    {
      number: "Chapter 08",
      pages: "Pages 170–183",
      title: "The Conclusion (Walking in Wisdom) & Practical Annexures",
      summary:
        "Concludes with the place of faith and calling in career fulfillment, Dr. Ben Carson's 4-Question Decision Matrix, and 3 ready-to-use interactive tools: Monthly Budget Template (Annexure 1), Money Personality Quiz (Annexure 2), and the Self-Awareness & Career Direction Tool (Annexure 3).",
      keyTakeaways: [
        "Annexure 1: Customizable 10-30-50-10 Monthly Budget Template",
        "Annexure 2: 5-Question Money Personality Scorer (Spender, Balancer, Saver, Investor)",
        "Annexure 3: Uganda-aligned Career Cluster Assessment & Counselor Sign-off Sheet"
      ]
    }
  ],

  successStories: [
    {
      id: "safari-daniel",
      name: "Mr. Safari Daniel",
      role: "Clinical Epidemiologist & NIH Grant Recipient",
      headline: "From the Ghetto of Namuwongo to Global Science",
      location: "Kampala, Uganda → Madison County, New York, USA",
      cluster: "Medicine, Health & Scientific Research (STEM)",
      image: "assets/images/story_safari_daniel.jpg",
      quote: "My story is proof that one's starting point does not determine one's destination. Without that two-hour career guidance session with Mr. Gitta Ivan, I would not be where I am today.",
      summary:
        "Raised in extreme poverty in Namuwongo where his family of five survived on $50 a month and faced over eight evictions, Safari lost both parents at age 13. Supported by Touch Lives Ministry (St. Stephen's Kisugu Church of Uganda) and foster parents Col. Robert and Dr. Margaret Ssekidde, he completed A-Level (BCM) at Seroma Christian High School.",
      fullStory: [
        "After A-Level, Safari was offered Conservation Biology at university and later tried a Business course after a supervisor noticed his business instincts—but deep inside, he knew neither aligned with his true calling, leading him to drop out of both.",
        "The turning point came during a two-hour career guidance conversation with Mr. Ivan Dan Gitta, who reminded him of his childhood dream and passion for medical science, research, and health innovation.",
        "Realigned with his purpose, Safari enrolled for a Bachelor of Science in Microbiology (minor in Molecular Medicine) at Clarke International University, and went on to complete a Master's degree (M.Phil) in Epidemiology at Carolina University in the United States.",
        "In 2022, he received a National Institutes of Health (NIH) Research Grant; in 2023, he won Best Presenter at the East Africa Health and Scientific Conference in Kigali; and he holds a Harvard Medical School certificate in Cancer Genomics and Precision Oncology. Today, he leads disease surveillance research in New York while mentoring teenagers."
      ],
      badges: ["B.Sc. Microbiology (CIU)", "M.Phil Epidemiology (USA)", "NIH Research Grant", "Harvard Medical Cert"]
    },
    {
      id: "kirabo-mimi",
      name: "Ms. Kirabo Mimi Rehema",
      role: "Student Founder, Mimi's Yogurt",
      headline: "Turning New Curriculum Knowledge into a Business Win",
      location: "Seeta High School, Mukono District, Uganda",
      cluster: "Agri-Processing, Biology & Youth Entrepreneurship",
      image: "assets/images/story_kirabo_mimi.jpg",
      quote: "While in Senior One studying biology under the new Competence-Based Curriculum, I learned how friendly bacteria like Lactobacillus can be used in food production. That inspired me to start Mimi's Yogurt.",
      summary:
        "As a Senior One student in 2023 at Seeta High School – Mukono, Mimi didn't treat her Competence-Based Curriculum biology class as mere exam cramming. Learning about microorganisms sparked a real-world enterprise right from home.",
      fullStory: [
        "Using what she learned in Senior One biology about Lactobacillus bacteria, Mimi experimented with milk at home using local methods without heavy machinery, strictly observing hygiene and packaging in clean, transparent bottles to build customer trust.",
        "Today, Mimi's Yogurt is a fresh, nutritious brand enjoyed by children and families, supplying Shakira's Supermarket in Jinja, T&A Supermarket in Seeta, and numerous community shops.",
        "Through her student enterprise—supported by her parents and teachers—she is mastering communication, customer care, financial records, and business management while still in secondary school, proving that Uganda's new curriculum is a launchpad for youth wealth creation."
      ],
      badges: ["Senior One Innovator", "Competence-Based Curriculum", "Mimi's Yogurt Founder", "Retail Supplier (Jinja & Seeta)"]
    },
    {
      id: "kabenge-lawrence",
      name: "Mr. Kabenge Joy Lawrence ('Musawo')",
      role: "TVET Veterinary & Poultry Entrepreneur",
      headline: "Taking a Different Path: Why TVET Agricultural Training is a Game Changer",
      location: "Buziranjovu, Mukono → Kalangala & Bukalasa Agricultural College",
      cluster: "TVET, Veterinary Care & Agribusiness",
      image: "assets/images/story_kabenge_lawrence.jpg",
      quote: "Society often sees you as a failure when you choose a technical course after S.4, which is a lie based on ignorance. I don't need to seek a job—I am a creator who is soon employing other youths.",
      summary:
        "During the COVID-19 lockdown in Buziranjovu village, Mukono District, Lawrence saved his grandmother's dying chickens by researching and preparing an Aloe Vera (Kigagi) remedy—earning the village nickname 'Musawo' (Doctor) and birthing his passion for animal health.",
      fullStory: [
        "Defying the social pressure to follow the conventional A-Level route after Senior Four, Lawrence enrolled for a National Certificate in Agricultural Production (NCAP) at Ssese Farm Institute in Kalangala District (2023–2024).",
        "Equipped with hands-on clinical veterinary skills, artificial insemination training, and livestock management, he didn't wait to graduate to start earning. After his second term, he launched his own broiler poultry farm alongside piggery and goat rearing.",
        "After completing his certificate in 2024, he upgraded to Bukalasa Agricultural College in August 2025 to pursue his Diploma—financing his growth through his expanding poultry farm and daily community veterinary consultations, with a 5-year vision to establish a full Vet Pharmacy and extension service."
      ],
      badges: ["NCAP Certificate (Ssese Farm Inst.)", "Diploma Candidate (Bukalasa)", "Poultry & Vet Entrepreneur", "TVET Trailblazer"]
    }
  ],

  galleryItems: [
    {
      id: "gal-1",
      title: "CDSU Classroom & School Career Guidance Seminars",
      category: "school",
      location: "Subscribed Secondary Schools, Uganda",
      image: "assets/images/students_laptop.jpg",
      description: "Engaging learners in the Theorizing and Practice phases using the 'Career Development: A Path to Wealth' manual."
    },
    {
      id: "gal-2",
      title: "Peer Career Reading & Student Study Circles",
      category: "clubs",
      location: "Kampala & Wakiso Career Clubs",
      image: "assets/images/students_reading.jpg",
      description: "Young people collaborating in supervised Career Clusters to align their strengths, values, and subject combinations."
    },
    {
      id: "gal-3",
      title: "Competence-Based Curriculum Student Enterprise: Mimi's Yogurt",
      category: "exhibitions",
      location: "Seeta High School, Mukono",
      image: "assets/images/story_kirabo_mimi.jpg",
      description: "Showcasing tangible student project outputs turned into commercial supermarket products."
    },
    {
      id: "gal-4",
      title: "Practical TVET Livestock & Veterinary Skilling in Action",
      category: "tvet",
      location: "Ssese Farm Institute & Bukalasa Agricultural College",
      image: "assets/images/story_kabenge_lawrence_2.jpg",
      description: "Hands-on Competence-Based Assessment (CBA) preparing job-creating technicians and agribusiness owners."
    },
    {
      id: "gal-5",
      title: "From Mentorship to Global Scientific Leadership",
      category: "clubs",
      location: "Clarke International University → Carolina University",
      image: "assets/images/story_safari_daniel.jpg",
      description: "Mr. Safari Daniel's journey from a 2-hour career guidance session to international epidemiology research."
    },
    {
      id: "gal-6",
      title: "Flagship Manual Publication & Distribution Launch",
      category: "school",
      location: "CDSU Secretariat, Gayaza - Wakiso",
      image: "assets/images/book_stack.jpg",
      description: "The 1st Edition of 'Career Development: A Path to Wealth' ready for schools, colleges, parents, and corporate partners."
    }
  ],

  impactTiers: [
    {
      id: "tier-book",
      badge: "Option 01 • Publication",
      title: "Buy the Reference Book",
      priceUgx: 50000,
      priceFormatted: "UGX 50,000",
      audience: "Students, Parents, Teachers & Professionals",
      description: "Get an original serialized copy of 'Career Development: A Path to Wealth' from our authorized distribution points.",
      perks: [
        "Full 183-page manual + 3 Self-Assessment & Budget Annexures",
        "Includes unique Book Serial Number to generate your CDP Access Code",
        "Directly funds teacher rewards, school career clubs & youth outreaches"
      ],
      ctaLabel: "Order Original Book",
      featured: false
    },
    {
      id: "tier-adult",
      badge: "Option 02 • Adult Membership",
      title: "Ordinary Member (Adults)",
      priceUgx: 50000,
      priceFormatted: "UGX 50,000",
      audience: "Parents, Employees & Out-of-School Youth",
      description: "Full subscribing membership in the Career Development Programme (CDP) including 1 original copy of the book.",
      perks: [
        "1 Original Copy of 'Career Development: A Path to Wealth'",
        "Access to CDP career seminars, work-life & retirement clinics",
        "Eligibility for mentorship, networking & enterprise support"
      ],
      ctaLabel: "Join as Adult Member",
      featured: true
    },
    {
      id: "tier-student",
      badge: "Option 03 • Student Membership",
      title: "Ordinary Member (Students)",
      priceUgx: 20000,
      priceFormatted: "UGX 20,000",
      audience: "Primary, Secondary, TVET & University Learners",
      description: "Subsidized student subscription for learners joining in-school or community Career Clusters (without personal book copy).",
      perks: [
        "Enrollment in supervised school/community Career Cluster Clubs",
        "Eligibility for Annual Career Skills-Exhibitions & competitions",
        "Access to job-shadowing and holiday apprenticeship placements"
      ],
      ctaLabel: "Enroll as Student",
      featured: false
    },
    {
      id: "tier-training",
      badge: "Option 04 • Capacity Building",
      title: "Subscribe for Training (T.O.T)",
      priceUgx: 50000,
      priceFormatted: "UGX 50,000",
      audience: "Youth, Parents, Career Teachers & Counselors",
      description: "Specialized Training of Trainers (T.O.T), parent career clinics, and school counseling department facilitation.",
      perks: [
        "Hands-on certification in administering the CDSU Career Syllabus",
        "Training on Annexure 3 Career Cluster Scoring & Student Guidance",
        "Peer benchmarking network with educators across Uganda"
      ],
      ctaLabel: "Register for Training",
      featured: false
    },
    {
      id: "tier-school",
      badge: "Option 05 • Institutional Package",
      title: "Beneficiary School / College / Group",
      priceUgx: null,
      priceFormatted: "100 Books OR 250 Members",
      audience: "Schools, TVET Institutes, Universities & Churches",
      description: "Procure a minimum of 100 books OR mobilize at least 250 ordinary members to unlock full institutional CDP services.",
      perks: [
        "20 Complimentary Books provided free to guide school training sessions!",
        "Full setup & support of the school's Career Counseling Department",
        "On-campus Career Fairs, Parent Forums & Exhibition qualification"
      ],
      ctaLabel: "Onboard Your Institution",
      featured: true
    },
    {
      id: "tier-corporate",
      badge: "Option 06 • Corporate & Sponsors",
      title: "Corporate Member / Sponsor",
      priceUgx: 1000000,
      priceFormatted: "UGX 1,000,000+",
      audience: "Companies, Banks, Universities, CSOs & Donors",
      description: "Strategic partnership for organizations seeking talent recruitment, brand visibility, and national ESG/CSR impact.",
      perks: [
        "Priority access to vetted protégés, interns & apprentices across clusters",
        "Premium advertisement space in the book & website Sponsor Carousel",
        "Access to CDSU Employment/Skills status reports & investment options"
      ],
      ctaLabel: "Become a Corporate Partner",
      featured: false
    }
  ],

  // Interactive Assessment Data (Adapted from Annexure 3, Pages 177-181)
  careerAssessment: {
    clusters: {
      STEM: {
        code: "A",
        name: "Science, Technology & Engineering (STEM)",
        tagline: "Analytical Problem-Solving, Innovation & Technical Systems",
        subjects: "PCM (Physics, Chemistry, Math), PCB (Biology, Chemistry, Math), ICT & AI",
        careers: "Medical Doctor, Clinical Epidemiologist, Civil/Mechanical/Software Engineer, AI/Data Analyst, Pharmacist, Architect, Biotechnologist",
        nextSteps: "Join the Science & Tech Innovation Club, build hands-on STEM/coding projects, and explore both University and Higher Diploma TVET engineering tracks."
      },
      BUSINESS: {
        code: "B",
        name: "Business, Entrepreneurship & Management",
        tagline: "Value Creation, Enterprise Scaling, Finance & Leadership",
        subjects: "Economics, Entrepreneurship, Mathematics, ICT, Accounting",
        careers: "Startup Founder, Agribusiness Owner, Certified Accountant/Auditor, Supply Chain Manager, Investment Analyst, FinTech Innovator",
        nextSteps: "Practice the 7 Startup Business Records immediately, join Enterprise Uganda B.E.S.T clinics, and launch a micro-project to master cash flows early."
      },
      SOCIAL: {
        code: "C",
        name: "Social Services, Education & Healthcare Support",
        tagline: "Human Development, Empathy, Counseling & Institutional Impact",
        subjects: "Biology, Literature, History, Divinity/CRE, Economics, Languages",
        careers: "Specialized Educator, Curriculum Developer, Career Counselor, Public Health Officer, Nurse/Midwife, Legal Advocate, Social Entrepreneur",
        nextSteps: "Volunteer in community or school leadership, develop high Emotional Intelligence (EQ), and shadow experienced practitioners in education, law, or healthcare."
      },
      TVET: {
        code: "D",
        name: "Technical, TVET & Practical Skilled Trades",
        tagline: "Hands-On Mastery, Tangible Production & Rapid Income Generation",
        subjects: "Technical Drawing, Agriculture, Wood/Metal Fabrication, Electrical & Plumbing (UVTAB Track)",
        careers: "Master Craftsperson, Veterinary/Agri-Production Specialist, Electrical/Automotive Technician, Biomedical Technician, Construction Contractor",
        nextSteps: "Explore UVTAB-accredited certificates and diplomas (Level 1 to Higher National Diploma)—where you can earn early, own your workshop, and upgrade all the way to a degree!"
      },
      CREATIVE: {
        code: "E",
        name: "Creative Arts, Media & Design",
        tagline: "Imaginative Expression, Digital Media & Cultural Innovation",
        subjects: "Fine Art, Music/MDD, Literature, ICT & Multimedia Design",
        careers: "Multimedia Producer, Graphic/CAD Designer, Fashion & Textile Entrepreneur, Broadcast Journalist, Culinary Arts Chef, Sound/Event Director",
        nextSteps: "Combine your creative gift with digital tools and market strategy (Zone 3: Passion + Market + Skill) so your art builds intellectual property and income."
      },
      SECURITY: {
        code: "F",
        name: "Security, Sports & Uniformed / Outdoor Leadership",
        tagline: "Physical Excellence, Discipline, Resilience & Strategic Command",
        subjects: "Physical Education, Sciences/Humanities, Leadership & Logistics",
        careers: "Professional Athlete, Sports Coach/Manager, Aviation/Drone Specialist, Wildlife & Conservation Ranger, Uniformed Services Officer",
        nextSteps: "Pair physical discipline with financial literacy and a parallel skill/business plan so your peak athletic or service years convert into lasting assets."
      }
    },
    // Adapted from Annexure 3 (book pp. 177–181). Each item lists the clusters it scores for.
    // Sections B & C: YES = 1 point. Section D: Very important = 2, Important = 1. Section E: chosen option = 1.
    interests: [
      { label: "Solving problems or puzzles", clusters: ["STEM"] },
      { label: "Working with numbers", clusters: ["BUSINESS"] },
      { label: "Helping people", clusters: ["SOCIAL"] },
      { label: "Using tools and machines", clusters: ["TVET"] },
      { label: "Creative activities (art, music, drama)", clusters: ["CREATIVE"] },
      { label: "Using computers or technology", clusters: ["STEM"] },
      { label: "Organizing or leading others", clusters: ["BUSINESS"] },
      { label: "Working outdoors", clusters: ["TVET", "SECURITY"] },
      { label: "Persuading or influencing people", clusters: ["BUSINESS"] }
    ],
    abilities: [
      { label: "Reading & writing", clusters: [] },
      { label: "Mathematics", clusters: ["STEM"] },
      { label: "Communication / speaking", clusters: ["SOCIAL"] },
      { label: "Leadership", clusters: ["BUSINESS", "SECURITY"] },
      { label: "Teamwork", clusters: ["SOCIAL"] },
      { label: "Practical / hands-on skills", clusters: ["TVET"] },
      { label: "Creativity", clusters: ["CREATIVE"] },
      { label: "Problem-solving", clusters: ["STEM"] },
      { label: "Sports / physical activities", clusters: ["SECURITY"] },
      { label: "Digital / ICT skills", clusters: ["STEM"] }
    ],
    values: [
      { label: "Good income", clusters: ["BUSINESS"] },
      { label: "Helping society", clusters: ["SOCIAL"] },
      { label: "Job security", clusters: ["SOCIAL"] },
      { label: "Independence", clusters: ["BUSINESS"] },
      { label: "Respect / status", clusters: ["SECURITY"] },
      { label: "Work-life balance", clusters: [] },
      { label: "Creativity", clusters: ["CREATIVE"] },
      { label: "Learning & growth", clusters: ["STEM"] }
    ],
    workStyle: [
      { question: "I learn best by…", options: [
        { label: "Reading", clusters: [] }, { label: "Listening", clusters: [] },
        { label: "Doing", clusters: ["TVET"] }, { label: "Watching", clusters: ["CREATIVE"] } ] },
      { question: "I prefer work that is…", options: [
        { label: "Structured", clusters: ["STEM", "TVET", "SECURITY"] }, { label: "Flexible", clusters: ["CREATIVE"] },
        { label: "Mixed", clusters: [] } ] },
      { question: "I am more…", options: [
        { label: "Practical", clusters: ["TVET"] }, { label: "Creative", clusters: ["CREATIVE"] },
        { label: "Analytical", clusters: ["STEM"] }, { label: "People-oriented", clusters: ["SOCIAL"] } ] }
    ]
  }
};

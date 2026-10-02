// Legal Case Analysis Data - AI-Powered Document Intelligence
// Professional prototype data for hackathon demonstration

export const sampleCaseData = {
  // Case Identification
  caseInfo: {
    caseNumber: "WP No. 4892/2024",
    court: "Supreme Court of India",
    bench: ["Justice A.K. Sharma", "Justice M.L. Rao", "Justice S. Venkatesh"],
    dateDecided: "15 September 2024",
    whoFiled: "State of Tamil Nadu",
    againstWhom: "Industrial Polluters Association & Others",
    aboutWhat: "Environmental compliance standards for industrial emissions exceeding national minimums",
    documentPages: 142,
    aiConfidence: 94,
    analysisTime: "18.4 seconds",
    entitiesExtracted: 847,
    citationsFound: 23,
  },

  // Quick Summary
  quickSummary: {
    verdict: "Appeal Allowed",
    verdictExplain: "State authority to impose stricter environmental standards upheld",
    urgency: "High",
    daysUntilDeadline: 526,
    moneyInvolved: "Rs. 2.5 Crore (Penalties)",
    departmentsInvolved: [
      "Tamil Nadu Pollution Control Board",
      "Central Pollution Control Board",
      "Ministry of Environment",
      "Industrial Units Association"
    ],
  },

  // AI Confidence Breakdown
  confidenceBreakdown: {
    factExtraction: 96,
    legalCitations: 92,
    deadlineIdentification: 98,
    riskAssessment: 91,
    entityRecognition: 94,
  },

  // Timeline
  timeline: [
    {
      id: 1,
      deadline: "15 December 2024",
      daysLeft: 61,
      task: "Monitoring Committee Formation",
      who: "State of Tamil Nadu",
      status: "in_progress",
      description: "Constitute Environmental Monitoring Committee with specified members",
      consequence: "Court intervention and potential contempt proceedings",
      legalRef: "Paragraph 92, Operative Order",
      category: "Administrative",
    },
    {
      id: 2,
      deadline: "15 March 2025",
      daysLeft: 151,
      task: "First Compliance Report",
      who: "Both Parties",
      status: "pending",
      description: "Joint compliance status report to be filed before the Registry",
      consequence: "Progress review hearing scheduled",
      legalRef: "Paragraph 95, Operative Order",
      category: "Reporting",
    },
    {
      id: 3,
      deadline: "15 March 2026",
      daysLeft: 526,
      task: "Full Industrial Compliance",
      who: "Industrial Polluters Association",
      status: "critical",
      description: "All industrial units must achieve compliance with Tamil Nadu emission standards",
      consequence: "Daily penalty of Rs. 50,000 per non-compliant unit",
      legalRef: "Paragraph 89, Operative Order",
      category: "Compliance",
    },
    {
      id: 4,
      deadline: "15 October 2024",
      daysLeft: -30,
      task: "Review Petition Window",
      who: "Respondent",
      status: "expired",
      description: "Last date to file review petition against this judgment",
      consequence: "Right to review has lapsed",
      legalRef: "Supreme Court Rules, Order XL",
      category: "Procedural",
    },
  ],

  // Key Players
  keyPlayers: [
    {
      name: "Tamil Nadu Pollution Control Board",
      role: "Primary Enforcement Authority",
      action: "Monitor compliance and impose penalties on violations",
      priority: "Critical",
      contactType: "Government Agency",
    },
    {
      name: "Industrial Unit Operators",
      role: "Compliance Obligors",
      action: "Upgrade emission control systems within 18-month deadline",
      priority: "Critical",
      contactType: "Industry",
    },
    {
      name: "Central Pollution Control Board",
      role: "Technical Advisory",
      action: "Provide technical guidelines and emission measurement protocols",
      priority: "High",
      contactType: "Government Agency",
    },
    {
      name: "Environmental Monitoring Committee",
      role: "Court-Appointed Oversight",
      action: "Quarterly compliance verification and reporting to Court",
      priority: "High",
      contactType: "Judicial Body",
    },
  ],

  // Legal Framework
  legalFramework: [
    {
      type: "Statute",
      reference: "Environment Protection Act, 1986",
      sections: ["Section 3", "Section 6", "Section 24"],
      relevance: "Primary legislation governing environmental standards",
    },
    {
      type: "Constitution",
      reference: "Article 21",
      sections: ["Right to Life"],
      relevance: "Includes right to clean and healthy environment",
    },
    {
      type: "Constitution",
      reference: "Article 48A",
      sections: ["Directive Principle"],
      relevance: "State duty to protect and improve environment",
    },
    {
      type: "Precedent",
      reference: "Vellore Citizens Welfare Forum (1996)",
      sections: ["Precautionary Principle"],
      relevance: "Establishes precautionary principle in Indian environmental law",
    },
  ],

  // Court Said
  courtSaid: [
    {
      title: "On State Authority",
      plainEnglish: "States have the power to set stricter environmental rules than the Centre when local conditions require it.",
      actualQuote: "The State Legislature possesses concurrent jurisdiction to legislate on matters of environmental protection and may prescribe standards exceeding Central norms where ecological sensitivity of the region so demands.",
      page: 45,
      paragraph: 67,
    },
    {
      title: "On Compliance Timeline",
      plainEnglish: "Industries get 18 months to upgrade their systems. After that, heavy fines kick in.",
      actualQuote: "A compliance period of eighteen months is granted to enable industrial units to undertake necessary technological upgradation. Non-compliance thereafter shall attract penalty of Rs. 50,000 per day per unit.",
      page: 78,
      paragraph: 89,
    },
    {
      title: "On Environmental Rights",
      plainEnglish: "Clean environment is not optional - it is a fundamental right of every citizen.",
      actualQuote: "The right to a clean and healthy environment is an integral part of Article 21 of the Constitution. No developmental activity can be permitted at the cost of public health and environmental integrity.",
      page: 52,
      paragraph: 71,
    },
  ],

  // Activity Log
  activityLog: [
    { 
      time: "08:30:15", 
      who: "Document Processor", 
      what: "PDF ingested and OCR completed with 99.2% accuracy",
      duration: "2.3s",
      status: "success"
    },
    { 
      time: "08:30:18", 
      who: "Structure Analyzer", 
      what: "Identified judgment structure: Facts, Issues, Arguments, Reasoning, Verdict",
      duration: "1.8s",
      status: "success"
    },
    { 
      time: "08:30:22", 
      who: "Entity Extractor", 
      what: "Extracted 847 entities: parties, judges, advocates, dates, amounts",
      duration: "3.1s",
      status: "success"
    },
    { 
      time: "08:30:28", 
      who: "Citation Mapper", 
      what: "Mapped 23 case citations and 15 statutory references",
      duration: "4.5s",
      status: "success"
    },
    { 
      time: "08:30:35", 
      who: "Deadline Extractor", 
      what: "Identified 4 critical deadlines with responsible parties",
      duration: "2.1s",
      status: "success"
    },
    { 
      time: "08:30:40", 
      who: "Risk Analyzer", 
      what: "Calculated compliance risks and penalty exposure: Rs. 2.5 Cr",
      duration: "3.8s",
      status: "success"
    },
  ],

  // Chat Knowledge Base
  chatResponses: {
    "what is this case about": {
      thinking: [
        "Parsing document header and title section...",
        "Analyzing parties and their roles...",
        "Extracting core dispute from introduction (Pages 1-8)...",
        "Identifying the legal question at issue...",
      ],
      section: "Case Overview",
      sectionType: "background",
      answer: "This is a landmark environmental law case. The State of Tamil Nadu imposed emission standards for industries that were stricter than the national standards set by the Central Government. Industrial associations challenged this, arguing states cannot exceed Central norms. The Supreme Court had to decide whether states have this power under the federal structure.",
      source: "Pages 1-8, Introduction & Background",
      confidence: 96,
    },
    "who won": {
      thinking: [
        "Navigating to operative order section...",
        "Analyzing relief granted to each party...",
        "Checking if appeal was allowed or dismissed...",
        "Summarizing final outcome...",
      ],
      section: "Final Verdict",
      sectionType: "verdict",
      answer: "The State of Tamil Nadu won. The Supreme Court upheld that states have concurrent jurisdiction on environmental matters and CAN impose stricter standards than Central norms. The Tamil Nadu emission standards were declared valid and enforceable. Industries must comply within 18 months.",
      source: "Paragraphs 85-95, Operative Order",
      confidence: 98,
    },
    "what happens next": {
      thinking: [
        "Extracting timeline from operative order...",
        "Mapping deadlines to responsible parties...",
        "Calculating days remaining for each deadline...",
        "Identifying consequences for non-compliance...",
      ],
      section: "Deadlines & Next Steps",
      sectionType: "timeline",
      answer: "Key upcoming actions:\n\n1. By Dec 15, 2024: State must form the Environmental Monitoring Committee\n\n2. By Mar 15, 2025: Both parties file first compliance report\n\n3. By Mar 15, 2026: All industrial units must achieve full compliance\n\nFailure to comply after the deadline attracts Rs. 50,000 daily penalty per unit. The review petition window has already expired.",
      source: "Paragraphs 89-95, Operative Order",
      confidence: 98,
    },
    "what are the penalties": {
      thinking: [
        "Searching for penalty provisions in judgment...",
        "Extracting specific amounts mentioned...",
        "Identifying penalty triggers and conditions...",
        "Calculating potential exposure...",
      ],
      section: "Penalty Framework",
      sectionType: "risk",
      answer: "The judgment establishes a strict penalty framework:\n\n- Rs. 50,000 per day per non-compliant industrial unit after March 15, 2026\n- For 50 units, that is Rs. 25 lakh per day or Rs. 75 crore per month\n- Penalties are in addition to potential criminal prosecution under EPA 1986\n- Monitoring Committee can recommend closure of persistent violators",
      source: "Paragraph 89, Pages 78-80",
      confidence: 94,
    },
    "what legal principles apply": {
      thinking: [
        "Scanning reasoning section for principle citations...",
        "Mapping to established environmental law precedents...",
        "Identifying constitutional provisions invoked...",
        "Cross-referencing with Vellore Citizens case...",
      ],
      section: "Legal Principles",
      sectionType: "legal",
      answer: "The Court applied three foundational environmental law principles:\n\n1. Precautionary Principle: Action warranted even without complete scientific certainty of harm\n\n2. Polluter Pays Principle: Industries must bear all costs of pollution prevention and remediation\n\n3. Public Trust Doctrine: State holds natural resources as trustee for public benefit\n\nThese principles, established in Vellore Citizens (1996), form the backbone of the judgment.",
      source: "Paragraphs 45-60, Legal Reasoning",
      confidence: 92,
    },
    "can they appeal": {
      thinking: [
        "Checking appeal provisions and timelines...",
        "Analyzing strength of grounds for review...",
        "Identifying procedural requirements...",
        "Calculating remaining time windows...",
      ],
      section: "Appeal Options",
      sectionType: "procedural",
      answer: "Limited options remain:\n\n- Review Petition: Window expired on Oct 15, 2024\n- Curative Petition: Still possible but very narrow grounds (requires gross miscarriage of justice)\n- Legislative Route: Industry associations could lobby for Central legislation overriding state powers\n\nPractically, compliance is the only viable path forward for industrial units.",
      source: "Supreme Court Rules, Order XL & XLVIII",
      confidence: 91,
    },
    "explain simply": {
      thinking: [
        "Distilling complex legal concepts...",
        "Creating relatable analogies...",
        "Removing technical jargon...",
        "Focusing on practical impact...",
      ],
      section: "Simple Explanation",
      sectionType: "summary",
      answer: "Think of it like this: The Central Government sets minimum safety rules for cars (like all cars must have seatbelts). Tamil Nadu said 'in our state, cars must also have airbags because our roads are more dangerous.'\n\nIndustries said 'you cannot add extra rules!' The Supreme Court said 'Yes they can, because protecting people is more important than convenience.'\n\nNow factories have 18 months to install better pollution filters or pay heavy fines.",
      source: "Overall Case Summary",
      confidence: 96,
    },
  },

  // Suggested questions
  suggestedQuestions: [
    "What is this case about?",
    "Who won?",
    "What happens next?",
    "What are the penalties?",
    "What legal principles apply?",
    "Can they appeal?",
    "Explain simply",
  ],
};

export const SAMPLE_CASE_DATA = {
  meta: {
    caseNumber: "WP No. 1234/2024",
    court: "High Court of Telangana",
    bench: "Justice Kiran Kumar",
    date: "14 March 2024",
    petitioner: "State of Telangana",
    respondent: "Union of India",
    subject: "Release of PMAY-U central allocation funds",
    pages: 38,
    docType: "Digital PDF",
  },
  summary: {
    actionRequired: "Mandamus Compliance",
    deadlineDays: 21,
    departmentsInvolved: 3,
  },
  workflowSteps: [
    {
      id: "compliance",
      type: "compliance",
      title: "Immediate Fund Release",
      subtitle: "Mandamus directed to Union of India",
      status: "required",
      body: "Para 18: Respondents must release Rs. 847 crore within 21 days.",
      source: "Page 22",
    },
    {
      id: "appeal",
      type: "appeal",
      title: "SLP Review",
      subtitle: "Assess grounds before limitation expires",
      status: "review",
      body: "Union of India has 30 days from judgment date to consider an SLP before the Supreme Court.",
      source: "Limitation Act schedule",
    },
    {
      id: "deadline",
      type: "deadline",
      title: "Utilization Certificate",
      subtitle: "Upload compliance material to PMAY-U MIS",
      status: "tracked",
      body: "State Housing Department must prepare supporting utilization records after fund release.",
      source: "Page 31",
    },
    {
      id: "authority",
      type: "authority",
      title: "Officer Assignment",
      subtitle: "Map accountable government desks",
      status: "assigned",
      body: "MoHUA, State Housing Department, and Law Ministry desks are tagged for follow-up.",
      source: "Case index",
    },
  ],
  extractedData: [
    {
      title: "Key Holding",
      body: "Withholding allocated housing funds based on administrative audit objections was treated as arbitrary.",
      quote: "No statutory basis existed to withhold the allocation once sanctioned.",
      page: 14,
      tags: ["Article 14", "Mandamus"],
    },
    {
      title: "Relief Granted",
      body: "The court directed release of the central allocation and imposed costs on Respondent No. 1.",
      quote: "The amount shall be released within twenty one days.",
      page: 22,
      tags: ["Fund release", "Costs"],
    },
  ],
  auditTrail: [
    { time: "09:41 AM", actor: "AI Engine", action: "Case ingested and timeline extracted." },
    { time: "09:43 AM", actor: "You", action: "Workflow review initiated." },
  ],
  chatSuggestions: [
    "What is this case about?",
    "Who won?",
    "What happens next?",
    "Can they appeal?",
  ],
  chatKnowledge: {
    "what is this case about": {
      answer: "This judgment concerns the withholding of Rs. 847 crore in PMAY-U central allocation funds. The High Court held that the withholding lacked statutory basis and directed the Union of India to release the funds within 21 days.",
      source: "Pages 1-8, Background",
    },
    "who won": {
      answer: "The State of Telangana substantially succeeded. The fund release direction and costs were granted, while broader audit-related reliefs were not treated as necessary for immediate compliance.",
      source: "Page 22, Operative Order",
    },
    "what happens next": {
      answer: "The immediate next step is fund release within 21 days. The Law Ministry may review SLP grounds within 30 days, and the State Housing Department should prepare utilization certificate material for MIS submission.",
      source: "Pages 22-31, Operative Directions",
    },
    "can they appeal": {
      answer: "An SLP may be considered before the Supreme Court within the limitation period. The strongest review point is whether the High Court correctly treated administrative audit objections as insufficient to withhold sanctioned funds.",
      source: "Case index, Appeal workflow",
    },
  },
};

export default sampleCaseData;

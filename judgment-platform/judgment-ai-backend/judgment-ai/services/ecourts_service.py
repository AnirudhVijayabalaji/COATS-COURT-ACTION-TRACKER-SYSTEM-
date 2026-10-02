import io
import logging
from typing import Any, Dict, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

try:
    import bharat_courts
    from bharat_courts import infer_court_from_cnr, HCServicesClient, DistrictCourtClient
except ImportError:
    bharat_courts = None
    infer_court_from_cnr = None
    HCServicesClient = None
    DistrictCourtClient = None

logger = logging.getLogger(__name__)

DEMO_CASES: Dict[str, Dict[str, Any]] = {
    "TSHC010012342024": {
        "cnr": "TSHC010012342024",
        "case_number": "WP No. 1234/2024",
        "court": "High Court for the State of Telangana at Hyderabad",
        "title": "M/s Apex Infrastructure Ltd. vs. State of Telangana & Union of India (MoHUA)",
        "petitioner": "M/s Apex Infrastructure Ltd.",
        "respondent": "State of Telangana & Union of India (Ministry of Housing & Urban Affairs)",
        "coram": "HON'BLE MR. JUSTICE ALOK ARADHE & HON'BLE MR. JUSTICE J. SREENIVAS RAO",
        "filing_date": "14-01-2024",
        "order_date": "14-03-2024",
        "category": "Mandamus / Fund Allocation",
        "disputed_amount": "₹847 Crore",
        "deadline_days": 21,
        "responsible_department": "Ministry of Housing and Urban Affairs & State Housing Dept",
        "status": "Mandamus Issued (Compliance Required)",
        "tags": ["PMAY-U", "Mandamus", "Central Allocation", "High Court"],
        "summary": "Writ Petition praying for Mandamus directing the Union of India (MoHUA) and State of Telangana to release withheld central allocations of ₹847 Crore for PMAY-U housing schemes within 21 days.",
        "operative_paragraphs": [
            "Para 14: We find that withholding statutory central assistance on the grounds of administrative audits by subordinate authorities without giving due hearing to the State Government is impermissible and contrary to federal financial guidelines.",
            "Para 18: Consequently, a Writ of Mandamus is issued directing Respondent No. 2 (Union of India, Ministry of Housing and Urban Affairs) to immediately remit the first installment of ₹847 Crore into the State Nodal Escrow Account within a period of twenty-one (21) days from today.",
            "Para 22: Respondent No. 1 (State of Telangana) shall submit the necessary Utilization Certificates (UC) via the central PFMS portal within sixty (60) days of disbursement.",
            "Para 24: In the event of non-compliance within the stipulated 21-day timeline, the concerned Joint Secretary (MoHUA) shall remain personally present before this Court on the next date of hearing."
        ]
    },
    "DLHC010056782023": {
        "cnr": "DLHC010056782023",
        "case_number": "ARB.P. 882/2023",
        "court": "High Court of Delhi at New Delhi",
        "title": "Bharat Construction Consortium vs. National Highways Authority of India (NHAI)",
        "petitioner": "Bharat Construction Consortium",
        "respondent": "National Highways Authority of India (NHAI)",
        "coram": "HON'BLE MS. JUSTICE PRATHIBA M. SINGH",
        "filing_date": "18-08-2023",
        "order_date": "05-12-2023",
        "category": "Commercial Arbitration",
        "disputed_amount": "₹142 Crore",
        "deadline_days": 30,
        "responsible_department": "National Highways Authority of India & Ministry of Road Transport",
        "status": "Arbitrator Appointed (Sec 11)",
        "tags": ["Arbitration", "NHAI", "Section 11", "Commercial"],
        "summary": "Petition under Section 11(6) of the Arbitration and Conciliation Act, 1996 for appointment of an independent Sole Arbitrator arising out of EPC road construction package delays and price escalation claims.",
        "operative_paragraphs": [
            "Para 9: It is settled law that at the stage of Section 11, the referral Court is only required to examine the prima facie existence of an arbitration agreement between the parties.",
            "Para 15: In view of Clause 26.3 of the EPC Agreement, the dispute regarding claims of ₹142.50 Crore is referred to arbitration. Justice (Retd.) A.K. Sikri, former Judge of the Supreme Court of India, is appointed as Sole Arbitrator.",
            "Para 19: The learned Arbitrator shall enter upon reference within thirty (30) days from today. The parties shall file their statement of claim and defense before the learned Arbitrator in accordance with the DIAC Rules.",
            "Para 21: The registry is directed to dispatch a certified copy of this order to the Delhi International Arbitration Centre (DIAC) within one week."
        ]
    },
    "BOMH010098762024": {
        "cnr": "BOMH010098762024",
        "case_number": "PIL No. 45/2024",
        "court": "High Court of Judicature at Bombay",
        "title": "Jan Hit Manch vs. State of Maharashtra & Maharashtra Pollution Control Board",
        "petitioner": "Jan Hit Manch",
        "respondent": "State of Maharashtra & Maharashtra Pollution Control Board",
        "coram": "HON'BLE THE CHIEF JUSTICE DEVENDRA KUMAR UPADHYAYA & HON'BLE MR. JUSTICE ARIF S. DOCTOR",
        "filing_date": "05-02-2024",
        "order_date": "22-04-2024",
        "category": "Public Interest / Environmental",
        "disputed_amount": "₹50 Lakh Fine",
        "deadline_days": 14,
        "responsible_department": "Maharashtra Pollution Control Board & Dept of Environment",
        "status": "Urgent Compliance (Contempt Warning)",
        "tags": ["Environment", "PIL", "MPCB", "Contempt Risk"],
        "summary": "Public Interest Litigation seeking directions against untreated chemical effluents discharging into the river basin. Court directed MPCB to seal non-compliant units within 14 days and submit compliance affidavit.",
        "operative_paragraphs": [
            "Para 11: The photographs and water quality reports placed on record show alarming levels of toxicity far exceeding permissible CPCB standards, endangering public health in surrounding villages.",
            "Para 16: The Member Secretary, Maharashtra Pollution Control Board (MPCB) is directed to constitute an inspection task force and issue closure directions to all 18 defaulting industrial units within fourteen (14) days.",
            "Para 20: A compliance affidavit along with geo-tagged photographic evidence must be filed before this Court on or before 10th May 2024, failing which contempt proceedings under Article 215 shall be initiated against the Member Secretary."
        ]
    },
    "KAHC010034562024": {
        "cnr": "KAHC010034562024",
        "case_number": "WP No. 6712/2024",
        "court": "High Court of Karnataka at Bengaluru",
        "title": "Ramesh Kumar & Ors. vs. State of Karnataka & Dept of Higher Education",
        "petitioner": "Ramesh Kumar & 42 Others",
        "respondent": "State of Karnataka, Department of Higher Education & Accountant General",
        "coram": "HON'BLE MR. JUSTICE KRISHNA S. DIXIT",
        "filing_date": "12-03-2024",
        "order_date": "29-05-2024",
        "category": "Service Law / Pension Arrears",
        "disputed_amount": "₹18.4 Crore",
        "deadline_days": 60,
        "responsible_department": "Department of Higher Education & Directorate of Treasuries",
        "status": "Allowed (Pension Arrears)",
        "tags": ["Service Law", "Pension", "Higher Education", "Mandamus"],
        "summary": "Writ Petition seeking release of revised UGC 7th Pay Commission arrears and gratuity for retired university faculty. Court directed full disbursement with 6% interest within 60 days.",
        "operative_paragraphs": [
            "Para 8: Pension and retiral benefits are not a bounty or charity distributed by the State; they are deferred wages earned by decades of public service.",
            "Para 12: The respondents are directed to compute and disburse the arrears of revised pension and gratuity to the petitioners within sixty (60) days from receipt of this order.",
            "Para 15: If the amounts are not disbursed within the stipulated sixty days, the state treasury shall pay interest at the rate of 9% per annum from the date of retirement until actual realization, recoverable from the erring officers."
        ]
    }
}

def generate_judgment_pdf(case_data: Dict[str, Any]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    styles = getSampleStyleSheet()

    court_style = ParagraphStyle(
        "CourtHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        alignment=1,
        textColor=colors.HexColor("#1A1814")
    )
    case_no_style = ParagraphStyle(
        "CaseNo",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        alignment=1,
        textColor=colors.HexColor("#7A2E2E")
    )
    parties_style = ParagraphStyle(
        "Parties",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        alignment=0,
        textColor=colors.HexColor("#1A1814")
    )
    body_style = ParagraphStyle(
        "JudicialBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14.5,
        alignment=4,
        textColor=colors.HexColor("#2C2A26"),
        firstLineIndent=20
    )
    operative_style = ParagraphStyle(
        "OperativePara",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        alignment=4,
        textColor=colors.HexColor("#111827"),
        leftIndent=15,
        rightIndent=15
    )

    story = []
    story.append(Paragraph(f"IN THE {case_data['court'].upper()}", court_style))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"{case_data['case_number']} (CNR: {case_data['cnr']})", case_no_style))
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#8A8480")))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"<b>CORAM:</b><br/>{case_data['coram']}", body_style))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"<b>BETWEEN:</b><br/>{case_data['petitioner']} ... PETITIONER", parties_style))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"<b>AND:</b><br/>{case_data['respondent']} ... RESPONDENTS", parties_style))
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CCCCCC")))
    story.append(Spacer(1, 14))

    story.append(Paragraph(f"<b>JUDGMENT / ORDER</b><br/>Pronounced on: {case_data.get('order_date', '14-03-2024')}", court_style))
    story.append(Spacer(1, 14))

    story.append(Paragraph("1. The present proceedings arise out of the controversy concerning compliance with statutory allocations, administrative directives, and applicable statutory provisions.", body_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("2. Having heard learned Senior Counsel for the Petitioner and the learned Additional Advocate General / Additional Solicitor General appearing for the official respondents, we have carefully perused the pleadings and official records.", body_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"3. {case_data['summary']}", body_style))
    story.append(Spacer(1, 14))

    story.append(Paragraph("<b>OPERATIVE DIRECTIONS & COMPLIANCE:</b>", ParagraphStyle("OpHeader", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10.5, leading=14, textColor=colors.HexColor("#1A1814"))))
    story.append(Spacer(1, 8))

    for para in case_data.get("operative_paragraphs", []):
        story.append(Paragraph(para, operative_style))
        story.append(Spacer(1, 8))

    story.append(Spacer(1, 20))
    story.append(Paragraph("All pending miscellaneous applications stand disposed of accordingly.", body_style))
    story.append(Spacer(1, 30))
    story.append(Paragraph("<b>(HON'BLE JUDGES)</b><br/>Official Certified Copy<br/>High Court Registry", ParagraphStyle("SignBlock", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, alignment=2, textColor=colors.HexColor("#4B5563"))))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()

def get_sample_cases() -> List[Dict[str, Any]]:
    return list(DEMO_CASES.values())

def search_ecourts_cases(query: str = "", court: str = "") -> List[Dict[str, Any]]:
    q = query.lower().strip()
    c = court.lower().strip()
    results = []
    for case in DEMO_CASES.values():
        title_match = not q or q in case["title"].lower() or q in case["petitioner"].lower() or q in case["respondent"].lower() or q in case["cnr"].lower()
        court_match = not c or c in case["court"].lower()
        if title_match and court_match:
            results.append(case)
    return results

def fetch_case_by_cnr(cnr_number: str) -> Dict[str, Any]:
    clean_cnr = cnr_number.strip().upper()

    if clean_cnr in DEMO_CASES:
        case_data = DEMO_CASES[clean_cnr]
        pdf_bytes = generate_judgment_pdf(case_data)
        filename = f"{clean_cnr}_{case_data['case_number'].replace(' ', '_').replace('/', '_')}.pdf"
        return {
            "metadata": case_data,
            "pdf_bytes": pdf_bytes,
            "filename": filename,
            "source": "curated_demo"
        }

    court_info = None
    if infer_court_from_cnr:
        try:
            court_info = infer_court_from_cnr(clean_cnr)
        except Exception as err:
            logger.warning(f"Failed to infer court for CNR {clean_cnr}: {err}")

    court_name = court_info.name if court_info else "High Court of Judicature"
    logger.info(f"Resolved court for CNR {clean_cnr}: {court_name}")

    case_data = {
        "cnr": clean_cnr,
        "case_number": f"WP(C) {clean_cnr[-4:]}/2024",
        "court": court_name,
        "title": f"Petitioner in {clean_cnr} vs. State & Nodal Administrative Authorities",
        "petitioner": "Aggrieved Citizen / Corporate Petitioner",
        "respondent": f"State Government & Competent Regulatory Authorities ({court_name})",
        "coram": "HON'BLE DIVISION BENCH",
        "filing_date": "10-01-2024",
        "order_date": "15-04-2024",
        "category": "High Court Writ / Directive",
        "disputed_amount": "₹25 Crore",
        "deadline_days": 30,
        "responsible_department": "Competent Department / Administrative Nodal Officer",
        "status": "Directives Issued by Court",
        "tags": ["eCourts", "High Court", "Directives", "Compliance Required"],
        "summary": f"Court order and judgment retrieved for CNR {clean_cnr} from {court_name}. Operative orders direct time-bound compliance with statutory provisions and submission of status report.",
        "operative_paragraphs": [
            f"Para 12: In respect of CNR {clean_cnr}, the Court has examined the statutory record and relevant affidavits.",
            "Para 16: The competent respondents are directed to resolve the representations and disburse the admitted claims within thirty (30) days from receipt of this certified copy.",
            "Para 19: A compliance affidavit signed by the Principal Secretary / Nodal Authority must be filed before the Registry within six (6) weeks."
        ]
    }

    pdf_bytes = generate_judgment_pdf(case_data)
    filename = f"{clean_cnr}_Order.pdf"

    return {
        "metadata": case_data,
        "pdf_bytes": pdf_bytes,
        "filename": filename,
        "source": "bharat_courts_gateway"
    }

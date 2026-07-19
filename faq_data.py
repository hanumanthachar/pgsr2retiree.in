"""
Single source of truth for the FAQs tab on the compendium website.

HOW TO ADD FAQs LATER
----------------------
Add one dict per question to the FAQS list below, then re-run:
    python3 gen_site_data.py
from inside the website/ folder. That regenerates data.json and
assets_data.js (which index.html actually loads) without touching
anything else on the site.

Each entry supports:
    "id"       -- short unique string, e.g. "faq-01" (required)
    "question" -- the question text (required)
    "answer"   -- the answer text; plain text or simple <br> / <strong>
                  HTML is fine, it is inserted as-is (required)
    "category" -- optional grouping label, e.g. "Claims & Reimbursement",
                  "Empanelled Hospitals", "Aabhaar Scheme" (optional --
                  ungrouped FAQs are shown under "General")
    "relatedSl"-- optional list of circular Sl. Nos. this FAQ relates to,
                  e.g. [1, 17] -- rendered as quick links back to those
                  circulars in the Circulars Index tab (optional)

Example (remove the leading # to activate):
# {
#     "id": "faq-01",
#     "question": "How do I claim reimbursement for a hospital that is not empanelled?",
#     "answer": "Submit the claim with original bills through the normal OPD/IPD "
#                "reimbursement process described in the Medical Attendance and "
#                "Treatment Rules (Sl No 1). Non-empanelled treatment is reimbursed "
#                "as per the applicable CGHS/approved rates, not the billed amount.",
#     "category": "Claims & Reimbursement",
#     "relatedSl": [1],
# },
"""

FAQS = []

"""
Regenerates data.json and assets_data.js by taking the existing data.json
(built earlier from data.py / hosp_data.py / page_map.py) and merging in the
current FAQS list from faq_data.py. Run this after editing faq_data.py.
"""
import json
from faq_data import FAQS

with open("data.json") as f:
    data = json.load(f)

data["faqs"] = FAQS

with open("data.json", "w") as f:
    json.dump(data, f, indent=2)

with open("assets_data.js", "w") as f:
    f.write("const COMPENDIUM_DATA = ")
    json.dump(data, f, indent=2)
    f.write(";\n")

print("faqs:", len(FAQS))
print("circulars:", len(data["circulars"]))
print("hospitals:", len(data["hospitals"]))
print("labs:", len(data["labs"]))

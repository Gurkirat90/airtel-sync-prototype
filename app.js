const DATA_BASE = "./data/";
const CASE_TODAY = "2026-07-15";

const state = {
  step: "profile",
  furthestStep: 0,
  data: { products: [], gst: [], udyam: [], leads: [] },
  profile: { businessName: "Star Electronics", businessType: "Electronics retail chain", segment: "multi", city: "Visakhapatnam", state: "Andhra Pradesh", tier: "2", employees: 44, sites: 11, language: "Hindi", fibre: "unknown", hasGST: "yes", currentInternet: "Mixed per site", currentProvider: "Competitor A", monthlySpend: 6900, need: "POS and reliable internet" },
  selections: new Set(["P01", "P19"]),
  quantities: {},
  scenario: "K12",
  consent: false,
  uploaded: {},
  ocrResults: {},
  advisorChoice: ""
};

let ocrWorkerPromise;

const caseFiles = id => ({
  gst: `${id}_gst_certificate.png`,
  udyam: id === "K05" ? null : `${id}_udyam_certificate.png`,
  id: `${id}_signatory_id.png`,
  address: `${id}_address_proof.png`
});
const scenarios = {
  K01: { name: "K01 · cancelled GST / Udyam number missing on specimen", business: "Vindhya Tours & Travels", gstin: "37IHKXV5167L1ZS", udyam: "", address: "Visakhapatnam, Andhra Pradesh", billDate: "2026-06-26", docUdyamDate: "2024-03-24", knownIssue: "GST record is cancelled; Udyam number is blank on the certificate.", files: caseFiles("K01") },
  K02: { name: "K02 · GST OCR unclear / Udyam date mismatch", business: "Harmony Dental Care", gstin: "19EOGXH4115Y1ZL", udyam: "UDYAM-WB-00-5053330", address: "Kolkata, West Bengal", billDate: "2026-05-22", docUdyamDate: "2023-01-11", knownIssue: "GST specimen OCR is unclear; Udyam certificate date differs from the mock registry.", files: caseFiles("K02") },
  K03: { name: "K03 · Udyam date mismatch", business: "Ganesh Woodcraft", gstin: "27XUIXG0767D1ZP", udyam: "UDYAM-MH-00-9516696", address: "Nagpur, Maharashtra", billDate: "2026-05-30", docUdyamDate: "2024-11-21", knownIssue: "Udyam certificate date differs from the mock registry.", files: caseFiles("K03") },
  K04: { name: "K04 · GST specimen OCR unreadable / Udyam date mismatch", business: "Saffron Dental Care LLP", gstin: "27PZSXS1936O1ZH", udyam: "UDYAM-MH-00-6131836", address: "Nagpur, Maharashtra", billDate: "2026-05-28", docUdyamDate: "2025-05-17", knownIssue: "GST specimen OCR is unreadable; Udyam certificate date differs from the mock registry.", files: caseFiles("K04") },
  K05: { name: "K05 · Udyam certificate missing", business: "Balaji Realty LLP", gstin: "32TZAXB5481U1Z1", udyam: "UDYAM-KL-00-5521886", address: "Kochi, Kerala", billDate: "2026-06-11", knownIssue: "Udyam mock record exists, but the certificate image is missing.", files: caseFiles("K05") },
  K06: { name: "K06 · GST OCR ambiguous / Udyam date mismatch", business: "Saffron Unisex Salon", gstin: "08YKZXS5189L1ZO", udyam: "UDYAM-RJ-00-6577157", address: "Jaipur, Rajasthan", billDate: "2026-06-11", docUdyamDate: "2023-01-24", knownIssue: "GST specimen OCR contains multiple character errors; Udyam certificate date differs from the mock registry.", files: caseFiles("K06") },
  K07: { name: "K07 · GST OCR ambiguity / Udyam date mismatch", business: "Neelgiri Physio Clinic", gstin: "07CPCXN0398P1ZT", udyam: "UDYAM-DL-00-9565547", address: "Delhi, Delhi", billDate: "2026-07-05", docUdyamDate: "2024-07-14", knownIssue: "GST specimen OCR confuses O and 0; Udyam certificate date differs from the mock registry.", files: caseFiles("K07") },
  K08: { name: "K08 · GST OCR ambiguity / Udyam date mismatch", business: "Green Leaf Legal Associates", gstin: "24XORXG9365M1Z3", udyam: "UDYAM-GJ-00-8477445", address: "Vadodara, Gujarat", billDate: "2026-05-26", docUdyamDate: "2022-11-12", knownIssue: "GST specimen OCR confuses O/0 and Z/7; Udyam certificate date differs from the mock registry.", files: caseFiles("K08") },
  K09: { name: "K09 · Udyam date mismatch", business: "Kaveri Insurance Advisors", gstin: "37LDYXK0296F1ZB", udyam: "UDYAM-AP-00-9751562", address: "Visakhapatnam, Andhra Pradesh", billDate: "2026-07-10", docUdyamDate: "2023-07-04", knownIssue: "Udyam certificate date differs from the mock registry.", files: caseFiles("K09") },
  K10: { name: "K10 · GST OCR ambiguity / Udyam date mismatch", business: "Kaveri Stays LLP", gstin: "27QHJXK0658U1ZL", udyam: "UDYAM-MH-00-7183141", address: "Mumbai, Maharashtra", billDate: "2026-06-18", docUdyamDate: "2024-01-09", knownIssue: "GST specimen OCR confuses J and I; Udyam certificate date differs from the mock registry.", files: caseFiles("K10") },
  K11: { name: "K11 · stale address proof / Udyam date mismatch", business: "Trinity Bake House Pvt Ltd", gstin: "03KGZXT1320R1ZZ", udyam: "UDYAM-PB-00-9719478", address: "Ludhiana, Punjab", billDate: "2025-10-31", docUdyamDate: "2025-09-15", knownIssue: "Address proof is 257 days old; Udyam certificate date differs from the mock registry.", files: caseFiles("K11") },
  K12: { name: "K12 · GST OCR ambiguity / Udyam date mismatch", business: "Star Electronics", gstin: "37NBLXS1145E1ZU", udyam: "UDYAM-AP-00-5186772", address: "Visakhapatnam, Andhra Pradesh", billDate: "2026-07-06", docUdyamDate: "2024-02-03", knownIssue: "GST specimen OCR confuses Z and 7; Udyam certificate date differs from the mock registry.", files: caseFiles("K12") }
};

const stepOrder = ["profile", "advisor", "quote", "kyc", "tracker"];
const segmentLabels = { micro: "Micro retail & services", prof: "Professional offices", multi: "Small multi-site businesses", mfg: "Small manufacturers" };
const segmentPhrases = { micro: "micro retail and services", prof: "professional office", multi: "small multi-site", mfg: "small manufacturing" };
const businessTypes = ["Electronics retail shop", "Kirana store", "Pharmacy", "Salon", "Boutique", "Professional office", "Travel agency", "Real estate agency", "Electronics retail chain", "Restaurant chain", "Budget hotel group", "Small manufacturer"];
function segmentForBusinessType(type) {
  const value = String(type || "").toLowerCase();
  if (/manufacturer|factory|packaging|production/.test(value)) return "mfg";
  if (/chain|multi-site|hotel group/.test(value)) return "multi";
  if (/office|travel agency|real estate|clinic|agency/.test(value)) return "prof";
  return "micro";
}
function applyLeadProfile(lead) {
  if (!lead) return;
  Object.assign(state.profile, {
    businessName: lead.business_name,
    businessType: lead.business_type,
    segment: segmentForBusinessType(lead.business_type),
    city: lead.city,
    state: lead.state,
    tier: lead.city_tier,
    employees: Number(lead.employee_count) || 1,
    sites: Number(lead.num_sites) || 1,
    language: lead.preferred_language || "English",
    hasGST: lead.has_gstin === "Y" ? "yes" : "no",
    gstin: lead.gstin || "",
    hasUdyam: lead.has_udyam === "Y",
    currentInternet: lead.current_internet || "None / not sure",
    currentProvider: lead.current_provider || "Not provided",
    monthlySpend: Number(lead.monthly_telecom_spend_inr) || 0,
    fibre: "unknown",
    need: "POS and reliable internet"
  });
}
function cityReference(city) {
  const key = nameKey(city);
  if (!key) return null;
  return state.data.leads.find(row => nameKey(row.city) === key) || null;
}
function cityTierHint(city, tier) {
  const ref = cityReference(city);
  if (!ref) return "No exact city match in the sample leads. Check spelling and confirm the city tier.";
  if (String(ref.city_tier) !== String(tier)) return `The supplied leads list ${ref.city} as Tier ${ref.city_tier}; this profile is set to Tier ${tier}. Check the tier.`;
  return `The supplied leads list ${ref.city} as Tier ${ref.city_tier}. Confirm site serviceability separately.`;
}

function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [], value = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { value += '"'; i++; }
      else if (ch === '"') quoted = false;
      else value += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(value); value = ""; }
    else if (ch === "\n") { row.push(value.replace(/\r$/, "")); rows.push(row); row = []; value = ""; }
    else value += ch;
  }
  if (value.length || row.length) { row.push(value.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift() || [];
  return rows.filter(r => r.some(v => v !== "")).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

async function loadData() {
  const [products, gst, udyam, leads] = await Promise.all([
    "product_catalogue.csv", "mock_gstin_registry.csv", "mock_udyam_registry.csv", "smb_leads.csv"
  ].map(async filename => {
    const res = await fetch(DATA_BASE + filename);
    if (!res.ok) throw new Error(`Could not load ${filename}`);
    return parseCSV(await res.text());
  }));
  state.data = { products, gst, udyam, leads };
  const lead = leads.find(row => row.gstin === scenarios.K12.gstin);
  applyLeadProfile(lead);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function money(value) { return "₹" + Number(value || 0).toLocaleString("en-IN"); }
function maskIdentifier(value, visible = 4) {
  const raw = String(value || "");
  if (!raw) return "Not provided";
  return `${"•".repeat(Math.max(4, raw.length - visible))}${raw.slice(-visible)}`;
}
async function runLocalOCR(file) {
  if (!window.Tesseract) throw new Error("The local OCR library did not load.");
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = window.Tesseract.createWorker("eng", 1, {
      workerPath: new URL("./vendor/tesseract/worker.min.js", window.location.href).href,
      corePath: new URL("./vendor/tesseract/tesseract-core-simd-lstm.wasm.js", window.location.href).href,
      langPath: new URL("./vendor/tesseract/lang", window.location.href).href,
      gzip: true
    });
  }
  const worker = await ocrWorkerPromise;
  const result = await worker.recognize(file);
  return result.data.text || "";
}
function parseOcrFields(text) {
  const original = String(text || "");
  const raw = original.toUpperCase();
  // Keep common OCR confusions in the GSTIN checksum position as an unverified
  // candidate; the exact mock registry lookup below still requires a literal match.
  const gstin = raw.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9][Z7][A-Z0-9]\b/)?.[0] || "";
  const udyamNumber = raw.match(/\bUDYAM[-\s][A-Z]{2}[-\s]\d{2}[-\s]\d+\b/)?.[0]?.replace(/\s/g, "-") || "";
  const rawDates = [...original.matchAll(/\b(?:\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})\b/g)].map(match => match[0]);
  const documentId = original.match(/\bSYN[-\s]?ID[-\s]?\d{3,}\b/i)?.[0]?.replace(/\s+/g, "-") || "";
  const toISO = value => {
    const parts = value.split(/[-/]/);
    if (parts[0].length === 4) return `${parts[0]}-${parts[1]}-${parts[2]}`;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };
  const lines = original.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const labeledValue = pattern => {
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(pattern);
      if (!match) continue;
      const inline = (match[1] || "").replace(/^[:\-\s]+/, "").trim();
      if (inline && !/^(?:address|name|date)$/i.test(inline)) return inline;
      const next = lines[i + 1] || "";
      if (next && !/^(?:gstin|legal name|trade name|address|date|type of registration)\b/i.test(next)) return next;
    }
    return "";
  };
  const businessName = labeledValue(/^\s*trade name\b\s*(.*)$/i)
    || labeledValue(/^\s*enterprise name\b\s*(.*)$/i)
    || labeledValue(/^\s*legal name\b\s*(.*)$/i)
    || labeledValue(/^\s*for business\b\s*(.*)$/i);
  let address = labeledValue(/^\s*(?:address|principal place of business|supply address)\b\s*(.*)$/i);
  if (/^(?:of principal|place of business)\b/i.test(address)) address = address.replace(/^(?:of principal(?: place of business)?|place of business)\s*/i, "");
  const normalizedText = nameKey(original);
  const locationLead = state.data.leads.find(row => normalizedText.includes(nameKey(row.city)) && normalizedText.includes(nameKey(row.state)));
  if (!address && locationLead) address = `${locationLead.city}, ${locationLead.state}`;
  const personName = labeledValue(/^\s*name\b\s*(.*)$/i);
  const designation = labeledValue(/^\s*designation\b\s*(.*)$/i);
  const validTill = labeledValue(/^\s*valid\s*till\b\s*(.*)$/i);
  return { gstin, udyamNumber, documentId, dates: rawDates.map(toISO), businessName, address, location: locationLead ? `${locationLead.city}, ${locationLead.state}` : "", personName, designation, validTill };
}
function product(id) { return state.data.products.find(p => p.product_id === id); }
function productRange(p) { return `${money(p.price_min_inr_per_month)}–${money(p.price_max_inr_per_month)}`; }
function registryGST(id) { return state.data.gst.find(r => r.gstin === id); }
function registryUdyam(id) { return state.data.udyam.find(r => r.udyam_number === id); }
function profileGSTIsActiveAndNamed(id = state.profile.gstin, businessName = state.profile.businessName) {
  const record = registryGST(id);
  if (!record || record.status !== "Active") return false;
  const businessKey = nameKey(businessName);
  return Boolean(businessKey && [record.trade_name, record.legal_name].some(name => nameKey(name) === businessKey));
}
function gstinHint(id, businessName = document.getElementById("businessName")?.value || state.profile.businessName) {
  const value = String(id || "").trim().toUpperCase();
  if (!value) return "Enter a GSTIN to check the mock registry.";
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(value)) return "GSTIN format does not match the 15-character sample format.";
  const record = registryGST(value);
  if (!record) return "No matching mock record; GST-required products will need review.";
  if (record.status !== "Active") return `${record.status} · GST-required products are not eligible`;
  return profileGSTIsActiveAndNamed(value, businessName) ? "Active · mock record and business name match" : "Active record, but the business name does not match";
}
function nameKey(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function placeKey(s) { return nameKey(String(s || "").split(",")[0]); }

function meetsEligibility(p, bundleIds = []) {
  const profile = state.profile;
  const tiers = (p.available_city_tiers || "").split(";");
  if (tiers.length && !tiers.includes(String(profile.tier))) return false;
  if (Number(profile.employees) < Number(p.min_employees || 0)) return false;
  if (Number(profile.sites) < Number(p.min_sites || 0)) return false;
  if (p.target_segments && !(p.target_segments.split(";").includes(profile.segment))) return false;
  if (p.requires_gstin === "Y" && (profile.hasGST !== "yes" || !profileGSTIsActiveAndNamed())) return false;
  const deps = (p.requires_one_of || "").split("|").filter(Boolean);
  if (deps.length && !deps.some(id => bundleIds.includes(id))) return false;
  return true;
}

function baselineIds() { return recommendedIds(); }
function connectionProductId() {
  const p = state.profile;
  if (p.segment === "multi") return p.fibre === "no" ? "" : "P02";
  if (p.segment === "prof") return p.fibre === "yes" ? "P02" : "P04";
  if (p.segment === "mfg") {
    if (meetsEligibility(product("P05"), [])) return "P05";
    if (meetsEligibility(product("P03"), [])) return "P03";
    return "";
  }
  return p.fibre === "yes" ? "P01" : "P04";
}
function currentSetupSummary() {
  const p = state.profile;
  const spend = Number(p.monthlySpend || 0);
  return `${p.currentInternet || "Current setup not provided"} with ${p.currentProvider || "provider not provided"}${spend ? ` · about ${money(spend)}/month currently` : ""}`;
}
function advisorPlan() {
  const p = state.profile;
  const connectionId = connectionProductId();
  const connection = product(connectionId);
  const base = connectionId ? [connectionId] : [];
  const label = segmentPhrases[p.segment] || "your business";
  const availabilityNote = p.fibre === "unknown"
    ? "Fibre availability is not confirmed; check it at each site before ordering. "
    : (p.fibre === "no" ? "Fibre is marked unavailable; confirm availability of the selected wireless option before ordering. " : "");
  if (!connectionId) return {
    ids: [],
    title: "Site assessment needed",
    explanation: `The catalogue has no eligible connectivity product for businesses in the ${label} segment with the current site details. Ask an advisor to confirm serviceability before building a quote. Current setup: ${currentSetupSummary()}.`
  };
  const plans = {
    payments: () => {
      const paymentProduct = ["micro", "multi"].includes(p.segment) && meetsEligibility(product("P19"), base) ? "P19" : "";
      return {
        ids: paymentProduct ? [...base, paymentProduct] : base,
        title: "For faster digital payments",
        explanation: paymentProduct
          ? `${availabilityNote}For businesses in the ${label} segment, pair ${connection.product_name} with Cloud POS & Billing for GST-ready billing and UPI/card acceptance. Your current setup is ${currentSetupSummary()}.`
          : `The supplied catalogue has no eligible POS or payment product for businesses in the ${label} segment. I’ve kept the quote to eligible connectivity and flagged payments for advisor follow-up. Your current setup is ${currentSetupSummary()}.`
      };
    },
    reliability: () => {
      let add = "";
      if (p.segment === "multi" && meetsEligibility(product("P10"), base)) add = "P10";
      else if (["multi", "prof"].includes(p.segment) && meetsEligibility(product("P09"), base)) add = "P09";
      return {
        ids: add ? [...base, add] : base,
        title: "For reliable internet",
        explanation: `${availabilityNote}For businesses in the ${label} segment, start with ${connection.product_name}${add ? ` and ${product(add).product_name}` : ""}. This uses the employee and site counts in your profile. Your current setup is ${currentSetupSummary()}.`
      };
    },
    security: () => {
      const securityId = p.segment === "micro" ? "P23" : (meetsEligibility(product("P21"), base) ? "P21" : (meetsEligibility(product("P20"), base) ? "P20" : ""));
      const securityProduct = securityId ? product(securityId) : null;
      return {
        ids: securityId ? [...base, securityId] : base,
        title: "For business security",
        explanation: securityProduct
          ? `${availabilityNote}For businesses in the ${label} segment, pair ${connection.product_name} with ${securityProduct.product_name}. ${securityProduct.description}. Your current setup is ${currentSetupSummary()}.`
          : `The catalogue has no security product eligible for businesses in the ${label} segment. I’ve kept the quote to eligible connectivity and flagged security for advisor follow-up. Your current setup is ${currentSetupSummary()}.`
      };
    }
  };
  if (plans[state.advisorChoice]) return plans[state.advisorChoice]();
  const need = String(p.need || "").toLowerCase();
  const inferredPriority = /security|camera|wi-fi/.test(need) ? "security" : /pos|payment/.test(need) ? "payments" : "reliability";
  return plans[inferredPriority]();
}
function recommendedIds() {
  const candidates = advisorPlan().ids;
  return candidates.filter(id => { const p = product(id); return p && meetsEligibility(p, candidates); });
}

function setStep(next) {
  const nextIndex = stepOrder.indexOf(next);
  if (nextIndex < 0 || nextIndex > state.furthestStep + 1) return;
  if (next === "tracker" && !state.consent) {
    showToast("Please record consent before continuing.");
    return;
  }
  if (next === "quote" && !state.data.products.length) return;
  state.step = next;
  state.furthestStep = Math.max(state.furthestStep, nextIndex);
  if (next === "quote" && !state.selections.size) state.selections = new Set(baselineIds());
  render();
  window.location.hash = next;
  document.getElementById("screenContent").focus({ preventScroll: true });
}

function pageHeader(kicker, title, subtitle, tag = "") {
  return `<div class="page-head"><div><div class="section-kicker">${kicker}</div><h2>${title}</h2><p>${subtitle}</p></div>${tag ? `<span class="stage-pill"><i class="dot"></i>${tag}</span>` : ""}</div>`;
}
function icon(name) {
  const paths = { arrow: "M5 12h14M13 6l6 6-6 6", check: "M5 12l4 4L19 6", lock: "M6 10V7a6 6 0 0 1 12 0v3M5 10h14v11H5z", doc: "M7 3h7l5 5v13H7zM14 3v6h5M10 13h6M10 17h6" };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.doc}"/></svg>`;
}

function profileView() {
  const p = state.profile;
  const typeOptions = businessTypes.map(type => `<option value="${esc(type)}" ${p.businessType === type ? "selected" : ""}>${esc(type)}</option>`).join("");
  const internetOptions = ["Mixed per site", "Business broadband", "Home broadband", "Mobile hotspot", "Leased line", "None / not sure"].map(value => `<option ${p.currentInternet === value ? "selected" : ""}>${esc(value)}</option>`).join("");
  const languages = ["English", "Hindi", "Marathi", "Kannada", "Gujarati", "Tamil", "Telugu"];
  const languageOptions = languages.map(value => `<option ${p.language === value ? "selected" : ""}>${value}</option>`).join("");
  const cityOptions = [...new Set(state.data.leads.map(row => row.city).filter(Boolean))].sort((a,b) => a.localeCompare(b)).map(city => `<option value="${esc(city)}"></option>`).join("");
  return `${pageHeader("STEP 01 · GET STARTED", "Let’s understand your business", "A few details help us recommend services that fit your day-to-day work.", "About 2 minutes")}
    <section class="card form-card">
      <div class="card-heading"><div><h3>Business profile</h3><p>We use these details to check product fit and availability.</p></div><span class="section-kicker">1 OF 5</span></div>
      <div class="form-grid">
        <div class="field"><label for="businessName">Business name</label><input id="businessName" value="${esc(p.businessName)}" placeholder="e.g. City Corner Store"></div>
        <div class="field"><label for="businessType">Business type</label><select id="businessType">${typeOptions}</select><span class="field-hint">Mapped segment: <b id="segmentSummary">${esc(segmentLabels[p.segment] || "Other")}</b></span></div>
        <div class="field"><label for="city">City</label><input id="city" list="citySuggestions" value="${esc(p.city)}"><datalist id="citySuggestions">${cityOptions}</datalist></div>
        <div class="field"><label for="state">State / UT</label><input id="state" value="${esc(p.state)}"></div>
        <div class="field"><label for="tier">City tier</label><select id="tier"><option value="1" ${p.tier === "1" ? "selected" : ""}>Tier 1</option><option value="2" ${p.tier === "2" ? "selected" : ""}>Tier 2</option></select><span class="field-hint" id="cityTierHint">${esc(cityTierHint(p.city, p.tier))}</span></div>
        <div class="field"><label for="employees">Number of employees</label><input id="employees" type="number" min="1" value="${esc(p.employees)}"></div>
        <div class="field"><label for="sites">Number of business sites</label><input id="sites" type="number" min="1" value="${esc(p.sites)}"></div>
        <div class="field"><label>Is fibre available at your site?</label><div class="choice-row"><label class="choice"><input type="radio" name="fibre" value="yes" ${p.fibre === "yes" ? "checked" : ""}><span>Yes</span></label><label class="choice"><input type="radio" name="fibre" value="no" ${p.fibre === "no" ? "checked" : ""}><span>No</span></label><label class="choice"><input type="radio" name="fibre" value="unknown" ${p.fibre === "unknown" ? "checked" : ""}><span>Not sure</span></label></div><span class="field-hint">For multiple sites, consider availability at each location.</span></div>
        <div class="field"><label for="hasGST">Do you have a GSTIN?</label><select id="hasGST"><option value="yes" ${p.hasGST === "yes" ? "selected" : ""}>Yes</option><option value="no" ${p.hasGST === "no" ? "selected" : ""}>No</option></select><span class="field-hint">GST-required products need an active record in the mock registry.</span></div>
        <div class="field" id="gstinField" ${p.hasGST === "yes" ? "" : "hidden"}><label for="gstin">GSTIN</label><input id="gstin" value="${esc(p.gstin || "")}" maxlength="15" autocomplete="off" placeholder="15-character GSTIN"><span class="field-hint" id="gstinHint">${esc(gstinHint(p.gstin))}</span></div>
        <div class="field"><label for="language">Preferred language</label><select id="language">${languageOptions}</select></div>
        <div class="field"><label for="currentInternet">Current internet setup</label><select id="currentInternet">${internetOptions}</select></div>
        <div class="field"><label for="currentProvider">Current provider</label><input id="currentProvider" value="${esc(p.currentProvider)}"></div>
        <div class="field"><label for="monthlySpend">Current monthly telecom spend (₹)</label><input id="monthlySpend" type="number" min="0" value="${esc(p.monthlySpend)}"></div>
        <div class="field full"><label for="need">What would help your business most?</label><select id="need"><option>POS and reliable internet</option><option>Customer Wi-Fi and payments</option><option>Security cameras and internet</option><option>More reliable internet at multiple sites</option></select></div>
      </div>
      <div class="action-row"><div class="note-inline"><span class="mini-icon">${icon("lock")}</span><span>No documents are needed at this stage.</span></div><button class="btn btn-primary" id="continueAdvisor">See recommendations ${icon("arrow")}</button></div>
    </section>`;
}

function advisorView() {
  const plan = advisorPlan();
  const ids = recommendedIds();
  const recs = ids.map(id => product(id)).filter(Boolean);
  const p = state.profile;
  const location = [p.city, p.state].filter(Boolean).join(", ");
  return `${pageHeader("STEP 02 · PRODUCT ADVICE", `A bundle for ${esc(p.businessName || "your business")}`, `${esc(p.businessType)} · ${esc(segmentLabels[p.segment] || "Other")} · Tier ${esc(p.tier)} · ${Number(p.employees)} employees · ${Number(p.sites)} site${Number(p.sites) === 1 ? "" : "s"} · ${esc(location)}`, "Recommendations")}
    <div class="advisor-grid">
      <section class="card chat-card">
        <div class="chat-head"><div class="bot-icon">✦</div><div><b>SYNC Business Advisor</b><small>Guided recommendation · ${esc(state.profile.language)}</small></div><span class="stage-pill" style="margin-left:auto"><i class="dot"></i>Ready</span></div>
        <div class="chat-body"><div class="bubble">Hi! I see ${/^[aeiou]/i.test(p.businessType) ? "an" : "a"} ${esc(p.businessType.toLowerCase())} in ${esc(location)}, with ${Number(p.sites)} site${Number(p.sites) === 1 ? "" : "s"} and ${Number(p.employees)} employees. Your current setup is ${esc(currentSetupSummary())}. What matters most today?</div>
          <div class="question-options"><button class="option-btn ${state.advisorChoice === "payments" ? "selected" : ""}" data-advisor="payments">Faster digital payments</button><button class="option-btn ${state.advisorChoice === "reliability" ? "selected" : ""}" data-advisor="reliability">Reliable internet</button><button class="option-btn ${state.advisorChoice === "security" ? "selected" : ""}" data-advisor="security">Keep the shop secure</button></div>
          <div class="bubble user">${state.advisorChoice ? ({ payments: "Faster digital payments", reliability: "Reliable internet", security: "Keep the shop secure" }[state.advisorChoice]) : esc(state.profile.need)}</div>
          <div class="bubble advisor-response"><b>${esc(plan.title)}</b><span>${esc(plan.explanation)}</span></div>
        </div>
        <div class="chat-compose"><span>Recommendations are calculated from your profile and the product catalogue.</span><span>●</span></div>
      </section>
      <aside class="advisor-summary"><div class="section-kicker">SUGGESTED STARTING BUNDLE</div><h3>${esc(plan.title)}</h3><p>These products fit your selected priority and catalogue eligibility. Add-ons remain optional.</p>
        ${recs.map((p, i) => `<div class="product-mini"><span class="product-glyph">${i ? "₹" : "⌁"}</span><div><b>${esc(p.product_name)}</b><small>${esc(p.description)} · ${esc(p.unit)}</small><div class="price-band">${productRange(p)} / month</div></div></div>`).join("")}
        <div class="recommendation-foot">The final quote will show price ranges, setup fees, contract length, and any eligibility conditions.</div>
        <button class="btn btn-primary" id="acceptBundle" style="width:100%;margin-top:16px">Review this quote ${icon("arrow")}</button>
      </aside>
    </div>`;
}

function lineTotal(p, qty, key) {
  const q = Number(qty || 1);
  const min = Number(p.price_min_inr_per_month || 0) * q;
  const max = Number(p.price_max_inr_per_month || 0) * q;
  const setup = Number(p.one_time_setup_inr || 0) * q;
  return { min, max, setup, key };
}
function quantityFor(p, id) {
  if (state.quantities[id] != null) return Math.max(1, Number(state.quantities[id]) || 1);
  return p.unit === "per site" ? Math.max(1, Number(state.profile.sites) || 1) : 1;
}
function selectedQuoteSummary() {
  const lines = [...state.selections].map(id => product(id)).filter(Boolean).map(p => {
    const qty = quantityFor(p, p.product_id);
    return { p, qty, ...lineTotal(p, qty, p.product_id) };
  });
  return {
    lines,
    totalMin: lines.reduce((sum, item) => sum + item.min, 0),
    totalMax: lines.reduce((sum, item) => sum + item.max, 0),
    setup: lines.reduce((sum, item) => sum + item.setup, 0),
    term: lines.length ? Math.max(...lines.map(item => Number(item.p.min_contract_months || 1))) : 0
  };
}
function quoteView() {
  const { lines, totalMin, totalMax, setup, term } = selectedQuoteSummary();
  const ids = lines.map(item => item.p.product_id);
  const addonCandidates = {
    micro: ["P19", "P22", "P23", "P18"],
    prof: ["P09", "P12", "P16", "P17", "P20", "P21", "P22"],
    multi: ["P09", "P10", "P13", "P16", "P19", "P21", "P22", "P23"],
    mfg: ["P20", "P21", "P24", "P05", "P06"]
  };
  const addOns = (addonCandidates[state.profile.segment] || []).filter(id => !state.selections.has(id) && product(id) && meetsEligibility(product(id), ids));
  const businessLocation = [state.profile.city, state.profile.state].filter(Boolean).join(", ");
  return `${pageHeader("STEP 03 · CLEAR PRICING", `Quote for ${esc(state.profile.businessName)}`, `Profile location: ${esc(businessLocation)} · Tier ${esc(state.profile.tier)} · ${esc(segmentLabels[state.profile.segment] || "Other")} · ${Number(state.profile.sites) || 1} site${Number(state.profile.sites) === 1 ? "" : "s"}. Catalogue prices are shown as ranges until serviceability is confirmed.`, "Editable quote")}
    <div class="quote-layout">
      <section class="card quote-items"><table class="quote-table"><thead><tr><th>Service</th><th>Quantity</th><th>Monthly price</th><th>Setup</th></tr></thead><tbody>
        ${lines.length ? lines.map(({p,qty,min,max,setup,key}) => `<tr><td><div class="quote-item"><b>${esc(p.product_name)}</b><small>${esc(p.unit)} · ${Number(p.min_contract_months)} month minimum</small></div></td><td><input class="quantity" type="number" min="1" max="99" value="${esc(qty)}" data-qty="${key}" aria-label="Quantity for ${esc(p.product_name)}"></td><td class="amount">${money(min)}–${money(max)}</td><td class="amount">${money(setup)}</td></tr>`).join("") : `<tr><td colspan="4"><div class="empty-state"><b>No services selected</b>Return to the advisor and choose a bundle.</div></td></tr>`}
        </tbody></table>
        ${addOns.length ? `<div class="addon-area"><h4>Optional add-ons</h4>${addOns.map(id => {const p=product(id); return `<label class="addon"><span class="addon-label"><input type="checkbox" data-addon="${id}"><span><b>${esc(p.product_name)}</b><small>${esc(p.description)}</small></span></span><span class="amount">${productRange(p)}</span></label>`}).join("")}</div>` : ""}
      </section>
      <aside class="card quote-summary"><h3>Monthly summary</h3><div class="summary-line"><span>Selected services</span><strong>${lines.length}</strong></div><div class="summary-line"><span>Minimum contract</span><strong>${term} months</strong></div><div class="summary-total"><span>Estimated monthly total</span><strong>${money(totalMin)}–${money(totalMax)}</strong><small>Catalogue range · before final configuration</small></div><div class="summary-line" style="margin-top:8px"><span>One-time setup</span><strong>${money(setup)}</strong></div><div class="included-note">No purchase is placed in this demo. Confirm address, installation feasibility, and final price before checkout.</div><button class="btn btn-primary" id="continueKyc">Continue to KYC ${icon("arrow")}</button><button class="btn btn-quiet" id="backAdvisor" style="width:100%;margin-top:5px">Back to recommendations</button></aside>
    </div><p class="legal-foot">Prices and terms come from the synthetic hackathon catalogue. Taxes and site-specific charges are not calculated in this prototype.</p>`;
}

function kycResult() {
  const s = scenarios[state.scenario];
  const uploadedGST = Boolean(state.uploaded.gst);
  const uploadedUdyam = Boolean(state.uploaded.udyam);
  const uploadedAddress = Boolean(state.uploaded.address);
  const gstFields = state.ocrResults.gst?.fields || {};
  const udyamFields = state.ocrResults.udyam?.fields || {};
  const addressFields = state.ocrResults.address?.fields || {};
  const effectiveGstin = uploadedGST ? (gstFields.gstin || "") : s.gstin;
  const effectiveUdyam = uploadedUdyam ? (udyamFields.udyamNumber || "") : s.udyam;
  const gst = effectiveGstin ? registryGST(effectiveGstin) : null;
  const uy = effectiveUdyam ? registryUdyam(effectiveUdyam) : null;
  const matchingLeadByGSTIN = effectiveGstin ? state.data.leads.find(row => row.gstin === effectiveGstin) : null;
  const specimenBusiness = uploadedGST ? (gstFields.businessName || "")
    : uploadedUdyam ? (udyamFields.businessName || "") : s.business;
  const partialAddressMatch = uploadedGST && specimenBusiness && gstFields.address
    ? state.data.gst.find(row => nameKey(row.trade_name || row.legal_name) === nameKey(specimenBusiness)
      && nameKey(row.principal_place_of_business).startsWith(nameKey(gstFields.address)))
    : null;
  const matchingLead = matchingLeadByGSTIN || (partialAddressMatch ? state.data.leads.find(row => row.gstin === partialAddressMatch.gstin) : null);
  const specimenAddress = uploadedAddress ? (addressFields.location || addressFields.address || "")
    : uploadedGST ? (gstFields.location || (matchingLead ? `${matchingLead.city}, ${matchingLead.state}` : gstFields.address || gst?.principal_place_of_business || ""))
    : uploadedUdyam ? (udyamFields.location || "") : s.address;
  const locationParts = specimenAddress.split(",").map(part => part.trim()).filter(Boolean);
  let specimenCity = locationParts[0] || "";
  let specimenState = locationParts[1] || "";
  if (locationParts.length > 2) {
    specimenState = locationParts.at(-1).replace(/\s*-\s*\d{5,6}\s*$/, "").trim();
    specimenCity = locationParts.at(-2).trim();
  }
  const profileNameMatch = Boolean(specimenBusiness) && nameKey(state.profile.businessName) === nameKey(specimenBusiness);
  const profileCityMatch = Boolean(specimenCity) && placeKey(state.profile.city) === placeKey(specimenCity);
  const profileStateMatch = Boolean(specimenState) && nameKey(state.profile.state) === nameKey(specimenState);
  const profileLocationMatch = profileCityMatch && profileStateMatch;
  const profileGstinMatch = state.profile.hasGST === "yes"
    ? Boolean(state.profile.gstin && state.profile.gstin === effectiveGstin)
    : !effectiveGstin;
  const profileGstStatusMatch = (state.profile.hasGST === "yes") === profileGSTIsActiveAndNamed();
  const gstNameMatch = Boolean(gst && specimenBusiness && nameKey(gst.trade_name) === nameKey(specimenBusiness));
  const billDate = uploadedAddress ? (addressFields.dates?.[0] || "") : s.billDate;
  const billAge = billDate ? Math.floor((new Date(CASE_TODAY) - new Date(billDate)) / 86400000) : NaN;
  const specimenUdyamDate = uploadedUdyam ? (udyamFields.dates?.[0] || "") : (s.docUdyamDate || "");
  const docs = [
    { key: "gst", label: "GST registration certificate", file: s.files.gst, state: gst?.status === "Active" ? "ok" : "review", status: gst ? `Mock record ${gst.status.toLowerCase()}` : "No registry match" },
    { key: "udyam", label: "Udyam registration certificate", file: s.files.udyam, state: s.files.udyam ? (uy ? "ok" : "review") : "missing", status: !s.files.udyam ? "Document missing" : (!effectiveUdyam ? "Number not detected" : (uy ? "Mock record found" : "No registry match")) },
    { key: "id", label: "Authorized signatory ID", file: s.files.id, state: "ok", status: "Uploaded · synthetic" },
    { key: "address", label: "Address proof", file: s.files.address, state: Number.isFinite(billAge) && billAge >= 0 && billAge <= 90 ? "ok" : "review", status: Number.isFinite(billAge) ? `Bill date · ${billAge} days from reference` : "Date not detected" }
  ].map(doc => {
    const ocr = state.ocrResults[doc.key];
    if (!state.uploaded[doc.key]) return doc;
    const status = ocr?.status === "processing" ? "OCR running · keep this page open"
      : ocr?.status === "complete" ? (doc.key === "gst" ? (gst ? `OCR read · mock record ${gst.status.toLowerCase()}` : "OCR read · no mock GST match")
        : doc.key === "udyam" ? (uy ? "OCR read · mock record found" : "OCR read · no mock Udyam match")
        : doc.key === "address" ? (Number.isFinite(billAge) ? `OCR read · bill date ${billAge} days old` : "OCR read · date not detected")
        : "OCR read · manual identity check required")
      : ocr?.status === "no-text" ? "No text read · manual review required"
      : ocr?.status === "error" ? "OCR failed · manual review required"
      : "File added · verification required";
    return { ...doc, state: "review", status };
  });
  let headline = "Manual review required", copy = "The mock checks found an item that needs a human decision before onboarding can continue.";
  if (Object.keys(state.uploaded).length) {
    const checks = [];
    if (uploadedGST) checks.push(gst ? `OCR found GSTIN ${maskIdentifier(effectiveGstin)}; the mock record is ${gst.status.toLowerCase()}.` : (effectiveGstin ? "OCR found a GSTIN with no mock registry match." : "OCR did not detect a GSTIN."));
    if (uploadedUdyam) checks.push(uy ? `OCR found a Udyam number with a mock record dated ${uy.date_of_registration}.` : (effectiveUdyam ? "OCR found a Udyam number with no mock registry match." : "OCR did not detect a Udyam number."));
    if (uploadedAddress) checks.push(Number.isFinite(billAge) ? `Address proof date is ${billAge} days from the case reference date.` : "OCR did not detect an address proof date.");
    copy = `${checks.join(" ")} Confirm the extracted fields and resolve mismatches manually before proceeding.`;
  } else {
    const checks = [];
    if (!gst) checks.push("No exact GSTIN mock record was found.");
    else if (gst.status !== "Active") checks.push(`The mock GST record is ${gst.status.toLowerCase()}; keep the case on hold.`);
    else if (!gstNameMatch) checks.push("The GST mock record name does not match the specimen trade name.");
    else checks.push("The mock GST record is active and its trade name matches the specimen.");
    if (!s.files.udyam) checks.push(uy ? "The Udyam mock record exists, but the certificate image is missing." : "The Udyam certificate image is missing.");
    else if (!effectiveUdyam) checks.push("The Udyam certificate image is present, but its number is blank or unreadable.");
    else if (!uy) checks.push("No exact Udyam mock record was found for the specimen number.");
    else if (specimenUdyamDate && specimenUdyamDate !== uy.date_of_registration) checks.push(`The Udyam certificate date (${specimenUdyamDate}) differs from the mock registry date (${uy.date_of_registration}).`);
    if (!Number.isFinite(billAge)) checks.push("The address proof date was not detected.");
    else if (billAge < 0 || billAge > 90) checks.push(`The address proof is ${billAge} days from the reference date and needs review.`);
    if (s.knownIssue && /OCR (?:is unclear|is unreadable|contains|confuses)/i.test(s.knownIssue)) checks.push(s.knownIssue);
    copy = `${checks.join(" ")} Confirm the documents and resolve any mismatch manually before proceeding.`;
  }
  const profileIssues = [];
  if (!profileNameMatch) profileIssues.push(`business name “${state.profile.businessName}” does not match the selected document data`);
  if (!profileLocationMatch) profileIssues.push(`profile location “${[state.profile.city, state.profile.state].filter(Boolean).join(", ") }” differs from the specimen address/location “${specimenAddress || "not detected"}”`);
  if (!profileGstinMatch) profileIssues.push("profile GST details do not match the selected specimen");
  if (state.profile.hasGST === "yes" && !profileGstStatusMatch) profileIssues.push("the profile GSTIN does not have an active matching mock record");
  copy += profileIssues.length ? ` Profile consistency check: ${profileIssues.join("; ")}.` : " The profile name, location, and GSTIN match this selected specimen.";
  return { s, gst, uy, billAge, docs, headline, copy, profileNameMatch, profileLocationMatch, profileGstinMatch, profileGstStatusMatch, gstNameMatch, profileIssues, specimenBusiness, specimenAddress, effectiveGstin, effectiveUdyam, specimenUdyamDate };
}
function kycView() {
  const { s, gst, uy, billAge, docs, headline, copy, profileNameMatch, profileLocationMatch, profileGstinMatch, profileGstStatusMatch, gstNameMatch, specimenBusiness, specimenAddress, effectiveGstin, effectiveUdyam, specimenUdyamDate } = kycResult();
  const gstStatus = gst ? `${gst.status} · mock` : "No match";
  const matchingProfileLoaded = profileNameMatch && profileLocationMatch && profileGstinMatch;
  const caseOptions = Object.entries(scenarios).map(([id, item]) => `<option value="${id}" ${state.scenario === id ? "selected" : ""}>${id} · ${esc(item.business)}</option>`).join("");
  const consentBox = `<label class="consent-box"><input type="checkbox" id="kycConsent" ${state.consent ? "checked" : ""}><span>I consent to using these synthetic specimens for this local KYC demonstration. This prototype does not transmit or retain uploaded files. A live service would specify purpose, authorized access, and the deletion period.</span></label>`;
  return `${pageHeader("STEP 04 · DOCUMENT REVIEW", "Review your documents", "We check whether the required files are present, readable, current, and consistent with the mock registries.", "Synthetic sample")}
    <div class="kyc-banner"><b>ⓘ</b><div><b>Competition specimen only</b><p>These generated images are not valid identity documents. This screen demonstrates OCR and mock lookups; it does not verify a real business. Scenario tabs switch to separate synthetic test records.</p></div></div>
    <div class="scenario-picker"><div class="field"><label for="kycScenario">Applicant test case</label><select id="kycScenario">${caseOptions}</select><span class="field-hint">12 synthetic applicants from the supplied image set. Changing case clears uploads and consent.</span></div><div class="scenario-profile"><button class="btn" id="loadCaseProfile" ${matchingProfileLoaded ? "disabled" : ""}>${matchingProfileLoaded ? "Matching profile loaded" : "Load matching profile and refresh quote"}</button><span class="field-hint">This resets the quote, uploads, and consent for a consistent replay.</span></div></div>
    <div class="case-focus"><b>Case focus:</b> ${esc(s.knownIssue || "Review the selected specimen and mock registry results.")} <span>Reference images are not OCR-verified until you upload them.</span></div>
    <div class="kyc-layout"><section class="card"><div class="card-heading" style="padding:18px 17px 0;margin-bottom:8px"><div><h3>${esc(s.business)}</h3><p>Upload status and sample OCR fields</p></div><span class="section-kicker">DEMO CASE ${state.scenario}</span></div><div class="doc-list">${docs.map(doc => {
      const uploadedName = state.uploaded[doc.key];
      const sampleUrl = doc.file ? `${DATA_BASE}kyc_documents/${encodeURIComponent(doc.file)}` : "";
      return `<div class="doc-row"><span class="doc-icon">${icon("doc")}</span><div><b>${esc(doc.label)}</b><small>${uploadedName ? esc(uploadedName) : doc.file ? esc(doc.file) : "No file supplied"}${doc.file && !uploadedName ? " · synthetic specimen" : ""}</small></div><span class="status ${doc.state}">${esc(doc.status)}</span>${sampleUrl ? `<a class="doc-open" href="${sampleUrl}" target="_blank" rel="noopener">View specimen</a>` : ""}</div>`;
    }).join("")}</div><div style="padding:0 17px 17px">${consentBox}<div class="field" style="margin-top:14px"><label for="documentType">Document type</label><select id="documentType" ${state.consent ? "" : "disabled"}><option value="gst">GST certificate</option><option value="udyam">Udyam certificate</option><option value="id">Authorized signatory ID</option><option value="address">Address proof</option></select></div><div style="margin-top:10px"><label class="btn ${state.consent ? "" : "btn-disabled"}" for="documentUpload" ${state.consent ? "" : "aria-disabled=\"true\""}>＋ Add an image</label><input id="documentUpload" type="file" accept="image/png,image/jpeg,image/webp" ${state.consent ? "" : "disabled"} hidden><span class="field-hint" style="margin-left:9px">${state.consent ? "OCR runs locally in this browser; file contents are not sent to a service." : "Give consent before adding a file."}</span></div></div></section>
      <aside class="kyc-side"><section class="card result-card"><div class="result-head"><span class="result-symbol">!</span><span><b>${headline}</b><small>Mock validation summary</small></span></div>
        <div class="result-row"><span>GSTIN lookup</span><strong class="${gst?.status === "Active" ? "good" : "warn"}">${esc(gstStatus)}</strong></div>
        <div class="result-row"><span>Specimen / registry name</span><strong class="${gstNameMatch ? "good" : "warn"}">${gstNameMatch ? "Matches mock record" : "Check required"}</strong></div>
        <div class="result-row"><span>Profile business name</span><strong class="${profileNameMatch ? "good" : "warn"}">${profileNameMatch ? "Matches specimen" : "Mismatch · review"}</strong></div>
        <div class="result-row"><span>Profile location</span><strong class="${profileLocationMatch ? "good" : "warn"}">${profileLocationMatch ? "Matches specimen" : "Mismatch · review"}</strong></div>
        <div class="result-row"><span>Profile GST details</span><strong class="${profileGstinMatch && profileGstStatusMatch ? "good" : "warn"}">${profileGstinMatch && profileGstStatusMatch ? "Consistent" : "Mismatch · review"}</strong></div>
        <div class="result-row"><span>Udyam lookup</span><strong class="${uy ? "good" : "warn"}">${uy ? "Record found" : "Not checked"}</strong></div>
        <div class="result-row"><span>Address proof</span><strong class="${Number.isFinite(billAge) && billAge >= 0 && billAge <= 90 ? "good" : "warn"}">${Number.isFinite(billAge) ? (billAge >= 0 && billAge <= 90 ? `${billAge} days · within 90 days` : `${billAge} days · review date`) : "Date not detected"}</strong></div>
        <div class="result-copy">${esc(copy)}</div>
      </section><section class="card result-card"><div class="card-heading" style="margin:0"><div><h3>Extracted details</h3><p>${Object.keys(state.uploaded).length ? "Values read locally from uploaded files; check them before accepting." : "Prefilled values for the selected synthetic scenario."}</p></div></div><div class="result-row"><span>Business</span><strong>${esc(specimenBusiness || "Not detected")}</strong></div><div class="result-row"><span>GSTIN</span><strong>${esc(maskIdentifier(effectiveGstin))}</strong></div><div class="result-row"><span>GST status</span><strong>${esc(gst?.status || "No match")}</strong></div><div class="result-row"><span>Address</span><strong>${esc(specimenAddress || "Not detected")}</strong></div>${effectiveUdyam || state.uploaded.udyam || s.files.udyam ? `<div class="result-row"><span>Udyam number</span><strong>${esc(maskIdentifier(effectiveUdyam))}</strong></div>` : ""}${specimenUdyamDate ? `<div class="result-row"><span>Udyam date on specimen</span><strong>${esc(specimenUdyamDate)}</strong></div><div class="result-row"><span>Udyam date in mock registry</span><strong>${esc(uy?.date_of_registration || "No match")}</strong></div>` : ""}${state.uploaded.id ? `<div class="result-row"><span>Signatory name</span><strong>${esc(state.ocrResults.id?.fields.personName || "Not detected")}</strong></div><div class="result-row"><span>Designation</span><strong>${esc(state.ocrResults.id?.fields.designation || "Not detected")}</strong></div><div class="result-row"><span>Signatory ID</span><strong>${esc(maskIdentifier(state.ocrResults.id?.fields.documentId))}</strong></div><div class="result-row"><span>Valid till</span><strong>${esc(state.ocrResults.id?.fields.validTill || "Not detected")}</strong></div>` : ""}</section></aside>
    </div><div class="action-row"><div class="note-inline"><span class="mini-icon">${icon("lock")}</span><span>Consent is recorded before proceeding in the demo.</span></div><button class="btn btn-primary" id="continueTracker" ${state.consent ? "" : "disabled"}>View order tracker ${icon("arrow")}</button></div><p class="legal-foot">The case reference date for freshness checks is ${CASE_TODAY}. GSTIN format validation accepts X in the embedded PAN segment for this dataset; Udyam district code 00 is a known test value.</p>`;
}

function trackerView() {
  const { s, gst, uy, docs, copy, profileLocationMatch, specimenAddress } = kycResult();
  const quote = selectedQuoteSummary();
  const missingDocument = docs.some(doc => doc.state === "missing");
  const hasUploadedDocuments = Object.keys(state.uploaded).length > 0;
  const review = true;
  const current = missingDocument ? 1 : 2;
  const location = [state.profile.city, state.profile.state].filter(Boolean).join(", ");
  const services = quote.lines.map(item => `${item.p.product_name} × ${item.qty}`).join(" + ") || "No services selected";
  const steps = [
    ["Quote prepared", "Your selected services and catalogue price range are saved for this demo."],
    ["KYC documents received", missingDocument ? "A required specimen is missing; request and verify it before continuing." : hasUploadedDocuments ? "Uploaded image(s) were processed locally; extracted fields and mock lookups still need human review." : "Scenario fields were checked against mock records; reference images have not been OCR-verified."],
    ["KYC review", copy],
    ["Installation scheduled", "We will show an estimated date after serviceability is confirmed."],
    ["Service activated", "The selected services are ready to use."]
  ];
  return `${pageHeader("STEP 05 · ORDER STATUS", `Setup progress for ${esc(state.profile.businessName)}`, `${esc(location)} · ${Number(state.profile.sites)} site${Number(state.profile.sites) === 1 ? "" : "s"} · ${esc(segmentLabels[state.profile.segment] || "Other")}. This is a demo journey, not a placed order.`, "Demo tracker")}
    <section class="card tracker-top"><div><div class="order-ref">DEMO JOURNEY · SYNC-DEMO-1048</div><h3>${esc(state.profile.businessName)}</h3><p>${esc(services)} · Profile location: ${esc(location)}</p></div><span class="tracker-badge">${review ? (missingDocument ? "Document needed" : "KYC review needed") : "In progress"}</span></section>
    <div class="tracker-grid"><section class="card timeline"><h3>Journey progress</h3><div class="timeline-list">${steps.map(([title,desc],i) => `<div class="timeline-item ${i < current ? "done" : (i === current ? "current" : "")}"><span class="timeline-mark">${i < current ? "✓" : String(i+1).padStart(2,"0")}</span><span><b>${title}</b><small>${esc(desc)}</small></span><time>${i < current ? "Complete" : (i === current ? "Needs attention" : "Upcoming")}</time></div>`).join("")}</div></section>
      <aside class="card order-card"><h3>Journey details</h3><dl><dt>Business profile</dt><dd>${esc(state.profile.businessName)}</dd><dt>Profile location</dt><dd>${esc(location)}</dd><dt>Customer segment</dt><dd>${esc(segmentLabels[state.profile.segment] || "Other")}</dd><dt>Estimated monthly total</dt><dd>${money(quote.totalMin)}–${money(quote.totalMax)}</dd><dt>One-time setup</dt><dd>${money(quote.setup)}</dd><dt>KYC demo case</dt><dd>${state.scenario} · ${esc(s.business)}</dd><dt>Specimen address</dt><dd>${esc(specimenAddress || "Not detected")} · ${profileLocationMatch ? "matches profile" : "profile mismatch"}</dd><dt>GST lookup</dt><dd>${esc(gst?.status || (state.uploaded.gst ? "No exact match" : "Not found"))} · mock</dd><dt>Udyam lookup</dt><dd>${uy ? "Record found · mock" : "Pending"}</dd><dt>Expected installation</dt><dd>Shown after site check</dd></dl><div class="alert-strip"><span class="icon">!</span><span>No order or installation has been created. ${missingDocument ? "Resolve the missing document before progressing." : "KYC issues shown above need review before service activation."}</span></div></aside>
    </div><div class="action-row"><button class="btn btn-quiet" id="backKyc">Back to KYC review</button><button class="btn" id="restartJourney">Start a new demo journey</button></div>`;
}

function render() {
  document.querySelectorAll(".step-link").forEach(link => {
    const step = link.dataset.step;
    const stepIndex = stepOrder.indexOf(step);
    link.classList.toggle("active", step === state.step);
    link.classList.toggle("done", stepIndex < stepOrder.indexOf(state.step));
    link.disabled = stepIndex > state.furthestStep || (step === "tracker" && !state.consent);
  });
  const screen = document.getElementById("screenContent");
  if (!state.data.products.length) { screen.innerHTML = `<div class="loading">Loading the product catalogue and mock registries…</div>`; return; }
  screen.innerHTML = ({ profile: profileView, advisor: advisorView, quote: quoteView, kyc: kycView, tracker: trackerView }[state.step])();
  bindEvents();
}

function showToast(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function saveProfile() {
  state.profile.businessName = document.getElementById("businessName").value.trim() || "Your business";
  state.profile.businessType = document.getElementById("businessType").value;
  state.profile.segment = segmentForBusinessType(state.profile.businessType);
  state.profile.city = document.getElementById("city").value.trim() || "Your city";
  state.profile.state = document.getElementById("state").value.trim() || "Not provided";
  state.profile.tier = document.getElementById("tier").value;
  state.profile.employees = Math.max(1, Number(document.getElementById("employees").value || 1));
  state.profile.sites = Math.max(1, Number(document.getElementById("sites").value || 1));
  state.profile.language = document.getElementById("language").value;
  state.profile.hasGST = document.getElementById("hasGST").value;
  state.profile.gstin = state.profile.hasGST === "yes" ? (document.getElementById("gstin")?.value.trim().toUpperCase() || "") : "";
  state.profile.fibre = document.querySelector('input[name="fibre"]:checked')?.value || "unknown";
  state.profile.currentInternet = document.getElementById("currentInternet").value;
  state.profile.currentProvider = document.getElementById("currentProvider").value.trim() || "Not provided";
  state.profile.monthlySpend = Math.max(0, Number(document.getElementById("monthlySpend").value || 0));
  state.profile.need = document.getElementById("need").value;
  state.selections = new Set(baselineIds());
  state.quantities = {};
  state.advisorChoice = "";
  state.consent = false;
  state.uploaded = {};
  state.ocrResults = {};
  state.furthestStep = 1;
}
function bindEvents() {
  document.getElementById("hasGST")?.addEventListener("change", e => {
    const field = document.getElementById("gstinField");
    if (field) field.hidden = e.target.value !== "yes";
  });
  document.getElementById("gstin")?.addEventListener("input", e => {
    const hint = document.getElementById("gstinHint");
    if (hint) hint.textContent = gstinHint(e.target.value);
  });
  document.getElementById("businessName")?.addEventListener("input", e => {
    const hint = document.getElementById("gstinHint");
    if (hint) hint.textContent = gstinHint(document.getElementById("gstin")?.value, e.target.value);
  });
  document.getElementById("businessType")?.addEventListener("change", e => {
    const summary = document.getElementById("segmentSummary");
    if (summary) summary.textContent = segmentLabels[segmentForBusinessType(e.target.value)] || "Other";
  });
  const refreshCityTierHint = () => {
    const city = document.getElementById("city");
    const tier = document.getElementById("tier");
    const hint = document.getElementById("cityTierHint");
    if (hint) hint.textContent = cityTierHint(city?.value, tier?.value);
  };
  document.getElementById("city")?.addEventListener("input", refreshCityTierHint);
  document.getElementById("city")?.addEventListener("change", e => {
    const ref = cityReference(e.target.value);
    if (ref) {
      document.getElementById("state").value = ref.state;
      document.getElementById("tier").value = ref.city_tier;
    }
    refreshCityTierHint();
  });
  document.getElementById("tier")?.addEventListener("change", refreshCityTierHint);
  document.getElementById("continueAdvisor")?.addEventListener("click", () => { saveProfile(); setStep("advisor"); });
  document.querySelectorAll("[data-advisor]").forEach(btn => btn.addEventListener("click", () => { state.advisorChoice = btn.dataset.advisor; render(); }));
  document.getElementById("acceptBundle")?.addEventListener("click", () => { state.selections = new Set(recommendedIds()); setStep("quote"); });
  document.getElementById("backAdvisor")?.addEventListener("click", () => setStep("advisor"));
  document.getElementById("continueKyc")?.addEventListener("click", () => setStep("kyc"));
  document.querySelectorAll("[data-addon]").forEach(box => box.addEventListener("change", () => { box.checked ? state.selections.add(box.dataset.addon) : state.selections.delete(box.dataset.addon); render(); }));
  document.querySelectorAll("[data-qty]").forEach(input => input.addEventListener("change", () => { state.quantities[input.dataset.qty] = Math.max(1, Number(input.value || 1)); render(); }));
  document.getElementById("kycScenario")?.addEventListener("change", e => {
    state.scenario = e.target.value;
    state.consent = false;
    state.uploaded = {};
    state.ocrResults = {};
    render();
  });
  document.getElementById("loadCaseProfile")?.addEventListener("click", () => {
    const scenario = scenarios[state.scenario];
    const lead = state.data.leads.find(row => row.gstin === scenario?.gstin);
    if (!lead) return showToast("No matching lead profile was found for this case.");
    applyLeadProfile(lead);
    state.advisorChoice = "";
    state.quantities = {};
    state.selections = new Set(baselineIds());
    state.consent = false;
    state.uploaded = {};
    state.ocrResults = {};
    render();
    showToast("Matching profile loaded; the quote and KYC review were reset for this case.");
  });
  document.getElementById("kycConsent")?.addEventListener("change", e => { state.consent = e.target.checked; render(); });
  document.getElementById("documentUpload")?.addEventListener("change", async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const doc = document.getElementById("documentType").value;
    const scenarioAtUpload = state.scenario;
    const token = `${Date.now()}-${Math.random()}`;
    state.uploaded[doc] = file.name;
    state.ocrResults[doc] = { token, status: "processing", text: "", fields: {} };
    render();
    try {
      const text = await runLocalOCR(file);
      if (state.scenario !== scenarioAtUpload || state.ocrResults[doc]?.token !== token) return;
      const fields = parseOcrFields(text);
      state.ocrResults[doc] = { token, status: text.trim() ? "complete" : "no-text", text, fields };
      showToast(text.trim() ? "Local OCR finished; check extracted values." : "No text found. Manual review is required.");
    } catch (error) {
      if (state.scenario !== scenarioAtUpload || state.ocrResults[doc]?.token !== token) return;
      ocrWorkerPromise = undefined;
      state.ocrResults[doc] = { token, status: "error", text: "", fields: {}, error: error.message };
      showToast("Local OCR could not read this file; manual review is required.");
    }
    render();
  });
  document.getElementById("continueTracker")?.addEventListener("click", () => { if (!state.consent) return showToast("Please record consent before continuing."); setStep("tracker"); });
  document.getElementById("backKyc")?.addEventListener("click", () => setStep("kyc"));
  document.getElementById("restartJourney")?.addEventListener("click", () => { state.step="profile";state.furthestStep=0;state.consent=false;state.uploaded={};state.ocrResults={};state.scenario="K12";state.advisorChoice="";state.quantities={};applyLeadProfile(state.data.leads.find(row => row.gstin === scenarios.K12.gstin));state.selections=new Set(baselineIds());render();window.location.hash="profile"; });
}

document.querySelectorAll(".step-link").forEach(link => link.addEventListener("click", () => setStep(link.dataset.step)));
loadData().then(() => {
  state.selections = new Set(baselineIds());
  render();
}).catch(error => {
  document.getElementById("screenContent").innerHTML = `<div class="card form-card"><h2>Could not load the demo data</h2><p class="muted">Serve this folder from the parent workspace so it can read the supplied CSV files. Open the prototype README for the local run command.</p><p class="field-hint">${esc(error.message)}</p></div>`;
});

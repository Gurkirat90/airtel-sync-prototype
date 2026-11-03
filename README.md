# Airtel SYNC · Udyam Digital

**A hackathon prototype for a simpler small-business onboarding journey.** The demo brings business profiling, catalogue-based recommendations, an editable quote, synthetic KYC review, and an order-progress tracker into one guided flow.

- **Live prototype:** [verceldeploy-phi-nine.vercel.app](https://verceldeploy-phi-nine.vercel.app/)
- **Source:** [Gurkirat90/airtel-sync-prototype](https://github.com/Gurkirat90/airtel-sync-prototype)
- **Track:** YTL Hackathon 2026 · Track A

> **Competition demo only.** Every business, person, identifier, registry entry, price, and document image in this repository is fictional test data. This prototype does not verify a real business, submit an order, or schedule an installation.

## The journey

The screens are designed to be reviewed in sequence. Use the step navigation after completing each screen.

1. **Business profile** — Enter a business type, city, city tier, employee and site counts, connectivity availability, GST status, preferred language, and current setup. The K12 sample profile is loaded by default. City hints come from the supplied sample leads; they are not a live serviceability check.
2. **Product advisor** — Choose a priority: faster digital payments, reliable internet, or shop security. The advisor maps the business type to a customer segment and filters the product catalogue using segment, tier, employee/site minimums, and GST requirements. The same priority can therefore produce different eligible bundles for different profiles.
3. **Quote** — Review and edit catalogue items and quantities. The quote shows monthly price ranges, setup fees, and minimum contract terms. Per-site products start with the profile's site count. Prices are estimates from the supplied catalogue, not a confirmed offer.
4. **Smart KYC** — Select one of 12 synthetic applicants (K01–K12), compare the scenario against the current profile and mock registries, and optionally upload an image after recording demo consent. OCR runs in the browser. Mismatches, missing records, unreadable fields, and date discrepancies are surfaced for manual review.
5. **Order tracker** — Review a simulated journey status, the selected services, quote summary, KYC flags, and the next steps. It is a walkthrough only; no order or installation is created.

### Suggested demo path

Start with the default **Star Electronics / K12** profile, compare all three advisor priorities, and inspect how the quote changes. Continue to KYC and try a few deliberately different cases:

- **K01 · Vindhya Tours & Travels:** cancelled GST record and a missing Udyam number on the specimen.
- **K05 · Balaji Realty LLP:** Udyam image missing, while the mock registry has a record.
- **K11 · Trinity Bake House:** stale address proof.
- **K12 · Star Electronics:** ambiguous GST characters and a specimen/registry Udyam date mismatch.

When the selected KYC applicant does not match the current business profile, use **Load matching profile and refresh quote** to replay the case consistently. Selecting another case clears the prior upload and consent.

## Run locally

The app is static HTML, CSS, and JavaScript. It has no build step or package installation. Serve the repository root over HTTP so the browser can fetch the CSV files and OCR assets:

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000/](http://localhost:8000/).

Opening `index.html` directly with a `file://` URL may prevent data and OCR assets from loading because browsers restrict local file requests.

## How the prototype uses its data

The app fetches four CSVs from `data/` when it starts:

| File | Role in the demo |
| --- | --- |
| `product_catalogue.csv` | Product names, segments, tier coverage, eligibility conditions, monthly price ranges, setup fees, and contract terms used for recommendations and quotes. |
| `smb_leads.csv` | Fictional business profiles used to seed the default profile and provide sample city/tier references. |
| `mock_gstin_registry.csv` | Fictional GST records used for status and business-name lookups. |
| `mock_udyam_registry.csv` | Fictional Udyam records used for enterprise and registration-date comparisons. |

`data/kyc_documents/` contains the supplied synthetic specimen images, named by applicant and document type (for example, `K12_gst_certificate.png`). There are 12 applicant cases; K05 intentionally has no Udyam certificate image. The sample fields shown before an upload come from the scenario and mock registries. The reference image is not OCR-verified until it is uploaded in the demo.

The advisor priorities are intents, not separate business types. Product fit comes from the editable profile and catalogue rules. A choice may be unavailable for a segment or profile; the prototype then explains the constraint and keeps the suggested bundle within the available catalogue rules.

## OCR and data handling

- The upload control accepts **PNG, JPEG, and WebP** images.
- Tesseract.js and its English language/core assets are bundled in `vendor/tesseract/`; OCR runs in the user's browser.
- Uploaded files and extracted OCR results are held in page memory for the current demo session. The prototype has no upload API or server-side document storage.
- OCR can misread characters. A missing exact mock-registry match or any profile/document discrepancy is a reason for human review, not a pass or a rejection.
- Consent is a demo interaction. This implementation does not provide production identity verification, access controls, retention rules, or a real KYC decision.

## Scope and limitations

- The repository covers the **12 applicants and specimen images included in the supplied pack**. The judging pack's 15 exact adversarial cases were not present in the source folders, so this repository does not claim end-to-end validation against that separate 15-case set.
- Registry lookups use local fictional CSVs. GST/Udyam checks are not connected to government systems.
- City tiers and product availability are sample inputs. Confirm actual address-level serviceability and final price outside this prototype.
- The tracker is simulated. No customer record, purchase, payment, installation, or activation is created.
- The current OCR path is image-only; PDF upload is not supported.

## Repository layout

```text
.
├── index.html                 # App shell and five-step navigation
├── styles.css                 # Responsive interface styling
├── app.js                     # Journey state, CSV rules, recommendations, KYC and tracker
├── data/
│   ├── *.csv                  # Product catalogue, leads, and mock registries
│   └── kyc_documents/         # Synthetic K01–K12 specimen images
├── vendor/tesseract/          # Locally bundled OCR runtime and English model
├── NOTICE.md                  # Synthetic-data notice and OCR attribution pointer
└── README.md
```

## Deployment

This repository is a static site and can be deployed from its root directory using Vercel or another static host. No build command is required; serve the files as-is. Keep the `data/` and `vendor/tesseract/` directories alongside `index.html` so CSV loading and browser OCR continue to work.

See the Tesseract license notices in `vendor/tesseract/`. See [NOTICE.md](./NOTICE.md) for the demo-data and implementation notice.

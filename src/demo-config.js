// Edit this file to change the presentation's fictional project details.
// Never put real addresses, credentials or private project identifiers here.
export const CONTEXT = Object.freeze({
  address: '42 Marubra Street, Marubra',
  publicName: 'Marubra Duplex',
  client: 'Demo Homeowner',
  admin: 'Demo Project Team',
  engineer: 'Example Engineering DEMO-STRUCT-001',
  consent: 'DEMO-CDC-001',
  certifier: 'Example Certifier',
  lender: 'Example Lender',
  instagramHandle: 'demo.buildco',
});

export function shortUpdates(c = CONTEXT) {
  return {
    admin: `Hi ${c.admin}, please confirm frame inspection readiness at ${c.address} and request an appointment with ${c.certifier}. Check the relevant wall and roof details against current issued drawings. Prepare the progress claim pack for ${c.lender}, holding submission pending sign-off and eligibility checks. References: ${c.engineer} / ${c.consent}.`,
    client: `Hi ${c.client}, the latest update reports framing progress at ${c.address}. We’ll confirm inspection readiness and arrange the certifier’s visit. Once the required sign-off and lender checks are complete, we plan to prepare the next progress claim. We’ll keep you updated.`,
    social: `A framing milestone at our ${c.publicName}. Thoughtful roof drainage and careful structural details are part of the design process. Craftsmanship starts in the structure. #${c.publicName.replace(/\s/g, '')} #TimberFraming`,
  };
}

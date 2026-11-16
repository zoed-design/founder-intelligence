// Edit this file to change the presentation's fictional project details.
// Never put real addresses, credentials or private project identifiers here.
export const CONTEXT = Object.freeze({
  address: '18 Maroubra Street, Maroubra',
  publicName: 'Coastal Duplex',
  client: 'Demo Homeowner',
  admin: 'Kira',
  engineer: 'Example Engineering DEMO-STRUCT-001',
  consent: 'DEMO-CDC-001',
  certifier: 'Cedar Certifiers',
  lender: 'Example Lender',
  instagramHandle: 'demo.buildco',
});

export function shortUpdates(c = CONTEXT) {
  return {
    admin: `Hi ${c.admin}, here are the steps for ${c.address}: check the current issued instructions and drawing revisions; confirm inspection readiness with Digger before requesting an appointment with ${c.certifier}; record your checks and open questions. Ask Roo for guidance, and flag conflicting instructions or proposed changes for Digger review. References: ${c.engineer} / ${c.consent}.`,
    client: `Hi ${c.client}, the latest update reports framing progress at ${c.address}. We’ll confirm inspection readiness and arrange the certifier’s visit. Once the required sign-off and lender checks are complete, we plan to prepare the next progress claim. We’ll keep you updated.`,
    social: `A framing milestone at our ${c.publicName}. Thoughtful roof drainage and careful structural details are part of the design process. Craftsmanship starts in the structure. #${c.publicName.replace(/\s/g, '')} #TimberFraming`,
  };
}

export function makeDraft(lead: { company_name: string; contact_name?: string | null; category?: string | null; city?: string | null }) {
  const greeting = lead.contact_name ? `Namaste ${lead.contact_name},` : 'Namaste,';
  const category = lead.category || 'goods';
  const city = lead.city || 'Noida–Delhi NCR';
  return {
    subject: `Local delivery vehicle available for ${lead.company_name}`,
    body: `${greeting}\n\nWe provide small commercial vehicle transportation for local goods movement in the ${city} area. Our Tata Ace Gold can be considered for ${category.toLowerCase()} cartons, packaging material, and factory-to-warehouse deliveries, subject to load and route requirements.\n\nIf you occasionally need an additional vehicle or a regular local delivery arrangement, please let us know. We would be happy to discuss your route, schedule, and transport rate.\n\nIf this is not relevant, reply “unsubscribe” and we will not contact you again.\n\nRegards,\nTransport Services\nNoida–Delhi NCR`
  };
}

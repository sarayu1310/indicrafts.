export interface CategoryImportance {
  cultural: string;
  environmental: string;
}

export const categoryImportance: Record<string, CategoryImportance> = {
  "Handicrafts & Art": {
    cultural: "These products are often direct expressions of tribal art forms and regional storytelling, passed down through generations. They embody unique aesthetic traditions, symbolic meanings, and indigenous craftsmanship that define a community's identity.",
    environmental: "Typically made from locally sourced, natural materials (e.g., wood, clay, natural fibers) using traditional tools and processes, resulting in minimal industrial waste and a low carbon footprint compared to mass-produced items."
  },
  "Textiles & Apparel": {
    cultural: "Reflects ancient weaving, dyeing, and embroidery techniques specific to different regions of India. Each pattern, color, and fabric tells a story of local history, rituals, and the skilled hands of weavers, linking wearers to a rich sartorial heritage.",
    environmental: "Often utilizes natural fibers (cotton, silk, wool, jute), natural dyes, and handloom methods, reducing reliance on synthetic materials and minimizing energy consumption compared to industrial textile production."
  },
  "Jewelry & Accessories": {
    cultural: "Carries deep symbolic meaning, often used in ceremonies, festivals, or as markers of social status and tribal identity. The designs and materials (e.g., silver, beads, natural seeds) are rooted in ancient aesthetic traditions and belief systems.",
    environmental: "Frequently crafted from recycled metals, natural stones, seeds, or upcycled materials, promoting resourcefulness and reducing the demand for new, often resource-intensive, raw material extraction."
  },
  "Home & Living": {
    cultural: "Items like pottery, traditional decor, and functional household goods often reflect ancestral living practices, architectural styles, and community values. They bring the essence of traditional Indian homes into modern spaces.",
    environmental: "Predominantly uses sustainable, biodegradable materials such as bamboo, terracotta, natural wood, and coir. These items replace plastic or industrially produced goods, contributing to a lower ecological impact and supporting circular economies."
  },
  "Food & Wellness": {
    cultural: "Represents indigenous knowledge of local flora, traditional recipes, and ancestral health practices. These products connect consumers to the diverse culinary and holistic wellness traditions passed down through generations in rural communities.",
    environmental: "Often involves organic farming, wild harvesting, and minimal processing of ingredients. It promotes biodiversity, supports local ecosystems, and avoids synthetic fertilizers, pesticides, and excessive industrial packaging."
  },
  "Eco-Friendly Products": {
    cultural: "Many 'eco-friendly' practices are, in fact, revivals of traditional, sustainable living methods that were inherently gentle on the environment long before 'eco-friendly' became a modern term. It bridges ancestral wisdom with contemporary environmental consciousness.",
    environmental: "This category explicitly highlights products that minimize environmental harm throughout their lifecycle—from sourcing and production to use and disposal. It champions waste reduction, resource conservation, and a lighter ecological footprint, serving as a beacon for sustainable consumption."
  },
  "Cultural & Ritual Products": {
    cultural: "These are items deeply embedded in religious practices, ceremonies, and folk traditions of various communities. They serve as conduits to spiritual beliefs, historical narratives, and community rituals, preserving intangible cultural heritage through tangible objects.",
    environmental: "Often crafted from natural, perishable, or biodegradable materials (e.g., specific woods, clay, leaves, natural pigments) following traditional methods that respect natural cycles and local ecosystems, in contrast to synthetic or mass-produced alternatives."
  }
};

export function getCategoryImportance(category: string): CategoryImportance | null {
  return categoryImportance[category] || null;
}


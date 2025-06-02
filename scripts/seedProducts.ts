import { openSearchService, Product } from '../src/services/opensearch.service';
import { config } from '../src/config';

// Product data templates
const categories = [
  'Werkzeuge',
  'Befestigungstechnik',
  'Elektro',
  'Garten',
  'Farben',
  'Baustoffe',
  'Sanitär',
  'Holz',
  'Maschinen',
  'Sicherheit'
];

const brands = [
  'Bosch', 'Makita', 'Metabo', 'DeWalt', 'Black+Decker',
  'Fischer', 'Würth', 'Hilti', 'Knipex', 'Wera',
  'Gardena', 'Kärcher', 'Stihl', 'Weber', 'Wolfcraft'
];

const productTemplates = {
  'Werkzeuge': [
    { name: 'Akkuschrauber', tags: ['Akku', 'Schrauben', 'Bohren'] },
    { name: 'Hammer', tags: ['Schlagen', 'Nageln'] },
    { name: 'Schraubendreher-Set', tags: ['Schrauben', 'Set'] },
    { name: 'Zange', tags: ['Greifen', 'Schneiden'] },
    { name: 'Säge', tags: ['Schneiden', 'Holz'] },
    { name: 'Wasserwaage', tags: ['Messen', 'Ausrichten'] },
    { name: 'Maßband', tags: ['Messen', 'Länge'] },
    { name: 'Winkelschleifer', tags: ['Schleifen', 'Schneiden', 'Metall'] }
  ],
  'Befestigungstechnik': [
    { name: 'Dübel', tags: ['Befestigung', 'Wand'] },
    { name: 'Schrauben', tags: ['Befestigung', 'Holz', 'Metall'] },
    { name: 'Anker', tags: ['Schwerlast', 'Beton'] },
    { name: 'Nagel', tags: ['Befestigung', 'Holz'] },
    { name: 'Klebstoff', tags: ['Kleben', 'Montage'] },
    { name: 'Silikon', tags: ['Abdichten', 'Fugen'] }
  ],
  'Elektro': [
    { name: 'Kabel', tags: ['Strom', 'Verbindung'] },
    { name: 'Steckdose', tags: ['Strom', 'Anschluss'] },
    { name: 'Schalter', tags: ['Strom', 'Steuerung'] },
    { name: 'LED-Lampe', tags: ['Licht', 'Energiesparend'] },
    { name: 'Verteilerkasten', tags: ['Strom', 'Sicherung'] },
    { name: 'Bewegungsmelder', tags: ['Sensor', 'Licht', 'Sicherheit'] }
  ],
  'Garten': [
    { name: 'Rasenmäher', tags: ['Rasen', 'Schneiden'] },
    { name: 'Gartenschlauch', tags: ['Wasser', 'Bewässerung'] },
    { name: 'Spaten', tags: ['Graben', 'Erde'] },
    { name: 'Gießkanne', tags: ['Wasser', 'Pflanzen'] },
    { name: 'Heckenschere', tags: ['Schneiden', 'Hecke'] },
    { name: 'Blumenerde', tags: ['Pflanzen', 'Erde'] }
  ],
  'Farben': [
    { name: 'Wandfarbe', tags: ['Streichen', 'Innen'] },
    { name: 'Lack', tags: ['Streichen', 'Holz', 'Metall'] },
    { name: 'Grundierung', tags: ['Vorbereitung', 'Streichen'] },
    { name: 'Pinsel', tags: ['Streichen', 'Werkzeug'] },
    { name: 'Farbroller', tags: ['Streichen', 'Werkzeug'] },
    { name: 'Abdeckfolie', tags: ['Schutz', 'Streichen'] }
  ]
};

const materials = ['Stahl', 'Holz', 'Kunststoff', 'Aluminium', 'Beton', 'Stein'];
const sizes = ['S', 'M', 'L', 'XL', '6mm', '8mm', '10mm', '12mm', '16mm', '20mm'];

function generateEAN(): string {
  return '40' + Math.random().toString().substr(2, 11);
}

function generateArticleNumber(): string {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

function generateDescription(productName: string, category: string): string {
  const descriptions = [
    `Hochwertiger ${productName} für professionelle Anwendungen im Bereich ${category}.`,
    `Robuster und langlebiger ${productName}, ideal für Heimwerker und Profis.`,
    `Premium ${productName} mit ausgezeichneter Verarbeitung und langer Lebensdauer.`,
    `Vielseitig einsetzbarer ${productName} für verschiedene Arbeiten im ${category}-Bereich.`,
    `Ergonomischer ${productName} für komfortables und effizientes Arbeiten.`
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generateProducts(count: number): Product[] {
  const products: Product[] = [];
  
  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const templates = productTemplates[category as keyof typeof productTemplates] || productTemplates['Werkzeuge'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const material = materials[Math.floor(Math.random() * materials.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    
    const product: Product = {
      id: `prod-${i + 1}`,
      name: `${brand} ${template.name} ${Math.random() > 0.5 ? 'Professional' : ''}`.trim(),
      description: generateDescription(template.name, category),
      category: category,
      subcategory: template.name,
      brand: brand,
      price: Math.round(Math.random() * 500 * 100) / 100 + 5, // 5-505 EUR
      attributes: {
        material: material,
        size: size,
        weight: `${Math.round(Math.random() * 5000) / 1000}kg`,
        power: category === 'Elektro' || category === 'Maschinen' ? `${Math.round(Math.random() * 2000)}W` : undefined,
        warranty: `${Math.floor(Math.random() * 3) + 1} Jahre`
      },
      tags: [...template.tags, brand, material, category],
      inStock: Math.random() > 0.2, // 80% in stock
      ean: generateEAN(),
      articleNumber: generateArticleNumber()
    };
    
    products.push(product);
  }
  
  return products;
}

async function seedProducts() {
  console.log('🌱 Starting product seeding...');
  
  try {
    // Initialize OpenSearch
    console.log('📦 Initializing OpenSearch...');
    await openSearchService.initialize();
    
    // Generate products
    console.log('🏭 Generating 1000 products...');
    const products = generateProducts(1000);
    
    // Bulk index products
    console.log('📝 Indexing products...');
    const batchSize = 100;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await openSearchService.bulkIndexProducts(batch);
      console.log(`✅ Indexed ${i + batch.length}/${products.length} products`);
    }
    
    console.log('🎉 Successfully seeded 1000 products!');
    
    // Test search
    console.log('\n🔍 Testing search...');
    const testResult = await openSearchService.search('Bosch Akkuschrauber');
    console.log(`Found ${testResult.total} products for "Bosch Akkuschrauber"`);
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the seeding
seedProducts();
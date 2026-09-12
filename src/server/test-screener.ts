import { prisma } from '@/lib/prisma';
import { fetchCompaniesScreener } from '@/server/services/sectorsApi';
import { executeGraphForScreener } from '@/server/services/graphEngine';

async function runScreenerTest() {
  console.log('🧪 Testing fetchCompaniesScreener with mock queries...');

  // Test 1: Banking query
  const resBanks = await fetchCompaniesScreener({ q: 'top 5 banks by market cap', limit: 5 });
  console.log('✅ Banks Query Result:', resBanks.data.map(c => `${c.symbol} (PE ${c.pe}, Mcap ${c.market_cap})`));

  // Test 2: Tech query
  const resTech = await fetchCompaniesScreener({ q: 'top tech companies by revenue', limit: 3 });
  console.log('✅ Tech Query Result:', resTech.data.map(c => `${c.symbol} (${c.company_name})`));

  // Test 3: High dividend coal query
  const resCoal = await fetchCompaniesScreener({ q: 'coal mining companies with high dividend yield', limit: 3 });
  console.log('✅ Coal/Dividend Query Result:', resCoal.data.map(c => `${c.symbol} (Div ${c.dividend_yield}%)`));

  // Test 4: Canvas Graph Execution
  console.log('\n🧪 Testing executeGraphForScreener on Canvas...');
  const canvas = await prisma.canvas.findFirst({ include: { nodes: true, edges: true } });
  if (!canvas) {
    console.log('No canvas found.');
    return;
  }

  // Create temporary screener node
  const screenerNode = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'screener',
      positionX: 400,
      positionY: 400,
      configJson: JSON.stringify({
        query: 'top 5 banks by market cap',
        limit: 5,
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // Create downstream note node
  const noteNode = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'note',
      positionX: 750,
      positionY: 400,
      configJson: JSON.stringify({
        content: 'Waiting for screener...',
        color: 'blue',
      }),
    },
  });

  // Connect them
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: screenerNode.id,
      toId: noteNode.id,
    },
  });

  console.log('⚡ Executing Graph for Screener Node:', screenerNode.id);
  const execResult = await executeGraphForScreener(canvas.id, screenerNode.id);
  console.log('✅ Execution Result:', execResult);

  const updatedNote = await prisma.node.findUnique({ where: { id: noteNode.id } });
  console.log('📝 Updated Note Content:\n', JSON.parse(updatedNote?.configJson || '{}').content);

  // Clean up test nodes
  await prisma.edge.deleteMany({ where: { fromId: screenerNode.id } });
  await prisma.node.deleteMany({ where: { id: { in: [screenerNode.id, noteNode.id] } } });
  console.log('🧹 Cleaned up temporary test nodes.');
}

runScreenerTest()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

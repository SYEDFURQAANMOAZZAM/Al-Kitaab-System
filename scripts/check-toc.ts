import { prisma } from "../lib/prisma";

async function main() {
  const badItems = await prisma.patternTocItem.findMany({
    where: {
      parentId: "",
    },
    select: {
      id: true,
      name: true,
      patternId: true,
      patternArrId: true,
      parentId: true,
      position: true,
    },
  });

  console.log("ITEMS WITH EMPTY parentId:");
  console.dir(badItems, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());